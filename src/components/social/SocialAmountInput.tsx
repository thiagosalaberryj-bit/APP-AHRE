import type { AspectoSocial } from '../../social/types';
import { useState } from 'react';
import EntradaMonto from '../MoneyInput';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
export default function MontoSocial(propiedades: import('../../social/types').AspectoSocial & ({etiqueta:string;valor:string;alCambiar:(valor:string)=>void})) {
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
