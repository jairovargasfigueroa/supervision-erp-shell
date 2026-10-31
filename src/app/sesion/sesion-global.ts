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
}

/** Estado de la conexión que comparten el shell y los microfrontends (104). */
export interface ConexionPlataforma {
  enLinea: boolean;
  /** Lo llama un microfrontend cuando una consulta falla por la red o por tiempo agotado. */
  reportarFallo(): void;
}

export interface Plataforma {
  sesion?: SesionPlataforma;
  conexion?: ConexionPlataforma;
  configuracion: { gatewayUrl: string };
}

/** Evento que el shell emite en window cuando la sesión cambia (token renovado o sesión cerrada). */
export const EVENTO_SESION = 'plataforma:sesion';

/** Evento que el shell emite en window cuando cambia la conexión; `detail: { enLinea }` (104). */
export const EVENTO_CONEXION = 'plataforma:conexion';

declare global {
  interface Window {
    plataforma?: Plataforma;
  }
}
