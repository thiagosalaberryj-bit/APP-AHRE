# Instrucciones para agentes de AHRE

Estas reglas aplican a Codex, OpenCode y cualquier otro agente que trabaje en
este repositorio. Se aplican junto con las instrucciones del usuario y, cuando
exista, del Issue asociado. El pedido del usuario y sus aclaraciones definen el
alcance; el Issue sirve como guía y contexto. Pregunta antes de implementar solo
si falta información indispensable para avanzar con criterio.

## Al comenzar una tarea

- Lee este archivo al comenzar cada tarea o sesión en el repositorio. Busca y
  sigue también cualquier `AGENTS.md` aplicable en la carpeta que vayas a
  modificar y sus directorios superiores.
- Si el usuario todavía no indicó un Issue, pregunta una sola vez si la tarea
  está asociada a uno, para que pueda compartir su número o enlace si lo tiene.
  La consulta es informativa: no exijas un Issue ni bloquees el trabajo mientras
  esperas la respuesta si el pedido ya permite avanzar. Si no hay Issue,
  continúa con el pedido del usuario como referencia.
- Cuando se proporcione un Issue, consulta su descripción y criterios de
  aceptación y úsalos como guía junto con las aclaraciones del usuario. No
  rechaces ajustes relacionados con el objetivo por no estar escritos de forma
  explícita o completa en el Issue. Si existe una contradicción que no se pueda
  resolver con las instrucciones del usuario, consulta ese punto concreto.
- Revisa `git status` y la rama actual antes de actualizar o cambiar de rama.
  Con el árbol de trabajo limpio, cambia a `main` y ejecuta
  `git pull origin main`. Después vuelve a la rama existente de la tarea o crea
  una nueva desde ese `main` actualizado. Si el árbol tiene cambios sin
  guardar, no ejecutes el pull ni cambies de rama: informa al usuario y acuerda
  cómo preservarlos.
- Cuando haya un Issue asociado, usa una rama con el formato definido en
  `docs/proceso/flujo-issues-prs-changelog.md`:
  `feature/issue-<numero>-<nombre-corto-en-minusculas-y-sin-acentos>`. Si la rama del Issue
  ya existe localmente o en `origin`, compruébala y continúa en ella. Si no
  existe, créala desde `main` actualizado. No crees una segunda rama para el
  mismo Issue.
- Para tareas sin Issue, continúa en la rama de trabajo correspondiente si ya
  existe; si hace falta una nueva, usa `codex/<nombre-corto-descriptivo>`. No
  inventes un número ni exijas crear un Issue. Las reglas de este archivo sobre
  Issues opcionales prevalecen sobre las exigencias de Issue obligatorio de
  `docs/proceso/flujo-issues-prs-changelog.md`.
- Antes de implementar, lee `README.md` y todos los documentos Markdown bajo
  `docs/`, incluidas sus subcarpetas. No omitas documentos por parecer ajenos al
  Issue: sirven para entender el contexto y las decisiones existentes.
- Presta especial atención a `docs/arquitectura/`, `docs/interfaces/`,
  `docs/configuracion/dependencias.md` y
  `docs/proceso/flujo-issues-prs-changelog.md`.

## Alcance del trabajo

- Implementa el pedido del usuario tomando el Issue asociado, si existe, como
  guía. Resuelve detalles no especificados y realiza los ajustes necesarios
  para que el resultado cumpla el objetivo, respetando las convenciones del
  proyecto. No hace falta pedir aprobación para cada decisión razonable de
  implementación; explica las decisiones relevantes al comunicar el resultado.
- No agregues funcionalidades ajenas al objetivo. Si aparece una ampliación
  importante o una duda que cambie el comportamiento esperado, consulta al
  usuario antes de implementarla; no exijas otro Issue para aclararla.
- Modifica las pantallas existentes; no crees pantallas nuevas. Si la tarea
  parece requerir una pantalla nueva, detente y consulta al usuario o al líder
  del proyecto antes de crearla.
- No cambies componentes compartidos, navegación, configuración raíz o estilos
  globales si eso modifica pantallas ajenas al alcance del Issue. Si una
  modificación compartida es indispensable, explica qué pantallas afecta y
  solicita autorización antes de aplicarla.
- Conserva las convenciones documentadas de arquitectura, nombres y TypeScript.

## Cambios en el esquema de la base de datos

- Mientras AHRE no tenga una versión final publicada y el esquema siga en
  desarrollo, aplica los cambios estructurales al esquema o migración inicial
  (`001_initialSchema.ts`). No agregues migraciones de transición para
  convertir bases locales creadas por versiones anteriores de desarrollo.
- Durante esta etapa, los datos locales de Expo usados para desarrollo y
  pruebas se consideran descartables. Si un cambio en `001_initialSchema.ts`
  requiere una base limpia, puedes borrar los datos locales de la app o
  reinstalarla para recrear la base; no hace falta agregar una migración ni
  pedir confirmación para descartar esos datos de desarrollo.
- Conserva el mecanismo de inicialización y versionado existente. Cuando el
  esquema se estabilice para una versión publicada, las modificaciones
  posteriores deberán usar nuevas migraciones para preservar los datos de las
  personas usuarias al actualizar la aplicación.
- Esta autorización se limita a datos locales de Expo en desarrollo y pruebas;
  nunca borres datos de producción ni datos reales de personas usuarias para
  aplicar cambios al esquema.

## Estilos e interfaz

- Reutiliza primero los tokens y estilos de `src/styles/` siempre que cubran la
  necesidad visual.
- Para una presentación personalizada de una pantalla, crea o actualiza un
  archivo de estilos separado para esa pantalla. Evita cambiar los estilos
  globales para resolver una necesidad local y no dupliques valores globales.
- Mantén el soporte de los temas claro y oscuro y las decisiones de interfaz
  documentadas, salvo que el usuario o el Issue indiquen expresamente otro comportamiento.

## Nombres en el código

- Mantén en inglés los nombres de los archivos fuente y sus rutas. Al renombrar
  un archivo, actualiza todos sus imports y referencias documentales.
- Escribe en español los identificadores propios de AHRE: variables, funciones,
  constantes, nombres de componentes y propiedades internas. Usa directamente
  el nombre español elegido; no declares alias duplicados en inglés y español.
- Conserva en inglés los nombres que forman parte de APIs externas de JavaScript,
  React Native, Expo y otras librerías, incluidos hooks, propiedades y métodos
  exigidos por esas APIs.
- Mantén en español los textos que ve el usuario.

## Dependencias

- No agregues, actualices ni elimines dependencias; tampoco ejecutes comandos
  para instalarlas. Esa responsabilidad corresponde únicamente al líder del
  proyecto.
- Si la tarea requiere una dependencia nueva o un cambio de versión, detén esa
  parte y pide al líder que lo resuelva. No edites `package.json` ni archivos de
  lock para sortear esta regla.

## Changelog y Pull Requests

- El agente que implementa una tarea, con o sin Issue, no debe editar `docs/CHANGELOG.md`.
- Únicamente la persona que revisa el Pull Request, después de comprobar el
  pedido y los criterios del Issue, si existe, actualiza el changelog antes del merge según
  `docs/proceso/flujo-issues-prs-changelog.md`.
- Presenta una implementación como terminada solo después de verificar el
  pedido y los criterios aplicables del Issue, si existe. Si detectas trabajo
  independiente del objetivo actual, descríbelo y consulta si el usuario quiere
  tratarlo como otra tarea; puede asociarlo a otro Issue si corresponde.
