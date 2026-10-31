import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

/** Texto del aviso al cerrar sesión con borradores de planilla sin enviar (104, criterio 19). */
export function avisoBorradoresAlCerrar(cantidad: number): string {
  return cantidad === 1
    ? 'Tienes 1 borrador de planilla sin enviar. Si cierras sesión se borrará de este equipo'
    : `Tienes ${cantidad} borradores de planilla sin enviar. Si cierras sesión se borrarán de este equipo`;
}

/** Confirmación antes de cerrar sesión con borradores locales; se cierra con `true` si el usuario confirma. */
@Component({
  selector: 'app-confirmar-cierre',
  imports: [MatDialogModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Cerrar sesión</h2>
    <mat-dialog-content>{{ aviso() }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Cancelar</button>
      <button mat-flat-button class="confirmar" [mat-dialog-close]="true">Cerrar sesión</button>
    </mat-dialog-actions>
  `,
  styles: `
    .confirmar {
      --mat-button-filled-container-color: var(--sv-error);
    }
  `,
})
export class ConfirmarCierreComponent {
  private readonly datos = inject<{ cantidad: number }>(MAT_DIALOG_DATA);
  protected readonly aviso = computed(() => avisoBorradoresAlCerrar(this.datos.cantidad));
}
