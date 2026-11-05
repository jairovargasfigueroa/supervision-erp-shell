# 601 · Preparar el despliegue · tareas de `frontend/erp-shell`

Requisitos y diseño: `docs/specs/601-contenedores-ci/` de la carpeta que agrupa los proyectos. Al implementarla, estas tareas reemplazan a `frontend/erp-shell/docs/specs/601-contenedores-ci/tareas.md` (eran del borrador anterior).

Marca cada tarea al terminarla (con sus pruebas y su commit).

- [x] Aplicar «Cambios a contratos y datos» que tocan este proyecto (`docs/`, `CLAUDE.md`, `.env.example`)
- [x] Cargar `configuracion.json` antes de iniciar (inicializador de Angular) con respaldo a los valores de desarrollo; `federation.manifest.json` con las direcciones de los remotos; pruebas
- [x] Plantillas `configuracion.json.plantilla` y `federation.manifest.json.plantilla` (con `${VARIABLES}`) que usa el script de publicación de infra
- [x] `.github/workflows/ci.yml`: job `prueba` (pruebas y compilación) y job `archivos` (en `main`, la carpeta compilada como artefacto)
