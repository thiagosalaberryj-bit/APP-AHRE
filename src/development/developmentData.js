// Datos ficticios y credenciales públicas, exclusivamente para desarrollo local.
// Eliminar junto con el acceso temporal de Inicio al terminar las pruebas.
import { COLORES_DEPOSITOS } from '../styles/colors';

export const CUENTA_PRUEBA = Object.freeze({
  nombre: 'Cuenta de pruebas',
  correo: 'pruebas@ahre.test',
  contrasena: 'AhrePruebas2026!',
});

export const DEPOSITOS_PRUEBA = Object.freeze([
  { clave: 'efectivo', nombre: 'Efectivo de prueba', tipo: 'efectivo', saldo_inicial: 120000, icono: 'cash-outline', color: COLORES_DEPOSITOS[0] },
  { clave: 'banco', nombre: 'Banco de prueba', tipo: 'banco', saldo_inicial: 350000, icono: 'business-outline', color: COLORES_DEPOSITOS[1] },
  { clave: 'billetera', nombre: 'Billetera de prueba', tipo: 'billetera_virtual', saldo_inicial: 80000, icono: 'wallet-outline', color: COLORES_DEPOSITOS[2] },
]);

export const MOVIMIENTOS_PRUEBA = Object.freeze([
  { clave: 'farmacia', deposito: 'efectivo', tipo: 'egreso', categoria: 'salud', monto: 3200, descripcion: 'Farmacia de prueba', dias: 6 },
  { clave: 'trabajo', deposito: 'billetera', tipo: 'ingreso', categoria: 'trabajo_independiente', monto: 45000, descripcion: 'Trabajo de prueba', dias: 5 },
  { clave: 'suscripcion', deposito: 'billetera', tipo: 'egreso', categoria: 'suscripciones', monto: 9000, descripcion: 'Suscripción de prueba', dias: 3 },
  { clave: 'sueldo', deposito: 'banco', tipo: 'ingreso', categoria: 'sueldo', monto: 300000, descripcion: 'Sueldo de prueba', dias: 2 },
  { clave: 'comida', deposito: 'efectivo', tipo: 'egreso', categoria: 'alimentacion', monto: 8500, descripcion: 'Comida de prueba', dias: 1 },
  { clave: 'transporte', deposito: 'efectivo', tipo: 'egreso', categoria: 'transporte', monto: 1500, descripcion: 'Transporte de prueba', dias: 0 },
]);
