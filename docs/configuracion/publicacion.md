# Compilación y publicación Android

## Notificaciones y Mercado Pago

La nueva APK requiere el archivo `google-services.json` de la app Firebase con
package `com.thiagosalaberry.APPAHRE`, la credencial FCM v1 en el proyecto Expo
existente y el backend con OAuth/n8n configurado. Ver la guía
`docs/funcionalidades/notificaciones.md` de SERVER-AHRE. La exportación Metro/Hermes
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

## APK local firmada en Windows

Con el proyecto nativo `android/` generado, el SDK configurado en
`android/local.properties` y el JDK disponible, ejecutá desde APP-AHRE:

```powershell
.\scripts\build-signed-apk.ps1
```

El script compila con Gradle, firma con la clave de distribución de Expo EAS
usada en la APK pública 0.9.5 y verifica el certificado antes de guardar
`.expo/ahre-local-firmada.apk`. Usá `-SoloFirmar` si ya generaste
`android/app/build/outputs/apk/release/app-release.apk`.

La credencial cifrada se prepara por usuario de Windows y se guarda en
`%LOCALAPPDATA%\AHRE\android-signing\ahre-eas-release.dpapi`, fuera del
repositorio. Android puede actualizar la instalación cuando coinciden el
identificador y el certificado y el `versionCode` es igual o mayor que el
instalado. La APK pública 0.9.4 y las APK firmadas con la clave de depuración
tienen certificados diferentes.

## Eliminar mis datos desde la APK

En **Perfil → Zona de peligro**, **Eliminar mis datos** requiere conexión con
el backend actualizado. Borra los registros privados y conserva el acceso
con el mismo correo y contraseña. [Alcance y recuperación](reinicio-datos-pruebas.md).

## APK interno con EAS

`.easignore` excluye `/docs/`, `/tests/`, `/README.md` y `/AGENTS.md` del
archivo enviado a EAS. Los archivos permanecen en Git y disponibles localmente.
Se conservan código, recursos, plugins, módulos nativos, sus avisos legales,
configuración y lockfile. También excluye los informes temporales locales
`/.codex-*.txt`. Esta exclusión reduce el envío de fuentes; no implica
una reducción del APK instalado. No se excluyen todos los Markdown mediante un
patrón global porque los módulos nativos pueden requerir avisos y licencias.

La verificación local del 9 de noviembre exportó Android con Metro/Hermes desde
una copia filtrada por estas reglas, sin `docs/` ni `tests/`, reutilizando las
dependencias instaladas. Se conservaron recursos, plugins y módulos nativos.
La exportación terminó correctamente; no se generó un APK ni se inició una
compilación remota de EAS para este ajuste.

