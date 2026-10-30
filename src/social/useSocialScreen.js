import { useContext, useState, useEffect } from 'react';
import { ContextoApariencia } from '../contexts/AppearanceContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { crearEstilosGlobales } from '../styles/globalStyles';
import crearEstilosCompartidos from '../styles/social/SharedStyles';
import crearEstilosMarco from '../styles/social/SocialScreenFrameStyles';
import { crearEstilosEgreso } from '../styles/expenseStyles';
import { RUTAS } from '../constants/routes';
import { SALAS_SIMULADAS } from './socialMockData';
import { obtenerPersona } from './socialHelpers';
export default function usePantallaSocial({
  navigation: navegacion,
  route: ruta
}) {
  const {
    tema
  } = useContext(ContextoApariencia);
  const {
    bottom: margenInferior
  } = useSafeAreaInsets();
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = {
    ...crearEstilosCompartidos(tema),
    ...crearEstilosMarco(tema, margenInferior)
  };
  const estilosMovimiento = crearEstilosEgreso(tema);
  const aspecto = {
    tema,
    estilos,
    estilosGlobales,
    estilosMovimiento
  };
  const parametros = ruta?.params || {};
  const esRegistro = ruta?.name === RUTAS.REGISTRO_SOCIAL;
  const esPersona = ruta?.name === RUTAS.PERSONA_SOCIAL;
  const esListado = ruta?.name === RUTAS.PERSONAS_SOCIAL;
  const esGasto = ruta?.name === RUTAS.GASTO_SOCIAL;
  const esListaSalas = ruta?.name === RUTAS.SALA_SOCIAL && !parametros.salaId;
  const esSala = Boolean(parametros.salaId) && !esRegistro && !esGasto;
  const esSecundaria = esRegistro || esPersona || esListado || esGasto || esSala || esListaSalas;
  const sala = SALAS_SIMULADAS.find(elemento => elemento.id === parametros.salaId);
  const persona = obtenerPersona(parametros.personaId);
  const gasto = sala?.gastos.find(elemento => elemento.id === parametros.gastoId);
  const [cargando, establecerCargando] = useState(true);
  useEffect(() => {
    const temporizador = setTimeout(() => establecerCargando(false), 350);
    return () => clearTimeout(temporizador);
  }, []);
  const irA = (destino, datos = {}) => {
    if (esSecundaria) navegacion.push(destino, datos);else navegacion.getParent()?.navigate(destino, datos);
  };
  const abrirSala = salaId => irA(RUTAS.SALA_SOCIAL, {
    salaId
  });
  const abrirPersona = personaId => irA(RUTAS.PERSONA_SOCIAL, {
    personaId
  });
  const abrirRegistro = (tipo, datos = {}) => irA(RUTAS.REGISTRO_SOCIAL, {
    tipo,
    ...datos
  });
  const acciones = {
    abrirSala,
    abrirPersona,
    abrirRegistro
  };
  const titulosRegistro = {
    crear: ['Crear sala', 'Una ocasión para compartir gastos.'],
    persona: ['Registrar persona', 'Agregá una persona a tu listado personal.'],
    deuda: ['Registrar deuda', 'Indicá quién debe y cuánto queda pendiente.'],
    gasto: [parametros.gastoId ? 'Editar gasto' : 'Agregar gasto', 'Elegí quién pagó y cómo se reparte.'],
    eliminarDeuda: ['Eliminar deuda', 'Revisá la deuda antes de confirmar.'],
    detalleDeuda: ['Detalle de deuda', 'Información y acciones de esta deuda.'],
    pago: ['Registrar pago', 'Registrá dinero entregado o recibido.'],
    cerrar: ['Cerrar sala', 'Revisá el reparto antes de finalizar la ocasión.']
  };
  const [titulo, descripcion] = esRegistro ? titulosRegistro[parametros.tipo] || ['Social', 'Registro no disponible.'] : esPersona ? ['Persona', 'Sus datos, deudas y pagos.'] : esListado ? parametros.todas ? ['Personas', 'Tu agenda personal, ordenada por nombre.'] : ['Historial de deudas', 'Consultá tus deudas pendientes y saldadas.'] : esListaSalas ? ['Salas', 'Tus ocasiones activas y cerradas.'] : esGasto ? [gasto?.descripcion || 'Gasto', 'Reparto y pagos de esta ocasión.'] : [sala?.nombre || 'Sala', 'Gastos de esta ocasión.'];
  const noDisponible = (esSala || esGasto) && !sala || esGasto && !gasto || esPersona && !persona;
  return {
    aspecto,
    navegacion,
    esSecundaria,
    esRegistro,
    parametros,
    titulo,
    descripcion,
    cargando,
    noDisponible,
    datos: {
      ...acciones,
      ...aspecto,
      parametros,
      sala,
      persona,
      gasto,
      deudaId: parametros.deudaId,
      tipo: parametros.tipo,
      abrirAltaInicial: esRegistro && parametros.tipo === 'persona',
      alAbrirGasto: gastoId => irA(RUTAS.GASTO_SOCIAL, {
        salaId: sala.id,
        gastoId
      }),
      sinDeudas: parametros.sinDeudas === true,
      alVerSalas: () => irA(RUTAS.SALA_SOCIAL),
      alVerPersonas: () => irA(RUTAS.PERSONAS_SOCIAL),
      alVerAgenda: () => irA(RUTAS.PERSONAS_SOCIAL, {
        todas: true
      })
    }
  };
}
