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

/** Valores de desarrollo: los de `environment.ts`. Se usan si `configuracion.json` no está (desarrollo). */
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

/** Toma de `datos` cada campo que sea un texto no vacío; el resto queda con el valor de desarrollo. */
export function combinarConfiguracion(datos: unknown): Configuracion {
  const resultado: Configuracion = { ...CONFIGURACION_DESARROLLO };
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

/**
 * Lee `configuracion.json` (sin caché HTTP) y la deja vigente. Si el archivo no está o no es JSON (desarrollo con
 * `ng serve`), queda la configuración de desarrollo. Nunca rechaza.
 */
export async function cargarConfiguracion(
  obtener: typeof fetch = (entrada, opciones) => fetch(entrada, opciones),
): Promise<Configuracion> {
  try {
    const respuesta = await obtener('configuracion.json', { cache: 'no-cache' });
    actual = respuesta.ok
      ? combinarConfiguracion(await respuesta.json())
      : { ...CONFIGURACION_DESARROLLO };
  } catch {
    // Sin el archivo (o el servidor de desarrollo devolvió index.html): valores de desarrollo
    actual = { ...CONFIGURACION_DESARROLLO };
  }
  return actual;
}
