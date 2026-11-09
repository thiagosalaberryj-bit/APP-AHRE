import {prepararVistaSocialOnline} from './seedSocialOnlinePreview';
import type { Deposito } from '../database/types';
import { iniciarSesion, registrarUsuario } from '../authentication/authenticationService';
import { verificarContrasena } from '../authentication/passwordSecurity';
import { autenticacionRepositorio } from '../database/repositories/authenticationRepository';
import { depositosRepositorio } from '../database/repositories/depositsRepository';
import { movimientosRepositorio } from '../database/repositories/movementsRepository';
import { ejecutarTransaccion } from '../database/transactions';
import { CUENTA_PRUEBA, DEPOSITOS_PRUEBA, MOVIMIENTOS_PRUEBA } from './developmentData';
import { prepararSocialPrueba } from './seedSocialDevelopmentData';
import {recurrenciasRepositorio} from '../database/repositories/recurrencesRepository';
import {registrarEjecucion} from '../recurrences/recurrenceService';
import {partesCalendario,siguienteEjecucion} from '../recurrences/recurrenceCalendar';
import {consultarAutorizacion,registrarAutorizacion} from '../sync/deviceAuthorization';

let preparacionEnCurso: Promise<void> | null = null;

async function prepararCuentaYDatos(incluirSocial: boolean,sincronizar:boolean,vistaSocialOnline:boolean) {
  const cuenta = await autenticacionRepositorio.consultarCredencialesPorCorreo(CUENTA_PRUEBA.correo);
  let usuario: Pick<import('../database/types').Usuario,'id'|'nombre'>;
  if (cuenta) {
    if (!cuenta.activo || !await verificarContrasena(CUENTA_PRUEBA.contrasena, cuenta.contrasena_verificador)) {
      throw new Error('La cuenta de pruebas ya existe con otros datos. Iniciá sesión manualmente.');
    }
    usuario = cuenta;
    if(!sincronizar){
      const autorizacion=await consultarAutorizacion(cuenta.id);
      if(autorizacion&&autorizacion.generacion>0)throw new Error('La cuenta de pruebas está vinculada al servidor. Iniciá sesión manualmente para conservar sus pendientes.');
      await registrarAutorizacion(cuenta.id,'prueba-local',0);
    }
  } else {
    usuario = await registrarUsuario({
      ...CUENTA_PRUEBA,
      confirmacion: CUENTA_PRUEBA.contrasena,
      localPruebas:!sincronizar,
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
          fecha_creacion: diasAntes(240),
        }, conexion);
      }
      depositos.set(clave, deposito);
    }
    const recurrenciaId=`prueba:${usuario.id}:recurrencia:streaming-v1`;
    if(depositos.get('billetera')?.activo&&!await recurrenciasRepositorio.consultarPorId(recurrenciaId,conexion)){
      const ultima=diasAntes(4),zona='America/Argentina/Buenos_Aires';
      const programacion={frecuencia:'mensual' as const,zona_horaria:zona,dia_ancla:partesCalendario(ultima,zona).dia};
      await recurrenciasRepositorio.crear({id:recurrenciaId,deposito_id:idDeposito('billetera'),categoria:'suscripciones',tipo:'egreso',monto:12000,descripcion:'Streaming · recurrencia de prueba',...programacion,fecha_inicio:diasAntes(124),proxima_ejecucion:siguienteEjecucion(programacion,ultima),activa:1},conexion);
    }
    for (const { clave, deposito, dias, ...datos } of MOVIMIENTOS_PRUEBA) {
      const id = `prueba:${usuario.id}:movimiento:${clave}`;
      const existente = await movimientosRepositorio.consultarPorId(id, conexion);
      // No repetir movimientos anulados ni reactivar depósitos que se quitaron.
      if (existente || !depositos.get(deposito)?.activo) continue;
      const esRecurrencia=clave.startsWith('recurrencia-v1-');
      await movimientosRepositorio.crear({
        ...datos, id, deposito_id: idDeposito(deposito), fecha_hora: diasAntes(dias),
        ...(esRecurrencia?{recurrencia_id:recurrenciaId}:{}),
      }, conexion);
      if(esRecurrencia)await registrarEjecucion(conexion,usuario.id,recurrenciaId,id,diasAntes(dias));
    }
    if (incluirSocial) await prepararSocialPrueba(usuario, conexion, depositos, diasAntes(1));
    if(incluirSocial&&vistaSocialOnline&&!sincronizar)await prepararVistaSocialOnline(usuario.id,conexion,depositos);
  });

  await iniciarSesion({ ...CUENTA_PRUEBA, recordar: false,localPruebas:!sincronizar });
}

export function prepararDatosPrueba({ incluirSocial = true,sincronizar=false,vistaSocialOnline=false }: { incluirSocial?: boolean;sincronizar?:boolean;vistaSocialOnline?:boolean } = {}) {
  if (!__DEV__) return Promise.reject(new Error('Los datos de prueba solo están disponibles en desarrollo.'));
  if (!preparacionEnCurso) {
    preparacionEnCurso = prepararCuentaYDatos(incluirSocial,sincronizar,vistaSocialOnline).finally(() => { preparacionEnCurso = null; });
  }
  return preparacionEnCurso;
}
