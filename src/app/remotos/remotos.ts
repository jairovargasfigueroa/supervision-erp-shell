// Microfrontends del ERP: nombre en public/federation.manifest.json → ruta del shell y forma de cargarlo.

export interface Remoto {
  /** Nombre en federation.manifest.json. */
  nombre: 'mf-obras' | 'mf-materiales' | 'mf-supervision';
  /** Primer segmento de la ruta del shell; el microfrontend maneja el resto. */
  ruta: string;
  etiqueta: string;
  tipo: 'angular' | 'web-component';
  /** Módulo expuesto: rutas de Angular o el archivo que registra el Web Component. */
  modulo: './Routes' | './Bootstrap';
  /** Etiqueta del Web Component que registra el módulo. */
  elemento?: string;
}

export const REMOTOS: Remoto[] = [
  { nombre: 'mf-obras', ruta: 'obras', etiqueta: 'Obras', tipo: 'angular', modulo: './Routes' },
  {
    nombre: 'mf-materiales',
    ruta: 'materiales',
    etiqueta: 'Materiales',
    tipo: 'web-component',
    modulo: './Bootstrap',
    elemento: 'mf-materiales',
  },
  {
    nombre: 'mf-supervision',
    ruta: 'supervision',
    etiqueta: 'Supervisión',
    tipo: 'web-component',
    modulo: './Bootstrap',
    elemento: 'mf-supervision',
  },
];
