import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { environment } from '../../environments/environment';
import { SesionService } from '../sesion/sesion.service';
import { aplicacionesWeb, rolPrincipal } from './menu';

/** Menú «Aplicaciones» (001, criterio 10), nombre y rol del usuario y «Cerrar sesión» (criterio 11). */
@Component({
  selector: 'app-barra-usuario',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (aplicaciones().length > 0) {
      <button mat-button [matMenuTriggerFor]="menuAplicaciones">
        <mat-icon fontSet="material-symbols-outlined">apps</mat-icon>
        Aplicaciones
      </button>
      <mat-menu #menuAplicaciones="matMenu">
        @for (aplicacion of aplicaciones(); track aplicacion.url) {
          <a mat-menu-item [href]="aplicacion.url" target="_blank" rel="noopener">
            <mat-icon fontSet="material-symbols-outlined">open_in_new</mat-icon>
            {{ aplicacion.etiqueta }}
          </a>
        }
      </mat-menu>
    }
    @if (sesion.requiereInicio()) {
      <!-- 104, criterio 4: volvió la conexión pero la sesión de Keycloak venció -->
      <button mat-flat-button class="iniciar" (click)="sesion.iniciarSesion()">
        <mat-icon fontSet="material-symbols-outlined">login</mat-icon>
        Iniciar sesión
      </button>
    }
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
    .iniciar {
      --mat-button-filled-container-color: var(--sv-acento);
      --mat-button-filled-label-text-color: #ffffff;
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
  protected readonly aplicaciones = computed(() =>
    aplicacionesWeb(this.sesion.roles(), environment.portalUrl),
  );
}
