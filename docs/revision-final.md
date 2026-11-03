# Revisión final e integración · etapa 9

Revisión local del 3 de noviembre de 2026. La etapa 8 está completa con el
alcance actualizado por el líder: README breves y coherentes, guías separadas y
sin material gráfico de procesos. Este informe prepara la revisión e integración;
no acredita una publicación en GitHub ni un despliegue.

## Cambios guardados

| Repositorio | Commit de cierre de etapas 7 y 8 | Rama |
| --- | --- | --- |
| APP-AHRE | `fd38e3a` | `codex/sincronizacion-servidor` |
| SERVER-AHRE | `2f0559c` | `codex/sincronizacion-servidor` |

Incluyen la limpieza autorizada de código, imports, CSS y paquetes sin uso,
además de la documentación. Los resguardos anteriores de etapas 1 a 6 son
`dadf614` y `b142f7e`, respectivamente. No se reinstalaron ni actualizaron
dependencias durante esta revisión final.

## Validaciones ejecutadas

| Comprobación | Resultado |
| --- | --- |
| `npm run typecheck` en APP-AHRE | Aprobada, incluidos herramientas y tests. |
| TypeScript de la app con `--noUnusedLocals --noUnusedParameters` | Aprobado. |
| `npm ls --all --json` en APP-AHRE | Sin errores del árbol de dependencias. |
| `npm --prefix backend run typecheck` en SERVER-AHRE | Aprobada. |
| `npm --prefix backend run build` | Aprobada. |
| Suite del backend con MySQL real aislado | 45 aprobadas; 0 fallidas y 0 omitidas. |
| Suite de la app con el mismo backend de pruebas | 158 aprobadas; 0 fallidas y 0 omitidas. |
| Manifiestos y lockfiles de ambos proyectos | Coinciden versión y dependencias directas. |
| Orden y nombres de las 14 tablas de sincronización | Coinciden entre cliente y servidor. |
| Enlaces locales, anclas, imágenes y cercos Markdown de la etapa 8 | 130 enlaces válidos en 42 documentos. |
| `git diff --check origin/main...HEAD` | Sin errores en ambos repositorios. |

La integración usó MySQL Community 8.4.13 en `127.0.0.1:13307`, con usuario
limitado a bases sintéticas `ahre_test_*`. Quedaron cero bases de prueba; se
apagó el proceso y se retiraron sus directorios temporales. No se consultó ni
modificó la base productiva. Los logs completos permanecen fuera de Git en los
artefactos locales de la sesión, carpeta `stage-9`.

Se revisaron identidad y acceso offline, reparación acotada de perfil,
serialización de lecturas y escrituras, confirmación de lotes, carga selectiva
del backend y agrupaciones de Social. Las pruebas cubren regresiones de esos
cambios. La limpieza posterior al resguardo conserva el comportamiento de las
funciones; las bajas de paquetes estaban autorizadas y sin consumidores.

## Situación respecto de main

Se ejecutó `git fetch origin main` en ambos repositorios sin cambiar de rama.
En esa consulta, `origin/main` era ancestro de las dos ramas: APP-AHRE tenía
cinco commits propios y SERVER-AHRE seis. No había commits remotos de main
pendientes de incorporar. Los informes de esta etapa se agregan después de esa
comprobación, por lo que el recuento puede aumentar.

Esto permite una integración sin reconciliar historias en el estado consultado.
Repetir la consulta inmediatamente antes de integrar si main recibe cambios.
No se ejecutaron push, merge, cambios en main ni comandos contra el servidor.

## Límites y asuntos separados

- `src/screens/ProfileScreen.tsx` muestra «Versión 1.0.0» en Acerca de AHRE,
  mientras los manifiestos declaran 0.5.0 y código Android 3. Resolver esa
  discrepancia antes de presentar una nueva entrega pública; no altera la
  validación de sincronización.
- La auditoría npm de la etapa 7, realizada el mismo día, mantiene 14 paquetes
  afectados en el árbol Expo. No se repitió la consulta de advisories ni se
  aplicó una migración de SDK durante esta etapa. Ver [dependencias](configuracion/dependencias.md).
- Social en la app y los lotes financieros del servidor todavía cargan conjuntos
  completos. No se agrega paginación ni caché sin revisar sus contratos.
- La exportación Android/Hermes aprobada pertenece a la etapa 7. No se volvió
  a exportar: desde entonces cambiaron únicamente documentos. No se generó APK
  ni se repitieron captura OCR nativa, biometría o pruebas físicas del teléfono.
- El líder confirmó anteriormente los recorridos funcionales en Expo Go. Los
  tests de Node no sustituyen las verificaciones nativas en Android.

No se detectaron nuevos fallos bloqueantes en las comprobaciones ejecutadas.
Esta conclusión se limita al alcance anterior y no equivale a una auditoría
exhaustiva de seguridad o a garantizar todo dispositivo y volumen de datos.

## Preparación de la integración

1. Revisar los cambios de ambos repositorios y los asuntos separados anteriores.
2. Volver a comprobar main remoto y que el árbol de trabajo esté limpio.
3. Publicar las ramas cuando el líder lo indique y preparar un PR por repositorio.
   La excepción al requisito de Issue fue autorizada por el líder; no inventar
   un número ni una referencia `Closes`.
4. La persona revisora actualiza el changelog antes del merge, según el
   [proceso del repositorio](proceso/flujo-issues-prs-changelog.md). Este informe
   no modifica `docs/CHANGELOG.md` ni sustituye esa revisión.
5. Tras la aprobación, integrar y seguir las guías de despliegue del servidor y
   [publicación Android](configuracion/publicacion.md) según el cambio a entregar.

La revisión técnica local de la etapa 9 queda realizada. La publicación, la
revisión del PR, el changelog y el merge siguen pendientes.
