# 104 · ERP sin conexión (PWA) · tareas de `frontend/erp-shell`

Requisitos y diseño: `docs/specs/104-erp-pwa/` de la carpeta que agrupa los proyectos. Contratos: `docs/contratos.md` de este proyecto.

Marca cada tarea al terminarla (con sus pruebas y su commit).

- [x] `ng add @angular/pwa`; manifiesto («Supervisión de obras»), íconos y registro del service worker solo fuera de desarrollo
- [x] `ngsw-config.json`: grupos `app`, `assets`, `remotos` (orígenes de los remotos) y `federation.manifest.json` con *freshness*
- [x] Aviso «Hay una versión nueva · Recargar» con `SwUpdate`
- [x] `ConexionService`: eventos del navegador, comprobación `{ salud }` cada 30 s, `window.plataforma.conexion` y evento `plataforma:conexion`
- [x] Instalar `idb`; `AlmacenService` con los tres almacenes, prefijo por usuario, límites y `window.plataforma.almacen`
- [x] Sesión sin conexión (24 h), reanudación con `check-sso` y `silent-check-sso.html`
- [x] Cierre de sesión con aviso de borradores y borrado de los datos del usuario
- [ ] Barra superior: «Sin conexión» y «Borradores sin enviar (N)»
- [ ] Script o instrucciones en el README para servir la versión compilada en 4200; pruebas de la spec
