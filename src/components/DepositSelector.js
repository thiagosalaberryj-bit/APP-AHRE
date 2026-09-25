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
  alSeleccionar,
  error,
}) {
  const [visible, establecerVisible] = useState(false);
  const seleccionado = depositos.find((deposito) => deposito.id === seleccionadoId);

  return (
    <View style={estilosMovimiento.grupo}>
      <Text style={estilosGlobales.etiqueta}>{etiqueta}</Text>
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
              {seleccionado ? seleccionado.nombre : 'Seleccioná un depósito'}
            </Text>
            <Text style={estilosMovimiento.saldoDeposito}>
              {seleccionado ? seleccionado.saldoTexto : 'Efectivo, Mercado Pago, cuenta bancaria'}
            </Text>
          </View>
          <Ionicons color={tema.textoPrincipal} name="chevron-down" size={24} />
        </Pressable>
      </View>
      {error ? (
        <Text style={[estilosGlobales.textoError, estilosMovimiento.errorCampo]}>{error}</Text>
      ) : null}
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
            {depositos.map((deposito) => {
              const activo = deposito.id === seleccionadoId;
              return (
                <Pressable
                  key={deposito.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activo }}
                  onPress={() => {
                    alSeleccionar(deposito.id);
                    establecerVisible(false);
                  }}
                  style={[
                    estilosMovimiento.opcionDeposito,
                    activo ? estilosMovimiento.opcionDepositoSeleccionada : null,
                  ]}
                >
                  <Ionicons
                    color={activo ? tema.foco : tema.textoSecundario}
                    name={activo ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                  />
                  <View style={estilosMovimiento.textoDeposito}>
                    <Text style={estilosMovimiento.nombreDeposito}>{deposito.nombre}</Text>
                    <Text style={estilosMovimiento.saldoDeposito}>{deposito.saldoTexto}</Text>
                  </View>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
