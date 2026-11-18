import AvisoFormulario from '../components/FormNotice';
import {useFinalizacionAccion} from '../hooks/useActionCompletion';
import {conRespuestaVisual} from '../utils/pressFeedback';
import {crearEstilosGlobales} from '../styles/globalStyles';
import { RETROALIMENTACION_PULSACION } from '../styles/globalStyles';
import PuntosCarga from '../components/LoadingDots';
import { useErrorNotificado } from '../hooks/useErrorNotice';
import { useRegresoProtegido } from '../navigation/useSafeGoBack';
import { useCallback, useContext, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Image, Keyboard, Pressable, Text, TextInput, View } from 'react-native';

import SelectorCategoria from '../components/CategorySelector';
import SelectorFecha from '../components/DateSelector';
import SelectorDeposito from '../components/DepositSelector';
import EntradaMonto from '../components/MoneyInput';
import BotonPrincipal from '../components/PrimaryButton';
import SelectorHora from '../components/TimeSelector';
import { Ionicons } from '@expo/vector-icons';
import { ContextoAvisos } from '../contexts/ToastContext';
import { ErrorBaseDatos } from '../database/errors';
import { cargarDatosMovimiento, crearMovimiento, ErrorMovimiento } from '../movements/movementService';
import { validarDatosMovimiento } from '../utils/movementValidation';
import { prepararEgresoReconocido } from './ocrExpenseDraft';

