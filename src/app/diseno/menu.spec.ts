import { opcionesMenu, rolPrincipal } from './menu';

describe('menú', () => {
  it('muestra Obras, Materiales y Supervisión a los roles del ERP', () => {
    for (const rol of ['admin', 'residente', 'gerente']) {
      expect(opcionesMenu([rol]).map((o) => o.ruta)).toEqual(['/obras', '/materiales', '/supervision']);
    }
  });

  it('no muestra áreas a quien no tiene un rol del ERP', () => {
    expect(opcionesMenu(['cliente'])).toEqual([]);
    expect(opcionesMenu([])).toEqual([]);
  });

  it('elige el rol principal para la barra superior', () => {
    expect(rolPrincipal(['default-roles-supervision', 'residente', 'cliente'])).toBe('Residente');
    expect(rolPrincipal(['residente', 'admin'])).toBe('Administrador');
    expect(rolPrincipal(['cliente'])).toBe('');
  });
});
