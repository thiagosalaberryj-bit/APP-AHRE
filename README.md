<div align="center">

<h1>AHRE</h1>

<p>Aplicación móvil para la administración de información financiera personal.</p>

<p>
  <img src="https://img.shields.io/badge/Estado-No%20estable-F97316?style=flat-square" alt="Estado: no estable" />
  <img src="https://img.shields.io/badge/Versi%C3%B3n-0.2.0-2563EB?style=flat-square" alt="Versión 0.2.0" />
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

## Contenido previsto de la aplicación

### Inicio y dashboard

La pantalla principal permitirá consultar de forma resumida la situación
financiera del usuario, incluyendo saldos, movimientos recientes y accesos a
las operaciones más frecuentes.

### Depósitos y movimientos

Los depósitos representarán las distintas ubicaciones del dinero del usuario,
como efectivo, cuentas bancarias o billeteras virtuales.

Los movimientos permitirán registrar ingresos, egresos y transferencias entre
depósitos. Cada movimiento podrá incluir monto, fecha, categoría y descripción.

### Deudas y gastos compartidos

La aplicación podrá registrar dinero que el usuario debe o que otras personas
le deben, incluyendo pagos parciales e historial.

También se prevén funciones para organizar gastos compartidos entre varias
personas.

### Estadísticas y notificaciones

Los datos registrados podrán utilizarse para consultar gastos por período,
categoría o depósito. Las notificaciones podrán ayudar con recordatorios,
movimientos recurrentes y deudas pendientes.

### OCR

Se prevé incorporar reconocimiento óptico de caracteres para asistir en la
lectura de tickets y comprobantes. El resultado deberá poder ser revisado y
corregido por el usuario antes de guardarse.

### Perfil y funciones sociales

La aplicación podrá incorporar posteriormente la administración del perfil,
salas de gastos compartidos y otras funciones relacionadas con la colaboración
entre usuarios.

## Estado actual

El proyecto se encuentra en la etapa de preparación de la estructura base.
Actualmente cuenta con:

- proyecto inicial configurado con Expo;
- entrada principal compatible con Expo y React Native;
- estructura separada para pantallas, componentes, navegación, base local,
  servicios y utilidades;
- pantalla inicial con bienvenida y acceso visual a Login;
- interfaces maquetadas para Login y Registro, con navegación visual entre
  ambas y acceso de prueba al Dashboard;
- Dashboard maquetado con balance, acciones rápidas de ingreso, egreso y OCR,
  depósitos y movimientos de ejemplo;
- temas claro y oscuro aplicados a las pantallas, componentes y barras del
  sistema;
- estados visuales de los inputs y componentes de carga/error listos para
  conectarse a lógica futura;
- documentación de arquitectura;
- documentación del flujo de trabajo con Issues, ramas y Pull Requests;
- historial de cambios con las funcionalidades visuales recientes del Dashboard.

Las funcionalidades completas de AHRE todavía no están implementadas. Tampoco
se implementaron la autenticación, el registro de usuarios, las validaciones ni
la sesión: los formularios actuales solo presentan la interfaz y el flujo
visual. Los depósitos y movimientos del Dashboard son datos de ejemplo. La
versión `1.0.0` se identifica como no estable para evaluación y no representa
una versión comercial.

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
│   ├── constants/          # Valores constantes compartidos
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
- [Interfaz del Dashboard](docs/interfaces/dashboard.md);
- [Interfaces de autenticación](docs/interfaces/autenticacion.md);
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
