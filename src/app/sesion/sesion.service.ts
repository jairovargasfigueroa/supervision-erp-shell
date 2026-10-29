import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { KEYCLOAK_EVENT_SIGNAL, KeycloakEventType } from 'keycloak-angular';
import Keycloak from 'keycloak-js';
import { environment } from '../../environments/environment';
import { EVENTO_SESION, type UsuarioSesion } from './sesion-global';

/**
 * Sesión del ERP: el shell es el único que habla con Keycloak. Expone el usuario como signal y lo publica en
 * window.plataforma para los microfrontends (convenciones, «Sesión dentro del ERP»).
 */
@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly keycloak = inject(Keycloak);
  private readonly eventos = inject(KEYCLOAK_EVENT_SIGNAL);

  readonly usuario = signal<UsuarioSesion | null>(null);
  readonly roles = computed(() => this.usuario()?.roles ?? []);

  constructor() {
    this.publicar();
    effect(() => {
      const evento = this.eventos();
      if (evento.type === KeycloakEventType.AuthRefreshSuccess) {
        this.publicar();
      } else if (evento.type === KeycloakEventType.AuthRefreshError) {
        // No se pudo renovar: vuelve al inicio de sesión (001, criterio 8)
        void this.keycloak.login();
      }
    });
  }

  async obtenerToken(): Promise<string> {
    await this.keycloak.updateToken(30);
    return this.keycloak.token ?? '';
  }

  cerrarSesion(): void {
    window.plataforma = { configuracion: { gatewayUrl: environment.gatewayUrl } };
    window.dispatchEvent(new Event(EVENTO_SESION));
    void this.keycloak.logout({ redirectUri: window.location.origin });
  }

  private publicar(): void {
    const datos = this.keycloak.tokenParsed;
    const usuario: UsuarioSesion | null = datos
      ? {
          id: datos.sub ?? '',
          nombre: (datos['name'] as string | undefined) ?? (datos['preferred_username'] as string | undefined) ?? '',
          roles: datos.realm_access?.roles ?? [],
        }
      : null;
    this.usuario.set(usuario);
    window.plataforma = {
      configuracion: { gatewayUrl: environment.gatewayUrl },
      sesion: usuario
        ? { usuario, obtenerToken: () => this.obtenerToken(), cerrarSesion: () => this.cerrarSesion() }
        : undefined,
    };
    window.dispatchEvent(new Event(EVENTO_SESION));
  }
}
