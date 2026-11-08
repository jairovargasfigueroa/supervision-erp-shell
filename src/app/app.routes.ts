import { Routes } from '@angular/router';
import { rutaRemotoAngular } from './remotos/remoto-angular';
import { rutaRemotoWebComponent } from './remotos/remoto-web-component.component';
import { REMOTOS } from './remotos/remotos';
import { accesoErp } from './sesion/acceso-erp.guard';
import { SinAccesoComponent } from './sesion/sin-acceso.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'obras' },
  { path: 'sin-acceso', component: SinAccesoComponent },
  ...REMOTOS.map((remoto) => ({
    ...(remoto.tipo === 'angular' ? rutaRemotoAngular(remoto) : rutaRemotoWebComponent(remoto)),
    canMatch: [accesoErp],
  })),
  { path: '**', redirectTo: 'obras' },
];
