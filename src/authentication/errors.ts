const MENSAJES: Readonly<Record<string, string>> = Object.freeze({
  datos_invalidos: 'Revisá los datos ingresados.',
  usuario_duplicado: 'Ya existe una cuenta con ese correo electrónico.',
  identidad_incompatible: 'El correo corresponde a otra identidad en el servidor. Conservamos las cuentas locales y sus pendientes sin vincularlas.',
  credenciales_invalidas: 'El correo electrónico o la contraseña no son correctos.',
  sesion_no_disponible: 'No se pudo acceder a la sesión local. Intentá nuevamente.',
  operacion_no_disponible: 'No se pudo completar la operación. Intentá nuevamente.',
  conexion_requerida: 'Conectate al servidor para registrar la cuenta o autorizar este dispositivo por primera vez.',
  servidor_incompatible: 'El servidor necesita actualizarse antes de autorizar dispositivos. Los datos locales se conservan.',
  dispositivo_ocupado: 'Esta cuenta está vinculada a otra instalación. Confirmá el cambio de dispositivo para continuar.',
  dispositivo_revocado: 'Este dispositivo fue desvinculado. Sus cambios pendientes se conservan localmente.',
  pendientes_otra_autorizacion: 'Hay cambios locales de una autorización anterior. Se conservaron sin reenviarlos. Esta instalación no puede vincularse automáticamente.',
  sincronizacion_pendiente: 'Conectate y sincronizá todos los pendientes antes de desvincular este dispositivo.',
});

export interface ErrorAutenticacion {
  detalles: Record<string, string> | null;
}

export class ErrorAutenticacion extends Error {

  constructor(public codigo: string, detalles: Record<string,string> | null = null) {
    super(MENSAJES[codigo] || MENSAJES.operacion_no_disponible);
    this.name = 'ErrorAutenticacion';
    this.detalles = detalles;
  }
}
