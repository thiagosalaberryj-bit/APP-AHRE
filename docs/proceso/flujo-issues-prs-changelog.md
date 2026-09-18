# Flujo de trabajo con Issues, Pull Requests y Changelog

Este documento define el flujo recomendado para trabajar en AHRE. Cada cambio
debe estar relacionado con un Issue y llegar a `main` mediante un Pull Request
(PR) revisado.

## 1. Crear o seleccionar un Issue

Antes de comenzar debe existir un Issue que describa el trabajo. El Issue debe
indicar:

- qué se quiere resolver o agregar;
- cuál es el alcance del trabajo;
- cuáles son los criterios de aceptación;
- cómo se va a verificar el resultado.

Una rama y un PR deben encargarse de un Issue principal. Si durante el trabajo
aparece una tarea diferente, se debe crear otro Issue en lugar de mezclar los
alcances.

## 2. Preparar el repositorio

Abrir una terminal dentro del repositorio y revisar el estado actual:

```bash
git status
git branch --show-current
```

No se debe cambiar de rama si existen cambios locales sin guardar. Primero hay
que confirmarlos, guardarlos temporalmente o resolverlos.

Si la terminal está ubicada en otra rama, volver a `main`:

```bash
git checkout main
```

Actualizar `main` antes de crear la rama del Issue:

```bash
git pull origin main
```

## 3. Crear la rama del Issue

Crear la rama utilizando este formato:

```text
feature/issue-numeroDelIssue-nombre-de-la-rama-separada-por-guiones
```

Ejemplo para el Issue `#24`:

```bash
git checkout -b feature/issue-24-estructura-base-app
```

Convenciones de las ramas:

- usar `feature/` para nuevas funcionalidades o trabajos de estructura;
- incluir siempre el número del Issue;
- escribir el nombre en minúsculas;
- separar las palabras con guiones;
- mantener el nombre corto y descriptivo.

La rama debe crearse desde el `main` actualizado. Todo el trabajo del Issue se
realiza dentro de esa rama.

## 4. Desarrollar y verificar

Durante el desarrollo:

1. realizar únicamente cambios relacionados con el Issue;
2. respetar la estructura y las convenciones del proyecto;
3. ejecutar las verificaciones indicadas en el Issue;
4. revisar los cambios antes de crear el commit.

Comandos útiles:

```bash
git status
git diff
```

## 5. Responsabilidad sobre el Changelog

La persona que implementa el Issue no debe modificar `CHANGELOG.md` dentro de
su rama de trabajo.

Cuando el PR fue revisado y el reviewer confirma que el Issue está terminado,
el reviewer es responsable de actualizar `CHANGELOG.md`. La entrada debe
agregarse antes de mergear el PR o, si el flujo del proyecto lo requiere, en un
commit posterior sobre `main`.

Los cambios se agregan en la sección `Unreleased` y deben referenciar el Issue:

```markdown
## [Unreleased]

### Added

- Se agregó la estructura base de la aplicación. (#24)
```

Categorías disponibles:

- `Added`: funcionalidades, estructuras o documentación nuevas;
- `Changed`: cambios en el comportamiento o la arquitectura existente;
- `Fixed`: correcciones de errores;
- `Removed`: funcionalidades o archivos eliminados.

El reviewer debe agregar la entrada después de verificar los cambios del PR y
los criterios de aceptación. No se deben modificar versiones anteriores salvo
para corregir un error de documentación.

## 6. Crear el commit y publicar los cambios

La persona que implementa el Issue agrega los archivos, crea un commit
descriptivo y publica la rama:

```bash
git add .
git commit -m "feat: preparar estructura base de la app"
git push -u origin feature/issue-24-estructura-base-app
```

El mensaje del commit debe describir el cambio principal. El número del Issue
ya queda identificado por la rama y por el PR.

## 7. Crear el Pull Request en GitHub

Después de publicar la rama:

1. entrar al repositorio en GitHub;
2. presionar **Compare & pull request**;
3. verificar que la rama base sea `main`;
4. verificar que la rama a comparar sea la rama del Issue;
5. escribir un título claro;
6. completar la descripción del PR;
7. solicitar una revisión.

La descripción del PR puede utilizar este formato:

```markdown
## Resumen

Qué se realizó y por qué.

## Cambios

- Cambio principal 1.
- Cambio principal 2.

## Verificación

- Comando o prueba ejecutada.
- Resultado obtenido.

Closes #24
```

La línea `Closes #24` debe usar el número real del Issue y colocarse al final
de la descripción. GitHub la utilizará para cerrar automáticamente el Issue
cuando el PR sea mergeado.

## 8. Revisión y merge

El PR debe revisarse antes de incorporarse a `main`. La revisión debe comprobar
que:

- el cambio resuelve el Issue;
- se cumplen los criterios de aceptación;
- no se agregaron archivos o cambios innecesarios;
- el proyecto continúa funcionando;
- el reviewer actualizó el changelog;
- la documentación está actualizada.

Si la revisión solicita cambios, realizarlos en la misma rama y publicar los
nuevos commits:

```bash
git add .
git commit -m "fix: aplicar observaciones de revisión"
git push
```

Una vez aprobado y mergeado el PR, se puede eliminar la rama remota desde
GitHub. La rama local también puede eliminarse después de actualizar `main`:

```bash
git checkout main
git pull origin main
git branch -d feature/issue-24-estructura-base-app
```

## Resumen rápido

```bash
git status
git branch --show-current
git checkout main
git pull origin main
git checkout -b feature/issue-123-nombre-del-cambio

# implementar y verificar el Issue

git add .
git commit -m "tipo: describir el cambio"
git push -u origin feature/issue-123-nombre-del-cambio
```

Después, en GitHub: **Compare & pull request** → base `main` → completar la
descripción → agregar `Closes #123` al final → solicitar una revisión. El
reviewer actualiza `CHANGELOG.md` después de confirmar que el Issue está
terminado.
