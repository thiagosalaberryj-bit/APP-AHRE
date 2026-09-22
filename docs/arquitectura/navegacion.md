# Navegación de AHRE

## Objetivo

Este documento define las rutas y los navegadores base de AHRE. Las pantallas
creadas en este Issue son placeholders mínimos para comprobar los recorridos.
Todavía no contienen diseño final, autenticación real, consultas a SQLite ni
lógica financiera.

## Navegadores utilizados

- `Native Stack`: controla el inicio, login, registro y las pantallas
  secundarias.
- `Bottom Tabs`: permite cambiar entre las áreas principales de AHRE.

La barra inferior se implementa en `src/navigation/BottomTabBar.js`. Utiliza la
paleta global, muestra íconos, identifica la pestaña activa y reserva el área
segura inferior del dispositivo. Solo aparece dentro de las cinco secciones
principales posteriores al dashboard.

Las pantallas de inicio, login y registro no muestran el encabezado verde ni la
barra inferior. El Dashboard, Movimientos, Nuevo, Estadísticas y Social
utilizan `src/components/MainHeader.js`, con el logo de AHRE, título,
descripción y accesos a notificaciones y perfil. Las pantallas secundarias
utilizan `src/components/SectionHeader.js`, con el título junto a la flecha de
regreso y una descripción alineada a la izquierda y centrada verticalmente
debajo.

La barra inferior contiene:

```text
Inicio | Movimientos | Nuevo | Estadísticas | Social
```

## Pantallas y archivos

| Pantalla | Archivo | Acceso inicial |
| --- | --- | --- |
| Inicio | `src/screens/InicioScreen.js` | Pantalla inicial |
| Login | `src/screens/LoginScreen.js` | Inicio |
| Registro | `src/screens/RegistroScreen.js` | Login |
| Dashboard | `src/screens/DashboardScreen.js` | Pestaña Inicio |
| Movimientos | `src/screens/MovimientosScreen.js` | Pestaña Movimientos |
| Nuevo | `src/screens/NuevoScreen.js` | Pestaña Nuevo |
| Estadísticas | `src/screens/EstadisticasScreen.js` | Pestaña Estadísticas |
| Social | `src/screens/SocialScreen.js` | Pestaña Social |
| Perfil | `src/screens/PerfilScreen.js` | Dashboard |
| Notificaciones | `src/screens/NotificacionesScreen.js` | Dashboard |
| Ingreso | `src/screens/IngresoScreen.js` | Dashboard o Nuevo |
| Egreso | `src/screens/EgresoScreen.js` | Dashboard o Nuevo |
| Nuevo depósito | `src/screens/DepositoScreen.js` | Dashboard o Nuevo |
| Detalle de depósito | `src/screens/DetalleDepositoScreen.js` | Dashboard |
| OCR | `src/screens/OcrScreen.js` | Dashboard |

## Flujo general

```text
Inicio
└── Login
    ├── Registro
    │   └── volver a Login
    │
    └── Dashboard
        ├── Perfil
        ├── Notificaciones
        ├── Ingreso
        ├── Egreso
        ├── Nuevo depósito
        ├── Detalle de depósito
        └── OCR
```

Desde Dashboard también se puede acceder a las áreas principales mediante la
barra inferior:

```text
Dashboard / Inicio
├── Movimientos
├── Nuevo
│   ├── Ingreso
│   ├── Egreso
│   └── Nuevo depósito
├── Estadísticas
└── Social
```

## Flujo temporal de autenticación

La autenticación todavía no es real. Para poder probar la navegación, Login
incluye una acción temporal que permite entrar a Dashboard.

```text
Inicio → Login → Dashboard
Login → Registro → volver a Login
```

La validación de sesión y el cierre de sesión se implementarán posteriormente.

## Depósitos

El detalle de depósito utiliza una única pantalla reutilizable. Actualmente se
puede abrir desde Dashboard como ruta de prueba. Más adelante recibirá el
identificador del depósito seleccionado y cargará la información de forma
dinámica.

La pantalla de creación de depósito se accede desde Dashboard o desde la
sección Nuevo.

## Regreso entre pantallas

Las pantallas secundarias utilizan el comportamiento normal del Stack Navigator.
La flecha del encabezado ejecuta `navigation.goBack()` para volver a la pantalla
anterior. Las pestañas principales no necesitan un botón de regreso porque se
cambian directamente desde la barra inferior.

## Límites actuales

En este Issue no se implementan:

- diseño final de las pantallas;
- autenticación o registro reales;
- consultas a la base de datos;
- creación de movimientos o depósitos;
- gráficos, filtros o estadísticas;
- cámara o reconocimiento OCR;
- notificaciones reales;
- lógica del módulo Social.
