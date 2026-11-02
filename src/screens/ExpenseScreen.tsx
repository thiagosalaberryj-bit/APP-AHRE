import { FormularioMovimiento } from './IncomeScreen';

export default function PantallaEgreso(propiedades: import('../navigation/types').PropiedadesPantalla) {
  return <FormularioMovimiento {...propiedades} tipo="egreso" />;
}
