import { isDevMode } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Direcciones que cambian según dónde se publique el ERP (601). La compilación es una sola: al publicar, el script de
 * `infra` escribe `configuracion.json` junto a `index.html` a partir de `configuracion.json.plantilla`.
 */
export interface Configuracion {
  keycloakUrl: string;
  keycloakRealm: string;
  /** Dirección completa de GraphQL (termina en `/graphql`). */
  gatewayUrl: string;
  portalUrl: string;
}

/** Valores de desarrollo: los de `environment.ts`. Se usan si `configuracion.json` no está (solo en desarrollo). */
export const CONFIGURACION_DESARROLLO: Readonly<Configuracion> = Object.freeze({
  keycloakUrl: environment.keycloakUrl,
  keycloakRealm: environment.realm,
  gatewayUrl: environment.gatewayUrl,
  portalUrl: environment.portalUrl,
});

const CAMPOS = Object.keys(CONFIGURACION_DESARROLLO) as (keyof Configuracion)[];

let actual: Configuracion = { ...CONFIGURACION_DESARROLLO };

/** Configuración vigente; la carga `cargarConfiguracion()` en `main.ts` antes de iniciar Angular. */
export function configuracion(): Readonly<Configuracion> {
  return actual;
}

/** Campos de `datos` que son un texto no vacío (sin espacios alrededor). */
function camposPublicados(datos: unknown): Partial<Configuracion> {
  const resultado: Partial<Configuracion> = {};
  if (typeof datos !== 'object' || datos === null) {
    return resultado;
  }
  for (const campo of CAMPOS) {
    const valor = (datos as Record<string, unknown>)[campo];
    if (typeof valor === 'string' && valor.trim() !== '') {
      resultado[campo] = valor.trim();
    }
  }
  return resultado;
}

/** Toma de `datos` cada campo que sea un texto no vacío; el resto queda con el valor de desarrollo. */
export function combinarConfiguracion(datos: unknown): Configuracion {
  return { ...CONFIGURACION_DESARROLLO, ...camposPublicados(datos) };
}

/**
 * Desarrollo: `ng serve` o la versión compilada servida en `localhost` (`npm run servir:pwa`, 104). Una publicación
 * (producción local en `*.localhost` o la nube) nunca lo es.
 */
export function esDesarrollo(
  modoDesarrollo: boolean = isDevMode(),
  host: string = globalThis.location?.hostname ?? '',
): boolean {
  return modoDesarrollo || host === 'localhost' || host === '127.0.0.1';
}

/** En la compilación publicada todos los campos vienen de `configuracion.json`; si falta uno, dice cuál. */
function configuracionPublicada(datos: unknown): Configuracion {
  const publicados = camposPublicados(datos);
  const faltan = CAMPOS.filter((campo) => publicados[campo] === undefined);
  if (faltan.length > 0) {
    throw new Error(`configuracion.json del ERP no trae ${faltan.join(', ')} (lo escribe infra al publicar).`);
  }
  return publicados as Configuracion;
}

/**
 * Lee `configuracion.json` (sin caché HTTP) y la deja vigente. En desarrollo (`esDesarrollo()`: sin el archivo, o con el
 * `index.html` que devuelve el servidor) quedan los valores de desarrollo y nunca rechaza. En la compilación publicada
 * rechaza si el archivo no está, no es JSON o le falta un campo: el ERP no arranca y la consola dice por qué, en vez de
 * apuntar en silencio a `localhost`.
 */
export async function cargarConfiguracion(
  obtener: typeof fetch = (entrada, opciones) => fetch(entrada, opciones),
  desarrollo: boolean = esDesarrollo(),
): Promise<Configuracion> {
  let datos: unknown;
  try {
    const respuesta = await obtener('configuracion.json', { cache: 'no-cache' });
    if (!respuesta.ok) {
      throw new Error(`configuracion.json del ERP respondió ${respuesta.status} (lo escribe infra al publicar).`);
    }
    datos = await respuesta.json();
  } catch (error) {
    if (!desarrollo) {
      throw error instanceof SyntaxError
        ? new Error('configuracion.json del ERP no es JSON: falta el archivo (lo escribe infra al publicar).')
        : error;
    }
    // Sin el archivo (o el servidor de desarrollo devolvió index.html): valores de desarrollo
    actual = { ...CONFIGURACION_DESARROLLO };
    return actual;
  }
  actual = desarrollo ? combinarConfiguracion(datos) : configuracionPublicada(datos);
  return actual;
}
