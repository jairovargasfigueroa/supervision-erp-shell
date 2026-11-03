import { describe, expect, it } from 'vitest';
import {
  CONFIGURACION_DESARROLLO,
  cargarConfiguracion,
  combinarConfiguracion,
  configuracion,
} from './configuracion';

const respuestaJson = (cuerpo: unknown, status = 200): Response =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('configuracion', () => {
  it('sin cargar, usa los valores de desarrollo', () => {
    expect(CONFIGURACION_DESARROLLO).toEqual({
      keycloakUrl: 'http://localhost:8080',
      keycloakRealm: 'supervision',
      gatewayUrl: 'http://localhost:4000/graphql',
      portalUrl: 'http://localhost:4300',
    });
  });

  it('carga configuracion.json sin caché y la deja vigente', async () => {
    const publicada = {
      keycloakUrl: 'https://keycloak.azure.localhost:8443',
      keycloakRealm: 'supervision',
      gatewayUrl: 'https://gateway.azure.localhost:8443/graphql',
      portalUrl: 'https://portal.azure.localhost:8443',
    };
    const pedidos: [RequestInfo | URL, RequestInit | undefined][] = [];

    const resultado = await cargarConfiguracion(async (entrada, opciones) => {
      pedidos.push([entrada, opciones]);
      return respuestaJson(publicada);
    });

    expect(pedidos).toEqual([['configuracion.json', { cache: 'no-cache' }]]);
    expect(resultado).toEqual(publicada);
    expect(configuracion()).toEqual(publicada);
  });

  it('si el archivo no está (404), vuelve a los valores de desarrollo', async () => {
    await cargarConfiguracion(async () => respuestaJson({ gatewayUrl: 'https://otro/graphql' }));

    const resultado = await cargarConfiguracion(
      async () => new Response('No encontrado', { status: 404 }),
    );

    expect(resultado).toEqual(CONFIGURACION_DESARROLLO);
    expect(configuracion()).toEqual(CONFIGURACION_DESARROLLO);
  });

  it('si el servidor de desarrollo devuelve index.html, usa los valores de desarrollo', async () => {
    const resultado = await cargarConfiguracion(
      async () => new Response('<!doctype html><html></html>', { status: 200 }),
    );

    expect(resultado).toEqual(CONFIGURACION_DESARROLLO);
  });

  it('si la red falla, usa los valores de desarrollo', async () => {
    const resultado = await cargarConfiguracion(async () => {
      throw new TypeError('Failed to fetch');
    });

    expect(resultado).toEqual(CONFIGURACION_DESARROLLO);
  });

  it('completa con los valores de desarrollo los campos que faltan, vacíos o que no son texto', () => {
    expect(
      combinarConfiguracion({
        keycloakUrl: ' https://keycloak.ejemplo ',
        keycloakRealm: '',
        gatewayUrl: 42,
      }),
    ).toEqual({ ...CONFIGURACION_DESARROLLO, keycloakUrl: 'https://keycloak.ejemplo' });
    expect(combinarConfiguracion(null)).toEqual(CONFIGURACION_DESARROLLO);
    expect(combinarConfiguracion(['x'])).toEqual(CONFIGURACION_DESARROLLO);
  });
});
