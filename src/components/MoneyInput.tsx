import { crearEstilosEgreso } from '../styles/expenseStyles';
import { useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';
import { editarEntradaMonto, formatearEntradaMonto } from '../utils/moneyInput';
import { crearEstilosEntradaMonto } from '../styles/MoneyInputStyles';

export default function EntradaMonto({
  tema, estilosGlobales, estilosMovimiento = crearEstilosEgreso(tema),
  etiqueta = 'Monto', valor, alCambiarTexto, alLimpiar, error,
  mostrarEtiqueta = true, mostrarLimpiar = true, compacto = false, editable = true,
  etiquetaAccesibilidad = etiqueta, ayudaAccesibilidad,
  estiloContenedor, estiloEntrada, estiloSimbolo, estiloLimpiar,
}: import('../types/ui').MontoProps) {
  const [enfocado, establecerEnfocado] = useState(false);
  const [seleccion, establecerSeleccion] = useState<{start:number;end:number} | undefined>();
  const seleccionActual = useRef({ start: 0, end: 0 });
  const entrada = useRef<TextInput>(null);
  const estilos = crearEstilosEntradaMonto(tema);
  const formateado = formatearEntradaMonto(valor);
  const estiloEstado = error ? estilosGlobales.campoError : enfocado ? estilosGlobales.campoEnfocado : null;

  const cambiarTexto = (texto: string) => {
    const cambio = editarEntradaMonto(formateado, texto, seleccionActual.current);
    if (!cambio) {
      entrada.current?.setNativeProps({ text: formateado, selection: seleccionActual.current });
      return;
    }
    seleccionActual.current = cambio.seleccion;
    establecerSeleccion(cambio.seleccion);
    alCambiarTexto(cambio.valor);
  };

  const campo = <>
    <View style={[estilosGlobales.campo, compacto ? estilos.compacto : estilosMovimiento.filaMonto, estiloContenedor, estiloEstado]}>
      <Text style={[compacto ? estilosGlobales.textoSecundario : estilosMovimiento.simboloMonto, estiloSimbolo]}>$</Text>
      <TextInput ref={entrada}
        accessibilityLabel={etiquetaAccesibilidad} accessibilityHint={error || ayudaAccesibilidad}
        editable={editable} keyboardType="decimal-pad"
        onBlur={() => { establecerEnfocado(false); establecerSeleccion(undefined); }}
        onFocus={() => establecerEnfocado(true)}
        onChangeText={cambiarTexto}
        onSelectionChange={({ nativeEvent }) => { seleccionActual.current = nativeEvent.selection; }}
        selection={seleccion}
        placeholder="0" placeholderTextColor={tema.textoSecundario} selectionColor={tema.foco}
        style={[compacto ? estilos.entradaCompacta : estilosMovimiento.entradaMonto, estiloEntrada]} value={formateado}
      />
      {mostrarLimpiar && valor ? <Pressable
        accessibilityLabel={'Limpiar ' + etiquetaAccesibilidad.toLocaleLowerCase('es')}
        accessibilityRole="button" disabled={!editable}
        onPress={() => { establecerSeleccion(undefined); (alLimpiar || (() => alCambiarTexto('')))(); }}
        style={estiloLimpiar || estilosMovimiento.accionLimpiar}>
        <Ionicons color={tema.textoSecundario} name="close-circle-outline" size={24}/>
      </Pressable> : null}
    </View>
    {error ? <Text style={[estilosGlobales.textoError, estilosMovimiento.errorCampo]}>{error}</Text> : null}
  </>;
  return mostrarEtiqueta ? <View style={estilosMovimiento.grupo}>
    <Text style={estilosGlobales.etiqueta}>{etiqueta}</Text>{campo}
  </View> : campo;
}
