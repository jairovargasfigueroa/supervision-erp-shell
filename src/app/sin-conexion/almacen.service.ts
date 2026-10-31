import { Injectable, signal } from '@angular/core';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { environment } from '../../environments/environment';
import {
  EVENTO_BORRADORES,
  type AlmacenPlataforma,
  type BorradorPlanilla,
  type UsuarioSesion,
} from '../sesion/sesion-global';

/** Límites de las consultas guardadas por usuario (104, decisión del equipo). Los borradores no se borran solos. */
export const MAXIMO_CONSULTAS = 300;
export const ANTIGUEDAD_MAXIMA_CONSULTA_MS = 7 * 24 * 60 * 60 * 1000;

export interface ConsultaGuardada<T = unknown> {
  datos: T;
  /** ISO */
  guardadoEn: string;
}

/** Última sesión correcta en este navegador, para entrar en «modo sin conexión» (104). */
export interface SesionGuardada {
  usuario: UsuarioSesion;
  /** ISO */
  guardadaEn: string;
}

interface BaseErp extends DBSchema {
  consultas: { key: string; value: ConsultaGuardada };
  borradores_planilla: { key: string; value: BorradorPlanilla };
  sesion: { key: string; value: SesionGuardada };
}

const NOMBRE_BASE = 'plataforma-erp';
const CLAVE_SESION = 'ultima';

/** Claves que empiezan con «{usuarioId}|». */
function delUsuario(usuarioId: string): IDBKeyRange {
  return IDBKeyRange.bound(`${usuarioId}|`, `${usuarioId}|￿`);
}

/**
 * Almacén local del ERP en IndexedDB (104): consultas, borradores de planilla y última sesión. Separa los datos por
 * usuario con el prefijo «{usuarioId}|» y publica window.plataforma.almacen sin ese prefijo.
 */
@Injectable({ providedIn: 'root' })
export class AlmacenService implements AlmacenPlataforma {
  private base?: Promise<IDBPDatabase<BaseErp>>;
  private usuarioId: string | null = null;

  /** Borradores de planilla del usuario actual (para el indicador de la barra). */
  readonly borradores = signal<BorradorPlanilla[]>([]);

  /** Publica window.plataforma.almacen; se llama al arrancar el ERP. */
  iniciar(): void {
    if (typeof indexedDB === 'undefined') {
      return;
    }
    window.plataforma = {
      ...window.plataforma,
      configuracion: { gatewayUrl: environment.gatewayUrl },
      almacen: {
        guardarConsulta: (clave, datos) => this.guardarConsulta(clave, datos),
        leerConsulta: (clave) => this.leerConsulta(clave),
        guardarBorradorPlanilla: (borrador) => this.guardarBorradorPlanilla(borrador),
        leerBorradorPlanilla: (planillaId) => this.leerBorradorPlanilla(planillaId),
        listarBorradoresPlanilla: () => this.listarBorradoresPlanilla(),
        borrarBorradorPlanilla: (planillaId) => this.borrarBorradorPlanilla(planillaId),
      },
    };
  }

  /** Usuario dueño de los datos; lo fija la sesión (null: sin sesión, no se guarda ni se lee nada). */
  async usarUsuario(usuarioId: string | null): Promise<void> {
    if (usuarioId === this.usuarioId) {
      return;
    }
    this.usuarioId = usuarioId;
    await this.avisarBorradores();
  }

  async guardarConsulta(clave: string, datos: unknown): Promise<void> {
    const usuarioId = this.usuarioId;
    if (!usuarioId) {
      return;
    }
    const base = await this.abrir();
    const ahora = Date.now();
    const tx = base.transaction('consultas', 'readwrite');
    await tx.store.put(
      { datos, guardadoEn: new Date(ahora).toISOString() },
      `${usuarioId}|${clave}`,
    );

    // Límites: fuera las de más de 7 días y, si se pasa de 300, las más antiguas
    const rango = delUsuario(usuarioId);
    const [claves, valores] = await Promise.all([
      tx.store.getAllKeys(rango),
      tx.store.getAll(rango),
    ]);
    const guardadas = claves.map((k, i) => ({ clave: k, en: Date.parse(valores[i].guardadoEn) }));
    const vigentes = guardadas.filter((g) => ahora - g.en <= ANTIGUEDAD_MAXIMA_CONSULTA_MS);
    const sobrantes = vigentes
      .sort((a, b) => b.en - a.en)
      .slice(MAXIMO_CONSULTAS)
      .concat(guardadas.filter((g) => ahora - g.en > ANTIGUEDAD_MAXIMA_CONSULTA_MS));
    await Promise.all(sobrantes.map((s) => tx.store.delete(s.clave)));
    await tx.done;
  }

