import { DestroyRef, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { EVENTO_CONEXION } from '../sesion/sesion-global';

/** Cada cuánto se vuelve a preguntar al gateway mientras se cree estar sin conexión (104, diseño). */
export const INTERVALO_COMPROBACION_MS = 30_000;
/** Tiempo máximo de la consulta `{ salud }`. */
export const TIEMPO_MAXIMO_SALUD_MS = 3_000;

/** Pregunta `{ salud }` al gateway (sin token); `true` si responde. Se reemplaza en las pruebas. */
export const CONSULTAR_SALUD = new InjectionToken<() => Promise<boolean>>('CONSULTAR_SALUD', {
  providedIn: 'root',
  factory: () => async () => {
    try {
      const respuesta = await fetch(environment.gatewayUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ salud }' }),
        signal: AbortSignal.timeout(TIEMPO_MAXIMO_SALUD_MS),
      });
      if (!respuesta.ok) {
        return false;
      }
      const cuerpo = (await respuesta.json()) as { data?: { salud?: string } };
      return typeof cuerpo.data?.salud === 'string';
    } catch {
      return false;
    }
  },
});

/**
 * Estado de la conexión del ERP (104): en línea si el navegador lo está y la última comprobación con el gateway no
 * falló. Lo publica en window.plataforma.conexion y emite plataforma:conexion en cada cambio.
 */
@Injectable({ providedIn: 'root' })
export class ConexionService {
  private readonly consultarSalud = inject(CONSULTAR_SALUD);

  private gatewayFallo = false;
  private sondeo: ReturnType<typeof setInterval> | undefined;
  private comprobando = false;

  private readonly estado = signal(navigator.onLine);
  readonly enLinea = this.estado.asReadonly();

  constructor() {
    const alCambiarNavegador = () => this.alCambiarNavegador();
    window.addEventListener('online', alCambiarNavegador);
    window.addEventListener('offline', alCambiarNavegador);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('online', alCambiarNavegador);
      window.removeEventListener('offline', alCambiarNavegador);
      this.detenerSondeo();
    });
  }

  /** Publica window.plataforma.conexion; se llama al arrancar el ERP. */
  iniciar(): void {
    this.publicar();
    this.actualizar();
  }

  reportarFallo(): void {
    this.gatewayFallo = true;
    this.actualizar();
  }

  private alCambiarNavegador(): void {
    this.actualizar();
    // Si el gateway había fallado, se comprueba ya en vez de esperar al siguiente intento
    if (navigator.onLine && this.gatewayFallo) {
      void this.comprobar();
    }
  }

  private async comprobar(): Promise<void> {
    if (!navigator.onLine || this.comprobando) {
      return;
    }
    this.comprobando = true;
    try {
      this.gatewayFallo = !(await this.consultarSalud());
    } finally {
      this.comprobando = false;
    }
    this.actualizar();
  }

  private actualizar(): void {
    const enLinea = navigator.onLine && !this.gatewayFallo;
    if (enLinea) {
      this.detenerSondeo();
    } else {
      this.sondeo ??= setInterval(() => void this.comprobar(), INTERVALO_COMPROBACION_MS);
    }
    if (enLinea !== this.estado()) {
      this.estado.set(enLinea);
      window.dispatchEvent(new CustomEvent(EVENTO_CONEXION, { detail: { enLinea } }));
    }
  }

  private detenerSondeo(): void {
    clearInterval(this.sondeo);
    this.sondeo = undefined;
  }

  private publicar(): void {
    const estado = this.estado;
    window.plataforma = {
      ...window.plataforma,
      configuracion: { gatewayUrl: environment.gatewayUrl },
      conexion: {
        get enLinea() {
          return estado();
        },
        reportarFallo: () => this.reportarFallo(),
      },
    };
  }
}
