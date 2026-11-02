import type { AspectoSocial } from '../../social/types';
import type { Financiacion } from '../../social/types';
import { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDatosSociales } from '../../social/SocialDataContext';
import { consultarMovimientosCompatibles } from '../../social/socialService';
import { formatearMontoSocial } from '../../social/socialHelpers';
import { combinarFechaYHora } from '../../utils/movementValidation';
import SelectorDeposito from '../DepositSelector';
import SelectorFecha from '../DateSelector';
import SelectorHora from '../TimeSelector';
import BotonSocial from './SocialButton';
import OpcionesSeleccion from './SocialChoiceGroup';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';

export default function ModalMovimientoSocial({ plan, guardando, alCerrar, alConfirmar, ...aspecto }: import('../../social/types').AspectoSocial & ({plan:import('../../social/types').PlanOperaciones;guardando:boolean;alCerrar:()=>void;alConfirmar:(financiaciones:import('../../social/types').Financiaciones)=>void})) {
  const { tema, estilosGlobales, estilosMovimiento } = aspecto;
  const estilos = crearEstilosCompartidos(tema), social = useDatosSociales();
  const [indice, establecerIndice] = useState(0), [selecciones, establecerSelecciones] = useState<Record<string, Financiacion>>({});
  const [modo, establecerModo] = useState('nuevo'), [depositoId, establecerDepositoId] = useState<string | null>(null);
  const [movimientoId, establecerMovimientoId] = useState<string | null>(null), [movimientos, establecerMovimientos] = useState<Awaited<ReturnType<typeof consultarMovimientosCompatibles>>>([]);
  const [fecha, establecerFecha] = useState(() => new Date());
  const [hora, establecerHora] = useState(() => `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`);
  const [error, establecerError] = useState<string | null>(null), [cargando, establecerCargando] = useState(false);
  const operacion = plan.operaciones[indice];
  useEffect(() => {
    let vigente = true;
    establecerMovimientoId(null); establecerError(null); establecerMovimientos([]);
    if (modo !== 'existente' || !operacion) return undefined;
    establecerCargando(true);
    consultarMovimientosCompatibles(operacion.tipo, operacion.monto).then(datos => { if (vigente) establecerMovimientos(datos); })
      .catch((fallo: unknown) => { if (vigente) establecerError(fallo instanceof Error ? fallo.message : 'No se pudieron consultar los movimientos.'); }).finally(() => { if (vigente) establecerCargando(false); });
    return () => { vigente = false; };
  }, [indice, modo, operacion]);
  const cerrar = () => { if (!guardando) alCerrar(); };
  const avanzar = () => {
    const datos = operacion ? { ...selecciones, [operacion.clave]: modo === 'nuevo' ? { depositoId, fecha: combinarFechaYHora(fecha, hora) } : { movimientoId } } : selecciones;
    if (!operacion || indice === plan.operaciones.length - 1) alConfirmar(datos);
    else { establecerSelecciones(datos); establecerIndice(indice + 1); establecerModo('nuevo'); establecerMovimientoId(null); }
  };
  const valida = !operacion || (modo === 'nuevo' ? social.depositos.some((d) => d.id === depositoId) && combinarFechaYHora(fecha, hora) : movimientoId && !cargando && !error);
  return <Modal visible transparent animationType="fade" onRequestClose={cerrar}>
    <View style={estilos.fondoModal}>
      <Pressable accessibilityRole="button" accessibilityLabel="Volver al formulario" onPress={cerrar} style={estilos.cierreFondo} />
      <View accessibilityViewIsModal style={estilos.tarjetaModal}>
        <View style={estilos.filaModal}><Text style={[estilosGlobales.encabezadoSeccion, estilos.textoFlexible]}>Confirmar movimiento</Text><Pressable accessibilityRole="button" accessibilityLabel="Cerrar selección de movimiento" onPress={cerrar} style={estilos.botonCerrar}><Ionicons name="close" size={24} color={tema.textoPrincipal} /></Pressable></View>
        <ScrollView keyboardShouldPersistTaps="handled" style={estilos.desplazamientoModal} contentContainerStyle={estilos.grupo}>
          {plan.diferido ? <Text style={estilosGlobales.textoSecundario}>Se guardará esta asociación. Los movimientos nuevos afectarán el depósito recién al cerrar la sala; vincular uno existente no lo duplica.</Text> : null}
          {operacion ? <>
            <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.textoSecundario}>{indice + 1} de {plan.operaciones.length} · {operacion.descripcion}</Text>
            <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.subtitulo}>{operacion.tipo === 'egreso' ? 'Pagás' : 'Recibís'} {formatearMontoSocial(operacion.monto)}</Text>
            <OpcionesSeleccion enLinea opciones={[{ id: 'nuevo', nombre: 'Crear movimiento' }, { id: 'existente', nombre: 'Ya registrado' }]} elegida={modo} alElegir={establecerModo} {...aspecto} />
            {modo === 'nuevo' ? <>
              <SelectorDeposito depositos={social.depositos} seleccionadoId={depositoId} alSeleccionar={establecerDepositoId} {...aspecto} />
              {!social.depositos.length ? <BotonSocial texto="Crear depósito" alPresionar={() => { cerrar(); social.abrirDeposito(); }} {...aspecto} /> : null}
              <SelectorFecha etiqueta="Fecha del pago" valor={fecha} alSeleccionar={establecerFecha} tema={tema} estilosMovimiento={estilosMovimiento} />
              <SelectorHora valor={hora} alSeleccionar={establecerHora} tema={tema} estilosMovimiento={estilosMovimiento} />
            </> : <>
              {cargando ? <Text style={estilosGlobales.textoSecundario}>Buscando movimientos…</Text> : null}
              {error ? <Text accessibilityRole="alert" style={estilosGlobales.textoError}>{error}</Text> : null}
              {!cargando && !error && !movimientos.length ? <Text style={estilosGlobales.textoSecundario}>No hay movimientos disponibles con ese importe y dirección.</Text> : null}
              {movimientos.filter(m => !Object.values(selecciones).some(s => s.movimientoId === m.id)).map(m => <Pressable key={m.id} accessibilityRole="radio" accessibilityState={{ checked: m.id === movimientoId }} onPress={() => establecerMovimientoId(m.id)} style={estilos.opcionPersona}>
                <Ionicons name={m.id === movimientoId ? 'radio-button-on' : 'radio-button-off'} color={tema.foco} size={22} /><View style={estilos.textoFlexible}><Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.texto}>{m.descripcion}</Text><Text style={estilosGlobales.textoSecundario}>{m.deposito} · {new Date(m.fecha_hora).toLocaleString('es-AR')}</Text></View>
              </Pressable>)}
              <Text style={estilosGlobales.textoAyuda}>Vincularlo no vuelve a modificar tu saldo.</Text>
            </>}
          </> : null}
        </ScrollView>
        <BotonSocial texto={guardando ? 'Guardando…' : operacion && indice < plan.operaciones.length - 1 ? 'Continuar' : 'Confirmar y guardar'} deshabilitado={guardando || !valida} alPresionar={avanzar} {...aspecto} />
      </View>
    </View>
  </Modal>;
}
