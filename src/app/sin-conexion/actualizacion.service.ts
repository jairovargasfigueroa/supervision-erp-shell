import { inject, Injectable, InjectionToken } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SwUpdate, type VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

/** Recarga la página; se reemplaza en las pruebas. */
export const RECARGAR_PAGINA = new InjectionToken<() => void>('RECARGAR_PAGINA', {
  providedIn: 'root',
  factory: () => () => document.location.reload(),
});

/** Avisa «Hay una versión nueva · Recargar» cuando el service worker tiene lista otra versión (104, criterio 5). */
@Injectable({ providedIn: 'root' })
export class ActualizacionService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly avisos = inject(MatSnackBar);
  private readonly recargar = inject(RECARGAR_PAGINA);

  iniciar(): void {
    // Con ng serve el service worker no se registra y no hay versiones que avisar
    if (!this.swUpdate.isEnabled) {
      return;
    }
    this.swUpdate.versionUpdates
      .pipe(filter((evento): evento is VersionReadyEvent => evento.type === 'VERSION_READY'))
      .subscribe(() => {
        this.avisos
          .open('Hay una versión nueva', 'Recargar')
          .onAction()
          .subscribe(() => this.recargar());
      });
  }
}
