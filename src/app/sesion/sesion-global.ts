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

export interface Plataforma {
  sesion?: SesionPlataforma;
  configuracion: { gatewayUrl: string };
}

/** Evento que el shell emite en window cuando la sesión cambia (token renovado o sesión cerrada). */
export const EVENTO_SESION = 'plataforma:sesion';

declare global {
  interface Window {
    plataforma?: Plataforma;
  }
}
