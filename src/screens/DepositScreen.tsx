import MarcoEncabezado from '../components/ScreenHeaderFrame';
import { DesplazamientoEncabezado } from '../components/HeaderScrollView';
import FormularioDeposito from '../components/DepositForm';
import ModalIconosDeposito from '../components/DepositIconModal';
import { useContext, useEffect,useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,

  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorBaseDatos } from '../database/errors';
import { crearDeposito, ErrorDeposito } from '../deposits/depositService';
import { ContextoAvisos } from '../contexts/ToastContext';
import { ContextoApariencia } from '../contexts/AppearanceContext';
import BotonPrincipal from '../components/PrimaryButton';
import EntradaMonto from '../components/MoneyInput';
import EncabezadoSeccion from '../components/SectionHeader';
import { crearEstilosDeposito } from '../styles/DepositScreenStyles';
import { crearEstilosGlobales, ESPACIADO } from '../styles/globalStyles';
import { validarDatosDeposito } from '../utils/depositValidation';

export default function PantallaDeposito({ navigation: navegacion }: import('../navigation/types').PropiedadesPantalla) {
  const insets = useSafeAreaInsets();
  const { tema } = useContext(ContextoApariencia);
  const { mostrarAviso } = useContext(ContextoAvisos);
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = crearEstilosDeposito(tema);
  const guardandoRef = useRef(false);
  useEffect(()=>navegacion.addListener('beforeRemove',evento=>{if(guardandoRef.current)evento.preventDefault();}),[navegacion]);
  const [nombre, establecerNombre] = useState('');
  const [saldoInicial, establecerSaldoInicial] = useState('');
  const [tipo, establecerTipo] = useState<string | null>(null);
  const [icono, establecerIcono] = useState('cash-outline');
  const [color, establecerColor] = useState<string | null>(null);
  const [descripcion, establecerDescripcion] = useState('');
  const [iconosAdicionalesVisibles, establecerIconosAdicionalesVisibles] = useState(false);
  const [nombreEnfocado, establecerNombreEnfocado] = useState(false);
  const [descripcionEnfocada, establecerDescripcionEnfocada] = useState(false);
  const [intentoGuardar, establecerIntentoGuardar] = useState(false);
  const [guardando, establecerGuardando] = useState(false);
  const datosFormulario = { nombre, saldo_inicial: saldoInicial, tipo, icono, color, descripcion };
  const erroresFormulario = validarDatosDeposito(datosFormulario);
  const errorNombre = intentoGuardar ? erroresFormulario.nombre : null;
  const errorSaldo = intentoGuardar ? erroresFormulario.saldo_inicial : null;
  const errorTipo = intentoGuardar ? erroresFormulario.tipo : null;
  const errorIcono = intentoGuardar ? erroresFormulario.icono : null;
  const errorColor = intentoGuardar ? erroresFormulario.color : null;
  const errorDescripcion = intentoGuardar ? erroresFormulario.descripcion : null;
  const formularioInvalido = Object.keys(erroresFormulario).length > 0;
  const cambiarSaldo = (valor: string) => {
    establecerSaldoInicial(valor);
  };

  const guardarDeposito = async () => {
    if (guardandoRef.current) return;

    establecerIntentoGuardar(true);
    if (formularioInvalido) {
      mostrarAviso('Revisá los campos marcados antes de crear el depósito.', { tipo: 'error' });
      return;
    }

    guardandoRef.current = true;
    establecerGuardando(true);

    try {
      const depositoCreado = await crearDeposito(datosFormulario);
      guardandoRef.current = false;
      establecerGuardando(false);
      mostrarAviso(`Se creó el depósito «${depositoCreado.nombre}».`, { tipo: 'exito' });
      navegacion.goBack();
    } catch (error) {
      guardandoRef.current = false;
      establecerGuardando(false);
      if (error instanceof ErrorDeposito && error.errores) {
        establecerIntentoGuardar(true);
      }
      const mensaje = error instanceof ErrorDeposito || error instanceof ErrorBaseDatos
        ? error.message
        : 'No se pudo crear el depósito. Intentá nuevamente.';
      mostrarAviso(mensaje, { tipo: 'error' });
    }
  };

  const volver = () => {
    if (!guardandoRef.current) navegacion.goBack();
  };

  const seleccionarIcono = (idIcono: string) => {
    establecerIcono(idIcono);
    establecerIconosAdicionalesVisibles(false);
  };

  return (
    <SafeAreaView edges={['top']} style={estilosGlobales.areaSegura}>
      <MarcoEncabezado style={estilosGlobales.pantalla} tema={tema} encabezado={<EncabezadoSeccion
          tema={tema}
          titulo="Nuevo depósito"
          descripcion="Organiza una nueva fuente de dinero."
          alVolver={volver}
        />}>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={estilos.contenedorTeclado}
        >
          <DesplazamientoEncabezado
            contentContainerStyle={[estilos.formulario, { paddingBottom: insets.bottom + ESPACIADO.enorme }]}
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            keyboardShouldPersistTaps="handled"
          >
            <View style={estilos.grupo}>
              <Text style={estilosGlobales.etiqueta}>Saldo inicial *</Text>
              <EntradaMonto tema={tema} estilosGlobales={estilosGlobales}
                etiqueta="Saldo inicial" valor={saldoInicial} alCambiarTexto={cambiarSaldo}
                mostrarEtiqueta={false} editable={!guardando} error={errorSaldo}
                ayudaAccesibilidad="Ingresá el monto en pesos."
                estiloContenedor={estilos.filaSaldo} estiloEntrada={estilos.entradaSaldo}
                estiloSimbolo={estilos.simboloSaldo} estiloLimpiar={estilos.accionLimpiarSaldo}/>
              <Text style={estilosGlobales.textoAyuda}>
                Para ingresar decimales, usá coma.
              </Text>
            </View>

            <FormularioDeposito
              tema={tema} estilos={estilos} estilosGlobales={estilosGlobales} variante="creacion"
              valores={datosFormulario} errores={{ nombre: errorNombre, tipo: errorTipo, icono: errorIcono, color: errorColor, descripcion: errorDescripcion }}
              alCambiar={(campo, valor) => {
                if (campo === 'nombre') establecerNombre(valor || '');
                else if (campo === 'tipo') establecerTipo(valor);
                else if (campo === 'icono') seleccionarIcono(valor || '');
                else if (campo === 'color') establecerColor(valor);
                else establecerDescripcion(valor || '');
              }}
              focoNombre={{ enfocado: nombreEnfocado, alCambiar: establecerNombreEnfocado }}
              focoDescripcion={{ enfocado: descripcionEnfocada, alCambiar: establecerDescripcionEnfocada }}
              iconosAdicionalesVisibles={iconosAdicionalesVisibles}
              alAbrirIconos={() => establecerIconosAdicionalesVisibles(true)} deshabilitado={guardando}
            />

            <View style={estilos.acciones}>
              <BotonPrincipal
                estilosAutenticacion={estilos}
                estilosGlobales={estilosGlobales}
                titulo="Crear depósito"
                cargando={guardando}
                alPresionar={guardarDeposito}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: guardando }}
                disabled={guardando}
                onPress={volver}
                style={({ pressed }) => [
                  estilosGlobales.botonSecundario,
                  pressed && !guardando && estilos.elementoPresionado,
                  guardando && estilosGlobales.botonDeshabilitado,
                ]}
              >
                <Text style={guardando ? estilosGlobales.textoDeshabilitado : estilosGlobales.textoBotonSecundario}>
                  Cancelar
                </Text>
              </Pressable>
            </View>

          </DesplazamientoEncabezado>
        </KeyboardAvoidingView>
      </MarcoEncabezado>
      <ModalIconosDeposito
        tema={tema} estilos={estilos} variante="creacion" visible={iconosAdicionalesVisibles}
        icono={icono} alCerrar={() => establecerIconosAdicionalesVisibles(false)}
        alSeleccionar={seleccionarIcono} deshabilitado={guardando}
      />
    </SafeAreaView>
  );
}
