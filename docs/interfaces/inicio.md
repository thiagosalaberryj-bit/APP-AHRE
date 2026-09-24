# Pantalla inicial de AHRE

## Finalidad

La pantalla inicial da la bienvenida al usuario y permite continuar manualmente
hacia Login. No comprueba sesiones ni decide todavía entre Login y Dashboard.

## Elementos visuales

- Fondo uniforme del tema activo, sin luces ni círculos decorativos (`#F4F4F4`
  en claro y `#081C19` en oscuro).
- Símbolo de AHRE desde `assets/ahre-mark.png`.
- Nombre de AHRE en dos líneas (`AH` y `RE`), centrado en la pantalla.
- Deslizador inferior que ocupa el ancho disponible, respetando márgenes
  laterales y las áreas seguras del dispositivo.
- Manija verde claro con esquinas redondeadas y un chevrón `>` centrado.
- Texto «Desliza para iniciar», centrado respecto de toda la pista.

## Comportamiento del deslizador

Al arrastrar la manija hacia la derecha, un segmento de color fijo la acompaña y
deja detrás una estela continua del mismo verde. El borde que une ambos tramos
es recto para que no se vea una separación. Al completar el recorrido, la pista
queda completamente rellena.

Si el usuario no alcanza el umbral requerido, la manija vuelve suavemente al
inicio. Al completar el recorrido, se muestra «Iniciando AHRE…» en blanco y se
abre Login. La pantalla no avanza automáticamente.

```text
Abrir AHRE → deslizar hasta el final → Iniciando AHRE… → Login
```

## Tema y áreas seguras

Inicio acompaña el modo claro u oscuro seleccionado en el dispositivo. La barra
de estado, el fondo, el contenido y el área de navegación del sistema respetan
el tema activo y las áreas seguras. No muestra la barra de pestañas de AHRE.

## Relación con el flujo futuro

En una etapa posterior se reemplazará el avance directo a Login por una
comprobación del estado del usuario:

```text
Abrir AHRE → Inicio → comprobar sesión → Login o Dashboard
```

## Funcionamiento sin conexión

La pantalla utiliza recursos locales y no consulta Internet, autenticación ni
almacenamiento local.
