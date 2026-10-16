const archivos = require('node:fs/promises');
const rutas = require('node:path');
const { withFinalizedMod, XML } = require('expo/config-plugins');

// El launcher enmascara el primer plano adaptativo. Un margen nativo mantiene
// el caballo completo dentro del área segura sin modificar la imagen original.
module.exports = function conIconoAdaptativoCompleto(configuracion) {
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
      documento['adaptive-icon'].foreground = [{ $: { 'android:drawable': '@drawable/ahre_launcher_foreground' } }];
      await XML.writeXMLAsync({ path: destino, xml: documento });
    }
    return configuracionModificada;
  }]);
};
