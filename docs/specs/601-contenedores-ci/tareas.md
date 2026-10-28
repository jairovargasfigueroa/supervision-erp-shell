# 601 · Contenedores y CI/CD · tareas de `frontend/erp-shell`

Requisitos y diseño: `docs/specs/601-contenedores-ci/` de la carpeta que agrupa los proyectos. Contratos: `docs/contratos.md` de este proyecto.

Marca cada tarea al terminarla (con sus pruebas y su commit).

- [ ] `environment.prod.ts` con las URL de producción de Keycloak, gateway y portal (desde las variables del entorno `produccion`) y `public/federation.manifest.json` generado en el workflow con las URL de los tres remotos
- [ ] `staticwebapp.config.json`: `navigationFallback` y `Cache-Control: no-cache` en `index.html`, `ngsw.json`, `ngsw-worker.js` y `federation.manifest.json` (service worker de la 104)
- [ ] `Dockerfile` (`node:24-alpine` para compilar, `nginxinc/nginx-unprivileged:1.29-alpine` para servir) con `nginx.conf` propio y `.dockerignore`
- [ ] `.github/workflows/ci-cd.yml`: pruebas y build; imagen nginx en GHCR; despliegue de los archivos estáticos con `Azure/static-web-apps-deploy@v1`
- [ ] Comprobar: la imagen sirve la aplicación en el puerto 8080 sin `root`
