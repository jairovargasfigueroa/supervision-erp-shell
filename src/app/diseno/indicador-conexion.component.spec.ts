import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { BorradorPlanilla } from '../sesion/sesion-global';
import { AlmacenService } from '../sin-conexion/almacen.service';
import { ConexionService } from '../sin-conexion/conexion.service';
import { IndicadorConexionComponent } from './indicador-conexion.component';

function borrador(planillaId: string, numero: number): BorradorPlanilla {
  return {
    planillaId,
    obraId: 'obra-1',
    numero,
    periodo: '2026-10',
    versionBase: 1,
    lineas: [],
    fotoIds: [],
    guardadoEn: '2026-10-30T10:00:00.000Z',
    estadoEnvio: 'PENDIENTE',
  };
}

describe('IndicadorConexionComponent', () => {
  const enLinea = signal(true);
  const borradores = signal<BorradorPlanilla[]>([]);

  function pintar(): HTMLElement {
    TestBed.configureTestingModule({
      imports: [IndicadorConexionComponent],
      providers: [
        provideRouter([]),
        { provide: ConexionService, useValue: { enLinea } },
        { provide: AlmacenService, useValue: { borradores } },
      ],
    });
    const fixture = TestBed.createComponent(IndicadorConexionComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    enLinea.set(true);
    borradores.set([]);
  });

  it('en línea y sin borradores no muestra nada', () => {
    expect(pintar().textContent?.trim()).toBe('');
  });

  it('muestra «Sin conexión» mientras no hay conexión', () => {
    enLinea.set(false);
    expect(pintar().textContent).toContain('Sin conexión');
  });

  it('con un borrador muestra «Borradores sin enviar (1)» que abre su planilla', () => {
    borradores.set([borrador('pl-7', 3)]);
    const enlace = pintar().querySelector('a')!;
    expect(enlace.textContent).toContain('Borradores sin enviar (1)');
    expect(enlace.getAttribute('href')).toBe('/obras/planillas/pl-7');
  });

  it('con varios borradores abre una lista con cada planilla', () => {
    borradores.set([borrador('pl-1', 1), borrador('pl-2', 2)]);
    const elemento = pintar();
    const boton = elemento.querySelector('button')!;
    expect(boton.textContent).toContain('Borradores sin enviar (2)');

    boton.click();
    TestBed.tick();
    const opciones = [...document.querySelectorAll<HTMLAnchorElement>('.mat-mdc-menu-item')];
    expect(opciones.map((o) => o.textContent?.trim())).toEqual([
      'Planilla N.º 1 · Octubre 2026',
      'Planilla N.º 2 · Octubre 2026',
    ]);
    expect(opciones[1].getAttribute('href')).toBe('/obras/planillas/pl-2');
  });
});
