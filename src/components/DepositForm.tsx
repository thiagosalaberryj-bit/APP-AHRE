import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';
import {
  ICONOS_ADICIONALES_DEPOSITO,
  ICONOS_DEPOSITO,
  ICONOS_PRINCIPALES_DEPOSITO,
  TIPOS_DEPOSITO,
} from '../constants/deposits';
import { COLOR_DEPOSITO_PREDETERMINADO, COLORES_DEPOSITOS, type Tema } from '../styles/colors';
import type { crearEstilosDeposito } from '../styles/DepositScreenStyles';
import type { EstilosGlobales } from '../types/ui';
import type { DatosDeposito } from '../types/forms';

export type VarianteFormularioDeposito = 'creacion' | 'edicion';

function obtenerNombreIcono(opcion: typeof ICONOS_DEPOSITO[number], variante: VarianteFormularioDeposito) {
  return variante === 'edicion' && opcion.id === 'phone-portrait-outline' && 'nombreCorto' in opcion
    ? opcion.nombreCorto
    : opcion.nombre;
}

const NOMBRES_COLORES_DEPOSITO = Object.freeze(['Verde suave', 'Violeta', 'Rosa', 'Amarillo suave']);
const COLORES_SELECTOR = Object.freeze(COLORES_DEPOSITOS
  .filter(color => color !== COLOR_DEPOSITO_PREDETERMINADO)
  .map((valor, indice) => ({ valor, nombre: NOMBRES_COLORES_DEPOSITO[indice] })));

type CamposDeposito = Pick<DatosDeposito, 'nombre' | 'tipo' | 'icono' | 'color' | 'descripcion'>;
type FocoCampo = { enfocado: boolean; alCambiar: (enfocado: boolean) => void };

