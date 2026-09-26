import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, Text, View } from 'react-native';
import {
  COLOR_DEPOSITO_PREDETERMINADO,
  COLOR_ICONO_DEPOSITO,
  COLORES_DEPOSITOS,
} from '../styles/colors';

const ESTILOS_ICONOS_DEPOSITO = Object.freeze({
  efectivo: Object.freeze({ color: COLOR_DEPOSITO_PREDETERMINADO, icono: 'cash-outline' }),
  'mercado-pago': Object.freeze({ color: COLORES_DEPOSITOS[1], icono: 'phone-portrait-outline' }),
  'cuenta-bancaria': Object.freeze({ color: COLORES_DEPOSITOS[2], icono: 'business-outline' }),
  banco: Object.freeze({ color: COLORES_DEPOSITOS[2], icono: 'business-outline' }),
});

export default function SelectorDeposito({
  tema,
  estilosGlobales,
  estilosMovimiento,
  etiqueta = 'Depósito',
  depositos,
  seleccionadoId,
  alSeleccionar = () => {},
  seleccionMultiple = false,
  seleccionadasIds = [],
  alCambiarMulti = () => {},
  enLinea = false,
  error,
}) {
  const [visible, establecerVisible] = useState(false);
  const seleccionado = depositos.find((deposito) => deposito.id === seleccionadoId);

  const depositoActivo = (depositoId) => (seleccionMultiple
    ? seleccionadasIds.includes(depositoId)
    : seleccionadoId === depositoId);

  const seleccionarDeposito = (depositoId, cerrar = true) => {
    if (seleccionMultiple) {
      const activo = seleccionadasIds.includes(depositoId);
      if (enLinea && activo && seleccionadasIds.length === 1) return;
      alCambiarMulti(activo
        ? seleccionadasIds.filter((id) => id !== depositoId)
        : [...seleccionadasIds, depositoId]);
      return;
    }
    alSeleccionar(depositoId);
    if (cerrar) establecerVisible(false);
  };

  const mostrarOpcion = (deposito) => {
    const activo = depositoActivo(deposito.id);
    const opcionFiltro = seleccionMultiple && enLinea;
    const bloqueada = opcionFiltro && activo && seleccionadasIds.length === 1;
    const estiloIconoDeposito = ESTILOS_ICONOS_DEPOSITO[deposito.id]
      || { color: COLOR_DEPOSITO_PREDETERMINADO, icono: 'wallet-outline' };
    return (
      <Pressable
        key={deposito.id}
        accessibilityRole={seleccionMultiple ? 'checkbox' : 'button'}
        accessibilityState={seleccionMultiple
          ? { checked: activo, disabled: bloqueada }
          : { selected: activo }}
        accessibilityHint={bloqueada ? 'Seleccioná otro depósito antes de quitar este.' : undefined}
        disabled={bloqueada}
        onPress={() => {
          if (!bloqueada) seleccionarDeposito(deposito.id);
        }}
        style={[
          opcionFiltro ? estilosMovimiento.opcionDepositoFiltro : estilosMovimiento.opcionDeposito,
          !opcionFiltro && activo ? estilosMovimiento.opcionDepositoSeleccionada : null,
        ]}
      >
        {opcionFiltro ? (
          <View
            style={[
              estilosMovimiento.iconoDepositoFiltro,
              { backgroundColor: estiloIconoDeposito.color },
            ]}
          >
            <Ionicons color={COLOR_ICONO_DEPOSITO} name={estiloIconoDeposito.icono} size={20} />
          </View>
        ) : (
          <Ionicons
            color={activo ? tema.foco : tema.textoSecundario}
            name={seleccionMultiple
              ? (activo ? 'checkbox' : 'square-outline')
              : (activo ? 'radio-button-on' : 'radio-button-off')}
            size={20}
          />
        )}
        <View style={estilosMovimiento.textoDeposito}>
          <Text style={estilosMovimiento.nombreDeposito}>{deposito.nombre}</Text>
          <Text style={estilosMovimiento.saldoDeposito}>{deposito.saldoTexto}</Text>
        </View>
        {opcionFiltro ? (
          <View style={estilosMovimiento.seleccionDepositoFiltro}>
            <Ionicons
              color={activo ? tema.foco : tema.borde}
              name={activo ? 'checkbox' : 'square-outline'}
              size={22}
            />
            {bloqueada ? (
              <Ionicons color={tema.textoSecundario} name="lock-closed" size={14} />
            ) : null}
          </View>
        ) : null}
      </Pressable>
    );
  };

  const textoBoton = seleccionMultiple
    ? (seleccionadasIds.length === 0
      ? 'Todos los depósitos'
      : `${seleccionadasIds.length} depósito${seleccionadasIds.length > 1 ? 's' : ''}`)
    : (seleccionado ? seleccionado.nombre : 'Seleccioná un depósito');
  const textoAyuda = seleccionMultiple
    ? (seleccionadasIds.length === 0
      ? 'Efectivo, Mercado Pago, cuenta bancaria'
      : depositos.filter((deposito) => seleccionadasIds.includes(deposito.id)).map((deposito) => deposito.nombre).join(', '))
    : (seleccionado ? seleccionado.saldoTexto : 'Efectivo, Mercado Pago, cuenta bancaria');

  return (
    <View style={estilosMovimiento.grupo}>
      {etiqueta ? <Text style={estilosGlobales.etiqueta}>{etiqueta}</Text> : null}
      {enLinea ? (
        <View style={seleccionMultiple ? estilosMovimiento.listaDepositosFiltro : estilosMovimiento.listaDepositos}>
          {seleccionMultiple ? (
            <View style={estilosMovimiento.accionesDepositosFiltro}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Seleccionar todos los depósitos"
                onPress={() => alCambiarMulti(depositos.map((deposito) => deposito.id))}
              >
                <Text style={estilosMovimiento.textoAccionDepositoFiltro}>Todos</Text>
              </Pressable>
            </View>
          ) : null}
          {depositos.map((deposito) => mostrarOpcion(deposito))}
        </View>
      ) : (
      <View style={estilosMovimiento.tarjetaDeposito}>
        <Pressable
          accessibilityLabel={etiqueta}
          accessibilityRole="button"
          accessibilityState={{ expanded: visible }}
          onPress={() => establecerVisible(true)}
          style={({ pressed: presionado }) => [
            estilosMovimiento.botonDeposito,
            visible ? estilosMovimiento.botonDepositoEnfocado : null,
            error && !seleccionadoId ? estilosMovimiento.botonDepositoError : null,
            presionado ? { opacity: 0.85 } : null,
          ]}
        >
          <View style={estilosMovimiento.iconoDeposito}>
            <Ionicons color={tema.textoSecundario} name="wallet-outline" size={28} />
          </View>
          <View style={estilosMovimiento.textoDeposito}>
            <Text style={estilosMovimiento.nombreDeposito}>
              {textoBoton}
            </Text>
            <Text style={estilosMovimiento.saldoDeposito}>
              {textoAyuda}
            </Text>
          </View>
          <Ionicons color={tema.textoPrincipal} name="chevron-down" size={24} />
        </Pressable>
      </View>
      )}
      {error ? (
        <Text style={[estilosGlobales.textoError, estilosMovimiento.errorCampo]}>{error}</Text>
      ) : null}
      {enLinea ? null : (
      <Modal
        animationType="fade"
        onRequestClose={() => establecerVisible(false)}
        transparent
        visible={visible}
      >
        <Pressable
          accessibilityLabel="Cerrar selector de depósito"
          onPress={() => establecerVisible(false)}
          style={estilosMovimiento.fondoSuperpuesto}
        >
          <Pressable style={estilosMovimiento.tarjetaSuperpuesta}>
            {depositos.map((deposito) => mostrarOpcion(deposito))}
          </Pressable>
        </Pressable>
      </Modal>
      )}
    </View>
  );
}
