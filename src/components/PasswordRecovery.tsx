import {useCallback, useContext, useEffect, useRef, useState, type ReactNode} from 'react';
import {BackHandler, Keyboard, Pressable, Text, TextInput, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {ContextoAvisos} from '../contexts/ToastContext';
import {autenticacionRepositorio} from '../database/repositories/authenticationRepository';
import {ErrorRemoto, solicitarRemoto} from '../sync/remote';
import {normalizarCorreo, validarContrasena, validarInicioSesion} from '../utils/authenticationValidation';
import type {Tema} from '../styles/colors';
import {crearEstilosAutenticacion} from '../styles/authStyles';
import {crearEstilosGlobales, RETROALIMENTACION_PULSACION} from '../styles/globalStyles';
import {crearEstilosRecuperacion} from '../styles/PasswordRecoveryStyles';
import {crearEstilosPerfil} from '../styles/ProfileScreenStyles';
import ContenedorAutenticacion from './AuthContainer';
import CampoAutenticacion from './AuthInput';
import CampoContrasena from './PasswordInput';
import BotonPrincipal from './PrimaryButton';
import BotonAccion from './ActionButton';
import ModalPerfil from './ProfileModal';

interface Propiedades {
  correoInicial: string;
  tema: Tema;
  fondo: ReactNode;
  vistaPrueba?: boolean;
  alCerrar: () => void;
  alCompletar: (correo: string) => void;
}

const CANTIDAD_DIGITOS = 6;
const CODIGO_PRUEBA = '123456';
const codigoVacio = () => Array<string>(CANTIDAD_DIGITOS).fill('');

export default function RecuperacionContrasena({correoInicial, tema, fondo, vistaPrueba = false, alCerrar, alCompletar}: Propiedades) {
  const {mostrarAviso} = useContext(ContextoAvisos);
  const simular = vistaPrueba && __DEV__;
  const [correo, establecerCorreo] = useState(correoInicial);
  const [digitos, establecerDigitos] = useState(codigoVacio);
  const [enfocado, establecerEnfocado] = useState<number | null>(null);
  const [nueva, establecerNueva] = useState('');
  const [confirmacion, establecerConfirmacion] = useState('');
  const [paso, establecerPaso] = useState<'correo' | 'codigo' | 'contrasena'>('correo');
  const [ocupada, establecerOcupada] = useState(false);
  const [error, establecerError] = useState('');
  const [codigoConError, establecerCodigoConError] = useState(false);
  const enCurso = useRef(false);
  const autorizacion = useRef<string | null>(null);
  const proximoEnvio = useRef(0);
  const ultimoDestino = useRef('');
  const referencias = useRef<Array<TextInput | null>>([]);
  const referenciaConfirmacion = useRef<TextInput>(null);
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilosAutenticacion = crearEstilosAutenticacion(tema);
  const estilos = crearEstilosRecuperacion(tema);
  const campos = {tema, estilosGlobales, estilosAutenticacion, deshabilitado: ocupada, editable: !simular && !ocupada};
  const destino = simular ? 'pruebas@ahre.test' : normalizarCorreo(correo);
  const codigo = digitos.join('');

  const volver = useCallback(() => {
    if (enCurso.current) return;
    Keyboard.dismiss();
    autorizacion.current = null;
    establecerEnfocado(null);
    establecerError('');
    establecerCodigoConError(false);
    if (paso === 'contrasena') {
      establecerPaso('codigo');
    } else {
      establecerNueva('');
      establecerConfirmacion('');
      establecerPaso('correo');
    }
  }, [paso]);

  useEffect(() => {
    if (paso === 'correo') return;
    const suscripcion = BackHandler.addEventListener('hardwareBackPress', () => {
      volver();
      return true;
    });
    return () => suscripcion.remove();
  }, [paso, volver]);

  function avisarErrorCodigo(mensaje: string) {
    establecerCodigoConError(true);
    mostrarAviso(mensaje, {tipo: 'error'});
  }

  async function ejecutar(accion: () => Promise<void>) {
    if (enCurso.current) return;
    enCurso.current = true;
    establecerOcupada(true);
    establecerError('');
    try {
      await accion();
    } catch (fallo) {
      if (fallo instanceof ErrorRemoto && (fallo.codigo === 'codigo_invalido' || fallo.codigo === 'autorizacion_invalida')) {
        avisarErrorCodigo(fallo.message);
      } else {
        establecerError(fallo instanceof ErrorRemoto && fallo.estado !== 0
          ? fallo.message : 'No pudimos conectar con el servicio de recuperación. Volvé a intentar.');
      }
    } finally {
      enCurso.current = false;
      establecerOcupada(false);
    }
  }

  function enviar() {
    if (simular) {
      Keyboard.dismiss();
      establecerDigitos(codigoVacio());
      establecerEnfocado(null);
      establecerError('');
      establecerCodigoConError(false);
      establecerPaso('codigo');
      return;
    }
    const invalido = validarInicioSesion({correo: destino}).correo;
    if (invalido) {
      establecerError(invalido);
      return;
    }
    if (ultimoDestino.current === destino && proximoEnvio.current > Date.now()) {
      if (paso === 'correo') {
        Keyboard.dismiss();
        establecerError('');
        establecerPaso('codigo');
        return;
      }
      establecerError('Esperá un minuto desde el último envío antes de pedir otro código.');
      return;
    }
    void ejecutar(async () => {
      await solicitarRemoto('/auth/recuperacion/solicitar', {correo: destino}, undefined, 10_000);
      autorizacion.current = null;
      ultimoDestino.current = destino;
      proximoEnvio.current = Date.now() + 60_000;
      Keyboard.dismiss();
      establecerEnfocado(null);
      establecerDigitos(codigoVacio());
      establecerCodigoConError(false);
      establecerPaso('codigo');
    });
  }

  function cambiarDigito(indice: number, texto: string) {
    const entrada = texto.replace(/\D/g, '');
    const inicio = entrada.length === CANTIDAD_DIGITOS ? 0 : indice;
    const reemplazo = entrada ? entrada.slice(0, CANTIDAD_DIGITOS - inicio).split('') : [''];
    establecerDigitos(actuales => {
      const siguientes = [...actuales];
      siguientes.splice(inicio, reemplazo.length, ...reemplazo);
      return siguientes;
    });
    establecerError('');
    establecerCodigoConError(false);
    if (entrada) referencias.current[Math.min(inicio + reemplazo.length, CANTIDAD_DIGITOS - 1)]?.focus();
  }

  function continuar() {
    if (ocupada) return;
    if (codigo.length !== CANTIDAD_DIGITOS) {
      avisarErrorCodigo('Ingresá los seis dígitos del código.');
      referencias.current[digitos.indexOf('')]?.focus();
      return;
    }
    function abrirContrasena() {
      Keyboard.dismiss();
      establecerEnfocado(null);
      establecerError('');
      establecerCodigoConError(false);
      establecerPaso('contrasena');
    }
    if (simular) {
      if (codigo === CODIGO_PRUEBA) abrirContrasena();
      else avisarErrorCodigo('El código es incorrecto. Probá con el código de ejemplo.');
      return;
    }
    Keyboard.dismiss();
    void ejecutar(async () => {
      const respuesta = await solicitarRemoto<{autorizacion: string}>('/auth/recuperacion/verificar', {correo: destino, codigo});
      if (!respuesta?.autorizacion) throw new Error('Falta la autorización de recuperación.');
      autorizacion.current = respuesta.autorizacion;
      abrirContrasena();
    });
  }

  function confirmar() {
    if (simular || !autorizacion.current) return;
    const invalido = validarContrasena(nueva).contrasena;
    if (invalido || nueva !== confirmacion) {
      establecerError(invalido || 'Las contraseñas no coinciden.');
      return;
    }
    void ejecutar(async () => {
      try {
        const {usuarioId} = await solicitarRemoto<{usuarioId: string}>('/auth/recuperacion/confirmar', {correo: destino, autorizacion: autorizacion.current, nueva});
        await autenticacionRepositorio.actualizarVerificadorContrasena(usuarioId, 'requiere_ingreso_en_linea');
        autorizacion.current = null;
        Keyboard.dismiss();
        alCompletar(destino);
      } catch (fallo) {
        if (fallo instanceof ErrorRemoto && fallo.codigo === 'autorizacion_invalida') {
          autorizacion.current = null;
          Keyboard.dismiss();
          establecerPaso('codigo');
        }
        throw fallo;
      }
    });
  }

  const errorVisible = error ? <Text accessibilityLiveRegion="polite" style={estilosGlobales.textoError}>{error}</Text> : null;
  const boton = {estilosAutenticacion, estilosGlobales, cargando: ocupada};
  const flechaVolver = <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button"
    accessibilityLabel={paso === 'contrasena' ? 'Volver al código' : 'Volver al correo'} disabled={ocupada}
    onPress={volver} style={estilos.volver}>
    <Ionicons accessible={false} name="arrow-back" size={24} color={tema.foco} />
  </Pressable>;

  if (paso === 'correo') return <>
    {fondo}
    <ModalPerfil visible desplazable tema={tema} estilos={crearEstilosPerfil(tema)}
      titulo="Recuperá tu contraseña" icono="mail-outline" etiquetaCerrar="Cerrar recuperación"
      descripcion="Ingresá el correo de tu cuenta de AHRE para pedir un código."
      alCerrar={() => {if (!enCurso.current) alCerrar();}}>
      <CampoAutenticacion {...campos} icono="mail-outline" etiqueta="Correo electrónico"
        autoCapitalize="none" autoComplete="email" keyboardType="email-address" maxLength={254}
        placeholder="Ingresá tu correo electrónico"
        valor={correo} alCambiarTexto={establecerCorreo} onSubmitEditing={enviar} />
      {simular ? <Text style={estilosAutenticacion.textoPie}>Vista de prueba. El botón abre la vista del código.</Text> : null}
      {errorVisible}
      <BotonPrincipal {...boton} alPresionar={enviar} titulo="Enviar código" />
    </ModalPerfil>
  </>;

  if (paso === 'codigo') return <ContenedorAutenticacion key="codigo" tema={tema} accionInicial={flechaVolver}
    titulo="Ingresá el código" descripcion={simular ? `Escribí el código de ejemplo ${CODIGO_PRUEBA} para probar las casillas.` : 'Si el correo está asociado a una cuenta de AHRE, te llegará un código válido por 10 minutos. Revisá también correo no deseado.'}>
    <View style={estilosAutenticacion.formulario}>
      <Text style={[estilosAutenticacion.textoPie, estilos.correo]}>{destino}</Text>
      <View>
        <View style={estilos.digitos}>
          {digitos.map((digito, indice) => <TextInput key={indice}
            ref={campo => {referencias.current[indice] = campo;}}
            accessibilityLabel={`Dígito ${indice + 1} de ${CANTIDAD_DIGITOS}`}
            editable={!ocupada} value={digito} keyboardType="number-pad"
            autoComplete={!simular && indice === 0 ? 'one-time-code' : 'off'}
            textContentType={!simular && indice === 0 ? 'oneTimeCode' : 'none'}
            maxLength={CANTIDAD_DIGITOS} selectTextOnFocus
            onFocus={() => establecerEnfocado(indice)}
            onBlur={() => establecerEnfocado(actual => actual === indice ? null : actual)}
            onChangeText={texto => cambiarDigito(indice, texto)}
            onKeyPress={({nativeEvent}) => {
              if (nativeEvent.key === 'Backspace' && !digito && indice > 0) referencias.current[indice - 1]?.focus();
            }}
            style={[
              estilosGlobales.campo,
              estilos.digito,
              indice === CANTIDAD_DIGITOS / 2 && estilos.inicioSegundoGrupo,
              enfocado === indice && estilos.digitoEnfocado,
              codigoConError && estilosGlobales.campoError,
            ]}
          />)}
        </View>
      </View>
      {errorVisible}
      <BotonPrincipal {...boton} alPresionar={continuar} titulo="Continuar" />
      <BotonAccion tema={tema} texto="Reenviar código" icono="refresh-outline" variante="secundario"
        deshabilitado={ocupada} alPresionar={enviar} />
    </View>
  </ContenedorAutenticacion>;

  return <ContenedorAutenticacion key="contrasena" tema={tema} accionInicial={flechaVolver}
    titulo="Actualizá tu contraseña" descripcion="Creá una contraseña nueva para volver a iniciar sesión en AHRE.">
    <View style={estilosAutenticacion.formulario}>
      <CampoContrasena {...campos} icono="lock-closed-outline" etiqueta="Nueva contraseña"
        placeholder="Ingresá la nueva contraseña"
        textContentType="newPassword" maxLength={256} valor={nueva} alCambiarTexto={establecerNueva}
        returnKeyType="next" onSubmitEditing={() => referenciaConfirmacion.current?.focus()} />
      <CampoContrasena {...campos} ref={referenciaConfirmacion} icono="lock-closed-outline" etiqueta="Confirmá la contraseña"
        placeholder="Repetí la nueva contraseña"
        textContentType="newPassword" maxLength={256} valor={confirmacion} alCambiarTexto={establecerConfirmacion}
        returnKeyType="done" onSubmitEditing={confirmar} />
      {errorVisible}
      <BotonPrincipal {...boton} deshabilitado={simular} alPresionar={confirmar} titulo="Actualizar contraseña" />
    </View>
  </ContenedorAutenticacion>;
}
