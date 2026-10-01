import { TIPOS_DEPOSITO } from '../constants/deposits';
import { depositosRepositorio } from '../database/repositories/depositsRepository';
import { obtenerSesionActual } from '../authentication/sessionService';
import { convertirSaldoInicial, resolverColorDeposito, validarDatosDeposito } from '../utils/depositValidation';

const MENSAJES_ERROR = Object.freeze({
  datos_invalidos: 'Revisá los campos marcados antes de crear el depósito.',
  sesion_no_disponible: 'No se encontró una sesión local activa. Iniciá sesión e intentá nuevamente.',
});

export class ErrorDeposito extends Error {
  constructor(codigo, errores = null) {
    super(MENSAJES_ERROR[codigo] || MENSAJES_ERROR.datos_invalidos);
    this.name = 'ErrorDeposito';
    this.codigo = codigo;
    this.errores = errores;
  }
}

function generarDescripcionAutomatica(nombre, tipoId) {
  const tipo = TIPOS_DEPOSITO.find((opcion) => opcion.id === tipoId);
  return `Fuente «${nombre}» · ${tipo.nombre}`;
}

export async function crearDeposito(datos) {
  const errores = validarDatosDeposito(datos);
  if (Object.keys(errores).length > 0) {
    throw new ErrorDeposito('datos_invalidos', errores);
  }

  const { usuario } = await obtenerSesionActual();
  if (!usuario) {
    throw new ErrorDeposito('sesion_no_disponible');
  }

  const nombre = datos.nombre.trim();
  const descripcionIngresada = typeof datos.descripcion === 'string'
    ? datos.descripcion.trim()
    : '';

  return depositosRepositorio.crear({
    usuario_id: usuario.id,
    nombre,
    tipo: datos.tipo,
    saldo_inicial: convertirSaldoInicial(datos.saldo_inicial),
    icono: datos.icono,
    color: resolverColorDeposito(datos.color),
    descripcion: descripcionIngresada || generarDescripcionAutomatica(nombre, datos.tipo),
    activo: 1,
  });
}
