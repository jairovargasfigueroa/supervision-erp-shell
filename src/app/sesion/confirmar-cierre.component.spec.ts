import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { avisoBorradoresAlCerrar, ConfirmarCierreComponent } from './confirmar-cierre.component';

describe('ConfirmarCierreComponent', () => {
  it('muestra cuántos borradores se borrarán y confirma con «Cerrar sesión»', () => {
    let resultado: unknown;
    TestBed.configureTestingModule({
      imports: [ConfirmarCierreComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { cantidad: 3 } },
        { provide: MatDialogRef, useValue: { close: (valor: unknown) => (resultado = valor) } },
      ],
    });
    const fixture = TestBed.createComponent(ConfirmarCierreComponent);
    fixture.detectChanges();

    const elemento = fixture.nativeElement as HTMLElement;
    expect(elemento.textContent).toContain(
      'Tienes 3 borradores de planilla sin enviar. Si cierras sesión se borrarán de este equipo',
    );
    const botones = [...elemento.querySelectorAll('button')];
    botones.find((b) => b.textContent?.includes('Cerrar sesión'))!.click();
    expect(resultado).toBe(true);
  });

  it('usa el singular con un solo borrador', () => {
    expect(avisoBorradoresAlCerrar(1)).toBe(
      'Tienes 1 borrador de planilla sin enviar. Si cierras sesión se borrará de este equipo',
    );
  });
});
