export const COLORES_MARCA = Object.freeze({
  verdeOscuro: '#024C42',
  verdeMedio: '#296860',
  verdeClaro: '#CCEB6C',
  verdeBrillante: '#D7FF00',
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
export const COLOR_ICONO_DEPOSITO = '#263238';

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

export const COLORES_GRAFICOS_OSCURO = Object.freeze([
  '#F58D8B',
  '#F8B878',
  '#F9D879',
  '#BBE991',
  '#84C889',
  '#75B2F3',
  '#A596F4',
  '#E58FEF',
]);

export function obtenerColoresGraficos(tema: { nombre: string; }) {
  return tema.nombre === 'oscuro' ? COLORES_GRAFICOS_OSCURO : COLORES_GRAFICOS;
}

export const TEMAS = Object.freeze({
  claro: Object.freeze({
    nombre: 'claro',
    fondo: COLORES_NEUTROS.fondoClaro,
    campoFondo: '#F8F8F8', campoFondoActivo: COLORES_NEUTROS.superficie, campoBorde: '#A0A0A0',
    superficie: COLORES_NEUTROS.superficie,
    navegacion: COLORES_NEUTROS.superficie,
    navegacionTexto: COLORES_NEUTROS.textoSecundario,
    navegacionBorde: COLORES_NEUTROS.borde,
    textoPrincipal: COLORES_NEUTROS.textoPrincipal,
    textoSecundario: COLORES_NEUTROS.textoSecundario,
    borde: COLORES_NEUTROS.borde,
    bordeFuerte: COLORES_NEUTROS.bordeFuerte,
    deshabilitado: '#666666',
    fondoDeshabilitado: COLORES_NEUTROS.fondoDeshabilitado,
    foco: COLORES_MARCA.verdeMedio,
    exito: COLORES_ESTADO.exito,
    error: COLORES_ESTADO.error,
    botonPeligro: '#BA3024',
    botonPeligroTexto: COLORES_NEUTROS.superficie,
    avatarFondo: COLORES_MARCA.verdeMedio + '18',
    avatarTexto: COLORES_MARCA.verdeMedio,
    errorFondo: '#FDECEA',
    encabezado: COLORES_MARCA.verdeOscuro,
    encabezadoTexto: COLORES_NEUTROS.superficie,
    superficieElevada: COLORES_MARCA.verdeMedio,
    superficieElevadaTexto: COLORES_NEUTROS.superficie,
    seleccion: COLORES_MARCA.verdeMedio,
    seleccionTexto: COLORES_MARCA.verdeClaro,
    seleccionSuave: '#EDF5E8',
    botonPrincipal: COLORES_MARCA.verdeClaro,
    botonPrincipalTexto: COLORES_MARCA.verdeOscuro,
    botonEncabezado: COLORES_MARCA.verdeMedio,
    botonSecundario: COLORES_MARCA.verdeMedio,
    botonSecundarioTexto: COLORES_MARCA.verdeClaro,
  }),
  oscuro: Object.freeze({
    nombre: 'oscuro',
    fondo: '#141A23',
    campoFondo: '#29323F', campoFondoActivo: '#343E4B', campoBorde: '#7D8B9E',
    superficie: '#202833',
    navegacion: '#1B222D',
    navegacionTexto: '#B9C3D0',
    navegacionBorde: '#536174',
    textoPrincipal: '#F1F4F8',
    textoSecundario: '#B9C3D0',
    borde: '#536174',
    bordeFuerte: '#7D8B9E',
    deshabilitado: '#A4AEBC',
    fondoDeshabilitado: '#2B3543',
    foco: COLORES_MARCA.verdeClaro,
    exito: '#81C784',
    error: '#FF8A80',
    botonPeligro: '#BA3024',
    botonPeligroTexto: COLORES_NEUTROS.superficie,
    avatarFondo: COLORES_MARCA.verdeClaro + '18',
    avatarTexto: COLORES_MARCA.verdeClaro,
    errorFondo: '#4A1F1F',
    encabezado: '#1B222D',
    encabezadoTexto: COLORES_NEUTROS.superficie,
    superficieElevada: '#303C4C',
    superficieElevadaTexto: COLORES_NEUTROS.superficie,
    seleccion: '#35475D',
    seleccionTexto: COLORES_MARCA.verdeClaro,
    seleccionSuave: '#303C4C',
    botonPrincipal: COLORES_MARCA.verdeClaro,
    botonPrincipalTexto: COLORES_MARCA.verdeOscuro,
    botonEncabezado: '#35475D',
    botonSecundario: '#35475D',
    botonSecundarioTexto: COLORES_MARCA.verdeClaro,
  }),
});

export type Tema = { readonly [Campo in keyof typeof TEMAS.claro]: string };
export type Apariencia = 'sistema' | 'claro' | 'oscuro';

export const COLORES_NOTIFICACIONES = Object.freeze({
  fondo: COLORES_MARCA.verdeOscuro,
  texto: COLORES_NEUTROS.superficie,
  botonCerrar: COLORES_NEUTROS.superficie,
  barraProgreso: COLORES_NEUTROS.superficie,
  fondoBarraProgreso: 'rgba(255, 255, 255, 0.22)',
  iconos: Object.freeze({
    error: TEMAS.oscuro.error,
    exito: COLORES_MARCA.verdeClaro,
    informacion: COLORES_GRAFICOS[5],
  }),
});
