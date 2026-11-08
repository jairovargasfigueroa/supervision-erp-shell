import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ShellComponent } from './diseno/shell.component';
import { RequiereConexionComponent } from './sesion/requiere-conexion.component';
import { SesionService } from './sesion/sesion.service';

@Component({
  selector: 'app-root',
  imports: [ShellComponent, RequiereConexionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (sesion.modo() === 'requiere-conexion') {
      <app-requiere-conexion />
    } @else {
      <app-shell />
    }
  `,
})
export class App {
  protected readonly sesion = inject(SesionService);
}
