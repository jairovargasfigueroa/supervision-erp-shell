# ERP · Shell: contratos

**Estado:** lo de abajo es lo conocido; las operaciones exactas se definen en el `diseno.md` de cada funcionalidad.

## Consume

| Desde | Qué |
|---|---|
| Keycloak | Inicio de sesión OIDC (realm `supervision`, cliente público `erp` con PKCE); `check-sso` con `silent-check-sso.html` al volver la conexión (104) |
| Microfrontends | Remotos por Native Federation (`public/federation.manifest.json`): `mf-obras`, `mf-materiales`, `mf-supervision` |
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
- Los microfrontends no usan IndexedDB, `localStorage` ni service workers propios: usan lo que publica el shell.
