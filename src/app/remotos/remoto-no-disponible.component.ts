import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/** Estado de error de docs/diseno-visual.md en el espacio de un microfrontend que no cargó. */
@Component({
  selector: 'app-remoto-no-disponible',
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="estado-error" role="alert">
      <mat-icon fontSet="material-symbols-outlined">cloud_off</mat-icon>
      <p>{{ etiqueta() }} no está disponible por el momento.</p>
      <button mat-flat-button (click)="reintentar.emit()">Reintentar</button>
    </section>
  `,
  styles: `
    .estado-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      margin: 24px auto;
      padding: 32px 24px;
      max-width: 480px;
      text-align: center;
      background: var(--sv-error-suave);
      color: var(--sv-error);
      border-radius: var(--sv-radio-tarjeta);
    }
    p {
      margin: 0;
      color: var(--sv-texto);
    }
  `,
})
export class RemotoNoDisponibleComponent {
  readonly etiqueta = input.required<string>();
  readonly reintentar = output<void>();
}
