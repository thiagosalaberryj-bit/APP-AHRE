# Instrucciones para agentes de AHRE

Estas reglas aplican a Codex, OpenCode y cualquier otro agente que trabaje en
este repositorio. Se aplican junto con las instrucciones del usuario y del
Issue activo; si falta información para delimitar el trabajo, pregunta antes de
implementar.

## Al comenzar una tarea

- Lee este archivo al comenzar cada tarea o sesión en el repositorio. Busca y
  sigue también cualquier `AGENTS.md` aplicable en la carpeta que vayas a
  modificar y sus directorios superiores.
- Antes de empezar una implementación, pide el número del Issue de GitHub si
  todavía no está indicado. Luego consulta ese Issue y lee su descripción y
  criterios de aceptación. No empieces a implementar hasta identificar el
  Issue y su alcance.
- Revisa `git status` y la rama actual antes de actualizar o cambiar de rama.
  Con el árbol de trabajo limpio, cambia a `main` y ejecuta
  `git pull origin main`. Después vuelve a la rama existente del Issue o crea
  una nueva desde ese `main` actualizado. Si el árbol tiene cambios sin
  guardar, no ejecutes el pull ni cambies de rama: informa al usuario y acuerda
  cómo preservarlos.
- Usa una rama del Issue con el formato definido en
  `docs/proceso/flujo-issues-prs-changelog.md`:
  `feature/issue-<numero>-<nombre-corto-en-minusculas-y-sin-acentos>`. Si la rama del Issue
  ya existe localmente o en `origin`, compruébala y continúa en ella. Si no
  existe, créala desde `main` actualizado. No crees una segunda rama para el
  mismo Issue.
- Antes de implementar, lee `README.md` y todos los documentos Markdown bajo
  `docs/`, incluidas sus subcarpetas. No omitas documentos por parecer ajenos al
  Issue: sirven para entender el contexto y las decisiones existentes.
- Presta especial atención a `docs/arquitectura/`, `docs/interfaces/`,
  `docs/configuracion/dependencias.md` y
  `docs/proceso/flujo-issues-prs-changelog.md`.

## Alcance del trabajo

- Implementa únicamente lo que solicita el Issue y lo necesario para cumplir
  sus criterios de aceptación. No agregues funcionalidades, pantallas,
  validaciones, lógica de negocio, hooks, servicios ni persistencia que el Issue
  no pida.
- Modifica las pantallas existentes; no crees pantallas nuevas. Si el Issue
  parece requerir una pantalla nueva, detente y consulta al usuario o al líder
  del proyecto antes de crearla.
- No cambies componentes compartidos, navegación, configuración raíz o estilos
  globales si eso modifica pantallas ajenas al alcance del Issue. Si una
  modificación compartida es indispensable, explica qué pantallas afecta y
  solicita autorización antes de aplicarla.
- Conserva las convenciones documentadas de arquitectura, nombres y JavaScript.

## Estilos e interfaz

- Reutiliza primero los tokens y estilos de `src/styles/` siempre que cubran la
  necesidad visual.
- Para una presentación personalizada de una pantalla, crea o actualiza un
  archivo de estilos separado para esa pantalla. Evita cambiar los estilos
  globales para resolver una necesidad local y no dupliques valores globales.
- Mantén el soporte de los temas claro y oscuro y las decisiones de interfaz
  documentadas, salvo que el Issue indique expresamente otro comportamiento.

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
- Si el Issue requiere una dependencia nueva o un cambio de versión, detén esa
  parte y pide al líder que lo resuelva. No edites `package.json` ni archivos de
  lock para sortear esta regla.

## Changelog y Pull Requests

- El agente que implementa un Issue no debe editar `docs/CHANGELOG.md`.
- Únicamente la persona que revisa el Pull Request, después de comprobar el
  Issue y sus criterios, actualiza el changelog antes del merge según
  `docs/proceso/flujo-issues-prs-changelog.md`.
- No presentes una implementación como terminada ni amplíes su alcance para
  resolver asuntos que pertenecen a otro Issue. Si detectas trabajo adicional,
  descríbelo y solicita un Issue separado.
