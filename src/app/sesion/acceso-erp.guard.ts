import { inject } from '@angular/core';
import { Router, type CanMatchFn } from '@angular/router';
import { tieneAccesoErp } from '../diseno/menu';
import { SesionService } from './sesion.service';

/** Sin un rol del ERP no se carga ningún microfrontend: se va a /sin-acceso. */
export const accesoErp: CanMatchFn = () =>
  tieneAccesoErp(inject(SesionService).roles()) || inject(Router).parseUrl('/sin-acceso');
