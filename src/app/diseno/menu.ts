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

export function opcionesMenu(roles: readonly string[]): OpcionMenu[] {
  return roles.some((rol) => (ROLES_ERP as readonly string[]).includes(rol)) ? AREAS : [];
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
