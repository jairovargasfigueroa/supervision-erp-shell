# 001 · Iniciar sesión y paso entre aplicaciones · tareas de `frontend/erp-shell`

Requisitos y diseño: `docs/specs/001-iniciar-sesion/` de la carpeta que agrupa los proyectos. Contratos: `docs/contratos.md` de este proyecto.

Marca cada tarea al terminarla (con sus pruebas y su commit).

- [x] Pantalla `SinAcceso` cuando el usuario no tiene `admin`, `residente` ni `gerente`
- [x] Barra superior con nombre, rol y «Cerrar sesión» (logout de Keycloak) (adelantada en la fase 1, tarea 1.8)
- [ ] Menú «Aplicaciones» con las aplicaciones web para las que el usuario tiene rol (portal si tiene `cliente`, URL desde `environment`); oculto si no hay ninguna
- [ ] Pruebas: menú por rol (incluida «Aplicaciones») y `SinAcceso`
