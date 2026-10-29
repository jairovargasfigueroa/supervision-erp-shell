// Opciones del menú lateral (función pura, probada). Los tres roles del ERP ven las tres áreas (001, criterio 4).

export interface OpcionMenu {
  etiqueta: string;
  ruta: string;
  icono: string;
}

export const ROLES_ERP = ['admin', 'residente', 'gerente'] as const;

const AREAS: OpcionMenu[] = [
  { etiqueta: 'Obras', ruta: '/obras', icono: 'apartment' },
  { etiqueta: 'Materiales', ruta: '/materiales', icono: 'inventory_2' },
  { etiqueta: 'Supervisión', ruta: '/supervision', icono: 'monitoring' },
];

/** Puede usar el ERP quien tiene admin, residente o gerente (001, criterio 3). */
export function tieneAccesoErp(roles: readonly string[]): boolean {
  return roles.some((rol) => (ROLES_ERP as readonly string[]).includes(rol));
}

export function opcionesMenu(roles: readonly string[]): OpcionMenu[] {
  return tieneAccesoErp(roles) ? AREAS : [];
}

const NOMBRE_ROL: Record<string, string> = {
  admin: 'Administrador',
  gerente: 'Gerente',
  residente: 'Residente',
};

/** Rol que se muestra en la barra superior: el de más alcance entre los del ERP. */
export function rolPrincipal(roles: readonly string[]): string {
  const rol = ['admin', 'gerente', 'residente'].find((r) => roles.includes(r));
  return rol ? NOMBRE_ROL[rol] : '';
}

export interface AplicacionWeb {
  etiqueta: string;
  url: string;
}

/**
 * Otras aplicaciones web de la plataforma para las que el usuario tiene rol (001, criterio 10). Mira los roles del
 * token completo, no los efectivos del ERP: demo1 entra al ERP como residente y además puede abrir el portal.
 */
export function aplicacionesWeb(roles: readonly string[], portalUrl: string): AplicacionWeb[] {
  return roles.includes('cliente') ? [{ etiqueta: 'Portal del cliente', url: portalUrl }] : [];
}
