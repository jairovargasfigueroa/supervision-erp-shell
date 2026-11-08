import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SesionService } from './sesion.service';
import { SinAccesoComponent } from './sin-acceso.component';

describe('SinAccesoComponent', () => {
  it('muestra el aviso con el nombre y cierra la sesión', () => {
    let cierres = 0;
    TestBed.configureTestingModule({
      imports: [SinAccesoComponent],
      providers: [
        {
          provide: SesionService,
          useValue: {
            usuario: signal({ id: 'u1', nombre: 'Freddy Choque Mamani', roles: ['maestro'] }),
            cerrarSesion: () => cierres++,
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(SinAccesoComponent);
    fixture.detectChanges();

    const elemento = fixture.nativeElement as HTMLElement;
    expect(elemento.textContent).toContain('No tienes acceso a esta aplicación');
    expect(elemento.textContent).toContain('Freddy Choque Mamani');
    elemento.querySelector('button')!.click();
    expect(cierres).toBe(1);
  });
});
