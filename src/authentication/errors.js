const MENSAJES = Object.freeze({
  datos_invalidos: 'Revisá los datos ingresados.',
  usuario_duplicado: 'Ya existe una cuenta con ese correo electrónico.',
  credenciales_invalidas: 'El correo electrónico o la contraseña no son correctos.',
  sesion_no_disponible: 'No se pudo acceder a la sesión local. Intentá nuevamente.',
  operacion_no_disponible: 'No se pudo completar la operación. Intentá nuevamente.',
});

export class ErrorAutenticacion extends Error {
  constructor(codigo, detalles = null) {
    super(MENSAJES[codigo] || MENSAJES.operacion_no_disponible);
    this.name = 'ErrorAutenticacion';
    this.detalles = detalles;
  }
}
