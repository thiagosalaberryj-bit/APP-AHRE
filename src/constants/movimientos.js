export const DEPOSITOS_SIMULADOS = Object.freeze([
  Object.freeze({ id: 'efectivo', nombre: 'Efectivo', saldoTexto: 'Saldo actual: $120.000' }),
  Object.freeze({ id: 'mercado-pago', nombre: 'Mercado Pago', saldoTexto: 'Saldo actual: $354.000' }),
  Object.freeze({ id: 'cuenta-bancaria', nombre: 'Cuenta bancaria', saldoTexto: 'Saldo actual: $890.000' }),
]);

export const CATEGORIAS_INGRESO = Object.freeze([
  Object.freeze({ id: 'sueldo', nombre: 'Sueldo', icono: 'cash-outline' }),
  Object.freeze({
    id: 'trabajo_independiente',
    nombre: 'Trabajo independiente',
    nombreCorto: 'Independ.',
    icono: 'briefcase-outline',
  }),
  Object.freeze({ id: 'ventas', nombre: 'Ventas', icono: 'storefront-outline' }),
  Object.freeze({
    id: 'transferencias_recibidas',
    nombre: 'Transferencias recibidas',
    nombreCorto: 'Transf.',
    icono: 'download-outline',
  }),
  Object.freeze({ id: 'devoluciones', nombre: 'Devoluciones', icono: 'return-up-back-outline' }),
  Object.freeze({ id: 'inversiones', nombre: 'Inversiones', icono: 'trending-up-outline' }),
  Object.freeze({ id: 'prestamos_recibidos', nombre: 'Préstamos recibidos', icono: 'card-outline' }),
  Object.freeze({ id: 'regalos', nombre: 'Regalos', icono: 'gift-outline' }),
  Object.freeze({ id: 'becas_ayudas', nombre: 'Becas / ayudas', icono: 'school-outline' }),
  Object.freeze({ id: 'otros_ingresos', nombre: 'Otros ingresos', icono: 'ellipsis-horizontal' }),
]);

export const CATEGORIAS_EGRESO = Object.freeze([
  Object.freeze({
    id: 'alimentacion',
    nombre: 'Alimentación',
    nombreCorto: 'Aliment.',
    icono: 'restaurant-outline',
  }),
  Object.freeze({
    id: 'transporte',
    nombre: 'Transporte',
    nombreCorto: 'Transp.',
    icono: 'car-outline',
  }),
  Object.freeze({ id: 'hogar', nombre: 'Hogar', icono: 'home-outline' }),
  Object.freeze({
    id: 'servicios',
    nombre: 'Servicios',
    nombreCorto: 'Serv.',
    icono: 'receipt-outline',
  }),
  Object.freeze({
    id: 'suscripciones',
    nombre: 'Suscripciones',
    nombreCorto: 'Suscrip.',
    icono: 'repeat-outline',
  }),
  Object.freeze({ id: 'salud', nombre: 'Salud', icono: 'medkit-outline' }),
  Object.freeze({ id: 'educacion', nombre: 'Educación', icono: 'school-outline' }),
  Object.freeze({
    id: 'entretenimiento',
    nombre: 'Entretenimiento',
    nombreCorto: 'Entreten.',
    icono: 'game-controller-outline',
  }),
  Object.freeze({ id: 'compras', nombre: 'Compras', icono: 'cart-outline' }),
  Object.freeze({ id: 'trabajo', nombre: 'Trabajo', icono: 'briefcase-outline' }),
  Object.freeze({ id: 'deudas', nombre: 'Deudas', icono: 'card-outline' }),
  Object.freeze({
    id: 'transferencias',
    nombre: 'Transferencias',
    nombreCorto: 'Transf.',
    icono: 'swap-horizontal-outline',
  }),
  Object.freeze({ id: 'impuestos', nombre: 'Impuestos', icono: 'document-text-outline' }),
  Object.freeze({ id: 'viajes', nombre: 'Viajes', icono: 'airplane-outline' }),
  Object.freeze({ id: 'regalos', nombre: 'Regalos', icono: 'gift-outline' }),
  Object.freeze({ id: 'mascotas', nombre: 'Mascotas', icono: 'paw-outline' }),
  Object.freeze({
    id: 'otros_gastos',
    nombre: 'Otros gastos',
    nombreCorto: 'Otros',
    icono: 'ellipsis-horizontal',
  }),
]);
