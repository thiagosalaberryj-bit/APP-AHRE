<div align="center">

<h1>AHRE</h1>

<p>Aplicación móvil para la administración de información financiera personal.</p>

<p>
  <img src="https://img.shields.io/badge/Estado-No%20estable-F97316?style=flat-square" alt="Estado: no estable" />
  <img src="https://img.shields.io/badge/Versi%C3%B3n-0.3.0-2563EB?style=flat-square" alt="Versión 0.3.0" />
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
                             ├── OCR
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

Las interfaces permiten recorrer depósitos y movimientos de ejemplo, buscar y
aplicar filtros, y abrir sus detalles. Los formularios de ingreso y egreso
presentan monto, depósito, categoría, fecha, hora y recurrencia. El alta,
edición y eliminación de depósitos, así como el guardado de movimientos,
continúan simulados y no persisten información.

### Deudas y gastos compartidos

La aplicación podrá registrar dinero que el usuario debe o que otras personas
le deben, incluyendo pagos parciales e historial.

También se prevén funciones para organizar gastos compartidos entre varias
personas.

### Estadísticas y notificaciones

La interfaz de Estadísticas ya muestra gráficos por categoría y período,
filtros y detalles con datos de ejemplo. Notificaciones muestra avisos
simulados agrupados por día. Las consultas reales, los recordatorios y las
notificaciones del dispositivo todavía no están implementados.

### OCR

La interfaz permite abrir la cámara, capturar o elegir una imagen, ajustar el
encuadre y revisar un resultado simulado editable. El reconocimiento óptico de
caracteres y el guardado del egreso todavía no están implementados.

### Perfil y funciones sociales

La pantalla de Perfil presenta datos de cuenta de ejemplo, selección y retiro
de foto, edición de datos y cambio de contraseña en flujos de demostración.
Incluye preferencias de idioma, notificaciones y apariencia, además de apartados
avanzados previstos para futuras funciones sociales y de cuenta.

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
- formularios maquetados para ingresos y egresos, con monto, descripción,
  depósito, categoría, fecha, hora y recurrencia visual; ambos simulan el
  guardado sin persistir movimientos;
- formulario de creación de depósitos y detalle con búsqueda, filtros,
  edición y eliminación simuladas; no se crean ni modifican depósitos reales;
- pantalla de Estadísticas con gráficos interactivos por categoría y período,
  filtros y detalles basados en datos de ejemplo;
- pantalla de Notificaciones con avisos de muestra agrupados por día; no usa
  notificaciones locales o push;
- flujo OCR con cámara en vivo, captura o selección desde la galería, recorte y
  revisión editable de un resultado simulado; no reconoce texto ni guarda el
  egreso;
- Perfil con datos de ejemplo, foto temporal, edición protegida por una
  confirmación local de contraseña, cambio de contraseña de demostración y
  apariencia compartida que solo se conserva durante la sesión;
- temas claro y oscuro aplicados a las pantallas, componentes y barras del
  sistema;
- estados visuales de los inputs y componentes de carga/error listos para
  conectarse a lógica futura;
- documentación de arquitectura;
- documentación del flujo de trabajo con Issues, ramas y Pull Requests;
- historial con la versión `0.4.0` en preparación, que reúne persistencia,
  autenticación local y la lógica de inicio de los Issues #19, #20 y #21.

Las funcionalidades completas de AHRE todavía no están implementadas. El
registro y el Login ya crean y verifican cuentas localmente. Al abrir AHRE, la
pantalla de Inicio permanece visible hasta que la persona desliza. Entonces,
sin sesión conduce a Login; con sesión válida solicita la huella y muestra una
carga animada antes de abrir el Dashboard. Los flujos
de edición y cambio de contraseña del Perfil son de demostración; el perfil, la
foto, el idioma, las notificaciones y la apariencia no se persisten. El botón Cerrar
sesión de Perfil sigue siendo visual; la operación local ya está disponible en
el servicio y su conexión desde Perfil queda para un issue posterior. Los
depósitos y movimientos de las otras pantallas financieras continúan siendo
datos de ejemplo; el Dashboard lee su resumen desde SQLite. La selección de
categorías y los formularios no persisten movimientos. El formulario de ingreso permite representar todos
sus campos y regresar mediante la flecha del encabezado; no tiene una acción
«Cancelar» en el pie. La versión `0.3.0` es la última publicada como versión
no estable para evaluación; la `0.4.0` está documentada como no publicada en
[`docs/CHANGELOG.md`](docs/CHANGELOG.md) y no representa una versión comercial.

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
- [Interfaz del perfil](docs/interfaces/perfil.md);
- [Interfaces de movimientos](docs/interfaces/movimientos.md);
- [Interfaz de Estadísticas](docs/interfaces/estadisticas.md);
- [Interfaz de Notificaciones](docs/interfaces/notificaciones.md);
- [Flujo OCR de comprobantes](docs/interfaces/ocr.md);
- [Interfaces de autenticación](docs/interfaces/autenticacion.md);
- [Autenticación local](docs/funcionalidades/autenticacion-local.md);
- [Lógica de inicio](docs/funcionalidades/inicio.md);
- [Carga local del Dashboard](docs/funcionalidades/dashboard.md);
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
