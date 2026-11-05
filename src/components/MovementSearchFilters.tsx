import type { ReactNode } from 'react';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import FilaFiltrosHorizontal from './HorizontalFilterRow';
import { Ionicons } from '@expo/vector-icons';
import type { Tema } from '../styles/colors';
import { crearEstilosGlobales } from '../styles/globalStyles';
import { crearEstilosBusquedaFiltros } from '../styles/MovementSearchFiltersStyles';

export default function BuscadorFiltrosMovimientos({ tema, busqueda = '', alBuscar, mostrarBuscador = true, alAbrirFiltros, alLimpiar, filtrosActivos = [], cantidad = 0, children }: {
  tema: Tema; busqueda?: string; alBuscar?: (valor:string)=>void; mostrarBuscador?:boolean; alAbrirFiltros:()=>void; alLimpiar?:()=>void; cantidad?:number; children?:ReactNode;
  filtrosActivos?: readonly {id:string;etiqueta:string;alQuitar:()=>void;bloqueado?:boolean}[];
}) {
  const estilos = crearEstilosBusquedaFiltros(tema);
  const globales = crearEstilosGlobales(tema);
  const [enfocado, establecerEnfocado] = useState(false);
  return <View style={estilos.contenedor}>
    {mostrarBuscador ? <View style={[globales.campo, estilos.buscador, enfocado && globales.campoEnfocado]}>
      <Ionicons name="search-outline" size={22} color={tema.textoSecundario}/>
      <TextInput accessibilityLabel="Buscar movimientos" placeholder="Buscar movimientos" value={busqueda}
        onChangeText={alBuscar} onFocus={()=>establecerEnfocado(true)} onBlur={()=>establecerEnfocado(false)}
        placeholderTextColor={tema.textoSecundario} selectionColor={tema.foco} style={estilos.entrada} returnKeyType="search"/>
      {busqueda ? <Pressable accessibilityRole="button" accessibilityLabel="Limpiar búsqueda" onPress={()=>alBuscar?.('')} style={estilos.accion}>
        <Ionicons name="close-circle-outline" size={22} color={tema.textoSecundario}/>
      </Pressable> : null}
    </View> : null}
    <FilaFiltrosHorizontal tema={tema} estiloContenido={estilos.fila}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Filtros, ${cantidad} activos`} onPress={alAbrirFiltros} style={[estilos.filtro, cantidad > 0 && estilos.filtroActivo]}>
        <Ionicons name="options-outline" size={18} color={cantidad > 0 ? tema.encabezadoTexto : tema.textoPrincipal}/>
        <Text style={[estilos.textoFiltro, cantidad > 0 && estilos.textoActivo]}>Filtros{cantidad > 0 ? ` · ${cantidad}` : ''}</Text>
      </Pressable>
      {children}
    </FilaFiltrosHorizontal>
    <View style={estilos.lineaActivos}>
      <View style={estilos.listaActivos}>
        {filtrosActivos.length ? <FilaFiltrosHorizontal tema={tema}>
          {filtrosActivos.map(filtro => <Pressable key={filtro.id} accessibilityRole="button" accessibilityLabel={filtro.bloqueado ? filtro.etiqueta + '. Seleccioná otro depósito antes de quitar este filtro.' : 'Quitar ' + filtro.etiqueta}
            disabled={filtro.bloqueado} accessibilityState={{ disabled: Boolean(filtro.bloqueado) }} onPress={filtro.alQuitar} style={[estilos.filtro, estilos.criterioActivo]}>
            <Text numberOfLines={1} style={[estilos.textoFiltro, estilos.textoCriterio]}>{filtro.etiqueta}</Text>
            <Ionicons name={filtro.bloqueado ? 'lock-closed' : 'close'} size={16} color={tema.textoSecundario}/>
          </Pressable>)}
        </FilaFiltrosHorizontal> : <Text style={estilos.sinFiltros}>Sin filtros seleccionados</Text>}
      </View>
      {alLimpiar ? <Pressable accessibilityRole="button" accessibilityLabel="Limpiar filtros" disabled={!cantidad} onPress={alLimpiar} style={[estilos.limpiar, !cantidad && estilos.deshabilitado]}>
        <Text style={estilos.textoLimpiar}>Limpiar</Text>
      </Pressable> : null}
    </View>
  </View>;
}
