import { useState } from 'react';
import EntradaMonto from '../MoneyInput';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
export default function MontoSocial(propiedades) {
  const {
    etiqueta,
    valor,
    alCambiar,
    ...aspecto
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema)
    }
  };
  const [monto, establecerMonto] = useState('');
  const cambiarMonto = alCambiar || establecerMonto;
  return <EntradaMonto etiqueta={etiqueta} valor={valor === undefined ? monto : valor} alCambiarTexto={cambiarMonto} alLimpiar={() => cambiarMonto('')} {...aspecto} />;
}
