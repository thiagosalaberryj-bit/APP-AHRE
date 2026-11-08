# Documentación de APP-AHRE

Guía vigente al 8 de noviembre de 2026, versión 0.8.0 (no estable). El [README](../README.md) presenta la app;
este índice enlaza el detalle. El [estado y las verificaciones](estado-y-validacion.md)
separan lo implementado, las pruebas automáticas, las confirmaciones del líder y
el trabajo pendiente. Los documentos históricos de TypeScript y dependencias
conservan sus fechas; sus recuentos no sustituyen el estado más reciente.

## Empezar

- [Entorno, Expo Go y pruebas](configuracion/entorno.md).
- [Compilar y publicar Android](configuracion/publicacion.md).
- [Dependencias y auditoría](configuracion/dependencias.md).

- [Revisión final e integración](revision-final.md).
- [Auditoría de Social y salas](social-audit.md).

## Arquitectura

| Documento | Guía |
| --- | --- |
| Estructura base de la aplicación AHRE | [estructura-app](arquitectura/estructura-app.md) |
| Navegación de AHRE | [navegacion](arquitectura/navegacion.md) |
| Datos privados/compartidos, permisos, recurrencias y correcciones | [social-online-recurrencias](arquitectura/social-online-recurrencias.md) |

## Base de datos

| Documento | Guía |
| --- | --- |
| Base de datos local de AHRE | [base-datos-local](base-de-datos/base-datos-local.md) |
| Implementación de la base de datos local | [implementacion](base-de-datos/implementacion.md) |
| Esquema local de Social | [social](base-de-datos/social.md) |

## Configuración

| Documento | Guía |
| --- | --- |
| Dependencias de AHRE | [dependencias](configuracion/dependencias.md) |
| Entorno y pruebas de APP-AHRE | [entorno](configuracion/entorno.md) |
| Compilación y publicación Android | [publicacion](configuracion/publicacion.md) |
| TypeScript en AHRE | [typescript](configuracion/typescript.md) |

## Funcionalidades

| Documento | Guía |
| --- | --- |
| Autenticación local | [autenticacion-local](funcionalidades/autenticacion-local.md) |
| Carga local del Dashboard | [dashboard](funcionalidades/dashboard.md) |
| Gestión local de depósitos | [depositos](funcionalidades/depositos.md) |
| Estadísticas con movimientos locales | [estadisticas](funcionalidades/estadisticas.md) |
| Lógica de inicio de AHRE | [inicio](funcionalidades/inicio.md) |
| Registro local de ingresos y egresos | [movimientos](funcionalidades/movimientos.md) |
| Notificaciones toast | [notificaciones-toast](funcionalidades/notificaciones-toast.md) |
| OCR offline de comprobantes — Issue 31 | [ocr](funcionalidades/ocr.md) |
| Perfil y preferencias locales | [perfil](funcionalidades/perfil.md) |
| Funcionamiento local de Social | [social](funcionalidades/social.md) |

## Interfaz

| Documento | Guía |
| --- | --- |
| Interfaces de autenticación de AHRE | [autenticacion](interfaces/autenticacion.md) |
| Dashboard principal | [dashboard](interfaces/dashboard.md) |
| Formulario de creación de depósitos | [depositos](interfaces/depositos.md) |
| Estadísticas | [estadisticas](interfaces/estadisticas.md) |
| Pantalla inicial de AHRE | [inicio](interfaces/inicio.md) |
| Interfaces de movimientos de AHRE | [movimientos](interfaces/movimientos.md) |
| Notificaciones de AHRE | [notificaciones](interfaces/notificaciones.md) |
| OCR de comprobantes de AHRE | [ocr](interfaces/ocr.md) |
| Perfil y configuración de AHRE | [perfil](interfaces/perfil.md) |
| Sistema visual de AHRE | [sistema-visual](interfaces/sistema-visual.md) |
| Interfaces de Social | [social](interfaces/social.md) |

## Proceso

| Documento | Guía |
| --- | --- |
| Flujo de trabajo con Issues, Pull Requests e historial de cambios | [flujo-issues-prs-changelog](proceso/flujo-issues-prs-changelog.md) |

## Historial

El [changelog](CHANGELOG.md)
es histórico y lo mantiene quien revisa el PR. La instalación de dependencias
corresponde al líder según [AGENTS.md](../AGENTS.md).

El servidor tiene un índice equivalente en su carpeta `docs/`:
[SERVER-AHRE](https://github.com/thiagosalaberryj-bit/SERVER-AHRE).

- [Social online, recurrencias y correcciones](arquitectura/social-online-recurrencias.md): contrato de la nueva implementación.

- [Recorrido completo de Social, build 10](social-validation.md).
