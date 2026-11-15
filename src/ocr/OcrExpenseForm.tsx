import { useErrorNotificado } from '../hooks/useErrorNotice';
import { useRegresoProtegido } from '../navigation/useSafeGoBack';
import { useCallback, useContext, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Image, Keyboard, Pressable, Text, TextInput, View } from 'react-native';

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
    establecerCargando(true);
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
    establecerGuardando(true);
    alCambiarGuardado(true);
    Keyboard.dismiss();
    try {
      await crearMovimiento(datos, 'egreso');
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
      <Text style={estilosGlobales.textoSecundario}>Completá o corregí los datos antes de confirmar. La lectura puede tener errores.</Text>
      {resultado.comercio ? <Text selectable style={estilosGlobales.texto}>Comercio: {resultado.comercio}</Text> : null}
      <View pointerEvents={guardando ? 'none' : 'auto'} style={estilos.formularioResultado}>
        <EntradaMonto tema={tema} estilosGlobales={estilosGlobales} estilosMovimiento={estilosMovimiento}
          etiqueta="Total del comprobante" valor={String(datos.monto)} alCambiarTexto={(valor) => cambiarCampo('monto', valor)}
          alLimpiar={() => cambiarCampo('monto', '')} error={intentoGuardar ? errores.monto : null} />
        {resultado.monto == null ? <Text style={estilosGlobales.textoAyuda}>No se identificó un total único. Ingresá el monto que figura en el comprobante.</Text> : null}
        <View style={estilosMovimiento.grupo}>
          <View style={estilos.filaEtiqueta}>
            <Text style={estilosGlobales.etiqueta}>Descripción *</Text>
            <Text style={estilosMovimiento.contador}>{datos.descripcion.length}/500</Text>
          </View>
          <TextInput accessibilityLabel="Descripción del egreso reconocido" multiline editable={!guardando}
            onChangeText={(valor) => cambiarCampo('descripcion', valor)}
            placeholder="Comercio y productos del comprobante" placeholderTextColor={tema.textoSecundario}
            style={[estilosGlobales.campo, estilosGlobales.texto, estilos.descripcionResultado,
              intentoGuardar && errores.descripcion ? estilosGlobales.campoError : null]}
            textAlignVertical="top" value={datos.descripcion} />
          {intentoGuardar && errores.descripcion ? <Text style={estilosGlobales.textoError}>{errores.descripcion}</Text> : null}
          <Text style={estilosGlobales.textoAyuda}>
            {datos.descripcion.length > 500 ? 'Resumí la descripción a 500 caracteres para guardar; el texto reconocido sigue disponible abajo.'
              : 'Conservamos el comercio y el detalle detectado. Podés agregar los productos que falten.'}
          </Text>
        </View>
        {cargando ? <ActivityIndicator color={tema.foco} accessibilityLabel="Cargando depósitos y categorías" /> : null}
        {errorCarga ? (
          <View style={estilos.tarjetaInformacion}>

            <Pressable accessibilityRole="button" onPress={() => cargarDatos()} style={estilos.botonGaleria}>
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
        {!resultado.fecha ? <Text style={estilosGlobales.textoAyuda}>No se detectó una fecha única; se propone hoy. Revisala antes de guardar.</Text> : null}
        {!resultado.hora ? <Text style={estilosGlobales.textoAyuda}>No se detectó la hora; se propone la actual.</Text> : null}
        {intentoGuardar && errores.fecha_hora ? <Text style={estilosGlobales.textoError}>{errores.fecha_hora}</Text> : null}
        <Text style={estilosGlobales.textoAyuda}>Los egresos anteriores a la creación del depósito quedan en el historial sin cambiar su saldo actual.</Text>
      </View>
      <Image accessibilityLabel="Foto temporal del comprobante" resizeMode="contain" source={{ uri: imagen!.uri }} style={estilos.imagenComprobante} />
      <Text style={estilosGlobales.textoAyuda}>La foto se usa para revisar y no se guarda junto al egreso.</Text>
      <View style={estilos.desplegableTexto}>
        <Pressable accessibilityRole="button" accessibilityLabel="Texto reconocido" accessibilityState={{expanded:mostrarTexto,disabled:guardando}} onPress={()=>establecerMostrarTexto(!mostrarTexto)} disabled={guardando} style={estilos.encabezadoTexto}>
          <Ionicons name="document-text-outline" size={22} color={tema.textoSecundario}/>
          <Text style={[estilosGlobales.etiqueta,{flex:1}]}>Texto reconocido</Text>
          <Ionicons name={mostrarTexto?'chevron-up':'chevron-down'} size={20} color={tema.textoSecundario}/>
        </Pressable>
        {mostrarTexto?<Text selectable style={[estilosGlobales.texto,estilos.contenidoTexto]}>{resultado.texto}</Text>:null}
      </View>
      <BotonPrincipal estilosGlobales={estilosGlobales} estilosAutenticacion={estilosMovimiento} titulo="Confirmar egreso"
        cargando={guardando} deshabilitado={cargando || Boolean(errorCarga) || !depositos.length} alPresionar={guardarEgreso} />
      <Pressable accessibilityRole="button" disabled={guardando} onPress={alVolverAEscanear} style={estilos.accionReescanear}>
        <Ionicons name="camera-reverse-outline" size={21} color={tema.foco}/>
        <Text style={estilos.textoReescanear}>Escanear otro comprobante</Text>
      </Pressable>
    </>
  );
}
