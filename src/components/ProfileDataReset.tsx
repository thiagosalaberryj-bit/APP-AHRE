import { useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ContextoApariencia } from '../contexts/AppearanceContext';
import { ContextoAvisos } from '../contexts/ToastContext';
import { crearEstilosPerfil } from '../styles/ProfileScreenStyles';
import { crearEstilosGlobales } from '../styles/globalStyles';
import { consultarReinicio, reiniciarDatos, type VistaReinicio } from '../development/dataResetService';
import { reinicioEnCurso } from '../development/testResetState';
import type { NavegacionRaiz } from '../navigation/types';
import { RUTAS } from '../constants/routes';
import ModalPerfil from './ProfileModal';

// Temporal y aislado para poder retirar la herramienta antes de la versión final.
export default function ReinicioDatosPerfil({ navegacion }: { navegacion: NavegacionRaiz }) {
  const { tema } = useContext(ContextoApariencia), { mostrarAviso } = useContext(ContextoAvisos);
  const estilos = crearEstilosPerfil(tema), globales = crearEstilosGlobales(tema);
  const [visible, cambiarVisible] = useState(false), [ocupado, cambiarOcupado] = useState(false);
  const [vista, cambiarVista] = useState<VistaReinicio | null>(null);
  const [correo, cambiarCorreo] = useState(''), [contrasena, cambiarContrasena] = useState(''), [frase, cambiarFrase] = useState('');
  const bloqueo = useRef(false);
  useEffect(() => navegacion.addListener('beforeRemove', evento => { if (bloqueo.current || reinicioEnCurso()) evento.preventDefault(); }), [navegacion]);
  const cerrar = () => { if (bloqueo.current || reinicioEnCurso()) return; cambiarVisible(false); cambiarContrasena(''); };
  const abrir = async () => {
    if (bloqueo.current) return;
    bloqueo.current = true; cambiarOcupado(true); cambiarVisible(true); cambiarVista(null); cambiarCorreo(''); cambiarFrase(''); cambiarContrasena('');
    try { cambiarVista(await consultarReinicio()); }
    catch (error) { mostrarAviso(error instanceof Error ? error.message : 'No se pudo consultar el reinicio.', { tipo: 'error' }); cambiarVisible(false); }
    finally { bloqueo.current = false; cambiarOcupado(false); }
  };
  const confirmar = async () => {
    if (!vista || bloqueo.current || !correo || !contrasena || frase !== 'BORRAR MIS DATOS') return;
    bloqueo.current = true; cambiarOcupado(true);
    try {
      await reiniciarDatos(vista, correo.trim(), contrasena, frase);
      bloqueo.current = false; cambiarOcupado(false); cambiarVisible(false); cambiarContrasena('');
      navegacion.reset({ index: 0, routes: [{ name: RUTAS.INICIO_SESION }] });
      mostrarAviso('Datos locales y del servidor eliminados. Tu cuenta se conserva.', { tipo: 'exito' });
    } catch (error) {
      mostrarAviso(error instanceof Error ? error.message : 'No se pudo reiniciar.', { tipo: 'error', duracion: 9000 });
      cambiarContrasena('');
      // Una confirmación perdida mantiene bloqueada la app hasta recuperar el
      // recibo al abrirla de nuevo: no se admiten escrituras sobre datos dudosos.
      bloqueo.current = reinicioEnCurso(); cambiarOcupado(reinicioEnCurso());
    }
  };
  return <>
    <Pressable accessibilityRole="button" onPress={abrir} style={estilos.filaOpcion}>
      <View style={estilos.iconoSelector}><Ionicons color={tema.error} name="trash-outline" size={21} /></View>
      <View style={estilos.contenidoOpcionAvanzada}>
        <Text style={[estilos.textoFilaSelector, { color: tema.error }]}>Reiniciar mis datos</Text>
        <Text style={estilos.descripcionAvanzada}>Herramienta temporal · conserva tu cuenta</Text>
      </View>
    </Pressable>
    <ModalPerfil visible={visible} desplazable alCerrar={cerrar} estilos={estilos} tema={tema} icono="trash-outline" colorIcono={tema.error}
      titulo="Reiniciar mis datos" descripcion="Eliminación permanente en este teléfono y en el servidor." etiquetaCerrar="Cerrar reinicio de datos">
      {vista ? <>
        <Text style={estilos.descripcionFormularioModal}>Se borrarán tus movimientos, depósitos, recurrencias, personas, salas, deudas, pagos, avisos, preferencias e integraciones de AHRE. Se conservarán tu cuenta, correo y contraseña. No se borran operaciones externas de Mercado Pago.</Text>
        <Text style={globales.etiqueta}>Vista previa del servidor</Text>
        <Text style={estilos.descripcionFormularioModal}>{Object.values(vista.cantidades).reduce((total, cantidad) => total + cantidad, 0)} registros en total. Movimientos: {vista.cantidades.movimientos || 0}. Depósitos: {vista.cantidades.depositos || 0}. Deudas compartidas: {vista.cantidades.deudas_online || 0}. Salas compartidas a borrar: {vista.cantidades.salas_online || 0}.</Text>
        <Text style={estilos.descripcionFormularioModal}>Salas de otras personas a actualizar: {vista.salasActualizadas}. Cuentas relacionadas: {vista.cuentas.map(c => c.correo).join(', ')}. Se eliminarán los acuerdos compartidos relacionados; sus movimientos privados y otros acuerdos se conservan.</Text>
        <Text style={estilos.descripcionFormularioModal}>También se descartarán los cambios locales todavía sin sincronizar. Al finalizar cerrarás sesión y podrás ingresar con la misma cuenta.</Text>
        <Text style={globales.etiqueta}>Tu correo actual</Text>
        <TextInput accessibilityLabel="Confirmar correo para reiniciar" editable={!ocupado} autoCapitalize="none" keyboardType="email-address" value={correo} onChangeText={cambiarCorreo} style={globales.campo} />
        <Text style={globales.etiqueta}>Contraseña actual</Text>
        <TextInput accessibilityLabel="Contraseña para reiniciar" editable={!ocupado} secureTextEntry autoCapitalize="none" value={contrasena} onChangeText={cambiarContrasena} style={globales.campo} />
        <Text style={globales.etiqueta}>Escribí BORRAR MIS DATOS</Text>
        <TextInput accessibilityLabel="Frase de confirmación de borrado" editable={!ocupado} autoCapitalize="characters" value={frase} onChangeText={cambiarFrase} style={globales.campo} />
        <Pressable accessibilityRole="button" disabled={ocupado || !correo.trim() || !contrasena || frase !== 'BORRAR MIS DATOS'} onPress={confirmar}
          style={[globales.botonPrincipal, { backgroundColor: tema.error }, (ocupado || !correo.trim() || !contrasena || frase !== 'BORRAR MIS DATOS') && globales.botonDeshabilitado]}>
          <Text style={globales.textoBotonPrincipal}>Eliminar todos mis datos</Text>
        </Pressable>
      </> : null}
      {ocupado ? <View accessibilityLiveRegion="polite"><ActivityIndicator color={tema.foco} /><Text style={estilos.descripcionFormularioModal}>{vista ? 'Reiniciando. Si hay una interrupción, reabrí AHRE con conexión para recuperar el resultado.' : 'Consultando el alcance…'}</Text></View> : null}
    </ModalPerfil>
  </>;
}
