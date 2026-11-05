import { initFederation } from '@angular-architects/native-federation';
import { cargarConfiguracion } from './app/compartido/configuracion';

const opciones = { hostRemoteEntry: { url: './remoteEntry.json' } };

// 601: configuracion.json (escrito al publicar; en desarrollo no está) se carga antes de iniciar Angular, porque
// provideKeycloak crea la instancia de Keycloak al evaluar app.config.ts. En la compilación publicada, sin el archivo
// (o incompleto) rechaza: el ERP no arranca y la consola dice por qué.
const configuracionCargada = cargarConfiguracion();

const federacionIniciada = initFederation('federation.manifest.json', opciones)
  .catch((err) => {
    // Sin conexión y sin el manifiesto guardado (104): el shell arranca sin remotos y cada uno muestra su aviso
    console.error(err);
    return initFederation({}, opciones);
  })
  .catch((err) => console.error(err));

Promise.all([configuracionCargada, federacionIniciada])
  .then((_) => import('./bootstrap'))
  .catch((err) => console.error(err));
