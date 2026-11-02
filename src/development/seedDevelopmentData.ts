import type { Deposito } from '../database/types';
import { iniciarSesion, registrarUsuario } from '../authentication/authenticationService';
import { verificarContrasena } from '../authentication/passwordSecurity';
import { autenticacionRepositorio } from '../database/repositories/authenticationRepository';
import { depositosRepositorio } from '../database/repositories/depositsRepository';
import { movimientosRepositorio } from '../database/repositories/movementsRepository';
import { ejecutarTransaccion } from '../database/transactions';
import { CUENTA_PRUEBA, DEPOSITOS_PRUEBA, MOVIMIENTOS_PRUEBA } from './developmentData';
import { prepararSocialPrueba } from './seedSocialDevelopmentData';

let preparacionEnCurso: Promise<void> | null = null;

async function prepararCuentaYDatos(incluirSocial: boolean) {
  const cuenta = await autenticacionRepositorio.consultarCredencialesPorCorreo(CUENTA_PRUEBA.correo);
  let usuario: Pick<import('../database/types').Usuario,'id'|'nombre'>;
  if (cuenta) {
    if (!cuenta.activo || !await verificarContrasena(CUENTA_PRUEBA.contrasena, cuenta.contrasena_verificador)) {
      throw new Error('La cuenta de pruebas ya existe con otros datos. Iniciá sesión manualmente.');
    }
    usuario = cuenta;
  } else {
    usuario = await registrarUsuario({
      ...CUENTA_PRUEBA,
      confirmacion: CUENTA_PRUEBA.contrasena,
    });
  }

  const ahora = Date.now();
  const diasAntes = (dias: number) => new Date(ahora - dias * 86400000).toISOString();
  const idDeposito = (clave: string) => `prueba:${usuario.id}:deposito:${clave}`;
  await ejecutarTransaccion(async (conexion) => {
    const depositos = new Map<string, Deposito>();
    for (const { clave, ...datos } of DEPOSITOS_PRUEBA) {
      const id = idDeposito(clave);
      let deposito = await depositosRepositorio.consultarPorId(id, conexion);
      if (deposito && deposito.usuario_id !== usuario.id) throw new Error('No se pudo preparar la cuenta de pruebas.');
      if (!deposito) {
        deposito = await depositosRepositorio.crear({
          ...datos, id, usuario_id: usuario.id, activo: 1,
          descripcion: 'Depósito ficticio para pruebas locales.',
          fecha_creacion: diasAntes(45),
        }, conexion);
      }
      depositos.set(clave, deposito);
    }
    for (const { clave, deposito, dias, ...datos } of MOVIMIENTOS_PRUEBA) {
      const id = `prueba:${usuario.id}:movimiento:${clave}`;
      const existente = await movimientosRepositorio.consultarPorId(id, conexion);
      // No repetir movimientos anulados ni reactivar depósitos que se quitaron.
      if (existente || !depositos.get(deposito)?.activo) continue;
      await movimientosRepositorio.crear({
        ...datos, id, deposito_id: idDeposito(deposito), fecha_hora: diasAntes(dias),
      }, conexion);
    }
    if (incluirSocial) await prepararSocialPrueba(usuario, conexion, depositos, diasAntes(1));
  });

  await iniciarSesion({ ...CUENTA_PRUEBA, recordar: false });
}

export function prepararDatosPrueba({ incluirSocial = true }: { incluirSocial?: boolean } = {}) {
  if (!__DEV__) return Promise.reject(new Error('Los datos de prueba solo están disponibles en desarrollo.'));
  if (!preparacionEnCurso) {
    preparacionEnCurso = prepararCuentaYDatos(incluirSocial).finally(() => { preparacionEnCurso = null; });
  }
  return preparacionEnCurso;
}
