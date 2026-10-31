import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  AutoRefreshTokenService,
  KEYCLOAK_EVENT_SIGNAL,
  KeycloakEventType,
  type KeycloakEvent,
} from 'keycloak-angular';
import Keycloak from 'keycloak-js';
import { RECARGAR_PAGINA } from '../sin-conexion/actualizacion.service';
import { AlmacenService, type SesionGuardada } from '../sin-conexion/almacen.service';
import { ConexionService } from '../sin-conexion/conexion.service';
import { EVENTO_SESION, type UsuarioSesion } from './sesion-global';
import {
  KEYCLOAK_RESPONDE,
  SesionService,
  VIGENCIA_SESION_SIN_CONEXION_MS,
} from './sesion.service';

const ana: UsuarioSesion = { id: 'u-ana', nombre: 'Ana Rojas', roles: ['residente'] };
const HORA = 60 * 60 * 1000;

describe('SesionService', () => {
  let navegadorEnLinea: boolean;
  let keycloakResponde: boolean;
  let sesionGuardada: SesionGuardada | null;
  let guardadas: UsuarioSesion[];
  let recargas: number;
  let eventosSesion: number;
  const enLinea = signal(true);
  const eventosKeycloak = signal<KeycloakEvent>({
    type: KeycloakEventType.KeycloakAngularNotInitialized,
  });
  const contarEvento = () => eventosSesion++;

  // Keycloak falso: solo lo que usa SesionService
  let keycloak: {
    didInitialize: boolean;
    authenticated: boolean;
    token?: string;
    tokenParsed?: Record<string, unknown>;
    init: ReturnType<typeof vi.fn>;
    updateToken: ReturnType<typeof vi.fn>;
    login: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };

  function autenticarComo(usuario: UsuarioSesion) {
    keycloak.authenticated = true;
    keycloak.token = 'token-1';
    keycloak.tokenParsed = {
      sub: usuario.id,
      name: usuario.nombre,
      realm_access: { roles: usuario.roles },
    };
  }

  function crear(): SesionService {
    TestBed.configureTestingModule({
      providers: [
        { provide: Keycloak, useValue: keycloak },
        { provide: KEYCLOAK_EVENT_SIGNAL, useValue: eventosKeycloak },
        { provide: AutoRefreshTokenService, useValue: { start: vi.fn() } },
        {
          provide: AlmacenService,
          useValue: {
            leerSesion: () => Promise.resolve(sesionGuardada),
            guardarSesion: (usuario: UsuarioSesion) => {
              guardadas.push(usuario);
              return Promise.resolve();
            },
            usarUsuario: () => Promise.resolve(),
          },
        },
        { provide: ConexionService, useValue: { enLinea } },
        { provide: KEYCLOAK_RESPONDE, useValue: () => Promise.resolve(keycloakResponde) },
        { provide: RECARGAR_PAGINA, useValue: () => recargas++ },
      ],
    });
    return TestBed.inject(SesionService);
  }

  function guardadaHace(ms: number): SesionGuardada {
    return { usuario: ana, guardadaEn: new Date(Date.now() - ms).toISOString() };
  }

  beforeEach(() => {
    navegadorEnLinea = true;
    keycloakResponde = true;
    sesionGuardada = null;
    guardadas = [];
    recargas = 0;
    eventosSesion = 0;
    enLinea.set(true);
    eventosKeycloak.set({ type: KeycloakEventType.KeycloakAngularNotInitialized });
    keycloak = {
      didInitialize: false,
      authenticated: false,
      init: vi.fn(async () => {
        keycloak.didInitialize = true;
        return keycloak.authenticated;
      }),
      updateToken: vi.fn(() => Promise.resolve(true)),
      login: vi.fn(() => Promise.resolve()),
      logout: vi.fn(() => Promise.resolve()),
    };
    vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => navegadorEnLinea);
    window.addEventListener(EVENTO_SESION, contarEvento);
    window.plataforma = undefined;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    window.removeEventListener(EVENTO_SESION, contarEvento);
    vi.restoreAllMocks();
  });

  it('con conexión inicia con Keycloak (login-required), publica la sesión y la guarda en el equipo', async () => {
    autenticarComo(ana);
    const sesion = crear();
    await sesion.iniciar();

    expect(keycloak.init).toHaveBeenCalledWith(
      expect.objectContaining({ onLoad: 'login-required', pkceMethod: 'S256' }),
    );
    expect(sesion.modo()).toBe('activa');
    expect(sesion.usuario()).toEqual(ana);
    expect(window.plataforma?.sesion?.sinConexion).toBe(false);
    expect(await window.plataforma!.sesion!.obtenerToken()).toBe('token-1');
    expect(guardadas).toEqual([ana]);
  });

  it('sin conexión y con una sesión de hace 23 h entra en «modo sin conexión»', async () => {
    navegadorEnLinea = false;
    sesionGuardada = guardadaHace(23 * HORA);
    const sesion = crear();
    await sesion.iniciar();

    expect(keycloak.init).not.toHaveBeenCalled();
    expect(sesion.modo()).toBe('sin-conexion');
    expect(sesion.usuario()).toEqual(ana);
    expect(window.plataforma?.sesion?.usuario).toEqual(ana);
    expect(window.plataforma?.sesion?.sinConexion).toBe(true);
    await expect(window.plataforma!.sesion!.obtenerToken()).rejects.toThrow('SIN_CONEXION');
    expect(eventosSesion).toBeGreaterThan(0);
  });

  it('sin conexión y con una sesión de hace 25 h pide conectarse', async () => {
    navegadorEnLinea = false;
    sesionGuardada = guardadaHace(25 * HORA);
    const sesion = crear();
    await sesion.iniciar();

    expect(sesion.modo()).toBe('requiere-conexion');
    expect(sesion.usuario()).toBeNull();
    expect(window.plataforma?.sesion).toBeUndefined();
  });

  it('sin conexión y sin sesión guardada pide conectarse', async () => {
    navegadorEnLinea = false;
    const sesion = crear();
    await sesion.iniciar();
    expect(sesion.modo()).toBe('requiere-conexion');
  });

  it('entra sin conexión si Keycloak no responde o su inicio falla por la red', async () => {
    sesionGuardada = guardadaHace(VIGENCIA_SESION_SIN_CONEXION_MS - HORA);
    keycloakResponde = false;
    const sesion = crear();
    await sesion.iniciar();
    expect(keycloak.init).not.toHaveBeenCalled();
    expect(sesion.modo()).toBe('sin-conexion');

    TestBed.resetTestingModule();
    keycloakResponde = true;
    keycloak.init.mockRejectedValueOnce(new Error('Failed to fetch'));
    const otra = crear();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    enLinea.set(false);
    await otra.iniciar();
    expect(otra.modo()).toBe('sin-conexion');
  });

  it('al volver la conexión reanuda la sesión con check-sso si Keycloak sigue vigente', async () => {
    navegadorEnLinea = false;
    enLinea.set(false);
    sesionGuardada = guardadaHace(2 * HORA);
    const sesion = crear();
    await sesion.iniciar();
    TestBed.tick();
    expect(sesion.modo()).toBe('sin-conexion');

    navegadorEnLinea = true;
    autenticarComo(ana);
    eventosSesion = 0;
    enLinea.set(true);
    TestBed.tick();
    await vi.waitFor(() => expect(sesion.modo()).toBe('activa'));

    expect(keycloak.init).toHaveBeenCalledWith(
      expect.objectContaining({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
      }),
    );
    expect(window.plataforma?.sesion?.sinConexion).toBe(false);
    expect(eventosSesion).toBeGreaterThan(0);
    expect(sesion.requiereInicio()).toBe(false);
  });

  it('al volver la conexión sin sesión de Keycloak muestra «Iniciar sesión»', async () => {
    navegadorEnLinea = false;
    enLinea.set(false);
    sesionGuardada = guardadaHace(2 * HORA);
    const sesion = crear();
    await sesion.iniciar();
    TestBed.tick();

    navegadorEnLinea = true;
    enLinea.set(true);
    TestBed.tick();
    await vi.waitFor(() => expect(sesion.requiereInicio()).toBe(true));

    expect(sesion.modo()).toBe('sin-conexion');
    sesion.iniciarSesion();
    expect(keycloak.login).toHaveBeenCalled();
  });

  it('con «Conéctate a internet» recarga el ERP al volver la conexión', async () => {
    navegadorEnLinea = false;
    enLinea.set(false);
    const sesion = crear();
    await sesion.iniciar();
    TestBed.tick();
    expect(recargas).toBe(0);

    enLinea.set(true);
    TestBed.tick();
    expect(sesion.modo()).toBe('requiere-conexion');
    expect(recargas).toBe(1);
  });

  it('si no se puede renovar el token sin conexión, sigue en «modo sin conexión» sin ir a Keycloak', async () => {
    autenticarComo(ana);
    const sesion = crear();
    await sesion.iniciar();
    TestBed.tick();

    navegadorEnLinea = false;
    enLinea.set(false);
    eventosKeycloak.set({ type: KeycloakEventType.AuthRefreshError });
    TestBed.tick();
    await vi.waitFor(() => expect(sesion.modo()).toBe('sin-conexion'));

    expect(keycloak.login).not.toHaveBeenCalled();
    expect(sesion.usuario()).toEqual(ana);
    await expect(sesion.obtenerToken()).rejects.toThrow('SIN_CONEXION');
  });

  it('si no se puede renovar el token con conexión, vuelve al inicio de sesión (001)', async () => {
    autenticarComo(ana);
    const sesion = crear();
    await sesion.iniciar();
    TestBed.tick();

    eventosKeycloak.set({ type: KeycloakEventType.AuthRefreshError });
    TestBed.tick();
    await vi.waitFor(() => expect(keycloak.login).toHaveBeenCalled());
  });
});
