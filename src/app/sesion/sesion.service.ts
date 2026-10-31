import {
  computed,
  effect,
  inject,
  Injectable,
  InjectionToken,
  signal,
  untracked,
} from '@angular/core';
import {
  AutoRefreshTokenService,
  KEYCLOAK_EVENT_SIGNAL,
  KeycloakEventType,
} from 'keycloak-angular';
import Keycloak from 'keycloak-js';
import { environment } from '../../environments/environment';
import { RECARGAR_PAGINA } from '../sin-conexion/actualizacion.service';
import { AlmacenService } from '../sin-conexion/almacen.service';
import { ConexionService } from '../sin-conexion/conexion.service';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ConfirmarCierreComponent } from './confirmar-cierre.component';
import { EVENTO_SESION, type UsuarioSesion } from './sesion-global';

/** Hasta cuánto tiempo después del último inicio de sesión se puede entrar sin conexión (104, decisión del equipo). */
export const VIGENCIA_SESION_SIN_CONEXION_MS = 24 * 60 * 60 * 1000;
/** Espera antes de volver a intentar la reanudación si Keycloak todavía no responde. */
export const REINTENTO_REANUDACION_MS = 30_000;

/**
 * `true` si el servidor de Keycloak responde (cualquier respuesta; solo descarta errores de red). Evita que
 * `login-required` mande al navegador a una página de error cuando hay red pero Keycloak no se alcanza. Se reemplaza
 * en las pruebas.
 */
export const KEYCLOAK_RESPONDE = new InjectionToken<() => Promise<boolean>>('KEYCLOAK_RESPONDE', {
  providedIn: 'root',
  factory: () => async () => {
    try {
      const respuesta = await fetch(`${environment.keycloakUrl}/realms/${environment.realm}`, {
        mode: 'no-cors',
        cache: 'no-store',
        signal: AbortSignal.timeout(3_000),
      });
      // La respuesta real es «opaque»; si la red falla, el service worker de Angular responde él mismo con un 504
      return respuesta.type === 'opaque' || respuesta.status < 500;
    } catch {
      return false;
    }
  },
});

/**
 * - `activa`: sesión de Keycloak con token.
 * - `sin-conexion`: «modo sin conexión» con el usuario de la última sesión guardada (24 h); no hay token.
 * - `requiere-conexion`: sin conexión y sin sesión guardada vigente: «Conéctate a internet para iniciar sesión».
 */
export type ModoSesion = 'iniciando' | 'activa' | 'sin-conexion' | 'requiere-conexion';

/**
 * Sesión del ERP: el shell es el único que habla con Keycloak. Expone el usuario como signal y lo publica en
 * window.plataforma para los microfrontends (convenciones, «Sesión dentro del ERP»). Con la 104 también entra en
 * «modo sin conexión» y reanuda la sesión al volver la conexión.
 */
