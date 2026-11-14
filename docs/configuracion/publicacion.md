# Compilación y publicación Android

## Notificaciones y Mercado Pago

La nueva APK requiere el archivo `google-services.json` de la app Firebase con
package `com.thiagosalaberry.APPAHRE`, la credencial FCM v1 en el proyecto Expo
existente y el backend con OAuth/n8n configurado. Ver la guía
`docs/notificaciones-mercado-pago.md` de SERVER-AHRE. La exportación Metro/Hermes
comprueba el paquete JS; no acredita entrega push ni sustituye una APK.
El perfil existente `ocr-comparison` sigue disponible. Preparar una numeración
de entrega antes de publicar; esta implementación no publica un APK.

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

`.easignore` excluye `/docs/`, `/tests/`, `/README.md` y `/AGENTS.md` del
archivo enviado a EAS. Los archivos permanecen en Git y disponibles localmente.
Se conservan código, recursos, plugins, módulos nativos, sus avisos legales,
configuración y lockfile. Esta exclusión reduce el envío de fuentes; no implica
una reducción del APK instalado. No se excluyen todos los Markdown mediante un
patrón global porque los módulos nativos pueden requerir avisos y licencias.

La verificación local del 9 de noviembre exportó Android con Metro/Hermes desde
una copia filtrada por estas reglas, sin `docs/` ni `tests/`, reutilizando las
dependencias instaladas. Se conservaron recursos, plugins y módulos nativos.
La exportación terminó correctamente; no se generó un APK ni se inició una
compilación remota de EAS para este ajuste.

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
entrega. El estado actual declara versión 0.9.1 y `android.versionCode` 15;
la pantalla «Acerca de AHRE» lee la versión de la configuración Expo mediante
`Constants.expoConfig.version`, tanto en Expo Go como en la app compilada.

La build 8 habilita el escáner nativo de códigos de `expo-camera` para las
invitaciones QR; mantener `barcodeScannerEnabled: true`. Expo Go ya incluye
esa capacidad, por lo que probarla allí no comprueba esta configuración del APK.

La build 9 incorpora la revisión actual de Social, vínculos por correo,
historial de deudas y pagos con depósitos propios. Se prepara para usar una
cuenta en la APK y otra en Expo Go en el mismo teléfono; cada aplicación tiene
su almacenamiento y autorización de instalación independientes. Su envío a EAS
no publica el archivo en la web de AHRE.

## Publicar la descarga

