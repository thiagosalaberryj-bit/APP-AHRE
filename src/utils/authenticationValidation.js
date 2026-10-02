const EXPRESION_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LONGITUD_MINIMA_CONTRASENA = 8;
const LONGITUD_MAXIMA_NOMBRE = 80;

function cantidadCaracteres(texto) {
  return Array.from(texto).length;
}

export function normalizarCorreo(correo) {
  return String(correo || '').trim().toLowerCase();
}

export function validarRegistro({ nombre, correo, contrasena, confirmacion }) {
  const errores = {};
  const nombreNormalizado = String(nombre || '').trim();
  const correoNormalizado = normalizarCorreo(correo);
  const contrasenaIngresada = String(contrasena || '');
  const confirmacionIngresada = String(confirmacion || '');

  if (!nombreNormalizado) {
    errores.nombre = 'Ingresá tu nombre.';
  }
  if (!correoNormalizado) {
    errores.correo = 'Ingresá tu correo electrónico.';
  } else if (!EXPRESION_CORREO.test(correoNormalizado)) {
    errores.correo = 'Ingresá un correo electrónico válido.';
  }
  if (!contrasenaIngresada) {
    errores.contrasena = 'Ingresá una contraseña.';
  } else if (!contrasenaIngresada.trim()) {
    errores.contrasena = 'La contraseña no puede contener solo espacios.';
  } else if (cantidadCaracteres(contrasenaIngresada) < LONGITUD_MINIMA_CONTRASENA) {
    errores.contrasena = `La contraseña debe tener al menos ${LONGITUD_MINIMA_CONTRASENA} caracteres.`;
  }
  if (!confirmacionIngresada) {
    errores.confirmacion = 'Confirmá tu contraseña.';
  } else if (contrasenaIngresada !== confirmacionIngresada) {
    errores.confirmacion = 'Las contraseñas no coinciden.';
  }

  return errores;
}

export function validarInicioSesion({ correo, contrasena }) {
  const errores = {};
  const correoNormalizado = normalizarCorreo(correo);

  if (!correoNormalizado) {
    errores.correo = 'Ingresá tu correo electrónico.';
  } else if (!EXPRESION_CORREO.test(correoNormalizado)) {
    errores.correo = 'Ingresá un correo electrónico válido.';
  }
  if (!String(contrasena || '')) {
    errores.contrasena = 'Ingresá tu contraseña.';
  }

  return errores;
}

export function validarDatosPerfil({ nombre, correo }) {
  const errores = {};
  const nombreNormalizado = String(nombre || '').trim();
  const correoNormalizado = normalizarCorreo(correo);

  if (!nombreNormalizado) {
    errores.nombre = 'Ingresá tu nombre.';
  } else if (Array.from(nombreNormalizado).length > LONGITUD_MAXIMA_NOMBRE) {
    errores.nombre = `El nombre puede tener hasta ${LONGITUD_MAXIMA_NOMBRE} caracteres.`;
  }

  if (!correoNormalizado) {
    errores.correo = 'Ingresá tu correo electrónico.';
  } else if (!EXPRESION_CORREO.test(correoNormalizado)) {
    errores.correo = 'Ingresá un correo electrónico válido.';
  }

  return errores;
}
