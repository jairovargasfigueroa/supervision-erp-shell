import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
  type AfterViewInit,
} from '@angular/core';
import { ActivatedRoute, type Route, type UrlSegment } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';
import type { Remoto } from './remotos';
import { RemotoNoDisponibleComponent } from './remoto-no-disponible.component';

/**
 * Carga un microfrontend React (./Bootstrap registra su Web Component) y pinta su etiqueta, por ejemplo
 * <mf-materiales>. Si no carga, muestra el aviso con «Reintentar» sin afectar al resto del ERP.
 */
@Component({
  selector: 'app-remoto-web-component',
  imports: [RemotoNoDisponibleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (estado() === 'error') {
      <app-remoto-no-disponible [etiqueta]="remoto.etiqueta" (reintentar)="cargar()" />
    }
    <div #contenedor [hidden]="estado() !== 'listo'"></div>
  `,
})
export class RemotoWebComponentComponent implements AfterViewInit {
  protected readonly remoto: Remoto = inject(ActivatedRoute).snapshot.data['remoto'];
  protected readonly estado = signal<'cargando' | 'listo' | 'error'>('cargando');
  private readonly contenedor = viewChild.required<ElementRef<HTMLDivElement>>('contenedor');
  private elemento?: HTMLElement;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.elemento?.remove());
  }

  ngAfterViewInit(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    this.estado.set('cargando');
    try {
      await loadRemoteModule(this.remoto.nombre, this.remoto.modulo);
      if (!this.elemento) {
        this.elemento = document.createElement(this.remoto.elemento!);
        this.contenedor().nativeElement.appendChild(this.elemento);
      }
      this.estado.set('listo');
    } catch (error) {
      console.error(`No se pudo cargar ${this.remoto.nombre}`, error);
      this.estado.set('error');
    }
  }
}

/** Ruta que deja al microfrontend todo lo que empiece con su segmento (/materiales, /materiales/catalogo...). */
export function rutaRemotoWebComponent(remoto: Remoto): Route {
  return {
    matcher: (segmentos: UrlSegment[]) =>
      segmentos[0]?.path === remoto.ruta ? { consumed: segmentos } : null,
    component: RemotoWebComponentComponent,
    data: { remoto },
  };
}
