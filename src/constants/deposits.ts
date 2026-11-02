export const TIPOS_DEPOSITO = Object.freeze([
  Object.freeze({ id: 'efectivo', nombre: 'Efectivo', icono: 'cash-outline' }),
  Object.freeze({ id: 'banco', nombre: 'Banco', icono: 'business-outline' }),
  Object.freeze({ id: 'billetera_virtual', nombre: 'Billetera virtual', icono: 'phone-portrait-outline' }),
]);

export const ICONOS_DEPOSITO = Object.freeze([
  Object.freeze({ id: 'cash-outline', nombre: 'Efectivo' }),
  Object.freeze({ id: 'business-outline', nombre: 'Banco' }),
  Object.freeze({ id: 'phone-portrait-outline', nombre: 'Billetera virtual', nombreCorto: 'Virtual' }),
  Object.freeze({ id: 'wallet-outline', nombre: 'Billetera' }),
  Object.freeze({ id: 'card-outline', nombre: 'Tarjeta' }),
  Object.freeze({ id: 'briefcase-outline', nombre: 'Ahorros', nombreCorto: 'Ahorro' }),
]);

export const ICONOS_PRINCIPALES_DEPOSITO = Object.freeze(ICONOS_DEPOSITO.slice(0, 4));
export const ICONOS_ADICIONALES_DEPOSITO = Object.freeze(ICONOS_DEPOSITO.slice(4));