  async leerConsulta<T>(clave: string): Promise<{ datos: T; guardadoEn: string } | null> {
    if (!this.usuarioId) {
      return null;
    }
    const guardada = await (await this.abrir()).get('consultas', `${this.usuarioId}|${clave}`);
    return guardada ? { datos: guardada.datos as T, guardadoEn: guardada.guardadoEn } : null;
  }

  async guardarBorradorPlanilla(borrador: BorradorPlanilla): Promise<void> {
    if (!this.usuarioId) {
      return;
    }
    await (
      await this.abrir()
    ).put('borradores_planilla', borrador, `${this.usuarioId}|${borrador.planillaId}`);
    await this.avisarBorradores();
  }

  async leerBorradorPlanilla(planillaId: string): Promise<BorradorPlanilla | null> {
    if (!this.usuarioId) {
      return null;
    }
    return (
      (await (await this.abrir()).get('borradores_planilla', `${this.usuarioId}|${planillaId}`)) ??
      null
    );
  }

  async listarBorradoresPlanilla(): Promise<BorradorPlanilla[]> {
    if (!this.usuarioId) {
      return [];
    }
    return (await this.abrir()).getAll('borradores_planilla', delUsuario(this.usuarioId));
  }

  async borrarBorradorPlanilla(planillaId: string): Promise<void> {
    if (!this.usuarioId) {
      return;
    }
    await (await this.abrir()).delete('borradores_planilla', `${this.usuarioId}|${planillaId}`);
    await this.avisarBorradores();
  }

  async guardarSesion(usuario: UsuarioSesion): Promise<void> {
    await (
      await this.abrir()
    ).put('sesion', { usuario, guardadaEn: new Date().toISOString() }, CLAVE_SESION);
  }

  async leerSesion(): Promise<SesionGuardada | null> {
    return (await (await this.abrir()).get('sesion', CLAVE_SESION)) ?? null;
  }

  /** Borra las consultas, los borradores y la última sesión del usuario (al cerrar sesión, 104 criterio 19). */
  async borrarDatosUsuario(usuarioId: string): Promise<void> {
    const base = await this.abrir();
    const tx = base.transaction(['consultas', 'borradores_planilla', 'sesion'], 'readwrite');
    const rango = delUsuario(usuarioId);
    const sesion = await tx.objectStore('sesion').get(CLAVE_SESION);
    await Promise.all([
      tx.objectStore('consultas').delete(rango),
      tx.objectStore('borradores_planilla').delete(rango),
      sesion?.usuario.id === usuarioId ? tx.objectStore('sesion').delete(CLAVE_SESION) : undefined,
    ]);
    await tx.done;
    if (usuarioId === this.usuarioId) {
      await this.avisarBorradores();
    }
  }

  private abrir(): Promise<IDBPDatabase<BaseErp>> {
    this.base ??= openDB<BaseErp>(NOMBRE_BASE, 1, {
      upgrade(base) {
        base.createObjectStore('consultas');
        base.createObjectStore('borradores_planilla');
        base.createObjectStore('sesion');
      },
    });
    return this.base;
  }

  private async avisarBorradores(): Promise<void> {
    const usuarioId = this.usuarioId;
    const borradores = await this.listarBorradoresPlanilla();
    // Si el usuario cambió mientras tanto, la lista ya no es suya
    if (usuarioId === this.usuarioId) {
      this.borradores.set(borradores);
      window.dispatchEvent(new Event(EVENTO_BORRADORES));
    }
  }
}
