import {autenticacionRepositorio} from '../database/repositories/authenticationRepository';
import {validarInicioSesion,validarRegistro,normalizarCorreo} from '../utils/authenticationValidation';
import {ErrorBaseDatos} from '../database/errors';
import {ErrorAutenticacion} from './errors';
import {crearVerificadorContrasena,verificarContrasena} from './passwordSecurity';
import {crearSesion,obtenerSesionActual,cerrarSesion} from './sessionService';
import {generarIdentificador} from '../database/identifiers';
import {ErrorRemoto,URL_SERVIDOR,autenticarRemoto,guardarSesionRemota,solicitarRemoto,obtenerSesionRemota,comprobarProtocolo,type SesionRemota} from '../sync/remote';
import {consultarAutorizacion,registrarAutorizacion,obtenerInstalacion,contarPendientes,marcarRevocada,esPruebaLocal,autorizacionVigenteLocal} from '../sync/deviceAuthorization';
import {sincronizarCuenta} from '../sync/syncService';
import {ejecutarConConexion,ejecutarLecturaConConexion} from '../database/connectionQueue';

const publico=(u:Pick<import('../database/types').Usuario,'id'|'nombre'|'correo_electronico'|'activo'>)=>({id:u.id,nombre:u.nombre,correo_electronico:u.correo_electronico,activo:u.activo});
const pruebaLocal=(correo:string,solicitada=false)=>typeof __DEV__!=='undefined'&&__DEV__&&(!URL_SERVIDOR||(solicitada&&normalizarCorreo(correo)==='pruebas@ahre.test'));
function traducirError(error:unknown):never{
  if(error instanceof ErrorAutenticacion)throw error;
  if(error instanceof ErrorRemoto){
    if(error.codigo==='protocolo_incompatible')throw new ErrorAutenticacion('servidor_incompatible');
    if(error.estado===0)throw new ErrorAutenticacion('conexion_requerida');
    if(error.codigo==='dispositivo_ocupado'||error.codigo==='dispositivo_revocado')throw new ErrorAutenticacion(error.codigo);
    if(error.estado===401)throw new ErrorAutenticacion('credenciales_invalidas');
    if(error.estado===409)throw new ErrorAutenticacion('usuario_duplicado');
  }
  if(error instanceof ErrorBaseDatos&&error.codigo==='usuario_duplicado')throw new ErrorAutenticacion('usuario_duplicado');
  throw new ErrorAutenticacion('operacion_no_disponible');
}
export async function registrarUsuario(datos:import('../types/forms').DatosRegistro){
  const errores=validarRegistro(datos);if(Object.keys(errores).length)throw new ErrorAutenticacion('datos_invalidos',errores);
  try{
    if(await autenticacionRepositorio.existeCorreoRegistrado(normalizarCorreo(datos.correo)))throw new ErrorAutenticacion('usuario_duplicado');
    const id=generarIdentificador();
    if(pruebaLocal(datos.correo,datos.localPruebas))await registrarAutorizacion(id,'prueba-local',0);
    else{
      if(!URL_SERVIDOR)throw new ErrorAutenticacion('conexion_requerida');
      await comprobarProtocolo();
      const remota=await solicitarRemoto<SesionRemota>('/auth/register',{id,nombre:datos.nombre.trim(),correo:normalizarCorreo(datos.correo),contrasena:datos.contrasena,dispositivoId:await obtenerInstalacion()});
      await guardarSesionRemota(id,remota,false);
    }
    const usuario=await autenticacionRepositorio.crearCuenta({id,nombre:datos.nombre.trim(),correo:normalizarCorreo(datos.correo),contrasenaVerificador:await crearVerificadorContrasena(datos.contrasena)});
    return publico(usuario);
  }catch(error){return traducirError(error);}
}
export async function iniciarSesion({correo,contrasena,recordar=true,reemplazarDispositivo=false,localPruebas=false}:import('../types/forms').DatosIngreso){
  const errores=validarInicioSesion({correo,contrasena});if(Object.keys(errores).length)throw new ErrorAutenticacion('datos_invalidos',errores);
  try{
    let cuenta=await autenticacionRepositorio.consultarCredencialesPorCorreo(normalizarCorreo(correo));
    const autorizacion=cuenta?await consultarAutorizacion(cuenta.id):null;
    if(autorizacion?.revocada&&cuenta&&await contarPendientes(cuenta.id))throw new ErrorAutenticacion('pendientes_otra_autorizacion');
    let claveLocal=!!cuenta?.activo&&await verificarContrasena(contrasena,cuenta.contrasena_verificador);
    let remota:SesionRemota|null=null;
    if(!pruebaLocal(correo,localPruebas)&&!esPruebaLocal(autorizacion,normalizarCorreo(correo))){
      try{
        remota=await autenticarRemoto(normalizarCorreo(correo),contrasena,cuenta&&!autorizacion?{id:cuenta.id,nombre:cuenta.nombre}:undefined,reemplazarDispositivo);
      }catch(error){
        if(error instanceof ErrorRemoto&&error.codigo==='dispositivo_ocupado'&&cuenta)await marcarRevocada(cuenta.id);
        // Solo una instalación autorizada previamente puede volver a entrar offline.
        if(!(error instanceof ErrorRemoto)||error.estado!==0||!cuenta||!claveLocal||!autorizacion||!await autorizacionVigenteLocal(autorizacion,cuenta.correo_electronico)||autorizacion.generacion<1||reemplazarDispositivo)throw error;
      }
    }else if(!claveLocal)throw new ErrorAutenticacion('credenciales_invalidas');
    if(remota){
      if(cuenta&&cuenta.id!==remota.usuario.id)throw new ErrorAutenticacion('identidad_incompatible');
      // El correo editable puede estar pendiente de sincronizar. La identidad es el ID remoto.
      if(!cuenta){
        cuenta=await autenticacionRepositorio.consultarCredencialesPorId(remota.usuario.id);
        if(cuenta){
          const autorizacionPorId=await consultarAutorizacion(cuenta.id);
          if(autorizacionPorId?.revocada&&await contarPendientes(cuenta.id))throw new ErrorAutenticacion('pendientes_otra_autorizacion');
          claveLocal=!!cuenta.activo&&await verificarContrasena(contrasena,cuenta.contrasena_verificador);
        }
      }
      if(cuenta&&!cuenta.activo)throw new ErrorAutenticacion('credenciales_invalidas');
      await guardarSesionRemota(remota.usuario.id,remota,recordar);
      if(!cuenta){
        await autenticacionRepositorio.crearCuenta({id:remota.usuario.id,nombre:remota.usuario.nombre,correo:normalizarCorreo(correo),contrasenaVerificador:await crearVerificadorContrasena(contrasena),omitirPreferencias:remota.revision>0});
        cuenta=await autenticacionRepositorio.consultarCredencialesPorId(remota.usuario.id);
      }else if(!claveLocal)await autenticacionRepositorio.actualizarVerificadorContrasena(cuenta.id,await crearVerificadorContrasena(contrasena));
    }
    if(!cuenta?.activo)throw new ErrorAutenticacion('credenciales_invalidas');
    const usuario=await crearSesion(cuenta.id,recordar);
    // También iniciar el seguimiento al entrar offline con autorización previa.
    await sincronizarCuenta(usuario.id);
    if(!(await obtenerSesionActual()).usuario)throw new ErrorAutenticacion('dispositivo_revocado');
    return publico(usuario);
  }catch(error){return traducirError(error);}
}
export async function prepararCambioDispositivo(){
  const {usuario}=await obtenerSesionActual();if(!usuario)throw new ErrorAutenticacion('sesion_no_disponible');
  const autorizacion=await consultarAutorizacion(usuario.id);
  if(esPruebaLocal(autorizacion,usuario.correo_electronico))throw new ErrorAutenticacion('sincronizacion_pendiente');
  await sincronizarCuenta(usuario.id);
  const remota=await obtenerSesionRemota(usuario.id);
  if(!remota||await contarPendientes(usuario.id))throw new ErrorAutenticacion('sincronizacion_pendiente');
  const revision=await ejecutarLecturaConConexion(async c=>Number((await c.getFirstAsync<{revision:number}>('SELECT revision FROM sync_state WHERE usuario_id=?',[usuario.id]))?.revision||0));
  await ejecutarConConexion(async c=>{
    if(await c.getFirstAsync('SELECT secuencia FROM sync_outbox WHERE usuario_id=? LIMIT 1',[usuario.id]))throw new ErrorAutenticacion('sincronizacion_pendiente');
    await c.runAsync('UPDATE sync_authorization SET revocada=1 WHERE usuario_id=?',[usuario.id]);
  });
  await solicitarRemoto('/auth/release',{revision},remota.token);
  await marcarRevocada(usuario.id);
  await cerrarSesion();
}