export default function FormularioDeposito({
  tema, estilos, estilosGlobales, variante, valores, errores, alCambiar,
  focoNombre, focoDescripcion, iconosAdicionalesVisibles, alAbrirIconos, deshabilitado,
}: {
  tema: Tema;
  estilos: Omit<ReturnType<typeof crearEstilosDeposito>, 'formulario' | 'tarjetaModal'>;
  estilosGlobales: EstilosGlobales;
  variante: VarianteFormularioDeposito;
  valores: Partial<CamposDeposito>;
  errores: Partial<Record<keyof CamposDeposito, string | null>>;
  alCambiar: (campo: keyof CamposDeposito, valor: string | null) => void;
  focoNombre: FocoCampo;
  focoDescripcion: FocoCampo;
  iconosAdicionalesVisibles: boolean;
  alAbrirIconos: () => void;
  deshabilitado?: boolean;
}) {
  // Cada variante conserva los detalles de presentación de su pantalla original.
  const esEdicion = variante === 'edicion';
  const nombre = valores.nombre || '';
  const descripcion = valores.descripcion || '';
  const { tipo, icono } = valores;
  const colorEfectivo = valores.color || COLOR_DEPOSITO_PREDETERMINADO;
  const color = esEdicion ? colorEfectivo : valores.color;
  const colorPredeterminadoSeleccionado = esEdicion ? color === COLOR_DEPOSITO_PREDETERMINADO : color === null;
  const { nombre: errorNombre, tipo: errorTipo, icono: errorIcono, color: errorColor, descripcion: errorDescripcion } = errores;
  const { enfocado: nombreEnfocado, alCambiar: establecerNombreEnfocado } = focoNombre;
  const { enfocado: descripcionEnfocada, alCambiar: establecerDescripcionEnfocada } = focoDescripcion;
  const iconoFueraDeVista = (esEdicion || Boolean(icono)) && !ICONOS_PRINCIPALES_DEPOSITO.some(opcion => opcion.id === icono);
  const iconoAdicionalSeleccionado = ICONOS_ADICIONALES_DEPOSITO.find(opcion => opcion.id === icono);
  const opcionColorSeleccionado = COLORES_SELECTOR.find(opcion => opcion.valor === color);
  const opcionIconoSeleccionado = ICONOS_DEPOSITO.find(opcion => opcion.id === icono);
  const nombreIconoSeleccionado = opcionIconoSeleccionado && obtenerNombreIcono(opcionIconoSeleccionado, variante);

  return (<>
    <View style={estilos.grupo}>
      <View style={esEdicion ? estilosGlobales.encabezadoCampo : estilos.encabezadoCampo}>
        <Text style={esEdicion ? [estilosGlobales.etiqueta, estilosGlobales.etiquetaCampo] : estilosGlobales.etiqueta}>Nombre del depósito *</Text>
        <Text style={esEdicion ? estilosGlobales.contadorCampo : estilos.contador}>{`${nombre.length}/30`}</Text>
      </View>
      <View
        style={[
          estilosGlobales.campo,
          estilos.filaEntrada,
          ...(esEdicion
            ? [nombreEnfocado ? estilosGlobales.campoEnfocado : null, errorNombre ? estilosGlobales.campoError : null]
            : [errorNombre ? estilosGlobales.campoError : nombreEnfocado ? estilosGlobales.campoEnfocado : null]),
        ]}
      >
        <Ionicons color={tema.textoSecundario} name="wallet-outline" size={21} />
        <TextInput
          accessibilityLabel="Nombre del depósito"
          accessibilityHint={esEdicion ? undefined : errorNombre || undefined}
          editable={esEdicion ? undefined : !deshabilitado}
          maxLength={30}
          onBlur={() => establecerNombreEnfocado(false)}
          onChangeText={(valor) => alCambiar('nombre', valor)}
          onFocus={() => establecerNombreEnfocado(true)}
          placeholder="Ej: Efectivo, Cuenta BNA"
          placeholderTextColor={tema.textoSecundario}
          returnKeyType="next"
          selectionColor={tema.foco}
          style={estilos.entradaTexto}
          value={nombre}
        />
        {nombre ? (
          <Pressable
            accessibilityLabel="Limpiar nombre"
            accessibilityRole="button"
            disabled={deshabilitado}
            onPress={() => alCambiar('nombre', '')}
            style={estilos.botonLimpiar}
          >
            <Ionicons color={tema.textoSecundario} name="close-circle" size={22} />
          </Pressable>
        ) : null}
      </View>
      {errorNombre ? <Text style={estilosGlobales.textoError}>{errorNombre}</Text> : null}
    </View>

    <View style={estilos.grupo}>
      <Text style={estilosGlobales.etiqueta}>Tipo de depósito *</Text>
      <View style={estilos.listaTipos}>
        {TIPOS_DEPOSITO.map((opcion) => {
          const seleccionada = tipo === opcion.id;
          return (
            <Pressable
              accessibilityLabel={opcion.nombre}
              accessibilityRole="button"
              accessibilityState={{ selected: seleccionada }}
              disabled={deshabilitado}
              key={opcion.id}
              onPress={() => {
                alCambiar('tipo', opcion.id);
              }}
              style={({ pressed }) => [
                estilos.tarjetaTipo,
                seleccionada && estilos.tarjetaTipoSeleccionada,
                !esEdicion && errorTipo && estilos.tarjetaTipoError,
                pressed && estilos.elementoPresionado,
              ]}
            >
              <View style={[estilos.iconoTipo, seleccionada && estilos.iconoTipoSeleccionado]}>
                <Ionicons
                  color={seleccionada ? tema.botonPrincipalTexto : tema.foco}
                  name={opcion.icono}
                  size={25}
                />
              </View>
              <Text style={[estilos.nombreTipo, seleccionada && estilos.nombreTipoSeleccionado]}>
                {opcion.nombre}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {errorTipo ? <Text style={estilosGlobales.textoError}>{errorTipo}</Text> : null}
    </View>

    <View style={estilos.grupo}>
      <Text style={estilosGlobales.etiqueta}>Ícono</Text>
      <View style={estilos.listaIconos}>
        {ICONOS_PRINCIPALES_DEPOSITO.map((opcion) => {
          const seleccionado = icono === opcion.id;
          return (
            <Pressable
              accessibilityLabel={`Ícono ${obtenerNombreIcono(opcion, variante)}`}
              accessibilityRole="button"
              accessibilityState={{ selected: seleccionado }}
              disabled={deshabilitado}
              key={opcion.id}
              onPress={() => alCambiar('icono', opcion.id)}
              style={({ pressed }) => [
                estilos.botonIcono,
                seleccionado && estilos.botonIconoSeleccionado,
                pressed && estilos.elementoPresionado,
              ]}
            >
              <Ionicons
                color={seleccionado ? tema.foco : tema.textoPrincipal}
                name={opcion.id}
                size={23}
              />
              <Text numberOfLines={1} style={estilos.nombreIcono}>
                {('nombreCorto' in opcion ? opcion.nombreCorto : opcion.nombre)}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          accessibilityLabel={iconoAdicionalSeleccionado ? `Ícono ${iconoAdicionalSeleccionado.nombre}. Ver más íconos` : 'Ver más íconos'}
          accessibilityRole="button"
          accessibilityState={{ expanded: iconosAdicionalesVisibles, selected: Boolean(iconoAdicionalSeleccionado) }}
          disabled={deshabilitado}
          onPress={() => alAbrirIconos()}
          style={({ pressed }) => [
            estilos.botonIcono,
            iconoAdicionalSeleccionado ? estilos.botonIconoSeleccionado : estilos.botonMasIconos,
            pressed && estilos.elementoPresionado,
          ]}
        >
          <Ionicons color={tema.foco} name={iconoAdicionalSeleccionado?.id || 'add-outline'} size={23} />
          <Text numberOfLines={1} style={estilos.nombreIcono}>{iconoAdicionalSeleccionado?.nombre || 'Más'}</Text>
        </Pressable>
      </View>
      {iconoFueraDeVista ? (
        <Text style={estilosGlobales.textoAyuda}>
          Ícono seleccionado: {nombreIconoSeleccionado}
        </Text>
      ) : null}
      {errorIcono ? <Text style={estilosGlobales.textoError}>{errorIcono}</Text> : null}
    </View>

    <View style={estilos.grupo}>
      <View style={estilos.encabezadoColor}>
        <Text style={estilosGlobales.etiqueta}>Color</Text>
        <Text style={estilos.textoOpcional}>Opcional</Text>
      </View>
      <View style={estilos.listaColores}>
        <Pressable
          accessibilityLabel="Color azul suave predeterminado"
          accessibilityRole="button"
          accessibilityState={{ selected: colorPredeterminadoSeleccionado }}
          disabled={deshabilitado}
          onPress={() => {
            alCambiar('color', esEdicion ? COLOR_DEPOSITO_PREDETERMINADO : null);
          }}
          style={({ pressed }) => [
            estilos.opcionColor,
            pressed && estilos.elementoPresionado,
          ]}
        >
          <View style={[
            estilos.muestraColor,
            estilos.colorPredeterminado,
            colorPredeterminadoSeleccionado && estilos.muestraColorSeleccionada,
          ]}>
            {colorPredeterminadoSeleccionado ? (
              <Ionicons color={tema.botonPrincipalTexto} name="checkmark" size={22} />
            ) : null}
          </View>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[estilos.nombreColor, colorPredeterminadoSeleccionado && estilos.nombreColorSeleccionado]}>
            Azul
          </Text>
        </Pressable>
        {COLORES_SELECTOR.map(({ nombre, valor }) => {
          const seleccionado = color === valor;
          return (
            <Pressable
              accessibilityLabel={`Color ${nombre}`}
              accessibilityRole="button"
              accessibilityState={{ selected: seleccionado }}
              disabled={deshabilitado}
              key={valor}
              onPress={() => alCambiar('color', valor)}
              style={({ pressed }) => [
                estilos.opcionColor,
                pressed && estilos.elementoPresionado,
              ]}
            >
              <View
                style={[
                  estilos.muestraColor,
                  { backgroundColor: valor },
                  seleccionado && estilos.muestraColorSeleccionada,
                ]}
              >
                {seleccionado ? (
                  <Ionicons color={tema.botonPrincipalTexto} name="checkmark" size={22} />
                ) : null}
              </View>
              <Text numberOfLines={1} adjustsFontSizeToFit style={[estilos.nombreColor, seleccionado && estilos.nombreColorSeleccionado]}>
                {nombre.replace(/ suave$/, '')}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={estilos.colorSeleccionadoInfo}>
        <View
          style={[
            estilos.indicadorColorSeleccionado,
            {
              backgroundColor:
                esEdicion ? colorEfectivo : opcionColorSeleccionado?.valor || COLOR_DEPOSITO_PREDETERMINADO,
            },
          ]}
        />
        <Text style={estilosGlobales.textoAyuda}>
          {opcionColorSeleccionado
            ? `Color: ${opcionColorSeleccionado.nombre}`
            : 'Color: Azul suave (predeterminado)'}
        </Text>
      </View>
      {errorColor ? <Text style={estilosGlobales.textoError}>{errorColor}</Text> : null}
    </View>

    <View style={estilos.grupo}>
      <View style={esEdicion ? estilos.encabezadoColor : estilos.encabezadoCampo}>
        <Text style={estilosGlobales.etiqueta}>Descripción</Text>
        <View style={estilos.detalleEncabezadoCampo}>
          <Text style={estilos.textoOpcional}>Opcional ·</Text>
          <Text style={esEdicion ? estilosGlobales.contadorCampo : estilos.contador}>{`${descripcion.length}/60`}</Text>
        </View>
      </View>
      <View
        style={[
          estilosGlobales.campo,
          estilos.filaDescripcion,
          descripcionEnfocada ? estilosGlobales.campoEnfocado : null,
          esEdicion && errorDescripcion ? estilosGlobales.campoError : null,
        ]}
      >
        <Ionicons color={tema.textoSecundario} name="document-text-outline" size={20} />
        <TextInput
          accessibilityLabel="Descripción opcional"
          editable={esEdicion ? undefined : !deshabilitado}
          maxLength={60}
          multiline
          onBlur={() => establecerDescripcionEnfocada(false)}
          onChangeText={(valor) => alCambiar('descripcion', valor)}
          onFocus={() => establecerDescripcionEnfocada(true)}
          placeholder="Agregá un detalle para identificarlo"
          placeholderTextColor={tema.textoSecundario}
          selectionColor={tema.foco}
          style={estilos.entradaDescripcion}
          value={descripcion}
        />
        {descripcion ? (
          <Pressable
            accessibilityLabel="Limpiar descripción"
            accessibilityRole="button"
            disabled={deshabilitado}
            onPress={() => alCambiar('descripcion', '')}
            style={estilos.botonLimpiar}
          >
            <Ionicons color={tema.textoSecundario} name="close-circle" size={22} />
          </Pressable>
        ) : null}
      </View>
      {!esEdicion && errorDescripcion ? <Text style={estilosGlobales.textoError}>{errorDescripcion}</Text> : null}
      <Text style={estilosGlobales.textoAyuda}>
        {esEdicion
          ? 'Si la dejás vacía, se generará automáticamente con el nombre y el tipo.'
          : 'Si la dejás vacía, se genera automáticamente con el nombre y el tipo.'}
      </Text>
      {esEdicion && errorDescripcion ? <Text style={estilosGlobales.textoError}>{errorDescripcion}</Text> : null}
    </View>

  </>);
}
