import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SesionService } from '../sesion/sesion.service';
import { rolPrincipal } from './menu';

/** Nombre y rol del usuario y «Cerrar sesión» (001, criterio 11). */
@Component({
  selector: 'app-barra-usuario',
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="usuario">
      <span class="nombre">{{ sesion.usuario()?.nombre }}</span>
      <span class="rol">{{ rol() }}</span>
    </span>
    <button mat-button (click)="sesion.cerrarSesion()">
      <mat-icon fontSet="material-symbols-outlined">logout</mat-icon>
      Cerrar sesión
    </button>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .usuario {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      line-height: 1.2;
    }
    .nombre {
      font-weight: 500;
      font-size: 14px;
    }
    .rol {
      font-size: 12px;
      opacity: 0.85;
    }
    @media (max-width: 599px) {
      .usuario {
        display: none;
      }
    }
  `,
})
export class BarraUsuarioComponent {
  protected readonly sesion = inject(SesionService);
  protected readonly rol = computed(() => rolPrincipal(this.sesion.roles()));
}
