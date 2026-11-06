<div align="center">

<img src="assets/ahre-mark.png" width="76" alt="Logo AHRE" />

# AHRE · App

**Administrador de Historial y Recursos Económicos**

Finanzas personales, gastos compartidos y comprobantes en una app Android con datos locales.

![Estado](https://img.shields.io/badge/Estado-En%20desarrollo-F97316?style=flat-square)
![Versión](https://img.shields.io/badge/App-0.7.0-024C42?style=flat-square)
![Expo](https://img.shields.io/badge/Expo-SDK%2057-2563EB?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-Estricto-3178C6?style=flat-square)

[Documentación](docs/README.md) · [Pruebas](docs/configuracion/entorno.md#pruebas) · [Servidor](https://github.com/thiagosalaberryj-bit/SERVER-AHRE)

</div>

---

## Qué incluye

| Área | Disponible |
| --- | --- |
| Finanzas | Depósitos, ingresos, egresos, ajustes y estadísticas locales. |
| Social | Personas, salas, repartos, deudas y pagos asociados a movimientos. |
| Comprobantes | OCR local con ML Kit y revisión antes de guardar; requiere APK Android. |
| Cuenta | Registro e ingreso inicial con servidor, acceso offline autorizado y preferencias. |
| Sincronización | Lotes ordenados, reintentos sin duplicados y corrección guiada de correo rechazado. |

SQLite guarda primero cada operación. Al reconectar, la app envía los pendientes
a SERVER-AHRE, que valida el lote antes de confirmarlo. Una instalación por
cuenta puede sincronizar. AHRE registra información; no mueve dinero bancario.

## Empezar

Requisitos: Node 24, dependencias preparadas por el líder desde el lockfile y
Expo Go compatible con SDK 57. Desde la raíz de APP-AHRE:

```powershell
npm start -- --go --clear
```

Escaneá el QR en el teléfono, conectado a la misma red. El registro necesita
internet; «Entrar con datos de prueba» prepara ejemplos locales de desarrollo.
La URL del backend se configura con `EXPO_PUBLIC_API_URL`; ver
[entorno y pruebas](docs/configuracion/entorno.md).

El OCR nativo necesita un APK. La guía de [compilación y publicación](docs/configuracion/publicacion.md)
explica EAS, Expo Go y el paso separado de publicar la descarga.

## Verificar

```powershell
npm run typecheck
npm test
```

Las pruebas MySQL requieren un backend compilado y una instancia aislada;
sin ese entorno se omiten explícitamente. Ver [comandos completos](docs/configuracion/entorno.md#pruebas).

Última verificación de la etapa 7: **158 pruebas de la app y 45 del backend**
aprobadas sin omisiones, más exportación Android con Hermes. El líder confirmó
los recorridos manuales en Expo Go. El alcance y las limitaciones están en
[Estado y validación](docs/estado-y-validacion.md).


## Documentación

- [Guía e índice completo](docs/README.md): arquitectura, funciones, interfaz y base local.
- [Dependencias](docs/configuracion/dependencias.md): usos verificados y alertas pendientes de Expo.
- [Proceso de contribución](docs/proceso/flujo-issues-prs-changelog.md) e [historial](docs/CHANGELOG.md).

## Límites actuales

La sincronización funciona con la app activa; Social todavía no colabora entre
cuentas por web. Notificaciones muestra ejemplos y el idioma elegido no traduce
toda la interfaz. Los pendientes de una autorización revocada se conservan sin
recuperación automática. La app es una versión de evaluación; ver los
[límites y verificaciones](docs/estado-y-validacion.md).

## Mejoras de interfaz

La rama de interfaz unifica márgenes, tarjetas y formularios; agrupa movimientos
y pendientes por meses plegables, comparte selectores y mejora Estadísticas y
Social. Los filtros admiten grupos acumulativos y los montos se formatean al
escribir. Los recorridos se documentan en [Sistema visual](docs/interfaces/sistema-visual.md),
[Movimientos](docs/interfaces/movimientos.md), [Estadísticas](docs/interfaces/estadisticas.md)
y [Social](docs/interfaces/social.md).
