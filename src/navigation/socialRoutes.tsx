import PantallaSalas from '../screens/SocialRoomsScreen';
import PantallaSala from '../screens/SocialRoomScreen';
import PantallaPersonas from '../screens/SocialPeopleScreen';
import PantallaDeudas from '../screens/SocialDebtsScreen';
import PantallaDetalleDeuda from '../screens/SocialDebtScreen';
import PantallaCrearSala from '../screens/SocialCreateRoomScreen';
import PantallaRegistrarDeuda from '../screens/SocialRegisterDebtScreen';
import PantallaRegistrarGasto from '../screens/SocialRegisterExpenseScreen';
import PantallaEliminarDeuda from '../screens/SocialDeleteDebtScreen';
import PantallaRegistrarPago from '../screens/SocialRegisterPaymentScreen';
import PantallaCerrarSala from '../screens/SocialCloseRoomScreen';
import PantallaRegistroInvalido from '../screens/SocialInvalidRecordScreen';
export function RutaSalas(propiedades: import('./types').PropiedadesPantalla) {
  const Pantalla = propiedades.route.params?.salaId ? PantallaSala : PantallaSalas;
  return <Pantalla {...propiedades} />;
}
export function RutaPersonas(propiedades: import('./types').PropiedadesPantalla) {
  const Pantalla = propiedades.route.params?.todas === true ? PantallaPersonas : PantallaDeudas;
  return <Pantalla {...propiedades} />;
}
const REGISTROS = {
  crear: PantallaCrearSala,
  persona: PantallaPersonas,
  deuda: PantallaRegistrarDeuda,
  gasto: PantallaRegistrarGasto,
  eliminarDeuda: PantallaEliminarDeuda,
  pago: PantallaRegistrarPago,
  cerrar: PantallaCerrarSala,
  detalleDeuda: PantallaDetalleDeuda
};
export function RutaRegistro(propiedades: import('./types').PropiedadesPantalla) {
  const Pantalla = REGISTROS[propiedades.route.params?.tipo as keyof typeof REGISTROS] || PantallaRegistroInvalido;
  return <Pantalla {...propiedades} />;
}
