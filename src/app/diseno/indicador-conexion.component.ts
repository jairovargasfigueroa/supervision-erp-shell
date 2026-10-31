import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { formatearPeriodo } from '../compartido/formato';
import { AlmacenService } from '../sin-conexion/almacen.service';
import { ConexionService } from '../sin-conexion/conexion.service';

/** Ruta del editor de planilla de mf-obras (007) dentro del ERP. */
export function rutaPlanilla(planillaId: string): string {
  return `/obras/planillas/${planillaId}`;
}

/** Barra superior (104, criterio 6): «Sin conexión» y «Borradores sin enviar (N)». */
@Component({
  selector: 'app-indicador-conexion',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!conexion.enLinea()) {
      <span class="sin-conexion" role="status">
        <mat-icon fontSet="material-symbols-outlined">cloud_off</mat-icon>
        Sin conexión
      </span>
    }
    @let lista = borradores();
    @if (lista.length === 1) {
      <a mat-button class="borradores" [routerLink]="ruta(lista[0].planillaId)">
        <mat-icon fontSet="material-symbols-outlined">draft</mat-icon>
        {{ etiqueta() }}
      </a>
    } @else if (lista.length > 1) {
      <button mat-button class="borradores" [matMenuTriggerFor]="menuBorradores">
        <mat-icon fontSet="material-symbols-outlined">draft</mat-icon>
        {{ etiqueta() }}
      </button>
      <mat-menu #menuBorradores="matMenu">
        @for (borrador of lista; track borrador.planillaId) {
          <a mat-menu-item [routerLink]="ruta(borrador.planillaId)">
            Planilla N.º {{ borrador.numero }} · {{ periodo(borrador.periodo) }}
          </a>
        }
      </mat-menu>
    }
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .sin-conexion {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      border-radius: 999px;
      background: var(--sv-atencion-suave);
      color: var(--sv-atencion);
      font-size: 13px;
      font-weight: 500;
    }
    .sin-conexion mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .borradores {
      --mat-button-text-label-text-color: #ffffff;
    }
  `,
})
export class IndicadorConexionComponent {
  protected readonly conexion = inject(ConexionService);
  protected readonly borradores = inject(AlmacenService).borradores;
  protected readonly etiqueta = computed(
    () => `Borradores sin enviar (${this.borradores().length})`,
  );
  protected readonly ruta = rutaPlanilla;
  protected readonly periodo = formatearPeriodo;
}
