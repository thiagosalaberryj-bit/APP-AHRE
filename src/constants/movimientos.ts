import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type NombreIcono = ComponentProps<typeof Ionicons>['name'];
export interface Categoria { id: string; nombre: string; nombreCorto?: string; descripcion: string; icono: NombreIcono; }

export const DEPOSITOS_SIMULADOS = Object.freeze([
  Object.freeze({ id: 'efectivo', nombre: 'Efectivo', saldoTexto: 'Saldo actual: $120.000' }),
  Object.freeze({ id: 'mercado-pago', nombre: 'Mercado Pago', saldoTexto: 'Saldo actual: $354.000' }),
  Object.freeze({ id: 'cuenta-bancaria', nombre: 'Cuenta bancaria', saldoTexto: 'Saldo actual: $890.000' }),
]);

export const CATEGORIAS_INGRESO: readonly Categoria[] = Object.freeze([
  Object.freeze({
    id: 'sueldo',
    nombre: 'Sueldo',
    descripcion: 'Ingresos recibidos por empleo en relación de dependencia.',
    icono: 'cash-outline',
  }),
  Object.freeze({
    id: 'trabajo_independiente',
    nombre: 'Trabajo independiente',
    nombreCorto: 'Independ.',
    descripcion: 'Ingresos por servicios o trabajos realizados por cuenta propia.',
    icono: 'briefcase-outline',
  }),
  Object.freeze({
    id: 'ventas',
    nombre: 'Ventas',
    descripcion: 'Dinero recibido por la venta de productos.',
    icono: 'storefront-outline',
  }),
  Object.freeze({
    id: 'transferencias_recibidas',
    nombre: 'Transferencias recibidas',
    nombreCorto: 'Transf.',
    descripcion: 'Dinero enviado desde otra cuenta o persona.',
    icono: 'download-outline',
  }),
  Object.freeze({
    id: 'devoluciones',
    nombre: 'Devoluciones',
    descripcion: 'Reintegros y devoluciones de compras o pagos.',
    icono: 'return-up-back-outline',
  }),
  Object.freeze({
    id: 'inversiones',
    nombre: 'Inversiones',
    descripcion: 'Rendimientos y ganancias de inversiones.',
    icono: 'trending-up-outline',
  }),
  Object.freeze({
    id: 'prestamos_recibidos',
    nombre: 'Préstamos recibidos',
    descripcion: 'Dinero recibido en calidad de préstamo.',
    icono: 'card-outline',
  }),
  Object.freeze({
    id: 'regalos',
    nombre: 'Regalos',
    descripcion: 'Dinero recibido como regalo.',
    icono: 'gift-outline',
  }),
  Object.freeze({
    id: 'becas_ayudas',
    nombre: 'Becas / ayudas',
    descripcion: 'Becas, subsidios y otras ayudas económicas.',
    icono: 'school-outline',
  }),
  Object.freeze({
    id: 'otros_ingresos',
    nombre: 'Otros ingresos',
    descripcion: 'Ingresos que no corresponden a otra categoría.',
    icono: 'ellipsis-horizontal',
  }),
]);

export const CATEGORIAS_EGRESO: readonly Categoria[] = Object.freeze([
  Object.freeze({
    id: 'alimentacion',
    nombre: 'Alimentación',
    nombreCorto: 'Aliment.',
    descripcion: 'Compras de alimentos y comidas.',
    icono: 'restaurant-outline',
  }),
  Object.freeze({
    id: 'transporte',
    nombre: 'Transporte',
    nombreCorto: 'Transp.',
    descripcion: 'Viajes, transporte público y combustible.',
    icono: 'car-outline',
  }),
  Object.freeze({
    id: 'hogar',
    nombre: 'Hogar',
    descripcion: 'Vivienda, mantenimiento y artículos del hogar.',
    icono: 'home-outline',
  }),
  Object.freeze({
    id: 'servicios',
    nombre: 'Servicios',
    nombreCorto: 'Serv.',
    descripcion: 'Luz, agua, gas, internet y otros servicios.',
    icono: 'receipt-outline',
  }),
  Object.freeze({
    id: 'suscripciones',
    nombre: 'Suscripciones',
    nombreCorto: 'Suscrip.',
    descripcion: 'Pagos recurrentes de plataformas y servicios digitales.',
    icono: 'repeat-outline',
  }),
  Object.freeze({
    id: 'salud',
    nombre: 'Salud',
    descripcion: 'Consultas, medicamentos y gastos de salud.',
    icono: 'medkit-outline',
  }),
  Object.freeze({
    id: 'educacion',
    nombre: 'Educación',
    descripcion: 'Cursos, materiales y otros gastos educativos.',
    icono: 'school-outline',
  }),
  Object.freeze({
    id: 'entretenimiento',
    nombre: 'Entretenimiento',
    nombreCorto: 'Entreten.',
    descripcion: 'Actividades recreativas, salidas y espectáculos.',
    icono: 'game-controller-outline',
  }),
  Object.freeze({
    id: 'compras',
    nombre: 'Compras',
    descripcion: 'Ropa, tecnología y compras personales.',
    icono: 'cart-outline',
  }),
  Object.freeze({
    id: 'trabajo',
    nombre: 'Trabajo',
    descripcion: 'Herramientas, materiales y gastos para trabajar.',
    icono: 'briefcase-outline',
  }),
  Object.freeze({
    id: 'deudas',
    nombre: 'Deudas',
    descripcion: 'Pagos y cancelaciones de deudas.',
    icono: 'card-outline',
  }),
  Object.freeze({
    id: 'transferencias',
    nombre: 'Transferencias',
    nombreCorto: 'Transf.',
    descripcion: 'Dinero enviado a otra cuenta o persona.',
    icono: 'swap-horizontal-outline',
  }),
  Object.freeze({
    id: 'impuestos',
    nombre: 'Impuestos',
    descripcion: 'Impuestos, tasas y obligaciones fiscales.',
    icono: 'document-text-outline',
  }),
  Object.freeze({
    id: 'viajes',
    nombre: 'Viajes',
    descripcion: 'Alojamiento, pasajes y gastos de viaje.',
    icono: 'airplane-outline',
  }),
  Object.freeze({
    id: 'regalos',
    nombre: 'Regalos',
    descripcion: 'Compras de regalos para otras personas.',
    icono: 'gift-outline',
  }),
  Object.freeze({
    id: 'mascotas',
    nombre: 'Mascotas',
    descripcion: 'Alimentos, veterinaria y cuidados para mascotas.',
    icono: 'paw-outline',
  }),
  Object.freeze({
    id: 'otros_gastos',
    nombre: 'Otros gastos',
    nombreCorto: 'Otros',
    descripcion: 'Gastos que no corresponden a otra categoría.',
    icono: 'ellipsis-horizontal',
  }),
]);
