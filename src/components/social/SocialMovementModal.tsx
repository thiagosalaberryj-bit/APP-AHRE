import {operacionFinancieraEnCurso} from '../../social/financialOperation';
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
import SelectorSegmentado from '../SegmentedSelector';
import crearEstilosConfirmacion from '../../styles/social/SocialMovementModalStyles';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';

export default function ModalMovimientoSocial({ plan, guardando, alCerrar, alConfirmar, ...aspecto }: import('../../social/types').AspectoSocial & ({plan:import('../../social/types').PlanOperaciones;guardando:boolean;alCerrar:()=>void;alConfirmar:(financiaciones:import('../../social/types').Financiaciones)=>void})) {
  const { tema, estilosGlobales, estilosMovimiento } = aspecto;
  const estilos = { ...crearEstilosCompartidos(tema), ...crearEstilosConfirmacion(tema) }, social = useDatosSociales();
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
  const cerrar = () => { if (!guardando&&!operacionFinancieraEnCurso()) alCerrar(); };
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
        <View style={estilos.filaModal}><View style={estilos.textoFlexible}><Text accessibilityRole="header" style={estilos.tituloConfirmacion}>Confirmar movimiento</Text><Text style={estilos.ayudaConfirmacion}>{plan.operaciones.length > 1 ? 'Movimiento ' + (indice + 1) + ' de ' + plan.operaciones.length : 'Revisá los datos antes de guardar.'}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Cerrar selección de movimiento" onPress={cerrar} style={estilos.botonCerrar}><Ionicons name="close" size={24} color={tema.textoPrincipal} /></Pressable></View>
        <ScrollView keyboardShouldPersistTaps="handled" style={estilos.desplazamientoModal} contentContainerStyle={estilos.contenidoConfirmacion}>
          {plan.diferido ? <Text style={estilosGlobales.textoSecundario}>Se aplicará al cerrar la sala. Un movimiento ya registrado se vincula sin duplicarlo.</Text> : null}
          {operacion ? <>
            <View style={estilos.resumenOperacion}>
              <View style={[estilos.iconoOperacion, { backgroundColor: (operacion.tipo === 'egreso' ? tema.error : tema.exito) + '18' }]}>
                <Ionicons color={operacion.tipo === 'egreso' ? tema.error : tema.exito} name={operacion.tipo === 'egreso' ? 'arrow-up-outline' : 'arrow-down-outline'} size={22} />
              </View>
              <View style={estilos.textoFlexible}><Text style={estilos.ayudaConfirmacion}>{operacion.tipo === 'egreso' ? 'Pagás' : 'Recibís'}</Text><Text numberOfLines={2} style={estilos.descripcionOperacion}>{operacion.descripcion}</Text></View>
              <Text numberOfLines={1} adjustsFontSizeToFit style={[estilos.importeOperacion, { color: operacion.tipo === 'egreso' ? tema.error : tema.exito }]}>{formatearMontoSocial(operacion.monto)}</Text>
            </View>
            <SelectorSegmentado tema={tema} opciones={[{ id: 'nuevo', nombre: 'Crear movimiento' }, { id: 'existente', nombre: 'Ya registrado' }]} valor={modo} alSeleccionar={establecerModo} etiqueta="Origen del movimiento" />
            {modo === 'nuevo' ? <>
              <SelectorDeposito depositos={social.depositos} seleccionadoId={depositoId} alSeleccionar={establecerDepositoId} {...aspecto} />
              {!social.depositos.length ? <BotonSocial texto="Crear depósito" alPresionar={() => { cerrar(); social.abrirDeposito(); }} {...aspecto} /> : null}
              <View style={estilos.fechaHora}><View style={estilos.columnaFecha}>
              <SelectorFecha etiqueta="Fecha del pago" valor={fecha} alSeleccionar={establecerFecha} tema={tema} estilosMovimiento={estilosMovimiento} />
              </View><View style={estilos.columnaFecha}>
              <SelectorHora valor={hora} alSeleccionar={establecerHora} tema={tema} estilosMovimiento={estilosMovimiento} />
              </View></View>
            </> : <>
              {cargando ? <Text style={estilosGlobales.textoSecundario}>Buscando movimientos…</Text> : null}
              {error ? <Text accessibilityRole="alert" style={estilosGlobales.textoError}>{error}</Text> : null}
              {!cargando && !error && !movimientos.length ? <Text style={estilosGlobales.textoSecundario}>No hay movimientos disponibles con ese importe y dirección.</Text> : null}
              {movimientos.filter(m => !Object.values(selecciones).some(s => s.movimientoId === m.id)).map(m => <Pressable key={m.id} accessibilityRole="radio" accessibilityState={{ checked: m.id === movimientoId }} onPress={() => establecerMovimientoId(m.id)} style={[estilos.movimientoDisponible, m.id === movimientoId && estilos.movimientoSeleccionado]}>
                <Ionicons name={m.id === movimientoId ? 'radio-button-on' : 'radio-button-off'} color={tema.foco} size={22} /><View style={estilos.textoFlexible}><Text numberOfLines={1} ellipsizeMode="tail" style={estilos.descripcionOperacion}>{m.descripcion}</Text><Text style={estilos.ayudaConfirmacion}>{m.deposito} · {new Date(m.fecha_hora).toLocaleString('es-AR')}</Text></View>
              </Pressable>)}
              <Text style={estilosGlobales.textoAyuda}>Vincularlo no vuelve a modificar tu saldo.</Text>
            </>}
          </> : null}
        </ScrollView>
        <View style={estilos.pieConfirmacion}>
          <Pressable accessibilityRole="button" accessibilityLabel={guardando ? 'Guardando…' : operacion && indice < plan.operaciones.length - 1 ? 'Continuar' : 'Confirmar y guardar'} disabled={guardando || !valida} onPress={avanzar} style={[estilos.confirmarMovimiento, (guardando || !valida) && estilos.confirmacionDeshabilitada]}>
            <Text style={estilos.textoConfirmarMovimiento}>{guardando ? 'Guardando…' : operacion && indice < plan.operaciones.length - 1 ? 'Continuar' : 'Confirmar y guardar'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>;
}
