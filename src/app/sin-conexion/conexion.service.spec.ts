import { TestBed } from '@angular/core/testing';
import { EVENTO_CONEXION } from '../sesion/sesion-global';
import { CONSULTAR_SALUD, ConexionService, INTERVALO_COMPROBACION_MS } from './conexion.service';

describe('ConexionService', () => {
  let navegadorEnLinea: boolean;
  let gatewayResponde: boolean;
  let consultas: number;
  let eventos: boolean[];
  const escuchar = (evento: Event) =>
    eventos.push((evento as CustomEvent<{ enLinea: boolean }>).detail.enLinea);

  function iniciar(): ConexionService {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CONSULTAR_SALUD,
          useValue: () => {
            consultas++;
            return Promise.resolve(gatewayResponde);
          },
        },
      ],
    });
    const servicio = TestBed.inject(ConexionService);
    servicio.iniciar();
    return servicio;
  }

  function cambiarNavegador(enLinea: boolean): void {
    navegadorEnLinea = enLinea;
    window.dispatchEvent(new Event(enLinea ? 'online' : 'offline'));
  }

  beforeEach(() => {
    vi.useFakeTimers();
    navegadorEnLinea = true;
    gatewayResponde = true;
    consultas = 0;
    eventos = [];
    vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => navegadorEnLinea);
    window.addEventListener(EVENTO_CONEXION, escuchar);
    window.plataforma = undefined;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    window.removeEventListener(EVENTO_CONEXION, escuchar);
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('publica window.plataforma.conexion en línea y no consulta al gateway', async () => {
    const servicio = iniciar();
    await vi.advanceTimersByTimeAsync(INTERVALO_COMPROBACION_MS * 2);

    expect(servicio.enLinea()).toBe(true);
    expect(window.plataforma?.conexion?.enLinea).toBe(true);
    expect(window.plataforma?.configuracion.gatewayUrl).toBeTruthy();
    expect(consultas).toBe(0);
  });

  it('pasa a sin conexión con el evento offline del navegador y vuelve con online', () => {
    const servicio = iniciar();

    cambiarNavegador(false);
    expect(servicio.enLinea()).toBe(false);
    expect(window.plataforma?.conexion?.enLinea).toBe(false);

    cambiarNavegador(true);
    expect(servicio.enLinea()).toBe(true);
    expect(eventos).toEqual([false, true]);
  });

  it('arranca sin conexión si el navegador no tiene red', () => {
    navegadorEnLinea = false;
    const servicio = iniciar();
    expect(servicio.enLinea()).toBe(false);
    expect(window.plataforma?.conexion?.enLinea).toBe(false);
  });

  it('con un fallo reportado consulta { salud } cada 30 s hasta que el gateway vuelve', async () => {
    const servicio = iniciar();
    gatewayResponde = false;

    window.plataforma!.conexion!.reportarFallo();
    expect(servicio.enLinea()).toBe(false);
    expect(eventos).toEqual([false]);

    await vi.advanceTimersByTimeAsync(INTERVALO_COMPROBACION_MS);
    expect(consultas).toBe(1);
    expect(servicio.enLinea()).toBe(false);

    await vi.advanceTimersByTimeAsync(INTERVALO_COMPROBACION_MS);
    expect(consultas).toBe(2);
    expect(servicio.enLinea()).toBe(false);

    gatewayResponde = true;
    await vi.advanceTimersByTimeAsync(INTERVALO_COMPROBACION_MS);
    expect(consultas).toBe(3);
    expect(servicio.enLinea()).toBe(true);
    expect(eventos).toEqual([false, true]);

    // Ya en línea, deja de consultar
    await vi.advanceTimersByTimeAsync(INTERVALO_COMPROBACION_MS * 3);
    expect(consultas).toBe(3);
  });

  it('sin red en el navegador no consulta al gateway; al volver la red comprueba si había fallado', async () => {
    const servicio = iniciar();
    gatewayResponde = false;
    servicio.reportarFallo();
    cambiarNavegador(false);

    await vi.advanceTimersByTimeAsync(INTERVALO_COMPROBACION_MS * 2);
    expect(consultas).toBe(0);

    gatewayResponde = true;
    cambiarNavegador(true);
    await vi.advanceTimersByTimeAsync(0);
    expect(consultas).toBe(1);
    expect(servicio.enLinea()).toBe(true);
  });
});
