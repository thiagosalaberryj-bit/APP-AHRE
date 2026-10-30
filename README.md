<div align="center">

<h1>AHRE</h1>

<p>Aplicación móvil para la administración de información financiera personal.</p>

<p>
  <img src="https://img.shields.io/badge/Estado-No%20estable-F97316?style=flat-square" alt="Estado: no estable" />
  <img src="https://img.shields.io/badge/Versi%C3%B3n-0.4.0-2563EB?style=flat-square" alt="Versión 0.4.0" />
  <img src="https://img.shields.io/badge/Plataforma-Android-green?style=flat-square&logo=android&logoColor=green" alt="Plataforma Android" />
  <img src="https://img.shields.io/badge/Expo-SDK%2057-white?style=flat-square&logo=expo&logoColor=white" alt="Expo SDK 57" />
  <img src="https://img.shields.io/badge/React%20Native-0.86.3-61DAFB?style=flat-square&logo=react&logoColor=61DAFB" alt="React Native 0.86.3" />
</p>

</div>

---

## ¿Qué es este repositorio?

Este es el repositorio principal de la aplicación móvil AHRE, cuyo nombre
significa **Administrador de Historial y Recursos Económicos**.

El objetivo del proyecto es ofrecer una herramienta para registrar, organizar y
comprender la información relacionada con las finanzas personales. La aplicación
permitirá representar distintas fuentes de dinero mediante depósitos y registrar
los movimientos asociados a cada una.

AHRE está planteada inicialmente para dispositivos Android y utiliza un enfoque
**offline-first**. Las funciones principales deben poder utilizarse sin una
conexión permanente a Internet y la información central debe permanecer
disponible localmente en el dispositivo.

AHRE no almacena dinero real, no reemplaza a una entidad bancaria y no funciona
como una billetera virtual. Su función es administrar la información que el
usuario registra sobre sus recursos económicos.

## ¿Para qué sirve dentro de AHRE?

Este repositorio contiene la aplicación móvil y la estructura sobre la que se
desarrollarán las funciones principales del sistema.

El funcionamiento previsto puede representarse de la siguiente manera:

```text
Usuario
   │
   ▼
Aplicación móvil AHRE
   │
   ├──────────────► Almacenamiento local offline-first
   │                         │
   │                         ├── Depósitos
   │                         ├── Movimientos
   │                         ├── Categorías
   │                         ├── Deudas
   │                         └── Estadísticas
   │
   └──────────────► Servicios conectados futuros
                             │
                             ├── Sincronización
                             ├── Notificaciones
                             └── Funciones sociales
```

El almacenamiento local representa el núcleo de la aplicación. Los servicios
conectados se incorporarán como extensiones y no deben convertirse en una
dependencia obligatoria para las funciones esenciales.

## Áreas funcionales actuales y previstas

### Inicio y dashboard

La interfaz actual presenta un resumen visual de la situación financiera, con
saldo, depósitos, movimientos recientes y accesos a las operaciones frecuentes.
El Dashboard consulta el usuario de la sesión local, los depósitos y los
movimientos en SQLite; calcula el balance desde `saldo_actual` y actualiza la
información cuando vuelve a tomar el foco. Las demás pantallas financieras aún
pueden mostrar datos de ejemplo y no guardar cambios.

### Depósitos y movimientos

Los depósitos representan las distintas ubicaciones del dinero del usuario,
como efectivo, cuentas bancarias o billeteras virtuales.

La pestaña Movimientos consulta en SQLite los ingresos y egresos del usuario,
permite buscar por descripción, combinar filtros y abrir detalles por ID. El
formulario de creación de depósitos guarda localmente nombre, saldo inicial,
tipo, ícono, color y descripción. Los formularios de ingreso y egreso guardan
movimientos en SQLite y actualizan el saldo del depósito; la edición y
eliminación de depósitos continúan simuladas.

### Deudas y gastos compartidos

Social es una maqueta personal offline del Issue #18. No guarda personas,
salas, gastos, pagos ni deudas, y no calcula importes ni se comunica con otros
dispositivos.

El panel reúne Te deben y Debés en bloques de fondo suave con iconos, junto a
Nueva deuda, Personas y Nueva sala. Debajo muestra hasta cinco deudas
pendientes recientes y hasta tres salas activas, con flechas a las listas
completas. Las deudas abren su detalle individual. Su historial permite buscar,
filtrar pendientes/saldadas y expandir o cerrar los grupos mensuales.

La agenda usa tarjetas compactas con nombre, apodo y acceso al perfil. El alta
y la edición se representan en modal con nombre, apellido y apodo obligatorio
(máximo 20 caracteres), y comprobación visual de duplicados sobre los ejemplos.
Las salas comparten tarjetas en panel y listado, con total gastado, personas y
fecha de creación; el listado permite buscar y filtrar activas/cerradas. Crear
sala ofrece categorías de egreso, icono, color y fecha actual seleccionable.

