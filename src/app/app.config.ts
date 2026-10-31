import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import {
  AutoRefreshTokenService,
  createInterceptorCondition,
  includeBearerTokenInterceptor,
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
  provideKeycloak,
  UserActivityService,
  type IncludeBearerTokenCondition,
} from 'keycloak-angular';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { ActualizacionService } from './sin-conexion/actualizacion.service';
import { ConexionService } from './sin-conexion/conexion.service';
import { AlmacenService } from './sin-conexion/almacen.service';
import { SesionService } from './sesion/sesion.service';

const escapar = (texto: string) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // El shell es el único que inicia sesión (001, diseño «ERP»)
    provideKeycloak({
      config: {
        url: environment.keycloakUrl,
        realm: environment.realm,
        clientId: environment.clientId,
      },
      // Sin initOptions: SesionService.iniciar() decide si inicia con Keycloak o sin conexión (104)
      providers: [AutoRefreshTokenService, UserActivityService],
    }),
    // El token solo viaja al gateway
    {
      provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
      useValue: [
        createInterceptorCondition<IncludeBearerTokenCondition>({
          urlPattern: new RegExp(`^${escapar(environment.gatewayUrl)}`),
        }),
      ],
    },
    provideHttpClient(withInterceptors([includeBearerTokenInterceptor])),
    provideRouter(routes),
    // PWA (104): solo con la versión compilada; ng serve no lo registra
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideAppInitializer(() => inject(ActualizacionService).iniciar()),
    provideAppInitializer(() => inject(ConexionService).iniciar()),
    provideAppInitializer(() => inject(AlmacenService).iniciar()),
    provideAppInitializer(() => inject(SesionService).iniciar()),
  ],
};
