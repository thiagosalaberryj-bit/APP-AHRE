# Auditoría de Social y salas · 8 de noviembre de 2026

Este informe conserva la evidencia de la primera revisión. Las correcciones y
la validación posteriores se registran en [Estado y validación](estado-y-validacion.md)
y en el [contrato vigente](arquitectura/social-online-recurrencias.md). Los
recuentos y omisiones de este informe no representan la última ejecución.

## Alcance y método

Revisión estática del grafo de imports de las 283 fuentes de APP-AHRE desde
index.ts y App.tsx, incluidos require e imports dinámicos relativos. Comparación
SHA-256 de fuentes para detectar archivos idénticos y análisis TypeScript de
variables/parámetros sin uso. Los estilos se revisaron contra sus consumidores;
los nombres comunes y los estilos transmitidos a componentes no se eliminaron
solo por una búsqueda de texto.

Se recorrieron los componentes, servicios, cachés y permisos de Social. No se
cambiaron dependencias, navegación raíz ni esquema. Los cambios fuera de Social
se limitan a declaraciones sin uso en depósitos, movimientos y estadísticas.
El árbol contenía trabajo previo: se conservó la rama y no se actualizó main.

## Hallazgos y cambios

| Hallazgo | Resolución |
| --- | --- |
| Publicar desde una cuenta demo pedía sesión remota | Publicación transaccional en SQLite, conservando ID, gastos y una sola sala visible. |
| El ingreso por enlace no se podía recorrer localmente | Formulario demo hacia la sala participante precargada, con validación de contraseña y enlace. |
| Botón online con estilo distinto | Retirado OnlineButton; se reutilizan SocialButton y las filas/tarjetas locales. |
| Agenda, admisiones y formularios mezclados | Integrantes e Ingresos separados; se revisa una solicitud por modal. |
| Falta de feedback en altas fallidas | Error dentro del selector, sin cerrar ni perder la selección. |
| Crear ficha antes de una admisión fallida podía repetir el alta | Se conserva la ficha creada y se reintenta su asociación. |
| Podía reasignarse un invitado demo con acceso vigente | Se exige reemplazar expresamente su acceso; las fichas vinculadas se excluyen. |
| Consultas repetidas del detalle de sala | Se comparten lecturas simultáneas y se filtra SQLite por sala. |
| Un evento podía perderse durante una lectura | Se hace una consulta posterior al evento; las respuestas anteriores no sustituyen la nueva. |
| Selección financiera distinta al formulario habitual | Se reutilizan selector segmentado, depósitos y selección de movimientos existentes. |
| Archivo de reversión social sin consumidores | Eliminado socialMovementReversal.ts; se conserva la corrección privada vigente. |
| Estilos y variables sin uso | Retirados los estilos del botón eliminado, seis estilos huérfanos y seis declaraciones señaladas por TypeScript. |
| Capturas de errores repetidas | mensajeErrorSocial en el módulo existente conserva mensajes de Error y objetos de error de SDK/adaptadores. |

Se conservaron los servicios públicos de invitaciones personales y los envoltorios
financieros que tienen consumidores en las pruebas de compatibilidad e integración.
No se borraron por el solo hecho de no tener un botón en el recorrido nuevo.
El análisis final no encontró fuentes fuera del grafo ni archivos idénticos;
esto no demuestra por sí solo que toda función o todo estilo tenga uso.

## Escenarios cubiertos

| Escenario | Resultado |
| --- | --- |
| Creador demo publica una sala nueva o una local existente | Sin HTTP, mismo ID y cupo, sin duplicar sala ni gastos. |
| Comparte varias veces | Enlace y QR estables; se pueden renovar o deshabilitar. |
| Contraseña incorrecta o enlace invalidado | Error visible y posibilidad de corregir, sin admisión. |
| Invitado pide ingreso | Tarjeta separada en Ingresos; no se muestra un formulario por cada invitado. |
| Invitado nuevo o con ficha previa | Crear persona o elegir de agenda y admitir, con recuperación explícita de acceso si corresponde. |
| Ficha vinculada a una cuenta | Se omite de la asignación de otra identidad. |
| Participante sin permiso | Consulta y envía solicitudes; no administra ni cierra. |
| Participante con permiso de gastos | Registra gastos, sin administrar integrantes ni conceder permisos. |
| Participante informa parte pagada | Prepara su depósito; el aviso espera al administrador y no mueve dinero antes del cierre. |
| Administrador acepta o rechaza | Se actualizan el aviso y el gasto; no se crean pagos de deuda por esa sola decisión. |
| Sala cerrada | Sin administración de partes ni solicitudes; permite incorporar movimientos propios pendientes. |
| Evento recibido mientras se carga | Se recupera el cambio posterior, sin conservar una respuesta anterior. |
| Demo en release, cuenta real o autorización revocada | Los servicios de simulación rechazan su uso. |

## Verificación

- APP: TypeScript de app/herramientas correcto; noUnusedLocals y
  noUnusedParameters sin diagnósticos.
- Suite completa APP: 330 casos, 297 aprobados, cero fallos, 33 integraciones
  omitidas al no disponer del MySQL aislado requerido.
- Backend: tipos correctos; suite disponible sobre la compilación existente,
  58 casos, 34 aprobados, cero fallos y 24 integraciones MySQL omitidas.
- Recorridos de interfaz con SQLite real en memoria y adaptador React Native:
  creador y participante, temas claro/oscuro, sin solicitudes HTTP en demos,
  saldos conservados antes del cierre, reintentos, decisiones y permisos.

Las pruebas del adaptador no validan el layout nativo, cámara, teclado ni enlaces
entre dispositivos. Queda la revisión visual en Expo Go y la integración real
con MySQL/HTTP/WebSocket. No se modificó ni desplegó SERVER-AHRE, ni se generó APK.
