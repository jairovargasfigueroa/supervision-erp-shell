# ERP · Shell

Contenedor del ERP: inicia la sesión con Keycloak, muestra el menú según el rol y carga los microfrontends (Obras, Materiales, Supervisión).

Parte de la «Plataforma de supervisión de obras». Si existe `../../CLAUDE.md` (carpeta que agrupa todos los proyectos), léelo primero: tiene las reglas transversales, el plan y los contratos generales.

**Estado:** proyecto generado con Native Federation configurado, sin pantallas propias. No implementes una funcionalidad sin su especificación aprobada en `docs/specs/`.

## Stack

- Node 24 · Angular 22 (standalone, builder esbuild) · SCSS · pruebas con Vitest
- `@angular-architects/native-federation` 22 como **host dinámico**
- Previsto: keycloak-angular 22 (login OIDC), apollo-angular 14 (GraphQL), PWA en la capa 1
- Puerto: `4200`

## Comandos

```sh
npm install
npm start            # ng serve en http://localhost:4200
npm test             # ng test (Vitest)
npm run build
```

## Native Federation

- `federation.config.mjs`: qué se comparte. Las entradas de `@angular/platform-browser/animations` están en `skip` porque no usamos `@angular/animations`.
- `public/federation.manifest.json`: dónde está cada remoto (`mf-obras` 4201, `mf-materiales` 4202, `mf-supervision` 4203).
- `src/main.ts` inicia la federación y luego carga `src/bootstrap.ts`.
- Remotos Angular (`mf-obras`): se cargan con `loadRemoteModule` y se usan como rutas o componentes.
- Remotos React (`mf-materiales`, `mf-supervision`): se cargan con `loadRemoteModule('<nombre>', './Bootstrap')`, que registra un Web Component (`<mf-materiales>`, `<mf-supervision>`); el shell lo muestra con `CUSTOM_ELEMENTS_SCHEMA`.

## Estructura prevista

```
src/app/
  shell/          diseño general, menú, barra superior
  auth/           sesión con Keycloak y entrega del token a los microfrontends
  remotes/        carga de cada microfrontend
```

## Reglas del proyecto

- No tiene pantallas de negocio: esas viven en los microfrontends.
- Si un microfrontend no carga, se muestra un aviso en su espacio y el resto del ERP sigue funcionando.
- El menú incluye el paso a las otras aplicaciones sin volver a iniciar sesión (SSO).
- Toda llamada a datos va al gateway GraphQL; nunca directo a un servicio.

## Documentación

- `docs/app.md`: responsabilidades y qué no hace.
- `docs/contratos.md`: qué consume y qué expone.
- `docs/specs/`: especificaciones por funcionalidad (`requisitos.md`, `diseno.md`, `tareas.md`).

## Commits

Conventional Commits en español e imperativo (`feat(shell): carga microfrontend de obras`). Sin coautoría ni firmas de la IA.
