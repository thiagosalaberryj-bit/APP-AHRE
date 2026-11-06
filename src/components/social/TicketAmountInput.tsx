import EntradaMonto from '../MoneyInput';
import crearEstilosPropios from '../../styles/social/TicketAmountInputStyles';

export default function ImporteTicket({ etiqueta, valor, alCambiar, tema, estilosGlobales }: import('../../social/types').AspectoSocial & {etiqueta:string;valor:string;alCambiar:(valor:string)=>void}) {
  const estilos = crearEstilosPropios(tema);
  return <EntradaMonto tema={tema} estilosGlobales={estilosGlobales}
    etiqueta={etiqueta} valor={valor} alCambiarTexto={alCambiar}
    mostrarEtiqueta={false} mostrarLimpiar={false} compacto
    estiloContenedor={estilos.campoImporteTicket}
    estiloSimbolo={estilos.simboloTicket} estiloEntrada={estilos.entradaImporteTicket}/>;
}
