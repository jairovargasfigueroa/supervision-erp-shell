# ERP · Shell: estructura y librerías

Obligatorio para todo el código de este proyecto.

## Librerías

Angular 22 (standalone, *signals*, nuevo control de flujo `@if`/`@for`), `@angular/material` + `@angular/cdk` 22, Material Symbols, `@angular-architects/native-federation` 22, `keycloak-angular` 22 + `keycloak-js` 26, `@angular/pwa` 22 (capa 1). Sin NgRx. El shell **no** consulta datos del negocio (no usa Apollo). Pruebas con Vitest.

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
    app.config.ts                  # provideRouter, provideKeycloak, provideHttpClient(interceptor), Material
    app.routes.ts                  # /obras/**, /materiales/**, /supervision/**, /sin-acceso
    sesion/
      sesion.service.ts            # lee Keycloak, expone signals y publica window.plataforma.sesion
      sesion-global.ts             # tipos de window.plataforma (compartidos con los microfrontends por copia)
      sin-acceso.component.ts
    diseno/
      shell.component.ts           # mat-toolbar + mat-sidenav + router-outlet
      menu.ts                      # opciones por rol (función pura, probada)
      barra-usuario.component.ts
    remotos/
      remoto-angular.ts            # ruta que carga un remoto Angular con loadRemoteModule
      remoto-web-component.component.ts  # carga ./Bootstrap y pinta <mf-...>; muestra error si falla
      remotos.ts                   # nombre del remoto → ruta, tipo (angular | web-component), etiqueta
    compartido/
      formato.ts                   # montos, fechas, porcentajes (es-BO)
public/federation.manifest.json
```

## Reglas

- Componentes standalone con `ChangeDetectionStrategy.OnPush` y *signals*.
- El shell solo hace sesión, diseño, menú y carga de remotos.
- Si un remoto falla al cargar, `remoto-web-component` o la ruta Angular muestran el estado de error de `docs/diseno-visual.md` sin romper el resto.
- Archivos en `kebab-case` con sufijo de Angular (`.component.ts`, `.service.ts`).

## Tema (copia de los valores)

Primario `#0E4D5C`, primario oscuro `#0A3741`, acento `#F08A24`, texto `#14232A`, texto secundario `#56676F`, borde `#DAE2E5`, fondo `#F2F5F6`, éxito `#1B7343`, atención `#9A4A00`, error `#B42318`. Inter / IBM Plex Mono. Radio 10 px (tarjetas) y 6 px (botones).
