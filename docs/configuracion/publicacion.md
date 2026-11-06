# Compilación y publicación Android

## Elegir qué probar

| Cambio o función | Cómo verificar |
| --- | --- |
| JavaScript, interfaz, SQLite y sincronización | Expo Go compatible con SDK 57, recargando el proyecto. |
| Captura OCR con ML Kit | APK Android con `modules/receipt-ocr`; Expo Go no incluye ese módulo. |
| Plugins, permisos, módulos nativos o URL incluida en un APK | Nueva compilación Android y prueba en dispositivo. |
| Backend | Desplegar SERVER-AHRE; no requiere generar APK si el cliente ya es compatible. |

## Exportación local

Con dependencias preparadas, desde APP-AHRE:

```powershell
npx --no-install expo export --platform android --output-dir dist
```

Comprueba el empaquetado JavaScript/Hermes y los recursos. No produce un APK ni
instala la app. En la etapa 7 se exportó fuera del repositorio y el primer intento
necesitó reintentarse con permisos para el temporal de Hermes en Windows.

## APK interno con EAS

El líder necesita EAS CLI disponible, sesión de Expo y acceso al proyecto
configurado en `app.json`. El perfil verificado en [eas.json](../../eas.json)
se llama `ocr-comparison`: usa distribución interna y genera un APK, aunque el
nombre conserve la evaluación histórica de OCR.

```powershell
eas build --platform android --profile ocr-comparison --no-wait
```

El comando envía el código local a EAS y devuelve el seguimiento. Descargar el
APK al finalizar y probarlo en Android. No publica en Google Play.
`appVersionSource` es `local`: la versión proviene de `app.json`; comprobar
coherencia con `package.json` y la raíz de `package-lock.json` antes de una
entrega. El estado actual declara versión 0.7.0 y `android.versionCode` 5;
la pantalla «Acerca de AHRE» lee la versión de la configuración Expo mediante
`Constants.expoConfig.version`, tanto en Expo Go como en la app compilada.

## Publicar la descarga

SERVER-AHRE contiene `scripts/publish-apk.mjs`. El procedimiento de preparar el
manifiesto, copiar APK y `latest.json` y verificar SHA-256 está en su guía
`docs/infraestructura-y-despliegue.md`, accesible desde el
[repositorio del servidor](https://github.com/thiagosalaberryj-bit/SERVER-AHRE).
No usar la exportación local como si fuera un APK.

Subir un backend, hacer commit/push, compilar un APK y publicar su descarga son
acciones diferentes. La etapa 8 documenta el proceso; no ejecuta esas acciones.
