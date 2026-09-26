export const COLORES_MARCA = Object.freeze({
  verdeOscuro: '#024C42',
  verdeMedio: '#296860',
  verdeClaro: '#CCEB6C',
});

export const COLORES_NEUTROS = Object.freeze({
  fondoClaro: '#F4F4F4',
  superficie: '#FFFFFF',
  textoPrincipal: '#111111',
  textoSecundario: '#686868',
  borde: '#D6D6D6',
  bordeFuerte: '#1A1A1A',
  deshabilitado: '#B7B7B7',
  fondoDeshabilitado: '#E5E5E5',
});

export const COLORES_ESTADO = Object.freeze({
  ingreso: '#A8D5B2',
  egreso: '#E7B0B0',
  exito: '#2E7D32',
  error: '#C62828',
  advertencia: '#F9A825',
  informacion: '#1976D2',
  enfoque: COLORES_MARCA.verdeMedio,
});

export const COLOR_DEPOSITO_PREDETERMINADO = '#C3D1E3';

export const COLORES_DEPOSITOS = Object.freeze([
  '#BED5C8',
  COLOR_DEPOSITO_PREDETERMINADO,
  '#CEC0E1',
  '#EDB8BC',
  '#F6DB9F',
]);

export const COLORES_GRAFICOS = Object.freeze([
  '#F5B3B2',
  '#FBCD9E',
  '#FDE7AF',
  '#D4EFBF',
  '#8EB38F',
  '#89BCF4',
  '#B7ACF6',
  '#E9AAEF',
]);

export const TEMAS = Object.freeze({
  claro: Object.freeze({
    nombre: 'claro',
    fondo: COLORES_NEUTROS.fondoClaro,
    superficie: COLORES_NEUTROS.superficie,
    textoPrincipal: COLORES_NEUTROS.textoPrincipal,
    textoSecundario: COLORES_NEUTROS.textoSecundario,
    borde: COLORES_NEUTROS.borde,
    bordeFuerte: COLORES_NEUTROS.bordeFuerte,
    deshabilitado: COLORES_NEUTROS.deshabilitado,
    fondoDeshabilitado: COLORES_NEUTROS.fondoDeshabilitado,
    foco: COLORES_MARCA.verdeMedio,
    exito: COLORES_ESTADO.exito,
    error: COLORES_ESTADO.error,
    errorFondo: '#FDECEA',
    encabezado: COLORES_MARCA.verdeOscuro,
    encabezadoTexto: COLORES_NEUTROS.superficie,
    contenedorVerde: COLORES_MARCA.verdeMedio,
    contenedorVerdeTexto: COLORES_NEUTROS.superficie,
    botonPrincipal: COLORES_MARCA.verdeClaro,
    botonPrincipalTexto: COLORES_MARCA.verdeOscuro,
    botonSecundario: COLORES_MARCA.verdeMedio,
    botonSecundarioTexto: COLORES_MARCA.verdeClaro,
  }),
  oscuro: Object.freeze({
    nombre: 'oscuro',
    fondo: '#081C19',
    superficie: '#10322D',
    textoPrincipal: '#FFFFFF',
    textoSecundario: '#C5D1CF',
    borde: '#557570',
    bordeFuerte: COLORES_MARCA.verdeClaro,
    deshabilitado: '#6A7B78',
    fondoDeshabilitado: '#1F3D38',
    foco: COLORES_MARCA.verdeClaro,
    exito: '#81C784',
    error: '#FF8A80',
    errorFondo: '#4A1F1F',
    encabezado: COLORES_MARCA.verdeOscuro,
    encabezadoTexto: COLORES_NEUTROS.superficie,
    contenedorVerde: COLORES_MARCA.verdeMedio,
    contenedorVerdeTexto: COLORES_NEUTROS.superficie,
    botonPrincipal: COLORES_MARCA.verdeClaro,
    botonPrincipalTexto: COLORES_MARCA.verdeOscuro,
    botonSecundario: COLORES_MARCA.verdeMedio,
    botonSecundarioTexto: COLORES_MARCA.verdeClaro,
  }),
});
