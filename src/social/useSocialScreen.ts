import { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ContextoApariencia } from '../contexts/AppearanceContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { crearEstilosGlobales } from '../styles/globalStyles';
import crearEstilosCompartidos from '../styles/social/SharedStyles';
import crearEstilosMarco from '../styles/social/SocialScreenFrameStyles';
import { crearEstilosEgreso } from '../styles/expenseStyles';
import { RUTAS } from '../constants/routes';
import { cargarSocial } from './socialService';
export default function usePantallaSocial({
  navigation: navegacion,
  route: ruta
}: import('../navigation/types').PropiedadesPantalla | import('../navigation/types').PropiedadesPestana) {
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
  const raiz = ('push' in navegacion ? navegacion : navegacion.getParent<import('../navigation/types').NavegacionRaiz>())!;
  const esRegistro = ruta?.name === RUTAS.REGISTRO_SOCIAL;
  const esPersona = ruta?.name === RUTAS.PERSONA_SOCIAL;
  const esListado = ruta?.name === RUTAS.PERSONAS_SOCIAL;
  const esGasto = ruta?.name === RUTAS.GASTO_SOCIAL;
  const esListaSalas = ruta?.name === RUTAS.SALA_SOCIAL && !parametros.salaId;
  const esSala = Boolean(parametros.salaId) && !esRegistro && !esGasto;
  const esSecundaria = esRegistro || esPersona || esListado || esGasto || esSala || esListaSalas;
  const [registros, establecerRegistros] = useState<import('./socialQueryService').DatosSocialesVisibles | null>(null);
  const [error, establecerError] = useState<string | null>(null);
  const [cargando, establecerCargando] = useState(true);
  const montado = useRef(true);
  const solicitud = useRef(0);
  useEffect(() => { montado.current = true; return () => { montado.current = false; solicitud.current++; }; }, []);
  const recargar = useCallback(async () => {
    const numero = ++solicitud.current;
    try {
      const datos = await cargarSocial();
      if (montado.current && numero === solicitud.current) { establecerRegistros(datos); establecerError(null); }
    } catch (fallo) {
      if (montado.current && numero === solicitud.current) { establecerRegistros(null); establecerError((fallo instanceof Error ? fallo.message : "") || 'No se pudo cargar Social.'); }
    } finally {
      if (montado.current && numero === solicitud.current) establecerCargando(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { recargar(); }, [recargar]));
  const social = registros ? {
    ...registros, recargar,
    personasActivas: registros.personas.filter(p => p.activa),
    obtenerPersona: (id: string | undefined) => id === 'vos' ? registros.personaActual : registros.personas.find(p => p.id === id),
    volver: () => navegacion.goBack(),
    irInicioSocial: () => raiz.popTo(RUTAS.PRINCIPAL, { screen: RUTAS.SOCIAL }),
    irAgenda: () => raiz.popTo(RUTAS.PERSONAS_SOCIAL, { todas: true }),
    abrirDeposito: () => raiz.push(RUTAS.DEPOSITO),
    abrirOcrSala: (salaId: string) => raiz.push(RUTAS.OCR, { destino: 'social', salaId }),
    alCrearSala: (salaCreada: {id:string}) => raiz.replace(RUTAS.SALA_SOCIAL, { salaId: salaCreada.id }),
  } : null;
  const sala = registros?.salas.find(elemento => elemento.id === parametros.salaId);
  const persona = social?.obtenerPersona(parametros.personaId);
  const gasto = sala?.gastos.find(elemento => elemento.id === parametros.gastoId);
  const irA = (destino: import('../navigation/types').NombreRuta, datos: import('../navigation/types').ParametrosPantalla = {}) => {
    if (esSecundaria) raiz.push(destino, datos);else navegacion.getParent()?.navigate(destino, datos);
  };
  const abrirSala = (salaId: string) => irA(RUTAS.SALA_SOCIAL, {
    salaId
  });
  const abrirPersona = (personaId: string) => irA(RUTAS.PERSONA_SOCIAL, {
    personaId
  });
  const abrirRegistro = (tipo: string, datos: import('./types').ParametrosSociales = {}) => irA(RUTAS.REGISTRO_SOCIAL, {
    tipo,
    ...datos
  });
  const acciones = {
    abrirSala,
    abrirPersona,
    abrirRegistro
  };
  const titulosRegistro: Record<string, string[]> = {
    crear: ['Crear sala', 'Una ocasión para compartir gastos.'],
    persona: ['Registrar persona', 'Agregá una persona a tu listado personal.'],
    deuda: ['Registrar deuda', 'Indicá quién debe y cuánto queda pendiente.'],
    gasto: [parametros.gastoId ? 'Editar gasto' : 'Agregar gasto', 'Elegí quién pagó y cómo se reparte.'],
    eliminarDeuda: ['Eliminar deuda', 'Revisá la deuda antes de confirmar.'],
    detalleDeuda: ['Detalle de deuda', 'Información y acciones de esta deuda.'],
    pago: ['Registrar pago', 'Registrá dinero entregado o recibido.'],
    cerrar: ['Cerrar sala', 'Revisá el reparto antes de finalizar la ocasión.']
  };
  const [titulo, descripcion] = esRegistro ? titulosRegistro[parametros.tipo || ""] || ['Social', 'Registro no disponible.'] : esPersona ? ['Persona', 'Sus datos, deudas y pagos.'] : esListado ? parametros.todas ? ['Personas', 'Tu agenda personal, ordenada por nombre.'] : ['Historial de deudas', 'Consultá tus deudas pendientes y saldadas.'] : esListaSalas ? ['Salas', 'Tus ocasiones activas y cerradas.'] : esGasto ? [gasto?.descripcion || 'Gasto', 'Reparto y pagos de esta ocasión.'] : [sala?.nombre || 'Sala', 'Gastos de esta ocasión.'];
  const noDisponible = Boolean(error) || !registros || (esSala || esGasto) && !sala || esGasto && !gasto || esPersona && !persona;
  return {
    aspecto,
    navegacion,
    esSecundaria,
    esRegistro,
    parametros,
    titulo,
    descripcion,
    cargando,
    social,
    error,
    recargar,
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
      alAbrirGasto: (gastoId: string) => irA(RUTAS.GASTO_SOCIAL, {
        salaId: sala!.id,
        gastoId
      }),
      alVerSalas: () => irA(RUTAS.SALA_SOCIAL),
      alVerPersonas: () => irA(RUTAS.PERSONAS_SOCIAL),
      alVerAgenda: () => irA(RUTAS.PERSONAS_SOCIAL, {
        todas: true
      })
    }
  };
}
