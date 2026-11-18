import {useRef, useState} from 'react';
import {Pressable, Text} from 'react-native';
import {autenticacionRepositorio} from '../database/repositories/authenticationRepository';
import {ErrorRemoto, solicitarRemoto} from '../sync/remote';
import {normalizarCorreo, validarContrasena, validarInicioSesion} from '../utils/authenticationValidation';
import type {Tema} from '../styles/colors';
import {crearEstilosAutenticacion} from '../styles/authStyles';
import {crearEstilosGlobales} from '../styles/globalStyles';
import {crearEstilosPerfil} from '../styles/ProfileScreenStyles';
import CampoAutenticacion from './AuthInput';
import CampoContrasena from './PasswordInput';
import BotonPrincipal from './PrimaryButton';
import ModalPerfil from './ProfileModal';

interface Propiedades {
  correoInicial: string;
  tema: Tema;
  alCerrar: () => void;
  alCompletar: (correo: string) => void;
}

export default function RecuperacionContrasena({correoInicial, tema, alCerrar, alCompletar}: Propiedades) {
  const [correo, establecerCorreo] = useState(correoInicial);
  const [codigo, establecerCodigo] = useState('');
  const [nueva, establecerNueva] = useState('');
  const [confirmacion, establecerConfirmacion] = useState('');
  const [enviado, establecerEnviado] = useState(false);
  const [ocupada, establecerOcupada] = useState(false);
  const [mensaje, establecerMensaje] = useState('');
  const [error, establecerError] = useState('');
  const enCurso = useRef(false);
  const proximoEnvio = useRef(0);
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilosAutenticacion = crearEstilosAutenticacion(tema);
  const campos = {tema, estilosGlobales, estilosAutenticacion, deshabilitado: ocupada};

  async function ejecutar(accion: () => Promise<void>) {
    if (enCurso.current) return;
    enCurso.current = true;
    establecerOcupada(true);
    establecerError('');
    try {
      await accion();
    } catch (fallo) {
      establecerError(fallo instanceof ErrorRemoto && fallo.estado !== 0
        ? fallo.message : 'No pudimos conectar con el servicio de recuperación. Volvé a intentar.');
    } finally {
      enCurso.current = false;
      establecerOcupada(false);
    }
  }

  function enviar() {
    const destino = normalizarCorreo(correo);
    const invalido = validarInicioSesion({correo: destino}).correo;
    if (invalido) {
      establecerError(invalido);
      return;
    }
    if (proximoEnvio.current > Date.now()) {
      establecerError('Esperá un minuto desde el último envío antes de pedir otro código.');
      return;
    }
    void ejecutar(async () => {
      await solicitarRemoto('/auth/recuperacion/solicitar', {correo: destino}, undefined, 10_000);
      proximoEnvio.current = Date.now() + 60_000;
      establecerCodigo('');
      establecerEnviado(true);
      establecerMensaje('Si el correo corresponde a una cuenta de AHRE, te llegará un código válido por 10 minutos. Revisá también correo no deseado.');
    });
  }

  function confirmar() {
    const invalido = validarContrasena(nueva).contrasena;
    if (!/^\d{6}$/.test(codigo) || invalido || nueva !== confirmacion) {
      establecerError(!/^\d{6}$/.test(codigo) ? 'Ingresá el código de seis dígitos.'
        : invalido || 'Las contraseñas no coinciden.');
      return;
    }
    void ejecutar(async () => {
      const destino = normalizarCorreo(correo);
      const {usuarioId} = await solicitarRemoto<{usuarioId: string}>('/auth/recuperacion/confirmar', {correo: destino, codigo, nueva});
      await autenticacionRepositorio.actualizarVerificadorContrasena(usuarioId, 'requiere_ingreso_en_linea');
      alCompletar(destino);
    });
  }

  return <ModalPerfil visible desplazable tema={tema} estilos={crearEstilosPerfil(tema)}
    titulo="Recuperá tu contraseña" icono="mail-outline" etiquetaCerrar="Cerrar recuperación"
    descripcion={enviado ? normalizarCorreo(correo) : 'Ingresá el correo de tu cuenta de AHRE.'}
    alCerrar={() => {if (!enCurso.current) alCerrar();}}>
    {enviado ? <>
      <Text style={estilosAutenticacion.textoPie}>{mensaje}</Text>
      <CampoAutenticacion {...campos} icono="key-outline" etiqueta="Código"
        keyboardType="number-pad" autoComplete="one-time-code" maxLength={6}
        valor={codigo} alCambiarTexto={valor => establecerCodigo(valor.replace(/\D/g, ''))} />
      <CampoContrasena {...campos} icono="lock-closed-outline" etiqueta="Nueva contraseña"
        textContentType="newPassword" maxLength={256} valor={nueva} alCambiarTexto={establecerNueva} />
      <CampoContrasena {...campos} icono="lock-closed-outline" etiqueta="Confirmá la contraseña"
        textContentType="newPassword" maxLength={256} valor={confirmacion} alCambiarTexto={establecerConfirmacion} />
      <Pressable accessibilityRole="button" disabled={ocupada} onPress={enviar}>
        <Text style={estilosAutenticacion.textoRecuperar}>Reenviar código</Text>
      </Pressable>
      <Pressable accessibilityRole="button" disabled={ocupada} onPress={() => {
        establecerEnviado(false);
        establecerCodigo('');
        establecerNueva('');
        establecerConfirmacion('');
        establecerError('');
        proximoEnvio.current = 0;
      }}>
        <Text style={estilosAutenticacion.textoRecuperar}>Cambiar correo</Text>
      </Pressable>
    </> : <CampoAutenticacion {...campos} icono="mail-outline" etiqueta="Correo electrónico"
      autoCapitalize="none" autoComplete="email" keyboardType="email-address" maxLength={254}
      valor={correo} alCambiarTexto={establecerCorreo} onSubmitEditing={enviar} />}
    {error ? <Text accessibilityLiveRegion="polite" style={estilosGlobales.textoError}>{error}</Text> : null}
    <BotonPrincipal estilosAutenticacion={estilosAutenticacion} estilosGlobales={estilosGlobales}
      cargando={ocupada} alPresionar={enviado ? confirmar : enviar}
      titulo={enviado ? 'Cambiar contraseña' : 'Enviar código'} />
  </ModalPerfil>;
}