export default function FormularioEgresoOcr({ resultado, imagen, navegacion, tema, estilos, estilosGlobales, estilosMovimiento, alVolverAEscanear, alCambiarGuardado }: import('../social/types').AspectoSocial & {resultado:Awaited<ReturnType<typeof import('./ocrService').reconocerComprobante>>;imagen:{uri:string;width:number;height:number;fileName?:string|null}|null;navegacion:import('../navigation/types').NavegacionRaiz;estilos:ReturnType<typeof import('../styles/OcrScreenStyles').crearEstilosOcr>;alVolverAEscanear:()=>void;alCambiarGuardado:(valor:boolean)=>void}) {
 const finalizacion=useFinalizacionAccion();

 const [focoEntrada,cambiarFocoEntrada]=useState<string|null>(null);
 const estilosEntrada=crearEstilosGlobales(tema);

  const volverProtegido = useRegresoProtegido(navegacion, () => accionEnCurso.current && !egresoGuardado.current);
  const { mostrarAviso } = useContext(ContextoAvisos);
  const [datos, establecerDatos] = useState<import('../types/forms').DatosMovimiento>(() => prepararEgresoReconocido(resultado));
  const [depositos, establecerDepositos] = useState<(import('../database/types').Deposito & {saldoTexto:string})[]>([]);
  const [categorias, establecerCategorias] = useState<import('../constants/movimientos').Categoria[]>([]);
  const [cargando, establecerCargando] = useState(true);
  const [errorCarga, establecerErrorCarga] = useErrorNotificado('');
  const [guardando, establecerGuardando] = useState(false);
  const [intentoGuardar, establecerIntentoGuardar] = useState(false);
  const [mostrarTexto, establecerMostrarTexto] = useState(false);
  const accionEnCurso = useRef(false);
  const egresoGuardado = useRef(false);
  const errores = validarDatosMovimiento(datos, 'egreso');
  const cambiarCampo = <Campo extends keyof import('../types/forms').DatosMovimiento>(campo: Campo, valor: import('../types/forms').DatosMovimiento[Campo]) => establecerDatos((actuales) => ({ ...actuales, [campo]: valor }));

  const cargarDatos = useCallback(async (vigente:()=>boolean = () => true) => {
    finalizacion.iniciar();establecerCargando(true);
    establecerErrorCarga('');
    try {
      const opciones = await cargarDatosMovimiento('egreso');
      if (!vigente()) return;
      establecerDepositos(opciones.depositos);
      establecerCategorias(opciones.categorias);
      establecerDatos((actuales) => ({
        ...actuales,
        deposito_id: opciones.depositos.some(({ id }) => id === actuales.deposito_id) ? actuales.deposito_id : null,
      }));
    } catch (error) {
      if (vigente()) establecerErrorCarga(error instanceof ErrorMovimiento || error instanceof ErrorBaseDatos
        ? error.message : 'No se pudieron cargar los depósitos y categorías. Intentá nuevamente.');
    } finally {
      if (vigente()) establecerCargando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    let vigente = true;
    cargarDatos(() => vigente);
    return () => { vigente = false; };
  }, [cargarDatos]));

  const guardarEgreso = async () => {
    if (accionEnCurso.current || egresoGuardado.current || cargando || errorCarga || !depositos.length) return;
    establecerIntentoGuardar(true);
    if (Object.keys(errores).length) {
      mostrarAviso('Revisá los campos marcados antes de guardar el egreso.', { tipo: 'error' });
      return;
    }
    accionEnCurso.current = true;
    finalizacion.iniciar();establecerGuardando(true);
    alCambiarGuardado(true);
    Keyboard.dismiss();
    try {
      await crearMovimiento(datos, 'egreso');
      if(!await finalizacion.confirmar())return;
      egresoGuardado.current = true;
      mostrarAviso('El egreso se guardó correctamente.', { tipo: 'exito' });
      volverProtegido();
    } catch (error) {
      mostrarAviso(error instanceof ErrorMovimiento || error instanceof ErrorBaseDatos
        ? error.message : 'No se pudo guardar el egreso. Intentá nuevamente.', { tipo: 'error' });
    } finally {
      accionEnCurso.current = false;
      establecerGuardando(false);
      alCambiarGuardado(false);
    }
  };

  return (
    <>
      <Text style={estilosGlobales.encabezadoSeccion}>Revisá el egreso</Text>
      <AvisoFormulario tema={tema} titulo="Antes de guardar">La lectura puede tener errores. Revisá el total, la descripción y la fecha.</AvisoFormulario>
      <View>
        <Text style={estilosGlobales.etiqueta}>Comercio sugerido</Text>
        <Text selectable style={estilosGlobales.texto}>{resultado.comercio||'No identificado'}</Text>
        <AvisoFormulario tema={tema} titulo="Cómo se eligió el comercio">Se toma la primera línea candidata entre las cinco primeras: debe contener letras y no parecer un importe, una fecha o un dato administrativo. También se evita tomar una línea seguida solo de un importe. Puede confundirse con un producto. Corregí el nombre en Descripción si hace falta.</AvisoFormulario>
      </View>
      <View pointerEvents={guardando ? 'none' : 'auto'} style={estilos.formularioResultado}>
        <EntradaMonto tema={tema} estilosGlobales={estilosGlobales} estilosMovimiento={estilosMovimiento}
          etiqueta="Total del comprobante" valor={String(datos.monto)} alCambiarTexto={(valor) => cambiarCampo('monto', valor)}
          alLimpiar={() => cambiarCampo('monto', '')} error={intentoGuardar ? errores.monto : null} />
        {resultado.monto == null ? <AvisoFormulario tema={tema} titulo="Total a completar">No se identificó un total único. Ingresá el monto que figura en el comprobante.</AvisoFormulario> : null}
        <View style={estilosMovimiento.grupo}>
          <View style={estilos.filaEtiqueta}>
            <Text style={estilosGlobales.etiqueta}>Descripción *</Text>
            <Text style={estilosMovimiento.contador}>{datos.descripcion.length}/500</Text>
          </View>
          <TextInput onFocus={()=>cambiarFocoEntrada("0")} onBlur={()=>cambiarFocoEntrada(null)} accessibilityLabel="Descripción del egreso reconocido" multiline editable={!guardando}
            onChangeText={(valor) => cambiarCampo('descripcion', valor)}
            placeholder="Comercio y productos del comprobante" placeholderTextColor={tema.textoSecundario}
            style={[[estilosGlobales.campo, estilosGlobales.texto, estilos.descripcionResultado,
              intentoGuardar && errores.descripcion ? estilosGlobales.campoError : null],estilosEntrada.campo,focoEntrada==="0"&&estilosEntrada.campoEnfocado]}
            textAlignVertical="top" value={datos.descripcion} />
          {intentoGuardar && errores.descripcion ? <Text style={estilosGlobales.textoError}>{errores.descripcion}</Text> : null}
          <AvisoFormulario tema={tema} titulo="Descripción del egreso">
            {datos.descripcion.length > 500 ? 'Resumí la descripción a 500 caracteres para guardar; el texto reconocido sigue disponible abajo.'
              : 'Conservamos el comercio y el detalle detectado. Podés agregar los productos que falten.'}
          </AvisoFormulario>
        </View>
        {cargando ? <PuntosCarga color={tema.foco} accessibilityLabel="Cargando depósitos y categorías" /> : null}
        {errorCarga ? (
          <View style={estilos.tarjetaInformacion}>

            <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" onPress={conRespuestaVisual(() => cargarDatos())} style={estilos.botonGaleria}>
              <Text style={estilos.textoBotonGaleria}>Reintentar carga</Text>
            </Pressable>
          </View>
        ) : !cargando ? (
          <>
            <SelectorCategoria tema={tema} estilosGlobales={estilosGlobales} estilosMovimiento={estilosMovimiento}
              categorias={categorias} seleccionadaId={datos.categoria} alSeleccionar={(valor) => cambiarCampo('categoria', valor)}
              error={intentoGuardar ? errores.categoria : null} />
            <SelectorDeposito tema={tema} estilosGlobales={estilosGlobales} estilosMovimiento={estilosMovimiento}
              depositos={depositos} seleccionadoId={datos.deposito_id} alSeleccionar={(valor) => cambiarCampo('deposito_id', valor)}
              error={intentoGuardar ? errores.deposito_id : null} />
          </>
        ) : null}
        <View style={estilosMovimiento.tarjetaInformacion}>
          <SelectorFecha tema={tema} estilosMovimiento={estilosMovimiento} valor={new Date(datos.fecha)} alSeleccionar={(valor) => cambiarCampo('fecha', valor)} />
          <SelectorHora tema={tema} estilosMovimiento={estilosMovimiento} valor={datos.hora} alSeleccionar={(valor) => cambiarCampo('hora', valor)} />
        </View>
        {!resultado.fecha ? <AvisoFormulario tema={tema} titulo="Fecha sugerida">No se detectó una fecha única; se propone hoy. Revisala antes de guardar.</AvisoFormulario> : null}
        {!resultado.hora ? <AvisoFormulario tema={tema} titulo="Hora sugerida">No se detectó la hora; se propone la actual.</AvisoFormulario> : null}
        {intentoGuardar && errores.fecha_hora ? <Text style={estilosGlobales.textoError}>{errores.fecha_hora}</Text> : null}
        <AvisoFormulario tema={tema} titulo="Cómo afecta al saldo">Los egresos anteriores a la creación del depósito quedan en el historial sin cambiar su saldo actual.</AvisoFormulario>
      </View>
      <Image accessibilityLabel="Foto temporal del comprobante" resizeMode="contain" source={{ uri: imagen!.uri }} style={estilos.imagenComprobante} />
      <AvisoFormulario tema={tema} titulo="Foto temporal">La foto se usa para revisar y no se guarda junto al egreso.</AvisoFormulario>
      <View style={estilos.desplegableTexto}>
        <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" accessibilityLabel="Texto reconocido" accessibilityState={{expanded:mostrarTexto,disabled:guardando}} onPress={conRespuestaVisual(()=>establecerMostrarTexto(!mostrarTexto))} disabled={guardando} style={estilos.encabezadoTexto}>
          <Ionicons name="document-text-outline" size={22} color={tema.textoSecundario}/>
          <Text style={[estilosGlobales.etiqueta,{flex:1}]}>Texto reconocido</Text>
          <Ionicons name={mostrarTexto?'chevron-up':'chevron-down'} size={20} color={tema.textoSecundario}/>
        </Pressable>
        {mostrarTexto?<Text selectable style={[estilosGlobales.texto,estilos.contenidoTexto]}>{resultado.texto}</Text>:null}
      </View>
      <BotonPrincipal completado={finalizacion.completado} estilosGlobales={estilosGlobales} estilosAutenticacion={estilosMovimiento} titulo="Confirmar egreso"
        cargando={guardando} deshabilitado={cargando || Boolean(errorCarga) || !depositos.length} alPresionar={guardarEgreso} />
      <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" disabled={guardando} onPress={conRespuestaVisual(alVolverAEscanear)} style={estilos.accionReescanear}>
        <Ionicons name="camera-reverse-outline" size={21} color={tema.foco}/>
        <Text style={estilos.textoReescanear}>Escanear otro comprobante</Text>
      </Pressable>
    </>
  );
}
