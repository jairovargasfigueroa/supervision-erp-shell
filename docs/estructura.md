# ERP · Shell: estructura y librerías

Obligatorio para todo el código de este proyecto.

## Librerías

Angular 22 (standalone, *signals*, nuevo control de flujo `@if`/`@for`), `@angular/material` + `@angular/cdk` 22, Material Symbols, `@angular-architects/native-federation` 22, `keycloak-angular` 22 + `keycloak-js` 26, `@angular/pwa` 22 e `idb` 8 (capa 1, 104). Pruebas del almacén con `fake-indexeddb` (solo desarrollo). Sin NgRx. El shell **no** consulta datos del negocio (no usa Apollo). Pruebas con Vitest.

## Tema y fuentes

- `src/index.html`: carga Inter e IBM Plex Mono desde Google Fonts (también las usan los microfrontends React).
- `src/styles/tema.scss`: tema de Angular Material 3 y variables `--sv-*` según `docs/diseno-visual.md` (copia de los valores en la sección «Tema» de abajo).
- `src/styles.scss`: importa el tema, reglas base y utilidades de espaciado.

## Árbol

```
src/
  main.ts / bootstrap.ts           # federación primero, luego Angular (no cambiar el orden)
  index.html
  styles.scss, styles/tema.scss
  environments/environment.ts      # urls: keycloak, gateway, portal; nombres de remotos
  app/
    app.config.ts                  # provideRouter, provideKeycloak, provideHttpClient(interceptor), Material, provideServiceWorker
    app.routes.ts                  # /obras/**, /materiales/**, /supervision/**, /sin-acceso
    sesion/
      sesion.service.ts            # inicia Keycloak (o el «modo sin conexión» de 24 h, 104), expone signals y publica window.plataforma.sesion
      sesion-global.ts             # tipos de window.plataforma (compartidos con los microfrontends por copia)
      sin-acceso.component.ts      # /sin-acceso: sin admin, residente ni gerente
      requiere-conexion.component.ts  # 104: «Conéctate a internet para iniciar sesión»
      confirmar-cierre.component.ts   # 104: aviso al cerrar sesión con borradores de planilla sin enviar
      acceso-erp.guard.ts          # canMatch de las rutas de los microfrontends
    diseno/
      shell.component.ts           # mat-toolbar + mat-sidenav + router-outlet
      menu.ts                      # opciones por rol, acceso al ERP y «Aplicaciones» (funciones puras, probadas)
      barra-usuario.component.ts
      indicador-conexion.component.ts  # 104: «Sin conexión» y «Borradores sin enviar (N)» (abre /obras/planillas/{id} o una lista)
    remotos/
      remoto-angular.ts            # ruta que carga un remoto Angular con loadRemoteModule
      remoto-web-component.component.ts  # carga ./Bootstrap y pinta <mf-...>; muestra error si falla
      remoto-no-disponible.component.ts  # aviso «… no está disponible por el momento» + Reintentar
      remotos.ts                   # nombre del remoto → ruta, tipo (angular | web-component), etiqueta
    sin-conexion/                  # 104 (PWA)
      actualizacion.service.ts     # SwUpdate: aviso «Hay una versión nueva · Recargar»
      conexion.service.ts          # en línea / sin conexión: eventos del navegador y { salud } cada 30 s; window.plataforma.conexion
      almacen.service.ts           # IndexedDB plataforma-erp (consultas, borradores_planilla, sesion) por usuario; window.plataforma.almacen
    compartido/
      formato.ts                   # montos, fechas, porcentajes y periodos (es-BO)
public/federation.manifest.json
public/manifest.webmanifest, public/icons/   # 104: instalación como aplicación
public/silent-check-sso.html       # 104: respuesta de check-sso al reanudar la sesión
ngsw-config.json                   # 104: qué guarda el service worker
```

## Reglas

- Componentes standalone con `ChangeDetectionStrategy.OnPush` y *signals*.
- El shell solo hace sesión, diseño, menú y carga de remotos.
- Si un remoto falla al cargar, `remoto-web-component` o la ruta Angular muestran el estado de error de `docs/diseno-visual.md` sin romper el resto.
- Archivos en `kebab-case` con sufijo de Angular (`.component.ts`, `.service.ts`).

## Tema (copia de los valores)

Primario `#0E4D5C`, primario oscuro `#0A3741`, acento `#F08A24`, texto `#14232A`, texto secundario `#56676F`, borde `#DAE2E5`, fondo `#F2F5F6`, éxito `#1B7343`, atención `#9A4A00`, error `#B42318`. Inter / IBM Plex Mono. Radio 10 px (tarjetas) y 6 px (botones).
