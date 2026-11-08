import { aplicacionesWeb, opcionesMenu, rolPrincipal, tieneAccesoErp } from './menu';

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

  it('da acceso al ERP solo con admin, residente o gerente', () => {
    expect(tieneAccesoErp(['residente'])).toBe(true);
    expect(tieneAccesoErp(['maestro', 'almacenero'])).toBe(false);
    expect(tieneAccesoErp(['cliente'])).toBe(false);
  });

  it('«Aplicaciones» ofrece el portal a quien tiene cliente (demo1) y se oculta si no hay ninguna', () => {
    const portal = 'http://localhost:4300';
    expect(aplicacionesWeb(['residente', 'cliente'], portal)).toEqual([{ etiqueta: 'Portal del cliente', url: portal }]);
    expect(aplicacionesWeb(['residente'], portal)).toEqual([]);
  });
});