Cada ítem tiene pagador, personas involucradas, reparto igual o manual y pagos
propios. El OCR de ejemplo carga una línea por vez, sin cámara ni egresos
reales. Mientras la sala está abierta, el reparto es provisional y los gastos
se pueden editar en un borrador. El cierre representa las deudas pendientes
y deja el historial en solo lectura, sin crear registros reales. Quitar una
persona pide confirmación y conserva sus gastos y pagos anteriores.

Las pantallas, componentes y estilos de Social están separados en archivos
propios; los datos de ejemplo viven en src/social/. Las rutas conservan
sus nombres y parámetros.

El detalle de la maqueta y su recorrido de verificación están en
[Interfaz de Social](docs/interfaces/social.md).

### Estadísticas y notificaciones

Estadísticas consulta los ingresos y egresos guardados en SQLite para calcular
totales, porcentajes, agrupaciones semanales y anuales, y detalles por categoría.
Sus cálculos funcionan sin conexión. Notificaciones muestra avisos simulados
agrupados por día; los recordatorios y las notificaciones del dispositivo
todavía no están implementados.

### OCR

La pantalla OCR utiliza ML Kit local para Android: permite capturar o elegir
una imagen, ajustar el encuadre y revisar propuestas de monto, fecha, comercio
y productos. Los datos se pueden corregir y confirmar como un egreso local,
reutilizando las validaciones y persistencia normales de Egresos. Requiere un
APK con el módulo nativo; Expo Go no incluye el motor. La extracción puede
ser incompleta y requiere revisión manual. El líder confirmó el funcionamiento
en su dispositivo; los escenarios de regresión se detallan en la guía funcional.

### Perfil y funciones sociales

La pantalla de Perfil presenta los datos de la persona autenticada, permite
editar nombre y correo con validación local, y ofrece cierre de sesión local.
Incluye cambio persistente de contraseña, preferencias locales de idioma,
notificaciones y apariencia, y apartados avanzados previstos para futuras
funciones sociales y de cuenta. La edición del perfil se confirma con la
contraseña local o la huella configurada en el dispositivo.

## Estado actual

El proyecto ofrece un prototipo visual no estable de sus principales
interfaces. Actualmente cuenta con:

- proyecto inicial configurado con Expo;
- entrada principal compatible con Expo y React Native;
- estructura separada para pantallas, componentes, navegación, base local,
  servicios y utilidades;
- pantalla de Inicio visible después de preparar SQLite; la sesión local se
  comprueba al completar el deslizador;
- registro de usuarios locales con validación, correo único y verificador de
  contraseña protegido;
- Login local y sesión persistente opcional mediante SecureStore, sin conexión
  a Internet;
- avisos toast reutilizables para errores, confirmaciones e información, con
  tiempo visible, cierre manual y gesto para descartarlos;
- inicio con preparación local de SQLite, consulta de sesión al deslizar y
  validación biométrica antes de abrir el Dashboard cuando ya hay sesión;
- carga de Inicio con barra verde animada, porcentaje y textos cambiantes, en
  modo claro y oscuro, durante 1,5 segundos después de validar la huella;
- Dashboard conectado a la base local para mostrar al usuario, depósitos,
  balance y hasta cinco movimientos recientes; mantiene los accesos rápidos a
  ingreso, egreso y OCR;
- pantalla de Movimientos con historial agrupado por día, búsqueda y filtros
  locales por tipo, fecha, monto, categoría y depósito, con detalles de
  movimientos;
- formularios de ingreso y egreso conectados a SQLite, con monto, descripción,
  depósito, categoría, fecha, hora y recurrencia; ambos validan y persisten el
  movimiento y actualizan el saldo del depósito;
- formulario de creación de depósitos conectado a SQLite local; el detalle con
  búsqueda, filtros, edición y eliminación sigue simulado;
- pantalla de Estadísticas con gráficos interactivos por categoría y período,
  filtros y detalles basados en datos de ejemplo;
- pantalla de Notificaciones con avisos de muestra agrupados por día; no usa
  notificaciones locales o push;
- pestaña Social con resumen, deudas recientes, agenda y salas; historiales
  con búsqueda y filtros, reparto por ítem y cierre de sala en solo lectura;
  todo con datos simulados y sin persistencia;
- flujo OCR con ML Kit local, captura o selección desde la galería, recorte,
  revisión editable y confirmación mediante el servicio normal de Egresos;
- Perfil con datos locales del usuario, foto temporal, edición protegida por la
  contraseña local o huella, cambio persistente de contraseña, preferencias de
  idioma, notificaciones y apariencia, y cierre de sesión local;
- temas claro y oscuro aplicados a las pantallas, componentes y barras del
  sistema;
- estados visuales de los inputs y componentes de carga/error listos para
  conectarse a lógica futura;
