import EntradaMonto from '../MoneyInput';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import crearEstilosFila from '../../styles/social/ExpenseListRowStyles';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';

export default function FilaListaGastos({ fila, indice, resumen, alCambiar, alEditar, alQuitar, tema, estilosGlobales }: import('../../social/types').AspectoSocial & ({fila:import('../../social/types').FilaGasto;indice:number;resumen:string;alCambiar:(cambios:Partial<import('../../social/types').FilaGasto>)=>void;alEditar:()=>void;alQuitar:()=>void})) {
  const estilos = { ...crearEstilosCompartidos(tema), ...crearEstilosFila(tema) };
  const [enfocado, establecerEnfocado] = useState<string | null>(null);
  return <View style={estilos.tarjetaItem}>
    <View style={estilos.cabecera}>
      <Text style={[estilos.tituloItem, estilos.textoFlexible]}>Ítem {indice + 1}</Text>
      <Text style={estilosGlobales.contadorCampo}>{fila.descripcion.length}/500</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Ajustar ítem ${indice + 1}`} hitSlop={4} onPress={alEditar} style={[estilos.accion, estilos.editar]}><Ionicons name="create-outline" size={20} color={tema.foco} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Quitar ítem ${indice + 1}`} hitSlop={4} onPress={alQuitar} style={[estilos.accion, estilos.borrar]}><Ionicons name="trash-outline" size={20} color={tema.error} /></Pressable>
    </View>
    <View style={estilos.filaCampos}>
      <TextInput accessibilityLabel={`Ítem ${indice + 1}`} value={fila.descripcion} maxLength={500} onChangeText={descripcion => alCambiar({ descripcion })} onFocus={() => establecerEnfocado('nombre')} onBlur={() => establecerEnfocado(null)} placeholder="Qué se pagó" placeholderTextColor={tema.textoSecundario} selectionColor={tema.foco} style={[estilosGlobales.campo, estilos.campo, estilos.nombre, enfocado === 'nombre' && estilosGlobales.campoEnfocado]} />
      <EntradaMonto tema={tema} estilosGlobales={estilosGlobales}
        etiqueta={'Importe ' + (indice + 1)} valor={fila.monto} alCambiarTexto={monto => alCambiar({ monto })}
        mostrarEtiqueta={false} mostrarLimpiar={false} compacto
        estiloContenedor={[estilos.campo, estilos.precio]} estiloEntrada={estilos.entradaPrecio}/>
    </View>
    <Text numberOfLines={2} ellipsizeMode="tail" style={estilos.resumenItem}>{resumen}</Text>
  </View>;
}
