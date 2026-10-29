import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, type Route, type Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';
import type { Remoto } from './remotos';
import { RemotoNoDisponibleComponent } from './remoto-no-disponible.component';

/** Lo que se muestra en la ruta de un remoto Angular que no cargó. */
@Component({
  selector: 'app-remoto-angular-no-disponible',
  imports: [RemotoNoDisponibleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-remoto-no-disponible [etiqueta]="etiqueta" (reintentar)="reintentar()" />`,
})
export class RemotoAngularNoDisponibleComponent {
  protected readonly etiqueta: string = inject(ActivatedRoute).snapshot.data['etiqueta'];

  // El router guarda las rutas ya cargadas: para reintentar se recarga la página
  protected reintentar(): void {
    window.location.reload();
  }
}

/** Ruta que carga las rutas expuestas por un remoto Angular (./Routes); si falla, muestra el aviso. */
export function rutaRemotoAngular(remoto: Remoto): Route {
  return {
    path: remoto.ruta,
    loadChildren: () =>
      loadRemoteModule<{ routes: Routes }>(remoto.nombre, remoto.modulo)
        .then((modulo) => modulo.routes)
        .catch((error: unknown) => {
          console.error(`No se pudo cargar ${remoto.nombre}`, error);
          return [{ path: '**', component: RemotoAngularNoDisponibleComponent, data: { etiqueta: remoto.etiqueta } }];
        }),
  };
}
