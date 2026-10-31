# ERP · Shell

Contenedor del ERP: inicia la sesión con Keycloak, muestra el menú según el rol y carga los microfrontends (Obras, Materiales, Supervisión).

Parte de la «Plataforma de supervisión de obras». Si existe `../../CLAUDE.md` (carpeta que agrupa todos los proyectos), léelo primero: tiene las reglas transversales, el plan y los contratos generales.

**Estado:** fase 1. Inicia sesión con Keycloak, publica `window.plataforma`, muestra barra, menú y carga los tres microfrontends (aviso si uno no carga). Tema en `src/styles/tema.scss`. No implementes una funcionalidad sin su especificación aprobada en `docs/specs/`.

## Stack

- Node 24 · Angular 22 (standalone, builder esbuild) · SCSS · pruebas con Vitest
- `@angular-architects/native-federation` 22 como **host dinámico**
- keycloak-angular 22 + keycloak-js 26 (login OIDC con PKCE) · Angular Material 22 (tema M3)
- PWA (capa 1, 104): `@angular/pwa` (service worker de Angular, `@angular/service-worker`) e IndexedDB con `idb`. El service worker solo se prueba con la versión compilada (`npm run build` y un servidor estático en 4200; ver `README.md`), no con `ng serve`
- Puerto: `4200`

## Comandos

```sh
npm install
npm start            # ng serve en http://localhost:4200
npm test             # ng test (Vitest)
npm run build        # también genera ngsw.json (service worker, 104)
npm run servir:pwa   # sirve la versión compilada en http://localhost:4200 para probar sin conexión (README.md)
```

## Native Federation

- `federation.config.mjs`: qué se comparte. Las entradas de `@angular/platform-browser/animations` están en `skip` porque no usamos `@angular/animations`.
- `public/federation.manifest.json`: dónde está cada remoto (`mf-obras` 4201, `mf-materiales` 4202, `mf-supervision` 4203).
- `src/main.ts` inicia la federación y luego carga `src/bootstrap.ts`.
- Remotos Angular (`mf-obras`): se cargan con `loadRemoteModule` y se usan como rutas o componentes.
- Remotos React (`mf-materiales`, `mf-supervision`): se cargan con `loadRemoteModule('<nombre>', './Bootstrap')`, que registra un Web Component (`<mf-materiales>`, `<mf-supervision>`); el shell crea el elemento con `document.createElement` en `remotos/remoto-web-component.component.ts`.

## Estructura

Ver `docs/estructura.md` (`sesion/`, `diseno/`, `remotos/`, `compartido/`).

## Reglas del proyecto

- No tiene pantallas de negocio: esas viven en los microfrontends.
- Si un microfrontend no carga, se muestra un aviso en su espacio y el resto del ERP sigue funcionando.
- El menú incluye el paso a las otras aplicaciones sin volver a iniciar sesión (SSO).
- Toda llamada a datos va al gateway GraphQL; nunca directo a un servicio.

## Documentación

- `docs/estructura.md`: **librerías permitidas y estructura exacta de carpetas y archivos. Obligatorio leerlo antes de escribir código.**
- `docs/app.md`: responsabilidades y qué no hace.
- `docs/contratos.md`: qué consume y qué expone.
- `docs/specs/`: especificaciones por funcionalidad (`requisitos.md`, `diseno.md`, `tareas.md`).

## Commits

Conventional Commits en español e imperativo (`feat(shell): carga microfrontend de obras`). Sin coautoría ni firmas de la IA.

Git Flow: ramas `feat/`, `fix/`, `docs/`… desde `develop`, que entran por *pull request*; nunca hagas *push* a `main` ni a `develop` (están protegidas). El agente crea y fusiona los PR (merge normal, sin squash) hacia `develop` cuando todas las pruebas pasan. Detalle y definición de terminado: `docs/flujo-trabajo.md` del repo `supervision-docs`.
