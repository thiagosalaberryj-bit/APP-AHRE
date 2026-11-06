# Estado y validación de AHRE

Referencia actualizada al 3 de noviembre de 2026. Este documento concentra el
estado operativo que antes se repetía en el README. Los changelogs mantienen
el historial de sus entregas; no se reescriben desde una implementación.

## Estado por etapa

| Etapa | Resultado |
| --- | --- |
| 1 · Entorno y línea base | Dependencias preparadas con autorización, tipos y MySQL temporal aislado. |
| 2 · Identidad y correo | Recuperación por ID después de cambiar correo offline, sin duplicar la cuenta. |
| 3 · Correo rechazado | Reparación guiada con respaldo, vista previa y conservación de eventos financieros. |
| 4 · SQLite y cola | Lecturas sin preparar lotes, índice por lote y recuentos limitados durante envío. |
| Corrección de saldo | El movimiento del mismo minuto de creación del depósito impacta el saldo; conserva el historial anterior. |
| 5 · Backend | Carga acotada de perfil/preferencias, joins e índices existentes y agrupaciones de dominio. |
| 6 · Social en la app | Consultas sin escrituras tras preparar identidad, adelantos agrupados y formateadores reutilizados. |
| 7 · Limpieza y dependencias | Archivos/imports/CSS sin uso retirados; grupo de formularios retirado con autorización. |
| 8 · Documentación | Guías y README; sin cambios funcionales ni despliegue ejecutado por el agente. |
| 9 · Integración final | Revisión técnica local aprobada; publicación, revisión del PR y merge pendientes. |

El líder confirmó los recorridos manuales de las etapas 2 a 7 en Expo Go,
incluidos correo, depósito nuevo, reconexión, Social y la prueba rápida tras
retirar dependencias. Son confirmaciones funcionales del recorrido solicitado,
no una matriz exhaustiva de dispositivos, accesibilidad o rendimiento.

## Evidencia automatizada más reciente

La etapa 9 volvió a aprobar tipos e integración: 158 pruebas de la app y 45
del backend, sin fallos ni omisiones. Ver el [informe final](revision-final.md).
La exportación Android y la auditoría npm siguientes corresponden a la etapa 7.

Después de la retirada autorizada de paquetes en la etapa 7:

- Tipos de APP-AHRE correctos; revisión adicional sin imports/parámetros sin uso.
- 158 pruebas de la app y 45 del backend aprobadas, cero fallos y cero omisiones.
- MySQL Community 8.4.13 temporal en 127.0.0.1:13307; credenciales sintéticas,
  permiso sobre bases `ahre_test_*` y proceso apagado al terminar.
- Exportación Android/Hermes correcta; primer intento bloqueado por escritura
  del temporal de Windows y reintento correcto con permisos suficientes.
- Árbol npm coherente; versiones, URLs e integridad de paquetes conservados sin cambios.

La exportación no genera un APK. Los escenarios automatizados de captura nativa
no sustituyen una prueba de ML Kit en Android. Ver [OCR](funcionalidades/ocr.md),
[entorno de pruebas](configuracion/entorno.md) y [dependencias](configuracion/dependencias.md).
Los recuentos de pruebas son evidencia fechada, no un número que cada cambio deba mantener.

## Recorrido manual de referencia

1. Con backend actualizado y conexión, registrar una cuenta sintética e ingresar.
2. Editar nombre/preferencias y esperar pendientes en cero.
3. Con la app cargada, cortar internet; crear depósito con 1000, egreso 100 e
   ingreso 50. Debe mostrar 950 incluso en el minuto de creación.
4. Reconectar: cero pendientes, mismo saldo y movimientos sin duplicados.
5. Crear una persona y sala de dos participantes, gasto 100 pagado por vos con
   el depósito y reparto igual, sin devolución ajena. Cerrar: saldo 850 y 50 por cobrar.
