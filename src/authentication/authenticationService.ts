import { autenticacionRepositorio } from '../database/repositories/authenticationRepository';
import { validarInicioSesion, validarRegistro, normalizarCorreo } from '../utils/authenticationValidation';
import { ErrorBaseDatos } from '../database/errors';
import { ErrorAutenticacion } from './errors';
import { crearVerificadorContrasena, verificarContrasena } from './passwordSecurity';
import { crearSesion } from './sessionService';
import { generarIdentificador } from '../database/identifiers';
import { ErrorRemoto, URL_SERVIDOR, autenticarRemoto, guardarSesionRemota, solicitarRemoto, type SesionRemota } from '../sync/remote';
import { sincronizarCuenta } from '../sync/syncService';

function validarDatos(errores: Record<string, string>) {
  return Object.keys(errores).length === 0;
}

function obtenerUsuarioPublico(usuario: Pick<import('../database/types').Usuario, 'id' | 'nombre' | 'correo_electronico' | 'activo'>) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    correo_electronico: usuario.correo_electronico,
    activo: usuario.activo,
  };
}

export async function registrarUsuario(datos: import('../types/forms').DatosRegistro) {
  const errores = validarRegistro(datos);
  if (!validarDatos(errores)) {
    throw new ErrorAutenticacion('datos_invalidos', errores);
  }

  try {
    if (await autenticacionRepositorio.existeCorreoRegistrado(normalizarCorreo(datos.correo))) {
      throw new ErrorAutenticacion('usuario_duplicado');
    }

    const id=generarIdentificador();
    let remota:SesionRemota|null=null;
    if(URL_SERVIDOR) {
      try { remota=await solicitarRemoto<SesionRemota>('/auth/register',{id,nombre:datos.nombre.trim(),correo:normalizarCorreo(datos.correo),contrasena:datos.contrasena}); }
      catch(error){if(!(error instanceof ErrorRemoto)||error.estado!==0)throw new ErrorAutenticacion(error instanceof ErrorRemoto&&error.estado===409?'usuario_duplicado':'operacion_no_disponible');}
    }
    const contrasenaVerificador = await crearVerificadorContrasena(datos.contrasena);
    const usuario = await autenticacionRepositorio.crearCuenta({
      id,
      nombre: datos.nombre.trim(),
      correo: normalizarCorreo(datos.correo),
      contrasenaVerificador,
    });

    if(remota)await guardarSesionRemota(usuario.id,remota,false);
    return obtenerUsuarioPublico(usuario);
  } catch (error) {
    if (error instanceof ErrorAutenticacion) throw error;
    if (error instanceof ErrorBaseDatos && error.codigo === 'usuario_duplicado') {
      throw new ErrorAutenticacion('usuario_duplicado');
    }
    throw new ErrorAutenticacion('operacion_no_disponible');
  }
}

export async function iniciarSesion({ correo, contrasena, recordar = true }: import('../types/forms').DatosIngreso) {
  const errores = validarInicioSesion({ correo, contrasena });
  if (!validarDatos(errores)) {
    throw new ErrorAutenticacion('datos_invalidos', errores);
  }

  try {
    let cuenta = await autenticacionRepositorio.consultarCredencialesPorCorreo(
      normalizarCorreo(correo),
    );
    let remota:SesionRemota|null=null;
    if(!cuenta&&URL_SERVIDOR) {
      try {
        remota=await autenticarRemoto(normalizarCorreo(correo),contrasena);
        await autenticacionRepositorio.crearCuenta({id:remota.usuario.id,nombre:remota.usuario.nombre,correo:normalizarCorreo(correo),contrasenaVerificador:await crearVerificadorContrasena(contrasena),omitirPreferencias:true});
        cuenta=await autenticacionRepositorio.consultarCredencialesPorCorreo(normalizarCorreo(correo));
      } catch {throw new ErrorAutenticacion('credenciales_invalidas');}
    }

    if(cuenta?.activo&&!(await verificarContrasena(contrasena,cuenta.contrasena_verificador))&&URL_SERVIDOR) {
      try {
        const recuperada=await autenticarRemoto(normalizarCorreo(correo),contrasena);
        if(recuperada.usuario.id===cuenta.id) {
          await autenticacionRepositorio.actualizarVerificadorContrasena(cuenta.id,await crearVerificadorContrasena(contrasena));
          cuenta=await autenticacionRepositorio.consultarCredencialesPorCorreo(normalizarCorreo(correo));remota=recuperada;
        }
      }catch{/* Una clave local anterior no permite acceder a la cuenta remota. */}
    }
    if (
      !cuenta ||
      !cuenta.activo ||
      !(await verificarContrasena(contrasena, cuenta.contrasena_verificador))
    ) {
      throw new ErrorAutenticacion('credenciales_invalidas');
    }

    if(!remota&&URL_SERVIDOR) {
      try {remota=await autenticarRemoto(normalizarCorreo(correo),contrasena,{id:cuenta.id,nombre:cuenta.nombre});}
      catch { /* El ingreso local sigue disponible; el indicador informa la sesión remota pendiente. */ }
    }
    if(remota) {
      try {await guardarSesionRemota(cuenta.id,remota,recordar);}
      catch {remota=null;}
    }
    const usuario = await crearSesion(cuenta.id, recordar);
    if(remota)await sincronizarCuenta(usuario.id);
    return obtenerUsuarioPublico(usuario);
  } catch (error) {
    if (error instanceof ErrorAutenticacion) throw error;
    throw new ErrorAutenticacion('operacion_no_disponible');
  }
}