Necesito EAS CLI disponible, sesión de Expo y acceso al proyecto
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
entrega. El estado actual declara versión 0.9.3 y `android.versionCode` 18;
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
manifiesto, copiar el APK, publicar `releases.json` y `latest.json` y verificar
SHA-256 está en su guía
`docs/infraestructura/despliegue.md`, accesible desde el
[repositorio del servidor](https://github.com/thiagosalaberryj-bit/SERVER-AHRE).
No usar la exportación local como si fuera un APK.

Subir un backend, hacer commit/push, compilar un APK y publicar su descarga son
acciones diferentes. La etapa 8 documenta el proceso; no ejecuta esas acciones.

### APK 0.9.4 · Android 19

Compilada localmente con `gradlew.bat :app:assembleRelease` y firmada con una
clave propia de AHRE para la descarga web. La 0.9.3 pública tiene una firma
distinta. Si está instalada, Android requiere una instalación limpia para
pasar a 0.9.4. Al desinstalar se pierden los datos que solo están en el
dispositivo. [Descargas Android](https://ahre-server.tailc5dfc5.ts.net/descargas/).

El catálogo público ofrece cinco versiones y la 0.9.4 aparece primera. La
descarga HTTPS completa coincidió con el SHA-256 del APK firmado.
[APK 0.9.4](https://ahre-server.tailc5dfc5.ts.net/downloads/ahre-0.9.4.apk).

## Mantenimiento 0.9.1 · build 15

Actualiza parches de SDK 57, React Navigation 7 y WorkManager 2.10.5,
manteniendo React 19.2.3, React Native 0.86.3 y el perfil `ocr-comparison`.
El backend coordinado de mantenimiento es 0.3.1; no cambia el protocolo HTTP,
el esquema ni las reglas financieras. El detalle está en
[Dependencias](dependencias.md#actualización-de-mantenimiento-091).

El 14/11/2026 el líder confirmó la validación integral de la entrega,
incluidas las comprobaciones manuales pendientes. SERVER-AHRE 0.3.1 quedó
desplegado; API, worker y supervisor n8n fueron verificados. Ver el registro
y la procedencia de los resultados en [Estado y validación](../estado-y-validacion.md).
La release GitHub 0.9.1 es no estable y contiene fuentes; no inicia una build
EAS ni reemplaza la descarga de la landing. Este cierre no adjunta un APK nuevo
ni un identificador de build adicional. Conservar firma y credenciales FCM.
Las builds 0.9.0/14 descritas debajo son antecedentes.

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

Preparé los changelogs y la publicación de las ramas mediante PR sin
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

Cancelé la build 12. La entrega interna 0.8.0/13 añade
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
con esta APK. Posteriormente comprobé tanto la prueba de diez
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

### APK del reinicio sin configuración adicional — 14/11/2026

Fuentes enviadas a [EAS 88fc2e23](https://expo.dev/accounts/thiago-salaberry/projects/APP-AHRE/builds/88fc2e23-2c3f-417f-8c57-a4a4377fbf4d),
perfil interno `ocr-comparison`, versión 0.9.1 / versionCode 15, misma firma.
Sustituye el envío 78753083: cualquier cuenta autenticada dispone del reinicio,
sin variables de entorno ni listas de correos. Requiere actualizar el backend,
conservando su `.env` actual. Se confirmó la carga/fingerprint con `--no-wait`;
no se comprobó la finalización ni se publicó la APK en la landing.
Tipos correctos y 12 pruebas específicas aprobadas (6 locales, 3 integraciones
Social/MySQL, 3 casos de API), sin omisiones. No se hicieron commits ni despliegue.

### Preparación de APK 0.9.2 · build 16

Se actualizan app.json, package.json y la raíz del lockfile a 0.9.2, con
android.versionCode 16. Se conserva el perfil interno ocr-comparison (APK) y
la firma existente. Incluye los cambios acumulados de perfil y Acerca de,
notificaciones, filtros, OCR y Social. En la última revisión el reparto de sala
empieza abierto y conserva el plegado manual; el café pagado y asociado deja
de bloquear el cierre por una diferencia de identificadores, sin alterar pagos.

Validación: TypeScript de app y herramientas correcto. La regresión específica
de sala tiene ocho pruebas aprobadas en ambos temas. El envío a EAS no equivale
a una APK terminada ni a una verificación física en Android. Los cambios de
servidor acordados requieren su despliegue coordinado por separado.

Envié las fuentes a Expo/EAS:
[APK 0.9.2 · build 16](https://expo.dev/accounts/thiago-salaberry/projects/APP-AHRE/builds/c175c59d-1ff5-4a19-b8a4-e21809d71daa).
Fuentes del commit d5d2e01; EAS confirmó la carga y el fingerprint con
--non-interactive --no-wait. No se verificó la finalización de la compilación.


## APK del flujo de salas · 15/11/2026

Fuentes locales con los cambios de salas, vínculos, avisos, archivo de fichas y Recordarme enviadas a [Expo/EAS](https://expo.dev/accounts/thiago-salaberry/projects/APP-AHRE/builds/5e6398f5-0e13-43cb-95c4-1cf631354d7d), como parte de esta entrega. Perfil ocr-comparison, Android APK, versión 0.9.2 y versionCode 16 existentes. EAS confirmó carga y fingerprint con --non-interactive --no-wait. No se esperó la compilación ni se verificó su resultado. El envío incluye cambios sin commit y no despliega SERVER-AHRE ni publica la descarga de la web.

## Envío posterior a las correcciones · 16/11/2026

[APK 0.9.2 / Android versionCode 16 en EAS](https://expo.dev/accounts/thiago-salaberry/projects/APP-AHRE/builds/23c1da29-3ed7-4bc7-8eb5-c203f3b4f460),
fuentes del commit a0188ca. Sustituye el envío 5e6398f5 como referencia de las
correcciones de Login, solicitudes, permisos secuenciales y contenido push.
Perfil ocr-comparison, firma existente, --non-interactive --no-wait: carga y
fingerprint confirmados; no se esperó ni se comprobó el resultado de compilación.
Este envío no publica una descarga en la web ni despliega c25fdc1 del servidor.
Seguir la actualización coordinada del backend antes de probar las funciones
online. Teclado, gestos y entrega física de notificaciones siguen pendientes.


## Preparación de release 0.9.2 · revisión final del 16/11/2026

Completé la validación automatizada de esta preparación el 16/11/2026: **579 pruebas de app y 116 del servidor aprobadas, cero fallos y cero omisiones**. Pasaron los tipos de app/herramientas y backend, la compilación del backend y una nueva exportación Android/Hermes. Usé MySQL 8.4.3 temporal en 127.0.0.1:13307, con bases sintéticas y usuario limitado a ahre_test_*. Al finalizar quedaron cero bases de pruebas y detuve la instancia; conservé los logs locales. No utilicé datos reales.

La preparación incluye todos los cambios pendientes en el commit local de app y
el commit coordinado del servidor 0.3.3. La nueva compilación se solicita con el
CLI existente: eas build --platform android --profile ocr-comparison
--non-interactive --no-wait. Conservo versión 0.9.2 / Android versionCode 16,
perfil interno y firma existentes. Consultar la URL devuelta por EAS; no esperar
ni dar por finalizada la compilación al confirmar carga y fingerprint.

Para publicar más adelante:

1. Verificar el backend desplegado y la APK instalada: ingreso con contraseña,
   Recordarme al reabrir/cerrar sesión, permisos de Android, recordatorios con
   nombres e importes, teclado/gestos y operaciones sociales con dos cuentas.
2. Revisar los PR e integrar app y servidor; mantener 0.3.2 como antecedente web
   y 0.3.3 como la actualización actual del backend.
3. Cerrar las secciones Sin publicar con fecha y versión, y crear las etiquetas
   y releases no estables desde las fuentes aprobadas.
4. Descargar la APK final, registrar tamaño y SHA-256, preparar sus novedades
   y publicar archivo/catálogo con scripts/publish-apk.mjs de SERVER-AHRE.
5. Comprobar la descarga HTTPS completa y su hash sin retirar APK anteriores.

La validación automatizada está completa para estas fuentes. Falta comprobar la nueva APK instalada (teclado, gestos y recepción de notificaciones), verificar el despliegue coordinado y publicar por separado la descarga. No publiqué etiquetas, releases ni hice merge a main.


## Cierre de APK 0.9.2 · 16/11/2026

La APK 0.9.2 / Android 16 del envío EAS 44178bff, generada desde 99ecf91, quedó probada en el teléfono el 16/11/2026 con funcionamiento confirmado. Archivo de distribución: ahre-0.9.2.apk, 173.236.452 bytes; SHA-256 ebb3439873e23a51272322af224dfdf66edc7b5ba7157788418c4695f2e55f79.

Preparé el nombre público de AHRE, manifiesto y archivo .sha256 con el catálogo
de SERVER-AHRE. Las novedades se presentan en cada tarjeta; desde tres versiones
se usa carrusel, dos tarjetas en escritorio y una en móvil, sin avance automático.
Cada entrega explica qué actualización de app y servidor corresponde.

La copia y el despliegue en el servidor siguen siendo manuales. Preparé APK, manifiesto, hash y catálogo localmente; no conecté el repositorio al servidor ni ejecuté el despliegue remoto. Los comandos conservan .env, la base y las descargas históricas.

La validación automatizada completa fue 579 pruebas de app y 116 del servidor,
sin fallos ni omisiones. Los 12 casos de publicación/carrusel se comprobaron por
separado; no se suman a las suites por solapamiento. Tipos y Android/Hermes correctos.
La prueba manual de la APK quedó confirmada; la comprobación pública de la nueva
descarga corresponde al despliegue posterior.


## Interfaz y confirmaciones · APK 0.9.2 / Android 17 · 16/11/2026

[Envío de APK interna a Expo/EAS](https://expo.dev/accounts/thiago-salaberry/projects/APP-AHRE/builds/df14e9e9-9e8f-4295-b242-bb5ec5bef9db),
identificador `df14e9e9-9e8f-4295-b242-bb5ec5bef9db`. Perfil `ocr-comparison`,
distribución interna y firma existente. Mantiene la versión 0.9.2 e incrementa
`android.versionCode` de 16 a 17 para distinguirla de la APK anterior.

El envío incluye las fuentes locales de `codex/modo-oscuro-neutro` posteriores
a `58e3fb0`: tema oscuro neutro, secuencia uniforme de «Procesando» y «Listo»,
puntos nativos y modales de Social que conservan su ventana. EAS recibió los
cambios locales antes del commit de documentación, no solo el contenido de HEAD.
Se incluye `google-services.json`, excluido de Git, y la variable pública de API
se resuelve desde el entorno `preview` de EAS. `.env`, `credentials/`, documentos,
pruebas e informes temporales quedan fuera del archivo enviado.

Se ejecutó `eas build --platform android --profile ocr-comparison
--non-interactive --no-wait`. EAS confirmó la carga y el fingerprint.
Por pedido del usuario no se esperó la compilación ni se comprobó su resultado;
el enlace de seguimiento no acredita una APK terminada o probada en dispositivo.
La exportación local Android/Hermes y los tipos pasaron. No se publica la
descarga en la web ni en Google Play, no se despliega el servidor y no se mergea
la rama a `main`. La instalación y la comprobación visual siguen pendientes.


## Preparación 0.9.3 / Android 18 · 17/11/2026

Los manifiestos de app y raíz del lockfile declaran 0.9.3, con versionCode 18,
coordinada con servidor 0.3.4. Esta preparación actualiza el changelog, las ayudas
y la presentación de solicitudes; no ejecuta EAS, crea tags ni publica APK.
No reemplaza los archivos de descargas ni acredita la compilación de 0.9.3.

### Envío autorizado de 0.9.3 / Android 18

EAS recibió las fuentes locales con `--platform android --profile ocr-comparison
--non-interactive --no-wait`, conservando la firma remota existente y el entorno
`preview`. [Seguimiento de la APK](https://expo.dev/accounts/thiago-salaberry/projects/APP-AHRE/builds/4fce02b6-9ae4-4036-95be-3abd66e12272).
Carga y fingerprint confirmados; no se esperó ni verificó el resultado de
compilación. Este envío no publica la descarga web, no despliega el servidor
ni mergea las ramas. Posteriormente se autorizó una nueva clave SSH exclusiva
de deploy y se desplegó backend 0.3.4 el 17/11/2026, con respaldos de MySQL,
código e imagen previa. Contenedor healthy, versión comprobada desde su
package.json y API local/pública disponibles. La compilación finalizó y la
descarga fue publicada el 18/11/2026, según el cierre siguiente.

### APK 0.9.3 publicada · 18/11/2026

[Descarga pública](https://ahre-server.tailc5dfc5.ts.net/downloads/ahre-0.9.3.apk):
173.306.576 bytes, SHA-256
2f345053baf37b7b565e6dd9ec9f82a08576de01aea3b29549ec8adc94b32dc0.
La descarga HTTPS completa coincide con el archivo finalizado en EAS.
Latest y catálogo apuntan a 0.9.3; se conservan las tres APK anteriores.
Frontend desplegado sin el bloque App y servidor en ninguna tarjeta, ni un
aviso sustituto. Las cuatro descargas responden con su tamaño esperado.
La instalación física de la APK queda pendiente; sin merge ni release de fuentes.
