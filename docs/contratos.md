# ERP · Shell: contratos

**Estado:** lo de abajo es lo conocido; las operaciones exactas se definen en el `diseno.md` de cada funcionalidad.

## Consume

| Desde | Qué |
|---|---|
| Keycloak | Inicio de sesión OIDC (realm `supervision`, cliente público `erp` con PKCE) |
| Microfrontends | Remotos por Native Federation (`public/federation.manifest.json`): `mf-obras`, `mf-materiales`, `mf-supervision` |

## Expone a los microfrontends

- La sesión en `window.plataforma.sesion` (`usuario`, `obtenerToken()`, `cerrarSesion()`) y el evento `plataforma:sesion` en `window` cuando cambia (ver «Sesión dentro del ERP» en `docs/convenciones.md` de la carpeta general).
