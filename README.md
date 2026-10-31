# ERP · Shell

Contenedor del ERP: inicia la sesión con Keycloak, muestra el menú según el rol y carga los microfrontends (Obras, Materiales, Supervisión).

Angular 22 · Native Federation (host).

Documentación en [`docs/`](docs/) e instrucciones para el agente en [`CLAUDE.md`](CLAUDE.md).

## Probar el ERP sin conexión (PWA, 104)

El service worker solo se registra con la versión compilada; `npm start` (`ng serve`) no lo usa.

```sh
npm run build        # ng build y vuelve a generar ngsw.json sobre dist (ver package.json)
npm run servir:pwa   # sirve dist/erp-shell/browser en http://localhost:4200 (http-server, sin caché HTTP)
```

Con Keycloak (`infra`), el gateway y los microfrontends levantados (`npm start` en cada uno: 4201, 4202 y 4203):

1. Abre `http://localhost:4200`, inicia sesión y espera unos segundos: el service worker se instala al quedar estable la página (como máximo 30 s). En DevTools → *Application* → *Service workers* debe verse `ngsw-worker.js` activo.
2. Abre obras, una planilla, el stock de materiales y el tablero. Lo que se carga **después** de que el service worker tomó el control queda guardado (los microfrontends visitados antes, en la siguiente visita).
3. En DevTools → *Network* marca *Offline* y recarga: carga el shell, los microfrontends ya visitados y entra en «modo sin conexión» con el usuario de la última sesión (si tiene 24 h o menos). La barra muestra «Sin conexión».
4. Edita y guarda la planilla sin conexión; desde otra ventana cambia la misma planilla; quita *Offline* y comprueba el envío del borrador o el diálogo de conflicto.
5. Instala el ERP como aplicación desde el ícono de la barra de direcciones de Chrome o Edge («Supervisión de obras»).
6. Para ver el aviso «Hay una versión nueva · Recargar»: cambia algo, vuelve a ejecutar `npm run build` con el servidor encendido y recarga la página una vez.

Al terminar, si vuelves a `npm start` en el mismo puerto, quita el service worker (DevTools → *Application* → *Service workers* → *Unregister*, o *Storage* → *Clear site data*) para que no sirva la versión compilada guardada.
