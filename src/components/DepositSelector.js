import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, Text, View } from 'react-native';

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
    return (
      <Pressable
        key={deposito.id}
        accessibilityRole="button"
        accessibilityState={{ selected: activo }}
        onPress={() => seleccionarDeposito(deposito.id)}
        style={[
          estilosMovimiento.opcionDeposito,
          activo ? estilosMovimiento.opcionDepositoSeleccionada : null,
        ]}
      >
        <Ionicons
          color={activo ? tema.foco : tema.textoSecundario}
          name={seleccionMultiple
            ? (activo ? 'checkbox' : 'checkbox-outline')
            : (activo ? 'radio-button-on' : 'radio-button-off')}
          size={20}
        />
        <View style={estilosMovimiento.textoDeposito}>
          <Text style={estilosMovimiento.nombreDeposito}>{deposito.nombre}</Text>
          <Text style={estilosMovimiento.saldoDeposito}>{deposito.saldoTexto}</Text>
        </View>
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
      <Text style={estilosGlobales.etiqueta}>{etiqueta}</Text>
      {enLinea ? (
        <View style={estilosMovimiento.listaDepositos}>
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
