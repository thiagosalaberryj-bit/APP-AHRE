import { forwardRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

import CampoAutenticacion from './AuthInput';

export default forwardRef(function CampoContrasena(propiedades, ref) {
  const [visible, establecerVisible] = useState(false);
  const { estilosAutenticacion, deshabilitado = false, tema } = propiedades;

  return (
    <CampoAutenticacion
      ref={ref}
      {...propiedades}
      autoCapitalize="none"
      autoComplete={propiedades.autoComplete || 'password'}
      accesorioDerecho={(
        <Pressable
          accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          accessibilityRole="button"
          accessibilityState={{ disabled: deshabilitado }}
          disabled={deshabilitado}
          hitSlop={8}
          onPress={() => establecerVisible((actual) => !actual)}
          style={estilosAutenticacion.accionContrasena}
        >
          <Ionicons
            color={deshabilitado ? tema.deshabilitado : tema.textoSecundario}
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={21}
          />
        </Pressable>
      )}
      secureTextEntry={!visible}
    />
  );
});