- documentación de arquitectura;
- documentación del flujo de trabajo con Issues, ramas y Pull Requests;
- historial con la versión `0.5.0` no publicada para la nueva maqueta de Social
  (#18), y la `0.4.0` publicada como prerelease no estable sin ese módulo.

Las funcionalidades completas de AHRE todavía no están implementadas. El
registro y el Login ya crean y verifican cuentas localmente. Al abrir AHRE, la
pantalla de Inicio permanece visible hasta que la persona desliza. Entonces,
sin sesión conduce a Login; con sesión válida solicita la huella y muestra una
carga animada antes de abrir el Dashboard. El cambio de contraseña actualiza
el verificador local que se usa en los siguientes ingresos; la foto de perfil
sigue siendo temporal. El perfil, el idioma, las notificaciones y la apariencia
se guardan localmente. El tema del sistema se usa al primer inicio y luego se
recupera la apariencia guardada.

Los depósitos ya se pueden crear y guardar en la base local; el Dashboard lee
su resumen desde SQLite y conserva los datos visibles mientras actualiza la
consulta al recuperar el foco. Movimientos consulta el historial local,
combina búsqueda y filtros y carga el detalle por ID; Estadísticas todavía usa
datos de ejemplo. Los formularios de ingreso y egreso validan y persisten sus
movimientos localmente, con su impacto en el saldo. La versión `0.4.0` es
la última publicada como versión no estable para evaluación; la `0.5.0` está
documentada como no publicada en [`docs/CHANGELOG.md`](docs/CHANGELOG.md) y no
representa una versión comercial. La prerelease `v0.4.0` publica el código fuente
anterior a Social, sin APK adjunto. La versión interna de Expo y del paquete
se conserva en `0.3.0`, como en el commit etiquetado.

## Tecnología

- Expo SDK 57;
- React Native 0.86.3;
- React 19.2.3;
- JavaScript únicamente;
- plataforma inicial Android;
- arquitectura offline-first.

## Estructura del repositorio

```text
APP-AHRE/
├── assets/                 # Íconos e imágenes utilizadas por Expo
├── docs/                   # Documentación de arquitectura, configuración, interfaz y procesos
├── src/
│   ├── components/         # Componentes reutilizables
│   ├── authentication/     # Registro, verificación de credenciales y sesión local
│   ├── constants/          # Valores constantes compartidos
│   ├── contexts/           # Preferencias compartidas durante la sesión
│   ├── database/           # Acceso y adaptadores de almacenamiento local
│   ├── navigation/         # Navegación de la aplicación
│   ├── screens/            # Pantallas de AHRE
│   ├── services/           # Servicios e integraciones futuras
│   ├── styles/             # Estilos globales de React Native
│   └── utils/              # Funciones auxiliares
├── App.js                  # Composición raíz de la aplicación
├── app.json                # Configuración de Expo
├── docs/CHANGELOG.md       # Historial de cambios
├── index.js                # Registro de la aplicación en Expo
└── README.md               # Descripción y alcance del repositorio
```

La descripción detallada de cada carpeta se encuentra en
[`docs/arquitectura/estructura-app.md`](docs/arquitectura/estructura-app.md).

## Documentación

La carpeta `docs/` contiene la documentación que acompaña al proyecto:

- [Estructura de la aplicación](docs/arquitectura/estructura-app.md);
- [Navegación](docs/arquitectura/navegacion.md);
- [Base de datos local](docs/base-de-datos/base-datos-local.md);
- [Dependencias de la aplicación](docs/configuracion/dependencias.md);
- [Pantalla inicial](docs/interfaces/inicio.md);
- [Interfaz del Dashboard](docs/interfaces/dashboard.md);
- [Formulario y detalle de depósitos](docs/interfaces/depositos.md);
- [Creación local de depósitos](docs/funcionalidades/depositos.md);
- [Interfaz del perfil](docs/interfaces/perfil.md);
- [Interfaces de movimientos](docs/interfaces/movimientos.md);
- [Interfaz de Estadísticas](docs/interfaces/estadisticas.md);
- [Interfaz de Notificaciones](docs/interfaces/notificaciones.md);
- [Interfaz de Social](docs/interfaces/social.md);
- [Flujo OCR de comprobantes](docs/interfaces/ocr.md);
- [OCR offline, interpretación y registro de egresos](docs/funcionalidades/ocr.md);
- [Interfaces de autenticación](docs/interfaces/autenticacion.md);
- [Autenticación local](docs/funcionalidades/autenticacion-local.md);
- [Lógica de inicio](docs/funcionalidades/inicio.md);
- [Carga local del Dashboard](docs/funcionalidades/dashboard.md);
- [Perfil y preferencias locales](docs/funcionalidades/perfil.md);
- [Notificaciones toast](docs/funcionalidades/notificaciones-toast.md);
- [Sistema visual](docs/interfaces/sistema-visual.md);
- [Historial de cambios](docs/CHANGELOG.md);
- [Flujo de Issues, Pull Requests e historial de cambios](docs/proceso/flujo-issues-prs-changelog.md).

## Cómo iniciar el proyecto

Instalar las dependencias:

```bash
npm install
```

Iniciar Expo:

```bash
npm start
```

También se encuentran disponibles los comandos:

```bash
npm run android
npm run ios
npm run web
```

## Alcance del README

Este archivo presenta el propósito, el alcance y el estado general de AHRE. Las
decisiones de arquitectura, las convenciones y el flujo detallado de trabajo se
mantienen en los documentos específicos dentro de `docs/`.
