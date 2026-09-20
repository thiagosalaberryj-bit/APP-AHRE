# Historial de cambios

Todos los cambios relevantes realizados en la aplicación AHRE y en su
documentación se registran en este archivo.

## [v0.1.0] - 2026-09-20 - No estable

### Añadido

- Se definió la estructura base de la aplicación móvil con Expo y React
  Native.
- Se separaron las áreas de pantallas, componentes, navegación, almacenamiento
  local, servicios, constantes y utilidades.
- Se agregó la documentación de arquitectura en
  `docs/arquitectura/estructura-app.md`.
- Se agregó la documentación del flujo de trabajo con Issues, ramas y Pull
  Requests.
- Se agregó el README general del proyecto.

### Cambiado

- Se mantuvo el proyecto utilizando JavaScript y archivos `.js`.
- Se conservó `app.json` como única fuente de configuración de Expo.
- Se dejó una pantalla inicial mínima para verificar la conexión entre las
  capas de la aplicación.

### Verificación

- Expo inició correctamente el proyecto.
- Metro generó correctamente el paquete para Android.
- No se encontraron archivos TypeScript.
- No se detectaron errores de formato en los cambios realizados.

### Estado

- La estructura base quedó preparada para incorporar las funcionalidades de
  AHRE.
- La aplicación continúa en desarrollo y esta versión no es estable ni
  comercial.

## Regla de actualización

Cuando un Issue se considera terminado, el revisor del Pull Request debe
actualizar este archivo antes de realizar el merge o como parte del cierre del
trabajo. La persona que implementa el Issue no debe modificar el historial de
cambios dentro de su rama, salvo que el revisor se lo solicite expresamente.
