import 'fake-indexeddb/auto';
import { TestBed } from '@angular/core/testing';
import { IDBFactory } from 'fake-indexeddb';
import { EVENTO_BORRADORES, type BorradorPlanilla } from '../sesion/sesion-global';
import { AlmacenService, ANTIGUEDAD_MAXIMA_CONSULTA_MS, MAXIMO_CONSULTAS } from './almacen.service';

function borrador(planillaId: string): BorradorPlanilla {
  return {
    planillaId,
    obraId: 'obra-1',
    numero: 2,
    periodo: '2026-10',
    versionBase: 3,
    lineas: [{ partidaId: 'p-1', cantidadPeriodo: 12.5 }],
    fotoIds: ['f-1'],
    guardadoEn: '2026-10-30T10:00:00.000Z',
    estadoEnvio: 'PENDIENTE',
  };
}

describe('AlmacenService', () => {
  let almacen: AlmacenService;

  beforeEach(async () => {
    // Base nueva en cada prueba
    globalThis.indexedDB = new IDBFactory();
    window.plataforma = { configuracion: { gatewayUrl: 'http://gateway' } };
    almacen = TestBed.inject(AlmacenService);
    almacen.iniciar();
    await almacen.usarUsuario('residente-1');
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('publica window.plataforma.almacen y guarda y lee una consulta', async () => {
    const publicado = window.plataforma!.almacen!;
    expect(window.plataforma?.configuracion.gatewayUrl).toBeTruthy();

    await publicado.guardarConsulta('obras:{}', [{ id: 'obra-1' }]);
    const leida = await publicado.leerConsulta<{ id: string }[]>('obras:{}');

    expect(leida?.datos).toEqual([{ id: 'obra-1' }]);
    expect(Date.parse(leida!.guardadoEn)).not.toBeNaN();
    expect(await publicado.leerConsulta('otra')).toBeNull();
  });

  it('separa los datos por usuario', async () => {
    await almacen.guardarConsulta('obras:{}', ['de residente-1']);
    await almacen.guardarBorradorPlanilla(borrador('pl-1'));

    await almacen.usarUsuario('residente-2');
    expect(await almacen.leerConsulta('obras:{}')).toBeNull();
    expect(await almacen.leerBorradorPlanilla('pl-1')).toBeNull();
    expect(await almacen.listarBorradoresPlanilla()).toEqual([]);

    await almacen.usarUsuario('residente-1');
    expect((await almacen.leerConsulta('obras:{}'))?.datos).toEqual(['de residente-1']);
  });

  it('sin usuario no guarda ni lee nada', async () => {
    await almacen.usarUsuario(null);
    await almacen.guardarConsulta('obras:{}', ['x']);
    await almacen.guardarBorradorPlanilla(borrador('pl-1'));
    expect(await almacen.leerConsulta('obras:{}')).toBeNull();
    expect(await almacen.listarBorradoresPlanilla()).toEqual([]);
  });

  it(`guarda hasta ${MAXIMO_CONSULTAS} consultas por usuario y borra las más antiguas`, async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const inicio = Date.parse('2026-10-30T08:00:00.000Z');
    for (let i = 0; i < MAXIMO_CONSULTAS + 2; i++) {
      vi.setSystemTime(inicio + i * 1000);
      await almacen.guardarConsulta(`c${i}`, i);
    }
    await almacen.usarUsuario('residente-2');
    await almacen.guardarConsulta('de-otro', 1);
    await almacen.usarUsuario('residente-1');

    expect(await almacen.leerConsulta('c0')).toBeNull();
    expect(await almacen.leerConsulta('c1')).toBeNull();
    expect((await almacen.leerConsulta('c2'))?.datos).toBe(2);
    expect((await almacen.leerConsulta(`c${MAXIMO_CONSULTAS + 1}`))?.datos).toBe(
      MAXIMO_CONSULTAS + 1,
    );
    await almacen.usarUsuario('residente-2');
    expect((await almacen.leerConsulta('de-otro'))?.datos).toBe(1);
  });

  it('al guardar borra las consultas de más de 7 días', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const inicio = Date.parse('2026-10-01T08:00:00.000Z');
    vi.setSystemTime(inicio);
    await almacen.guardarConsulta('vieja', 'v');
    vi.setSystemTime(inicio + ANTIGUEDAD_MAXIMA_CONSULTA_MS);
    await almacen.guardarConsulta('de-hace-7-dias-justo', 'j');
    vi.setSystemTime(inicio + ANTIGUEDAD_MAXIMA_CONSULTA_MS + 1);
    await almacen.guardarConsulta('nueva', 'n');

    expect(await almacen.leerConsulta('vieja')).toBeNull();
    expect((await almacen.leerConsulta('de-hace-7-dias-justo'))?.datos).toBe('j');
    expect((await almacen.leerConsulta('nueva'))?.datos).toBe('n');
  });

  it('guarda, lista y borra borradores de planilla y avisa con plataforma:borradores', async () => {
    let avisos = 0;
    const contar = () => avisos++;
    window.addEventListener(EVENTO_BORRADORES, contar);
    try {
      await almacen.guardarBorradorPlanilla(borrador('pl-1'));
      await almacen.guardarBorradorPlanilla(borrador('pl-2'));
      expect(await almacen.leerBorradorPlanilla('pl-1')).toEqual(borrador('pl-1'));
      expect((await almacen.listarBorradoresPlanilla()).map((b) => b.planillaId)).toEqual([
        'pl-1',
        'pl-2',
      ]);
      expect(almacen.borradores().length).toBe(2);

      await almacen.borrarBorradorPlanilla('pl-1');
      expect(await almacen.leerBorradorPlanilla('pl-1')).toBeNull();
      expect(almacen.borradores().map((b) => b.planillaId)).toEqual(['pl-2']);
      expect(avisos).toBe(3);
    } finally {
      window.removeEventListener(EVENTO_BORRADORES, contar);
    }
  });

  it('borra los datos de un usuario sin tocar los de otro', async () => {
    const usuario = { id: 'residente-1', nombre: 'Ana', roles: ['residente'] };
    await almacen.guardarSesion(usuario);
    await almacen.guardarConsulta('obras:{}', ['a']);
    await almacen.guardarBorradorPlanilla(borrador('pl-1'));
    await almacen.usarUsuario('residente-2');
    await almacen.guardarConsulta('obras:{}', ['b']);
    await almacen.usarUsuario('residente-1');

    expect((await almacen.leerSesion())?.usuario).toEqual(usuario);
    await almacen.borrarDatosUsuario('residente-1');

    expect(await almacen.leerConsulta('obras:{}')).toBeNull();
    expect(await almacen.listarBorradoresPlanilla()).toEqual([]);
    expect(await almacen.leerSesion()).toBeNull();
    expect(almacen.borradores()).toEqual([]);
    await almacen.usarUsuario('residente-2');
    expect((await almacen.leerConsulta('obras:{}'))?.datos).toEqual(['b']);
  });
});
