import {useFinalizacionAccion} from '../hooks/useActionCompletion';
import {conRespuestaVisual} from '../utils/pressFeedback';
import BotonAccion from './ActionButton';
import { RETROALIMENTACION_PULSACION } from '../styles/globalStyles';
import PuntosCarga from './LoadingDots';
import { useContext, useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ContextoApariencia } from '../contexts/AppearanceContext';
import { ContextoAvisos } from '../contexts/ToastContext';
import { crearEstilosPerfil } from '../styles/ProfileScreenStyles';
import { crearEstilosGlobales } from '../styles/globalStyles';
import { consultarReinicio, reiniciarDatos, type VistaReinicio } from '../development/dataResetService';
import { reinicioEnCurso } from '../development/testResetState';
import type { NavegacionRaiz } from '../navigation/types';
import { RUTAS } from '../constants/routes';
import { ErrorRemoto } from '../sync/remote';
import ModalPerfil from './ProfileModal';

const CONFIRMACION = 'BORRAR MIS DATOS';

export default function ReinicioDatosPerfil({ navegacion }: { navegacion: NavegacionRaiz }) {
  const finalizacion = useFinalizacionAccion();
  const [focoEntrada, cambiarFocoEntrada] = useState<'contrasena' | 'frase' | null>(null);
  const { tema } = useContext(ContextoApariencia), { mostrarAviso } = useContext(ContextoAvisos);
  const estilos = crearEstilosPerfil(tema), globales = crearEstilosGlobales(tema);
  const [visible, cambiarVisible] = useState(false), [ocupado, cambiarOcupado] = useState(false);
  const [vista, cambiarVista] = useState<VistaReinicio | null>(null);
  const [contrasena, cambiarContrasena] = useState(''), [frase, cambiarFrase] = useState('');
  const correo = vista?.cuentas[0]?.correo;
  const bloqueo = useRef(false);
  useEffect(() => navegacion.addListener('beforeRemove', evento => { if (bloqueo.current || reinicioEnCurso()) evento.preventDefault(); }), [navegacion]);
  const cerrar = () => { if (bloqueo.current || reinicioEnCurso()) return; cambiarVisible(false); cambiarContrasena(''); };
  const abrir = async () => {
    if (bloqueo.current) return;
    bloqueo.current = true; cambiarOcupado(true); cambiarVisible(true); cambiarVista(null); cambiarFrase(''); cambiarContrasena('');
    try { cambiarVista(await consultarReinicio()); }
    catch (error) { mostrarAviso(error instanceof Error ? error.message : 'No se pudo consultar el reinicio.', { tipo: 'error' }); cambiarVisible(false); }
    finally { bloqueo.current = false; cambiarOcupado(false); }
  };
  const confirmar = async () => {
    if (!vista || bloqueo.current || !correo || !contrasena || frase !== CONFIRMACION) return;
    bloqueo.current = true; finalizacion.iniciar();cambiarOcupado(true);
    try {
      await reiniciarDatos(vista, correo, contrasena, frase);
      if(!await finalizacion.confirmar())return;
      bloqueo.current = false; cambiarOcupado(false); cambiarVisible(false); cambiarContrasena('');
      navegacion.reset({ index: 0, routes: [{ name: RUTAS.INICIO_SESION }] });
      mostrarAviso('Datos locales y del servidor eliminados. Tu cuenta se conserva.', { tipo: 'exito' });
    } catch (error) {
      mostrarAviso(error instanceof Error ? error.message : 'No se pudo reiniciar.', { tipo: 'error', duracion: 9000 });
      cambiarContrasena('');
      if (error instanceof ErrorRemoto && error.codigo === 'reinicio_alcance_cambio') {
        cambiarVista(null);
        cambiarFrase('');
        try { cambiarVista(await consultarReinicio()); }
        catch { cambiarVisible(false); }
      }
      // Una confirmación perdida mantiene bloqueada la app hasta recuperar el
      // recibo al abrirla de nuevo: no se admiten escrituras sobre datos dudosos.
      bloqueo.current = reinicioEnCurso(); cambiarOcupado(reinicioEnCurso());
    }
  };
  return <>
    <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" onPress={conRespuestaVisual(abrir)} style={estilos.filaOpcion}>
      <View style={estilos.iconoSelector}><Ionicons color={tema.error} name="trash-outline" size={21} /></View>
      <View style={estilos.contenidoOpcionAvanzada}>
        <Text style={[estilos.textoFilaSelector, { color: tema.error }]}>Eliminar mis datos</Text>
        <Text style={estilos.descripcionAvanzada}>Conservás tu correo y contraseña</Text>
      </View>
      <Ionicons color={tema.textoSecundario} name="chevron-forward" size={20} />
    </Pressable>
    <ModalPerfil visible={visible} desplazable alCerrar={cerrar} estilos={estilos} tema={tema} icono="trash-outline" colorIcono={tema.error}
      titulo="Eliminar mis datos" descripcion="Eliminación permanente en este teléfono y en el servidor." etiquetaCerrar="Cerrar eliminación de datos">
      {vista ? <>
        <Text style={estilos.descripcionFormularioModal}>Se borrarán tus depósitos, movimientos, deudas personales, preferencias y conexiones de AHRE. Conservás tu cuenta, correo y contraseña.</Text>
        <Text style={globales.etiqueta}>Vista previa del servidor</Text>
        <Text style={estilos.descripcionFormularioModal}>Depósitos {vista.cantidades.depositos || 0} · Movimientos {vista.cantidades.movimientos || 0} · Deudas personales {vista.cantidades.deudas || 0}</Text>
        <Text style={estilos.descripcionFormularioModal}>Se cortarán tus vínculos online. Las otras personas conservarán sus fichas, deudas compartidas y saldos. Al finalizar se descartarán tus cambios locales pendientes y se cerrará tu sesión.</Text>
        <Text style={globales.etiqueta}>Cuenta</Text>
        <Text style={estilos.descripcionFormularioModal}>{correo}</Text>
        <Text style={globales.etiqueta}>Contraseña actual</Text>
        <TextInput onFocus={()=>cambiarFocoEntrada('contrasena')} onBlur={()=>cambiarFocoEntrada(null)} accessibilityLabel="Contraseña para reiniciar" editable={!ocupado} secureTextEntry autoCapitalize="none" value={contrasena} onChangeText={cambiarContrasena} style={[globales.campo,focoEntrada==='contrasena'&&globales.campoEnfocado]} />
        <Text style={globales.etiqueta}>Escribí BORRAR MIS DATOS</Text>
        <TextInput onFocus={()=>cambiarFocoEntrada('frase')} onBlur={()=>cambiarFocoEntrada(null)} accessibilityLabel="Frase de confirmación de borrado" editable={!ocupado} autoCapitalize="characters" value={frase} onChangeText={cambiarFrase} style={[globales.campo,focoEntrada==='frase'&&globales.campoEnfocado]} />
        <BotonAccion tema={tema} texto="Eliminar mis datos" variante="peligro" cargando={ocupado} completado={finalizacion.completado} deshabilitado={ocupado || !correo || !contrasena || frase !== CONFIRMACION} alPresionar={confirmar} estilo={[globales.botonPrincipal,{ backgroundColor: tema.botonPeligro }]} />
      </> : null}
      {ocupado ? <View accessibilityLiveRegion="polite"><PuntosCarga color={tema.foco} /><Text style={estilos.descripcionFormularioModal}>{vista ? 'Reiniciando. Si hay una interrupción, reabrí AHRE con conexión para recuperar el resultado.' : 'Consultando el alcance…'}</Text></View> : null}
    </ModalPerfil>
  </>;
}
