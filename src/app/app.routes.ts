import { Routes } from '@angular/router';
import { rutaRemotoAngular } from './remotos/remoto-angular';
import { rutaRemotoWebComponent } from './remotos/remoto-web-component.component';
import { REMOTOS } from './remotos/remotos';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'obras' },
  ...REMOTOS.map((remoto) => (remoto.tipo === 'angular' ? rutaRemotoAngular(remoto) : rutaRemotoWebComponent(remoto))),
  { path: '**', redirectTo: 'obras' },
];
