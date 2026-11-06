// Datos ficticios y credenciales públicas, exclusivamente para desarrollo local.
// Eliminar junto con el acceso temporal de Inicio al terminar las pruebas.
import { COLORES_DEPOSITOS } from '../styles/colors';
import { CATEGORIAS_EGRESO, CATEGORIAS_INGRESO } from '../constants/movimientos';

export const CUENTA_PRUEBA = Object.freeze({
  nombre: 'Cuenta de pruebas',
  correo: 'pruebas@ahre.test',
  contrasena: 'AhrePruebas2026!',
});

export const DEPOSITOS_PRUEBA: readonly (Omit<import('../database/types').Deposito,'id'|'usuario_id'|'saldo_actual'|'activo'|'descripcion'|'fecha_creacion'|'fecha_actualizacion'> & {clave:string})[] = Object.freeze([
  { clave: 'efectivo', nombre: 'Efectivo de prueba', tipo: 'efectivo', saldo_inicial: 120000, icono: 'cash-outline', color: COLORES_DEPOSITOS[0] },
  { clave: 'banco', nombre: 'Banco de prueba', tipo: 'banco', saldo_inicial: 350000, icono: 'business-outline', color: COLORES_DEPOSITOS[1] },
  { clave: 'billetera', nombre: 'Billetera de prueba', tipo: 'billetera_virtual', saldo_inicial: 80000, icono: 'wallet-outline', color: COLORES_DEPOSITOS[2] },
]);

const MOVIMIENTOS_BASE_PRUEBA: readonly (Pick<import('../database/types').Movimiento,'tipo'|'categoria'|'monto'|'descripcion'> & {clave:string;deposito:string;dias:number})[] = Object.freeze([
  { clave: 'farmacia', deposito: 'efectivo', tipo: 'egreso', categoria: 'salud', monto: 3200, descripcion: 'Farmacia de prueba', dias: 6 },
  { clave: 'trabajo', deposito: 'billetera', tipo: 'ingreso', categoria: 'trabajo_independiente', monto: 45000, descripcion: 'Trabajo de prueba', dias: 5 },
  { clave: 'suscripcion', deposito: 'billetera', tipo: 'egreso', categoria: 'suscripciones', monto: 9000, descripcion: 'Suscripción de prueba', dias: 3 },
  { clave: 'sueldo', deposito: 'banco', tipo: 'ingreso', categoria: 'sueldo', monto: 300000, descripcion: 'Sueldo de prueba', dias: 2 },
  { clave: 'comida', deposito: 'efectivo', tipo: 'egreso', categoria: 'alimentacion', monto: 8500, descripcion: 'Comida de prueba', dias: 1 },
  { clave: 'transporte', deposito: 'efectivo', tipo: 'egreso', categoria: 'transporte', monto: 1500, descripcion: 'Transporte de prueba', dias: 0 },
]);

// Seis meses de actividad para revisar listas, gráficos y filtros sin alterar
// el saldo neto de los ejemplos originales. Cada gasto tiene una financiación
// ficticia del mismo importe y depósito; ambos son movimientos independientes.
const IMPORTES_ESTADISTICAS = [450, 1000, 1850.5, 3200, 5000, 8750.75, 15600, 42350, 125000, 1250000];
const movimientosEstadisticas = Array.from({ length: 6 }, (_, mes) =>
  CATEGORIAS_EGRESO.flatMap((categoria, indice) => {
    const orden = mes * CATEGORIAS_EGRESO.length + indice;
    const ingreso = CATEGORIAS_INGRESO[orden % CATEGORIAS_INGRESO.length];
    const deposito = DEPOSITOS_PRUEBA[indice % DEPOSITOS_PRUEBA.length].clave;
    const monto = IMPORTES_ESTADISTICAS[orden % IMPORTES_ESTADISTICAS.length];
    const dias = mes * 30 + indice + (indice % 5) / 24;
    const clave = 'estadisticas-v1-' + mes + '-' + categoria.id;
    return [
      { clave: clave + '-ingreso', deposito, tipo: 'ingreso' as const, categoria: ingreso.id, monto, descripcion: ingreso.nombre + ' · ejemplo ampliado', dias },
      { clave: clave + '-egreso', deposito, tipo: 'egreso' as const, categoria: categoria.id, monto, descripcion: categoria.nombre + ' · ejemplo ampliado', dias },
    ];
  }),
).flat();

export const MOVIMIENTOS_PRUEBA = Object.freeze([...MOVIMIENTOS_BASE_PRUEBA, ...movimientosEstadisticas]);

export const PERSONAS_PRUEBA = [
  { clave: 'ana', nombre: 'Ana', apellido: 'García', apodo: 'Ani' },
  { clave: 'bruno', nombre: 'Bruno', apellido: 'Pérez', apodo: 'Bru' },
  { clave: 'carla', nombre: 'Carla', apellido: 'López', apodo: 'Carli' },
] as const;

type ClavePersonaPrueba = 'vos' | typeof PERSONAS_PRUEBA[number]['clave'];
interface GastoPrueba {
  clave: string; descripcion: string; monto: number; pagador: ClavePersonaPrueba;
  reparto: 'iguales' | 'manual'; involucradas: ClavePersonaPrueba[];
  pagaron: ClavePersonaPrueba[]; montosManuales?: Partial<Record<ClavePersonaPrueba, number>>;
}
export const GASTOS_SALA_PRUEBA: readonly GastoPrueba[] = [
  { clave: 'cena', descripcion: 'Cena compartida de prueba', monto: 12000, pagador: 'vos', reparto: 'iguales', involucradas: ['vos', 'ana', 'bruno', 'carla'], pagaron: ['ana'] },
  { clave: 'taxi', descripcion: 'Taxi de regreso de prueba', monto: 6000, pagador: 'bruno', reparto: 'iguales', involucradas: ['vos', 'bruno', 'carla'], pagaron: [] },
  { clave: 'compras', descripcion: 'Compras con reparto manual', monto: 10000, pagador: 'vos', reparto: 'manual', involucradas: ['vos', 'ana', 'bruno', 'carla'], pagaron: ['bruno', 'carla'], montosManuales: { vos: 2000, ana: 3500, bruno: 1500, carla: 3000 } },
  { clave: 'cafe', descripcion: 'Café ya pagado de prueba', monto: 1500, pagador: 'carla', reparto: 'iguales', involucradas: ['vos', 'carla'], pagaron: ['vos'] },
];
