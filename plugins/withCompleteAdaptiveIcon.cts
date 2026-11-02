import type { ConfigPlugin } from 'expo/config-plugins';

const archivos: typeof import('node:fs/promises') = require('node:fs/promises');
const rutas: typeof import('node:path') = require('node:path');
const { withFinalizedMod, XML }: typeof import('expo/config-plugins') = require('expo/config-plugins');

// El launcher enmascara el primer plano adaptativo. Un margen nativo mantiene
// el caballo completo dentro del área segura sin modificar la imagen original.
const conIconoAdaptativoCompleto: ConfigPlugin = function (configuracion) {
  return withFinalizedMod(configuracion, ['android', async (configuracionModificada) => {
    const recursos = rutas.join(configuracionModificada.modRequest.platformProjectRoot, 'app/src/main/res');
    const carpetaDrawable = rutas.join(recursos, 'drawable');
    await archivos.mkdir(carpetaDrawable, { recursive: true });
    await archivos.writeFile(rutas.join(carpetaDrawable, 'ahre_launcher_foreground.xml'), `<?xml version="1.0" encoding="utf-8"?>
<inset xmlns:android="http://schemas.android.com/apk/res/android"
    android:drawable="@mipmap/ic_launcher_foreground"
    android:inset="22%" />
`);

    for (const nombre of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
      const destino = rutas.join(recursos, 'mipmap-anydpi-v26', nombre);
      const documento = await XML.readXMLAsync({ path: destino });
      const icono = documento['adaptive-icon'] as { foreground: { $: { 'android:drawable': string } }[] };
      icono.foreground = [{ $: { 'android:drawable': '@drawable/ahre_launcher_foreground' } }];
      await XML.writeXMLAsync({ path: destino, xml: documento });
    }
    return configuracionModificada;
  }]);
};

module.exports = conIconoAdaptativoCompleto;
