import { TestBed } from '@angular/core/testing';
import { RemotoNoDisponibleComponent } from './remoto-no-disponible.component';

describe('RemotoNoDisponibleComponent', () => {
  it('muestra el aviso y avisa al pulsar Reintentar', () => {
    const fixture = TestBed.createComponent(RemotoNoDisponibleComponent);
    fixture.componentRef.setInput('etiqueta', 'Materiales');
    let reintentos = 0;
    fixture.componentInstance.reintentar.subscribe(() => reintentos++);
    fixture.detectChanges();

    const elemento = fixture.nativeElement as HTMLElement;
    expect(elemento.textContent).toContain('Materiales no está disponible por el momento.');
    elemento.querySelector('button')!.click();
    expect(reintentos).toBe(1);
  });
});