@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly keycloak = inject(Keycloak);
  private readonly eventos = inject(KEYCLOAK_EVENT_SIGNAL);
  private readonly renovacion = inject(AutoRefreshTokenService);
  private readonly almacen = inject(AlmacenService);
  private readonly conexion = inject(ConexionService);
  private readonly keycloakResponde = inject(KEYCLOAK_RESPONDE);
  private readonly recargar = inject(RECARGAR_PAGINA);
  private readonly dialogos = inject(MatDialog);

  readonly usuario = signal<UsuarioSesion | null>(null);
  readonly roles = computed(() => this.usuario()?.roles ?? []);
  readonly modo = signal<ModoSesion>('iniciando');
  readonly sinConexion = computed(() => this.modo() === 'sin-conexion');
  /** Volvió la conexión pero la sesión de Keycloak ya no está vigente: se muestra «Iniciar sesión» (104, criterio 4). */
  readonly requiereInicio = signal(false);

  private renovacionIniciada = false;
  private reanudando = false;
  private reintento: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    effect(() => {
      const evento = this.eventos();
      untracked(() => {
        if (evento.type === KeycloakEventType.AuthRefreshSuccess && this.modo() === 'activa') {
          this.publicar();
          void this.guardarSesion();
        } else if (evento.type === KeycloakEventType.AuthRefreshError && this.modo() === 'activa') {
          void this.alFallarRenovacion();
        }
      });
    });
    effect(() => {
      if (!this.conexion.enLinea()) {
        return;
      }
      untracked(() => {
        if (this.modo() === 'sin-conexion' && !this.requiereInicio()) {
          void this.reanudar();
        } else if (this.modo() === 'requiere-conexion') {
          // Ya hay conexión: se vuelve a cargar para iniciar sesión como siempre
          this.recargar();
        }
      });
    });
  }

  /** Arranque del ERP (app initializer): sesión de Keycloak o, sin conexión, la última sesión guardada. */
  async iniciar(): Promise<void> {
    if (navigator.onLine && (await this.keycloakResponde())) {
      try {
        // Sin sesión, login-required lleva a la página de Keycloak y no vuelve aquí
        if (
          await this.keycloak.init({
            onLoad: 'login-required',
            pkceMethod: 'S256',
            checkLoginIframe: false,
          })
        ) {
          this.activar();
          return;
        }
      } catch (error) {
        console.error('No se pudo iniciar la sesión con Keycloak', error);
      }
    }
    await this.entrarSinConexion();
  }

  async obtenerToken(): Promise<string> {
    if (this.modo() !== 'activa') {
      throw new Error('SIN_CONEXION');
    }
    await this.keycloak.updateToken(30);
    return this.keycloak.token ?? '';
  }

  /** Botón «Iniciar sesión» cuando volvió la conexión y la sesión de Keycloak venció. */
  iniciarSesion(): void {
    if (this.keycloak.didInitialize) {
      void this.keycloak.login();
    } else {
      this.recargar();
    }
  }

  /**
   * Cierra la sesión (001, criterio 11). Antes avisa si hay borradores de planilla sin enviar y, si el usuario
   * confirma, borra del equipo sus consultas, borradores y la última sesión (104, criterio 19).
   */
  async cerrarSesion(): Promise<void> {
    const usuario = this.usuario();
    if (usuario) {
      const borradores = await this.almacen.listarBorradoresPlanilla().catch(() => []);
      if (borradores.length > 0) {
        const confirmado = await firstValueFrom(
          this.dialogos
            .open<ConfirmarCierreComponent, { cantidad: number }, boolean>(
              ConfirmarCierreComponent,
              {
                data: { cantidad: borradores.length },
              },
            )
            .afterClosed(),
        );
        if (!confirmado) {
          return;
        }
      }
      await this.almacen.borrarDatosUsuario(usuario.id).catch((error: unknown) => {
        console.error('No se pudieron borrar los datos guardados en el equipo', error);
      });
    }

    const modoAnterior = this.modo();
    this.usuario.set(null);
    void this.almacen.usarUsuario(null);
    window.plataforma = {
      ...window.plataforma,
      configuracion: { gatewayUrl: environment.gatewayUrl },
      sesion: undefined,
    };
    window.dispatchEvent(new Event(EVENTO_SESION));

    const keycloakDisponible =
      this.keycloak.didInitialize &&
      (modoAnterior === 'activa' || (navigator.onLine && (await this.keycloakResponde())));
    if (keycloakDisponible) {
      void this.keycloak.logout({ redirectUri: window.location.origin });
    } else {
      // Sin conexión no se llega a Keycloak: queda la pantalla para iniciar sesión al volver la conexión
      this.requiereInicio.set(false);
      this.modo.set('requiere-conexion');
    }
  }

  private activar(): void {
    if (!this.renovacionIniciada) {
      // Renueva el token mientras el usuario trabaja; la sesión SSO dura 10 h en Keycloak
      this.renovacion.start({ onInactivityTimeout: 'none' });
      this.renovacionIniciada = true;
    }
    this.requiereInicio.set(false);
    this.modo.set('activa');
    this.publicar();
    void this.guardarSesion();
  }

  private async entrarSinConexion(): Promise<void> {
    const ultima = await this.almacen.leerSesion().catch(() => null);
    const vigente =
      ultima && Date.now() - Date.parse(ultima.guardadaEn) <= VIGENCIA_SESION_SIN_CONEXION_MS;
    if (ultima && vigente) {
      this.modo.set('sin-conexion');
      this.publicar(ultima.usuario);
    } else {
      this.modo.set('requiere-conexion');
      this.publicar(null);
    }
  }

  /** No se pudo renovar el token: sin conexión se sigue en «modo sin conexión»; con conexión, al inicio de sesión. */
  private async alFallarRenovacion(): Promise<void> {
    if (navigator.onLine && (await this.keycloakResponde())) {
      // 001, criterio 8
      void this.keycloak.login();
    } else {
      this.modo.set('sin-conexion');
      this.publicar(this.usuario());
    }
  }

  /** Vuelve la conexión en «modo sin conexión»: check-sso (o renovar el token si Keycloak ya se inició). */
  private async reanudar(): Promise<void> {
    if (this.reanudando) {
      return;
    }
    this.reanudando = true;
    clearTimeout(this.reintento);
    try {
      if (!(await this.keycloakResponde())) {
        this.reintento = setTimeout(() => this.reintentarReanudacion(), REINTENTO_REANUDACION_MS);
        return;
      }
      let autenticado = false;
      try {
        if (this.keycloak.didInitialize) {
          autenticado = !!this.keycloak.authenticated && (await this.keycloak.updateToken(-1));
        } else {
          autenticado = await this.keycloak.init({
            onLoad: 'check-sso',
            pkceMethod: 'S256',
            checkLoginIframe: false,
            silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
          });
        }
      } catch (error) {
        console.error('No se pudo reanudar la sesión con Keycloak', error);
      }
      if (autenticado) {
        this.activar();
      } else {
        this.requiereInicio.set(true);
      }
    } finally {
      this.reanudando = false;
    }
  }

  private reintentarReanudacion(): void {
    if (this.modo() === 'sin-conexion' && !this.requiereInicio() && this.conexion.enLinea()) {
      void this.reanudar();
    }
  }

  private async guardarSesion(): Promise<void> {
    const usuario = this.usuario();
    if (usuario) {
      await this.almacen.guardarSesion(usuario).catch(() => undefined);
    }
  }

  private usuarioDelToken(): UsuarioSesion | null {
    const datos = this.keycloak.tokenParsed;
    return datos
      ? {
          id: datos.sub ?? '',
          nombre:
            (datos['name'] as string | undefined) ??
            (datos['preferred_username'] as string | undefined) ??
            '',
          roles: datos.realm_access?.roles ?? [],
        }
      : null;
  }

  private publicar(usuario: UsuarioSesion | null = this.usuarioDelToken()): void {
    this.usuario.set(usuario);
    // Los datos guardados en el equipo son de este usuario (104)
    void this.almacen.usarUsuario(usuario?.id ?? null);
    // Conserva lo que publican otros servicios del shell (conexion, almacen)
    window.plataforma = {
      ...window.plataforma,
      configuracion: { gatewayUrl: environment.gatewayUrl },
      sesion: usuario
        ? {
            usuario,
            obtenerToken: () => this.obtenerToken(),
            cerrarSesion: () => void this.cerrarSesion(),
            sinConexion: this.modo() !== 'activa',
          }
        : undefined,
    };
    window.dispatchEvent(new Event(EVENTO_SESION));
  }
}
