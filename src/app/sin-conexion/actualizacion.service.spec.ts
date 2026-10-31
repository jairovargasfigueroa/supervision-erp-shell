import { TestBed } from '@angular/core/testing';
import { SwUpdate, type VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { ActualizacionService, RECARGAR_PAGINA } from './actualizacion.service';

describe('ActualizacionService', () => {
  function preparar(isEnabled = true) {
    const versiones = new Subject<VersionEvent>();
    let recargas = 0;
    TestBed.configureTestingModule({
      providers: [
        { provide: SwUpdate, useValue: { isEnabled, versionUpdates: versiones.asObservable() } },
        { provide: RECARGAR_PAGINA, useValue: () => recargas++ },
      ],
    });
    TestBed.inject(ActualizacionService).iniciar();
    return { versiones, recargas: () => recargas };
  }

  const versionLista: VersionEvent = {
    type: 'VERSION_READY',
    currentVersion: { hash: 'a' },
    latestVersion: { hash: 'b' },
  };

  function aviso(): HTMLElement | null {
    return document.querySelector('mat-snack-bar-container');
  }

  afterEach(() =>
    document.querySelectorAll('.cdk-overlay-container').forEach((nodo) => nodo.remove()),
  );

  it('muestra «Hay una versión nueva · Recargar» y recarga al pulsarlo', () => {
    const { versiones, recargas } = preparar();
    versiones.next(versionLista);
    TestBed.tick();

    expect(aviso()?.textContent).toContain('Hay una versión nueva');
    const boton = aviso()!.querySelector('button')!;
    expect(boton.textContent).toContain('Recargar');
    boton.click();
    expect(recargas()).toBe(1);
  });

  it('no avisa con otros eventos del service worker', () => {
    const { versiones } = preparar();
    versiones.next({ type: 'VERSION_DETECTED', version: { hash: 'b' } });
    TestBed.tick();
    expect(aviso()).toBeNull();
  });

  it('no hace nada si el service worker no está activo (ng serve)', () => {
    const { versiones } = preparar(false);
    versiones.next(versionLista);
    TestBed.tick();
    expect(aviso()).toBeNull();
  });
});
