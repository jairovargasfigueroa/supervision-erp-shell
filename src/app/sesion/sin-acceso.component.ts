import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SesionService } from './sesion.service';

/** Usuario sin admin, residente ni gerente (001, criterio 3): su nombre y «Cerrar sesión». */
@Component({
  selector: 'app-sin-acceso',
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="sin-acceso" role="alert">
      <mat-icon fontSet="material-symbols-outlined">block</mat-icon>
      <h1>No tienes acceso a esta aplicación</h1>
      <p>{{ sesion.usuario()?.nombre }}, tu cuenta no tiene un rol del ERP.</p>
      <button mat-flat-button (click)="sesion.cerrarSesion()">Cerrar sesión</button>
    </section>
  `,
  styles: `
    .sin-acceso {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      margin: 48px auto;
      padding: 32px 24px;
      max-width: 480px;
      text-align: center;
      background: var(--sv-superficie);
      border: 1px solid var(--sv-borde);
      border-radius: var(--sv-radio-tarjeta);
    }
    mat-icon {
      color: var(--sv-error);
    }
    h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
    p {
      margin: 0;
      color: var(--sv-texto-secundario);
    }
  `,
})
export class SinAccesoComponent {
  protected readonly sesion = inject(SesionService);
}
