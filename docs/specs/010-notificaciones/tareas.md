# 010 · Notificaciones · tareas de `frontend/erp-shell`

Requisitos y diseño: `docs/specs/010-notificaciones/` de la carpeta que agrupa los proyectos. Contratos: `docs/contratos.md` de este proyecto.

Marca cada tarea al terminarla (con sus pruebas y su commit).

- [ ] `notificaciones.api.ts` (documentos GraphQL por `HttpClient` al gateway, sin Apollo) y `rutas-notificacion.ts` (referencia → ruta del ERP); pruebas
- [ ] `notificaciones.service.ts` con *signals*: contador al iniciar sesión y cada 60 s con la pestaña visible (pausa en `sinConexion`), lista paginada, marcar una (optimista) y todas, estado de error; pruebas
- [ ] Campana en la barra superior (`matBadge` con «9+») y bandeja (lista, «Ver más», «Marcar todas como leídas», vacío, error); navegación con `popstate` para remotos *web component*
- [ ] Ruta `/notificaciones/abrir` (marca leída y navega con `replaceUrl`); pruebas
- [ ] Instalar `firebase` 13; `push-web.service.ts` (lee `/firebase-config.json`, `isSupported`, permiso con gesto, `getToken` con el registro propio, `registrarDispositivo`, `onMessage` → *snackbar*, mensajes del service worker, baja y `deleteToken` al cerrar sesión con 2 s máximo); sin configuración no ofrece activar; pruebas
- [ ] `public/firebase-messaging-sw.js` (scripts *compat* de la misma versión de `firebase`, configuración por la URL, `onBackgroundMessage`, `notificationclick`); `firebase-config.example.json`; `public/firebase-config.json` en `.gitignore`
- [ ] Si la 104 está hecha: excluir `/firebase-messaging-sw.js` y `/firebase-config.json` del grupo `app` de `ngsw-config.json`; comprobar en la versión compilada que conviven los dos service workers
- [ ] Pruebas de la spec y README (cómo activar Firebase en el shell)