SERVER-AHRE contiene `scripts/publish-apk.mjs`. El procedimiento de preparar el
manifiesto, copiar APK y `latest.json` y verificar SHA-256 está en su guía
`docs/infraestructura-y-despliegue.md`, accesible desde el
[repositorio del servidor](https://github.com/thiagosalaberryj-bit/SERVER-AHRE).
No usar la exportación local como si fuera un APK.

Subir un backend, hacer commit/push, compilar un APK y publicar su descarga son
acciones diferentes. La etapa 8 documenta el proceso; no ejecuta esas acciones.

## Mantenimiento 0.9.1 · build 15

Actualiza parches de SDK 57, React Navigation 7 y WorkManager 2.10.5,
manteniendo React 19.2.3, React Native 0.86.3 y el perfil `ocr-comparison`.
El backend coordinado de mantenimiento es 0.3.1; no cambia el protocolo HTTP,
el esquema ni las reglas financieras. El detalle está en
[Dependencias](dependencias.md#actualización-de-mantenimiento-091).

Esta tarea prepara fuentes y versiones; no envía una build a EAS ni publica
la descarga. La exportación Metro/Hermes no sustituye compilar e instalar
una APK 0.9.1/15 y comprobar OCR, SQLite, navegación, notificaciones, alarmas
exactas y WorkManager con la app cerrada. Conservar la firma y las credenciales
FCM existentes. Las builds 0.9.0/14 descritas debajo son antecedentes.

## Build 10: Social reorganizado

La configuración conserva android.versionCode 10, versión 0.7.0. El código incluye
acceso global con contraseña y aprobación, depósitos preparados desde gastos,
cierre con incorporación automática y clasificación de deudas online. Actualizar
SERVER-AHRE antes de probar las funciones nuevas. No requiere borrar datos locales.
Ver [guía de prueba](../social-validation.md).

La auditoría del 8 de noviembre no genera ni publica una APK. Una build 10
compilada previamente no incorpora automáticamente las correcciones posteriores;
antes de otra entrega, el líder debe identificar su revisión y asignar el código
de versión correspondiente. El servidor debe actualizarse de forma coordinada.

## Entrega 0.8.0 · build 11

El líder autorizó actualizar changelogs, publicar las ramas mediante PR sin
merge y enviar la build Android a EAS. La configuración de versión local es
0.8.0/11 y el backend coordinado es 0.2.0. Se usa el perfil interno APK existente
`ocr-comparison`; no se publica automáticamente en la landing ni en Google Play.
El resultado de EAS y la revisión en dispositivo se verifican por separado.


## Build 12: recurrencias manuales y bloqueos financieros

La entrega interna 0.8.0/12 incluye aceptación manual de recurrencias, pendientes
de incorporación por sala, bloqueo de acciones y navegación durante operaciones,
historial de origen unificado y etiquetas Saldada/Perdonada. Actualiza el mismo
PR sin mergearlo. La compilación en EAS no despliega el servidor ni publica el
APK en la landing. La build 11 anterior conserva su comportamiento original.

## Build 13: historial y salas pendientes

La build 12 fue cancelada a pedido del líder. La entrega interna 0.8.0/13 añade
iconos de estado al historial de deudas y muestra sin límite todas las salas
abiertas o con movimientos propios por registrar en el inicio de Social. Las
tarjetas indican el estado cerrado y la cantidad pendiente; las incorporaciones
locales actualizan el contador sin esperar la sincronización. Generar esta APK
no despliega el servidor ni publica la descarga en la web.

## Entrega 0.9.0 · build 14

Incluye notificaciones y Mercado Pago Search con backend 0.3.0. Conserva el
perfil interno ocr-comparison y la firma del proyecto Expo existente. Antes
de compilar, guardar google-services.json en la raíz de APP-AHRE y configurar
la cuenta de servicio FCM v1 en EAS Credentials. El archivo de configuración
se excluye de Git; .easignore permite enviarlo al compilador. Nunca colocar
la clave privada de la cuenta de servicio dentro del paquete de la app.

La compilación envía fuentes a EAS; no publica el APK en la landing ni cambia
el servidor desplegado. La instalación sobre una versión de desarrollo previa
puede requerir recrear su base SQLite si cambió el esquema inicial. No borrar
datos reales para actualizar la app.

### Obtener google-services.json

1. Abrir https://console.firebase.google.com/ y crear AHRE o reutilizar su proyecto.
2. Agregar una app Android con paquete exacto com.thiagosalaberry.APPAHRE.
   El apodo puede ser AHRE Android; conservar las mayúsculas del paquete.
3. Descargar google-services.json y guardarlo en la raíz de APP-AHRE, junto
   a app.json. No modificar Gradle manualmente: Expo genera los archivos nativos.
4. Para push remoto, abrir Configuración del proyecto → Cuentas de servicio,
   generar una clave privada y guardarla fuera del repositorio. Es otro archivo.
5. Ejecutar npx --yes eas-cli credentials --platform android, elegir el perfil
   ocr-comparison y cargar esa clave en la opción de Push Notifications FCM v1.
   Conservar la firma Android existente. No copiar su contenido al chat ni a Git.
6. Con ambos pasos completos, ejecutar npx --yes eas-cli build --platform android
   --profile ocr-comparison --no-wait para enviar la APK interna a EAS.

Referencias: [Firebase Android](https://firebase.google.com/docs/android/setup) y
[credenciales FCM v1 de Expo](https://docs.expo.dev/push-notifications/fcm-credentials/).

### Revisión de notificaciones y encabezado en la entrega 0.9.0

Se conserva la misma versión 0.9.0 (versionCode 14) y el perfil ocr-comparison.
Para esta revisión se envía la compilación con --no-wait: enviar no significa
que la APK ya esté disponible. Instalarla cuando EAS termine y conceder permisos.
Expo Go permite revisar diseño, paginación, decisiones y datos offline; push
remoto con app cerrada se comprueba en la APK sobre un Android físico.

Probar un pago parcial y después saldar la deuda: el primer pago mantiene el
aviso pendiente; el segundo lo resuelve y cancela recordatorios futuros. Verificar
locales y remotas juntas, aceptar/rechazar solicitudes y confirmar recurrencias.
Un día sin registros conserva su recordatorio informativo sin generar atrasos.
Backend y mp-worker deben tener los cambios coordinados antes de la prueba online.

### Alarmas exactas de Android

La configuración incluye android.permission.SCHEDULE_EXACT_ALARM y un puente
opcional registrado en el módulo local recurrence-worker para consultar el
permiso real y abrir el acceso especial de AHRE. No requiere dependencias nuevas.
EAS debe recompilar la APK con el código nativo y los permisos actualizados.
En la app: Notificaciones → Ajustes → Activar horario preciso; Android solicita
el acceso Alarmas y recordatorios. Regresar a AHRE reprograma las alarmas.
La opción no concede permiso para mostrar notificaciones: se necesitan ambos.
Expo Go sigue funcionando con la alternativa compatible y sin invocar el puente.
Una APK anterior al módulo muestra la necesidad de actualizar, sin bloquear la app.

### Compilación interna enviada el 13 de noviembre de 2026

- [Seguimiento y descarga cuando termine en EAS](https://expo.dev/accounts/thiago-salaberry/projects/APP-AHRE/builds/a20853c8-b2ba-4c97-b211-8d4eea685c1c).
- Perfil ocr-comparison, Android APK interna, versión 0.9.0 / versionCode 14.
- EAS confirmó la carga de fuentes y el cálculo del fingerprint. Se usó
  --non-interactive --no-wait; no se esperó ni se verificó el resultado de compilación.
- Incluye las fuentes locales de alarmas exactas y la revisión compacta MP,
  conservando la firma existente. El envío no crea commits ni actualiza los PR.
- No despliega backend/mp-worker ni publica la APK en la landing.

Tras instalar, abrir Notificaciones → Ajustes → Activar horario preciso y
conceder Alarmas y recordatorios a AHRE; comprobar también el permiso para
mostrar notificaciones. Volver a AHRE antes de probar un aviso unos minutos
después, con la app cerrada. Instalar esta APK es necesario para tener el puente;
una recarga de Expo Go o de una APK anterior no lo añade.

### Compilación posterior: permisos y Perfil coherentes

El 13 de noviembre se envió una [nueva APK interna a EAS](https://expo.dev/accounts/thiago-salaberry/projects/APP-AHRE/builds/55f805ed-2f41-4313-a314-9f70aea93871),
con el mismo perfil y firma, versión 0.9.0 / versionCode 14. Es posterior a la
solicitud a20853c8. Incluye el interruptor efectivo de Perfil, bloqueo del modal,
mensajes simplificados y entregas separadas al cambiar la hora de una deuda.
EAS confirmó la carga; se usó --no-wait sin esperar la compilación.
TypeScript y 20 pruebas de estados/permisos, conservación de preferencias,
recordatorios y modales aprobadas. No se hizo commit ni despliegue.

### Compilación de correcciones de entrega local

El 13 de noviembre se enviaron las fuentes a [EAS c33f1e33](https://expo.dev/accounts/thiago-salaberry/projects/APP-AHRE/builds/c33f1e33-78b2-4e7e-90a0-497d28c264ac),
perfil ocr-comparison, versión 0.9.0 / versionCode 14, conservando la firma.
Se confirmó la carga y fingerprint con --no-wait; no se esperó la compilación.
Es posterior a 55f805ed e incluye Guardar con confirmación nativa, alarmas
retrasadas conservadas, recuperación de programaciones e historial actualizado
al abrir, flecha compacta en Perfil y prueba local de diez segundos.

Verificación: TypeScript y suite de 511 casos (472 aprobados, 39 MySQL omitidos,
cero fallos). En ese momento, la entrega física seguía pendiente de repetir
con esta APK. Posteriormente el usuario confirmó tanto la prueba de diez
segundos como los recordatorios habituales en su teléfono. No se hicieron
commits ni despliegues del backend al enviar esa compilación.

### Revisión posterior: Perfil y guardado sin deformaciones

La siguiente APK interna conserva versión 0.9.0 / versionCode 14, perfil
ocr-comparison y firma existente. Incluye el interruptor de AHRE cuando Android
permite notificaciones, flecha solo si las bloquea, formulario de horarios con
su distribución habitual durante el guardado y retiro del botón temporal de
diez segundos. Conserva las correcciones de programación local y las acciones
compactas de revisión de Mercado Pago.

Verificación previa al envío: TypeScript correcto y 512 casos de la suite,
473 aprobados, 39 integraciones MySQL omitidas y cero fallos. Se solicita con
--non-interactive --no-wait; el envío no acredita una compilación finalizada
ni despliega el servidor. Tras instalar, comprobar el toggle de Perfil tanto
encendido como apagado, denegar/restaurar el permiso de Android y guardar un
horario verificando que el modal no cambie de distribución.

Envío confirmado el 13 de noviembre de 2026: [EAS f0d2bf46](https://expo.dev/accounts/thiago-salaberry/projects/APP-AHRE/builds/f0d2bf46-007a-4348-85d0-9eb180919c54),
con las fuentes del commit dca0f39. EAS confirmó carga y fingerprint; no se
esperó el resultado de compilación. El commit está publicado en la rama del
PR existente. No se desplegaron backend, mp-worker ni n8n.
