import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Sin conexión y sin una sesión de las últimas 24 h en este navegador (104, criterio 3). */
@Component({
  selector: 'app-requiere-conexion',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="requiere-conexion" role="alert">
      <mat-icon fontSet="material-symbols-outlined">wifi_off</mat-icon>
      <h1>Conéctate a internet para iniciar sesión</h1>
    </section>
  `,
  styles: `
    .requiere-conexion {
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
      color: var(--sv-texto-secundario);
    }
    h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
  `,
})
export class RequiereConexionComponent {}