6. Registrar devolución 25 en ese depósito: saldo 875 y pendiente 25.
7. Recorrer agenda, sala, gasto y deuda; consultas sucesivas no crean pendientes
   después de sincronizar la identidad. Una edición o pago sí debe generarlos.
8. Cerrar sesión normalmente y volver a ingresar: conservar datos, preferencias y saldos.

La recuperación de correo duplicado se verifica usando otra cuenta que exista
solo en servidor u otra instalación, para no detenerse primero en la validación
local de duplicados. Seguir [Perfil](interfaces/perfil.md#recuperación-guiada-de-correo-rechazado-etapa-3).

## Límites y trabajo pendiente

- Sincronización con la app activa; no hay ejecución nativa con la app cerrada.
- Social es personal por cuenta; no hay salas compartidas por web entre cuentas.
- Pendientes revocados conservados, sin interfaz general de recuperación. La
  reparación disponible está limitada al rechazo específico de perfil/correo.
- La consulta de Social mantiene su conjunto completo; paginar requiere revisar
  los consumidores. Los lotes financieros del backend también cargan estado completo.
- Notificaciones muestra ejemplos; guardar idioma no implementa traducción integral.
- «Acerca de AHRE» toma la versión de `Constants.expoConfig.version`; actualmente 0.7.0, con código Android 5 en el manifiesto.
- Los movimientos ya guardados con una hora anterior al depósito no se
  recalculan automáticamente al instalar la corrección del formulario.
- Auditoría de la app: 14 paquetes afectados (3 altos, 9 moderados, 2 bajos)
  del árbol de Expo; backend: cero en la consulta del 3 de noviembre. La propuesta
  de Expo 58 requiere una migración separada, no `audit fix --force`.

Los commits locales de resguardo anteriores a la etapa 7 son `dadf614` en
APP-AHRE y `b142f7e` en SERVER-AHRE. Las etapas posteriores pueden permanecer
sin commit hasta la revisión. Un commit, un push, un merge, un despliegue y una
build de APK no son equivalentes; no asumir publicación por estos resultados.


## Comprobación documental de la etapa 8

La revisión comprueba enlaces locales, imágenes, UTF-8 y cercos de código en
la documentación de ambos repositorios.

Las fuentes de la app, dependencias y scripts de despliegue se conservaron.
No se repiten pruebas funcionales por estos cambios exclusivamente documentales.

## Verificación de los últimos ajustes de interfaz

El 5 de noviembre de 2026 se verificó el commit `63363c8` de la rama
`codex/cambios-interfaz`: `npm run typecheck` correcto y `npm test` con
194 pruebas, 186 aprobadas, 8 omitidas y ningún fallo. Las omisiones dependen
de entornos externos; no equivalen a pruebas aprobadas. La suite incluye la
comprobación nueva del cierre anterior con depósitos nuevos, registros
históricos y reversiones. Posteriormente se completaron los ajustes de creación
de sala, contraste de categorías y etiqueta del selector de depósitos para 0.7.0.

Estos ajustes unifican cards y filtros, las proporciones de los resúmenes de
Inicio y Social, la variación del balance general y la presentación compacta
con desplazamiento del dato mensual en Detalle de depósito. TypeScript y las
pruebas no verifican layout ni animaciones nativas: la revisión en dispositivo
debe cubrir textos largos, privacidad, claro/oscuro y reducción de movimiento.
El túnel Expo de desarrollo no implica que se haya generado o publicado un APK
con estos cambios.

La verificación final de 0.7.0 del mismo día repitió TypeScript y la suite completa:
194 pruebas, 186 aprobadas, 8 omitidas y ningún fallo. También pasó la exportación
Android/Hermes (2157 módulos y 38 recursos). Incluye los últimos cambios de
creación de salas, colores de categorías y contraste de íconos. Los escenarios
de interfaz cubren búsqueda, confirmación y reapertura de participantes y
persistencia del color de la sala en ambos temas. No se generó un APK 0.7.0.
