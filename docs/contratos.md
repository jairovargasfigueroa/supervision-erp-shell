# ERP · Shell: contratos

**Estado:** lo de abajo es lo conocido; las operaciones exactas se definen en el `diseno.md` de cada funcionalidad.

## Consume

| Desde | Qué |
|---|---|
| Keycloak | Inicio de sesión OIDC (realm `supervision`, cliente público `erp` con PKCE); `check-sso` con `silent-check-sso.html` al volver la conexión (104) |
| Microfrontends | Remotos por Native Federation (`federation.manifest.json`): `mf-obras`, `mf-materiales`, `mf-supervision`. En desarrollo, `public/federation.manifest.json` (4201, 4202, 4203); al publicar (601) lo reescribe el script de `infra` desde `federation.manifest.json.plantilla` |
| `configuracion.json` (601) | Junto a `index.html`, lo escribe el script de publicación de `infra` desde `configuracion.json.plantilla`: `{ keycloakUrl, keycloakRealm, gatewayUrl, portalUrl }`. Se lee en `main.ts` antes de iniciar Angular; si no está (desarrollo), se usan los valores de `src/environments/environment.ts`. En la compilación publicada, sin el archivo, si no es JSON o si le falta un campo, el ERP no arranca y la consola dice por qué (nunca usa los valores de desarrollo) |
| Gateway | `{ salud }` (sin token) para comprobar la conexión cada 30 s mientras cree estar sin conexión (104) |

## Expone a los microfrontends

- La sesión en `window.plataforma.sesion` (`usuario`, `obtenerToken()`, `cerrarSesion()`, `sinConexion`) y el evento `plataforma:sesion` en `window` cuando cambia (ver «Sesión dentro del ERP» en `docs/convenciones.md` de la carpeta general).
  - 104: `sinConexion: boolean`. En «modo sin conexión» (sesión de las últimas 24 h guardada en el equipo) `obtenerToken()` rechaza con `Error('SIN_CONEXION')`.
- 104: `window.plataforma.conexion = { enLinea: boolean, reportarFallo(): void }` y el evento `plataforma:conexion` en `window` con `detail: { enLinea }` en cada cambio. `reportarFallo()` lo llama un microfrontend cuando una consulta falla por la red o por tiempo agotado.
- 104: `window.plataforma.almacen` (IndexedDB `plataforma-erp`, separado por usuario; el prefijo lo agrega el shell y se borra al cerrar sesión):

```ts
interface BorradorPlanilla {
  planillaId: string; obraId: string; numero: number; periodo: string;
  versionBase: number;
  lineas: { partidaId: string; cantidadPeriodo: number }[];
  fotoIds: string[];
  guardadoEn: string;                                   // ISO
  estadoEnvio: 'PENDIENTE' | 'CONFLICTO' | 'NO_EDITABLE' | 'RECHAZADO';
  ultimoError?: { codigo: string; mensaje: string; errores?: { campo: string; mensaje: string }[] };
}

interface AlmacenPlataforma {
  guardarConsulta(clave: string, datos: unknown): Promise<void>;
  leerConsulta<T>(clave: string): Promise<{ datos: T; guardadoEn: string } | null>;
  guardarBorradorPlanilla(borrador: BorradorPlanilla): Promise<void>;
  leerBorradorPlanilla(planillaId: string): Promise<BorradorPlanilla | null>;
  listarBorradoresPlanilla(): Promise<BorradorPlanilla[]>;
  borrarBorradorPlanilla(planillaId: string): Promise<void>;
}
```

- 104: el evento `plataforma:borradores` en `window` cuando cambia la lista de borradores de planilla.
- La configuración en `window.plataforma.configuracion = { gatewayUrl }` (dirección completa de GraphQL), tomada de `configuracion.json` (601). Los microfrontends no tienen su propia configuración de direcciones: la leen de aquí, con respaldo al valor de desarrollo.
- Los microfrontends no usan IndexedDB, `localStorage` ni service workers propios: usan lo que publica el shell.

## Publicación (601)

El shell se compila una vez (`npm run build`, carpeta `dist/erp-shell/browser`) y se publica como archivos estáticos. Al publicar, el script de `infra` (`produccion-local/publicar-frontends`, y en la 602 el de la nube) escribe con `envsubst`:

| Plantilla (raíz del repo) | Archivo publicado | Variables |
|---|---|---|
| `configuracion.json.plantilla` | `configuracion.json` | `KEYCLOAK_URL` (sin `/` final), `KEYCLOAK_REALM`, `GATEWAY_URL` (dirección base del gateway; la plantilla agrega `/graphql`), `PORTAL_URL` |
| `federation.manifest.json.plantilla` | `federation.manifest.json` (reemplaza al de desarrollo) | `MF_OBRAS_URL`, `MF_MATERIALES_URL`, `MF_SUPERVISION_URL` (dirección base de cada remoto; la plantilla agrega `/remoteEntry.json`) |

Reglas del servidor de estáticos: SPA (si el archivo no existe, `index.html`) y sin caché en `index.html`, `configuracion.json`, `federation.manifest.json`, `ngsw.json` y `ngsw-worker.js`.
