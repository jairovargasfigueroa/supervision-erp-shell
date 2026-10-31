// Contrato de window.plataforma entre el shell y los microfrontends (convenciones, «Sesión dentro del ERP»).
// Los microfrontends tienen una copia de estos tipos: si cambian, se cambian en todos.

export interface UsuarioSesion {
  id: string;
  nombre: string;
  roles: string[];
}

export interface SesionPlataforma {
  usuario: UsuarioSesion;
  /** Devuelve un token vigente; lo renueva si vence en menos de 30 s. */
  obtenerToken(): Promise<string>;
  cerrarSesion(): void;
  /** 104: «modo sin conexión» (sesión de las últimas 24 h guardada en el equipo); obtenerToken() rechaza con Error('SIN_CONEXION'). */
  sinConexion: boolean;
}

/** Estado de la conexión que comparten el shell y los microfrontends (104). */
export interface ConexionPlataforma {
  enLinea: boolean;
  /** Lo llama un microfrontend cuando una consulta falla por la red o por tiempo agotado. */
  reportarFallo(): void;
}

/** Borrador de una planilla guardado en el equipo (104). */
export interface BorradorPlanilla {
  planillaId: string;
  obraId: string;
  numero: number;
  periodo: string;
  /** version de la planilla sobre la que se editó */
  versionBase: number;
  lineas: { partidaId: string; cantidadPeriodo: number }[];
  fotoIds: string[];
  /** ISO */
  guardadoEn: string;
  estadoEnvio: 'PENDIENTE' | 'CONFLICTO' | 'NO_EDITABLE' | 'RECHAZADO';
  ultimoError?: {
    codigo: string;
    mensaje: string;
    errores?: { campo: string; mensaje: string }[];
  };
}

/** Almacén local en IndexedDB, separado por usuario (el prefijo lo agrega el shell) (104). */
export interface AlmacenPlataforma {
  guardarConsulta(clave: string, datos: unknown): Promise<void>;
  leerConsulta<T>(clave: string): Promise<{ datos: T; guardadoEn: string } | null>;
  guardarBorradorPlanilla(borrador: BorradorPlanilla): Promise<void>;
  leerBorradorPlanilla(planillaId: string): Promise<BorradorPlanilla | null>;
  listarBorradoresPlanilla(): Promise<BorradorPlanilla[]>;
  borrarBorradorPlanilla(planillaId: string): Promise<void>;
}

export interface Plataforma {
  sesion?: SesionPlataforma;
  conexion?: ConexionPlataforma;
  almacen?: AlmacenPlataforma;
  configuracion: { gatewayUrl: string };
}

/** Evento que el shell emite en window cuando la sesión cambia (token renovado o sesión cerrada). */
export const EVENTO_SESION = 'plataforma:sesion';

/** Evento que el shell emite en window cuando cambia la conexión; `detail: { enLinea }` (104). */
export const EVENTO_CONEXION = 'plataforma:conexion';

/** Evento que el shell emite en window cuando cambia la lista de borradores de planilla (104). */
export const EVENTO_BORRADORES = 'plataforma:borradores';

declare global {
  interface Window {
    plataforma?: Plataforma;
  }
}
