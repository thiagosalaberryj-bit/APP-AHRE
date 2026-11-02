const MENSAJES_USUARIO: Readonly<Record<string, string>> = Object.freeze({
  inicializacion: 'No se pudo preparar la base de datos local. Intentá nuevamente.',
  migracion: 'No se pudo actualizar la base de datos local. Intentá nuevamente.',
  version: 'La base local pertenece a una versión más reciente de AHRE.',
  usuario_duplicado: 'Ya existe una cuenta con ese correo electrónico.',
  consulta: 'No se pudo consultar la información local.',
  escritura: 'No se pudo guardar la información local.',
  integridad: 'La información contiene valores o relaciones no válidos.',
  transaccion: 'No se pudo completar la operación. No se guardaron los cambios.',
});

export interface ErrorBaseDatos {
  codigo: string;
}

export class ErrorBaseDatos extends Error {

  constructor(codigo: string = 'inicializacion') {
    super(MENSAJES_USUARIO[codigo] || MENSAJES_USUARIO.inicializacion);
    this.name = 'ErrorBaseDatos';
    this.codigo = codigo;
  }
}

export function manejarErrorBaseDatos(etapa: string, error: unknown) {
  if (error instanceof ErrorBaseDatos) {
    return error;
  }

  const fallo = error as {message?: unknown; code?: unknown; errcode?: unknown; extendedCode?: unknown} | null;
  const mensajeTecnico = String(fallo?.message || '').toLowerCase();
  const codigoTecnico = String(fallo?.code || '').toUpperCase();
  const codigoExtendido = Number(fallo?.errcode ?? fallo?.extendedCode);
  const esRestriccion =
    /constraint|foreign key|unique|check|not null/.test(mensajeTecnico) ||
    codigoTecnico.includes('CONSTRAINT') ||
    (Number.isInteger(codigoExtendido) && (codigoExtendido & 0xff) === 19);
  const codigo = esRestriccion ? 'integridad' : etapa;

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.error('[AHRE] Error de base de datos', {
      etapa,
      codigo,
      codigoTecnico: fallo?.code || 'desconocido',
    });
  }

  return new ErrorBaseDatos(codigo);
}

export async function ejecutarConManejoDeErrores<Resultado>(etapa: string, operacion: () => Promise<Resultado>): Promise<Resultado> {
  try {
    return await operacion();
  } catch (error) {
    throw manejarErrorBaseDatos(etapa, error);
  }
}
