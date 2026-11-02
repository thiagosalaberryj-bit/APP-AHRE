import { View, Text, TextInput, Pressable } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import crearEstilosFila from '../../styles/social/ExpenseListRowStyles';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';

export default function FilaListaGastos({ fila, indice, resumen, alCambiar, alEditar, alQuitar, tema, estilosGlobales }: import('../../social/types').AspectoSocial & ({fila:import('../../social/types').FilaGasto;indice:number;resumen:string;alCambiar:(cambios:Partial<import('../../social/types').FilaGasto>)=>void;alEditar:()=>void;alQuitar:()=>void})) {
  const estilos = { ...crearEstilosCompartidos(tema), ...crearEstilosFila(tema) };
  const [enfocado, establecerEnfocado] = useState<string | null>(null);
  return <View style={[estilosGlobales.tarjeta, estilos.tarjetaCompacta]}>
    <View style={estilos.cabecera}>
      <Text style={[estilosGlobales.etiqueta, estilos.textoFlexible]}>Ítem {indice + 1}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Ajustar ítem ${indice + 1}`} hitSlop={4} onPress={alEditar} style={[estilos.accion, estilos.editar]}><Ionicons name="create-outline" size={20} color={tema.foco} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Quitar ítem ${indice + 1}`} hitSlop={4} onPress={alQuitar} style={[estilos.accion, estilos.borrar]}><Ionicons name="trash-outline" size={20} color={tema.error} /></Pressable>
    </View>
    <View style={estilos.filaCampos}>
      <TextInput accessibilityLabel={`Ítem ${indice + 1}`} value={fila.descripcion} maxLength={500} onChangeText={descripcion => alCambiar({ descripcion })} onFocus={() => establecerEnfocado('nombre')} onBlur={() => establecerEnfocado(null)} placeholder="Qué se pagó" placeholderTextColor={tema.textoSecundario} selectionColor={tema.foco} style={[estilosGlobales.campo, estilos.campo, estilosGlobales.texto, estilos.nombre, enfocado === 'nombre' && estilosGlobales.campoEnfocado]} />
      <View style={[estilosGlobales.campo, estilos.campo, estilos.precio, enfocado === 'precio' && estilosGlobales.campoEnfocado]}><Text style={estilosGlobales.textoSecundario}>$</Text><TextInput accessibilityLabel={`Importe ${indice + 1}`} value={fila.monto} onChangeText={monto => alCambiar({ monto })} onFocus={() => establecerEnfocado('precio')} onBlur={() => establecerEnfocado(null)} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={tema.textoSecundario} selectionColor={tema.foco} style={[estilosGlobales.texto, estilos.entradaPrecio]} /></View>
    </View>
    <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.textoAyuda}>{resumen}</Text>
  </View>;
}
