import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { SesionService } from '../sesion/sesion.service';
import { BarraUsuarioComponent } from './barra-usuario.component';
import { opcionesMenu } from './menu';

/** Barra superior, menú lateral y espacio de los microfrontends (docs/diseno-visual.md, «Distribución del ERP»). */
@Component({
  selector: 'app-shell',
  imports: [
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    BarraUsuarioComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-toolbar class="barra">
      @if (!escritorio()) {
        <button mat-icon-button aria-label="Abrir el menú" (click)="menu.toggle()">
          <mat-icon fontSet="material-symbols-outlined">menu</mat-icon>
        </button>
      }
      <span class="marca">Supervisión de obras</span>
      <span class="espacio"></span>
      <app-barra-usuario />
    </mat-toolbar>
    <mat-sidenav-container class="contenedor">
      <mat-sidenav
        #menu
        class="menu"
        [mode]="escritorio() ? 'side' : 'over'"
        [opened]="escritorio()"
      >
        <mat-nav-list>
          @for (opcion of opciones(); track opcion.ruta) {
            <a
              mat-list-item
              [routerLink]="opcion.ruta"
              routerLinkActive="activa"
              #enlace="routerLinkActive"
              [activated]="enlace.isActive"
              (click)="escritorio() || menu.close()"
            >
              <mat-icon matListItemIcon fontSet="material-symbols-outlined">{{ opcion.icono }}</mat-icon>
              <span matListItemTitle>{{ opcion.etiqueta }}</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content class="contenido">
        <router-outlet />
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100dvh;
    }
    .barra {
      height: 56px;
      background: var(--sv-primario);
      color: #ffffff;
      gap: 8px;
      --mat-toolbar-container-background-color: var(--sv-primario);
      --mat-toolbar-container-text-color: #ffffff;
    }
    .marca {
      font-weight: 600;
      font-size: 18px;
    }
    .espacio {
      flex: 1;
    }
    .contenedor {
      flex: 1;
    }
    .menu {
      width: 240px;
      background: var(--sv-primario-oscuro);
      border-radius: 0;
      --mat-list-list-item-label-text-color: #ffffff;
      --mat-list-list-item-leading-icon-color: #ffffff;
      --mat-list-list-item-hover-label-text-color: #ffffff;
      --mat-list-list-item-focus-label-text-color: #ffffff;
      --mat-list-active-indicator-color: rgba(255, 255, 255, 0.16);
    }
    .menu .activa mat-icon,
    .menu .activa span {
      color: #ffffff;
    }
    .contenido {
      background: var(--sv-fondo);
    }
  `,
})
export class ShellComponent {
  private readonly sesion = inject(SesionService);
  protected readonly opciones = computed(() => opcionesMenu(this.sesion.roles()));
  // Desde 960 px el menú queda fijo; debajo es un cajón (docs/diseno-visual.md, «Pantallas chicas»)
  protected readonly escritorio = toSignal(
    inject(BreakpointObserver)
      .observe('(min-width: 960px)')
      .pipe(map((estado) => estado.matches)),
    { initialValue: true },
  );
}
