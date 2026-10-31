import { initFederation } from '@angular-architects/native-federation';

const opciones = { hostRemoteEntry: { url: './remoteEntry.json' } };

initFederation('federation.manifest.json', opciones)
  .catch((err) => {
    // Sin conexión y sin el manifiesto guardado (104): el shell arranca sin remotos y cada uno muestra su aviso
    console.error(err);
    return initFederation({}, opciones);
  })
  .catch((err) => console.error(err))
  .then((_) => import('./bootstrap'))
  .catch((err) => console.error(err));
