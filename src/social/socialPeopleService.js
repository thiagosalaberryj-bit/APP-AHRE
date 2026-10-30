import { personasRepositorio } from '../database/repositories';
import { conSocial, registroPropio } from './socialStore';
import { exigir, validarPersona } from './socialValidation';

export function guardarPersona(datos, id = null) {
  return conSocial(async contexto => {
    const valores = validarPersona(datos);
    const personas = await personasRepositorio.consultar({ usuario_id: contexto.usuario.id }, {}, contexto.conexion);
    const duplicada = personas.find(p => p.id !== id && !p.es_usuario_actual &&
      (p.apodo_normalizado === valores.apodo_normalizado || p.nombre_normalizado === valores.nombre_normalizado && p.apellido_normalizado === valores.apellido_normalizado));
    exigir(!duplicada, 'Ya existe una persona con ese nombre y apellido o apodo. Abrí su ficha para reutilizarla.');
    if (id) {
      const persona = await registroPropio(personasRepositorio, id, contexto);
      exigir(!persona.es_usuario_actual, 'La identidad del usuario se modifica desde Perfil.');
      return personasRepositorio.actualizar(id, valores, contexto.conexion);
    }
    return personasRepositorio.crear({ ...valores, usuario_id: contexto.usuario.id, activa: 1, es_usuario_actual: 0 }, contexto.conexion);
  });
}

export function cambiarActividadPersona(id, activa) {
  return conSocial(async contexto => {
    const persona = await registroPropio(personasRepositorio, id, contexto);
    exigir(!persona.es_usuario_actual, 'No podés desactivar tu propia identidad.');
    return personasRepositorio.actualizar(id, { activa: activa ? 1 : 0 }, contexto.conexion);
  });
}
