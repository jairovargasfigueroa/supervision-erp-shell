# ERP · Shell

Contenedor del ERP: inicia la sesión con Keycloak, muestra el menú según el rol y carga los microfrontends (Obras, Materiales, Supervisión).

Parte de la «Plataforma de supervisión de obras». Si existe `../../CLAUDE.md` (carpeta que agrupa todos los proyectos), léelo primero: tiene las reglas transversales, el plan y los contratos generales.

**Estado:** solo documentación. El proyecto del framework todavía no se generó (tarea de la fase 1 del plan general). No implementes una funcionalidad sin su especificación aprobada en `docs/specs/`.

## Stack

- Angular · Module Federation
- PWA (capa 1): consulta de lo guardado y borrador de planilla sin conexión
- Inicio de sesión con Keycloak (OIDC)

## Comandos

Se completan al generar el proyecto.

## Estructura prevista

```
src/app/
  shell/          diseño general, menú, barra superior
  auth/           sesión con Keycloak y entrega del token a los microfrontends
  remotes/        carga de cada microfrontend (Module Federation)
```

## Reglas del proyecto

- No tiene pantallas de negocio: esas viven en los microfrontends.
- Si un microfrontend no carga, se muestra un aviso en su espacio y el resto del ERP sigue funcionando.
- El menú incluye el paso a las otras aplicaciones sin volver a iniciar sesión (SSO).
- Toda llamada a datos va al gateway GraphQL; nunca directo a un servicio.

## Documentación

- `docs/app.md`: qué hace, pantallas o responsabilidades, y qué no hace.
- `docs/contratos.md`: qué consume y qué expone.
- `docs/specs/`: especificaciones por funcionalidad (`requisitos.md`, `diseno.md`, `tareas.md`).

## Commits

Conventional Commits en español e imperativo (`feat(alcance): descripción`). Sin coautoría ni firmas de la IA.
