import type { SQLiteDatabase, SQLiteBindValue } from 'expo-sqlite';

export type Conexion = SQLiteDatabase;
export type ErroresCampos = Record<string, string>;
export type ValorFiltro = SQLiteBindValue | boolean;
export type Filtros = Record<string, ValorFiltro | ValorFiltro[]>;
export interface OpcionesConsulta {
  ordenarPor?: string;
  direccion?: string;
  limite?: number;
  desplazamiento?: number;
}

export interface Usuario {
  id: string;
  nombre: string;
  correo_electronico: string;
  activo: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface CredencialUsuario {
  usuario_id: string;
  contrasena_verificador: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface Deposito {
  id: string;
  usuario_id: string;
  nombre: string;
  tipo: 'efectivo' | 'banco' | 'billetera_virtual';
  saldo_inicial: number;
  saldo_actual: number;
  icono: string;
  color: string | null;
  descripcion: string | null;
  activo: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface HistorialSaldoDeposito {
  id: string;
  deposito_id: string;
  saldo_anterior: number;
  saldo_informado: number;
  descripcion: string | null;
  fecha_hora: string;
}

export interface MovimientoHistorial extends Movimiento {
  deposito_nombre: string;
  deposito_tipo: Deposito['tipo'];
  deposito_icono: string;
  deposito_color: string | null;
  frecuencia: Recurrencia['frecuencia'] | null;
  recurrente: 0 | 1;
}

export interface Preferencias {
  id: string;
  usuario_id: string;
  deposito_predeterminado_id: string | null;
  notificaciones_activas: number;
  idioma: 'es' | 'en';
  apariencia: 'sistema' | 'claro' | 'oscuro';
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface Recurrencia {
  id: string;
  deposito_id: string;
  categoria: string;
  tipo: 'ingreso' | 'egreso';
  monto: number;
  descripcion: string;
  frecuencia: 'diaria' | 'semanal' | 'mensual' | 'anual';
  fecha_inicio: string;
  fecha_fin: string | null;
  proxima_ejecucion: string;
  activa: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface Transferencia {
  id: string;
  usuario_id: string;
  deposito_origen_id: string;
  deposito_destino_id: string;
  monto: number;
  fecha_hora: string;
  descripcion: string | null;
  anulada: number;
  reversion_de_id: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface Movimiento {
  id: string;
  deposito_id: string;
  categoria: string;
  recurrencia_id: string | null;
  transferencia_id: string | null;
  tipo: 'ingreso' | 'egreso' | 'transferencia_salida' | 'transferencia_entrada';
  monto: number;
  descripcion: string;
  fecha_hora: string;
  anulado: number;
  reversion_de_id: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface Persona {
  id: string;
  usuario_id: string;
  nombre: string;
  apellido: string | null;
  apodo: string | null;
  nombre_normalizado: string;
  apellido_normalizado: string | null;
  apodo_normalizado: string | null;
  correo_electronico: string | null;
  es_usuario_actual: number;
  activa: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface Sala {
  id: string;
  usuario_id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  icono: string;
  color: string;
  fecha: string;
  estado: 'abierta' | 'cerrada';
  fecha_cierre: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface PersonaSala {
  id: string;
  usuario_id: string;
  sala_id: string;
  persona_id: string;
  activa: number;
  fecha_alta: string;
  fecha_baja: string | null;
}

export interface GastoCompartido {
  id: string;
  usuario_id: string;
  sala_id: string;
  pagador_id: string;
  descripcion: string;
  monto_total: number;
  fecha: string;
  reparto: 'iguales' | 'manual';
  plan_pagos: string;
  estado: 'vigente' | 'cancelado';
  version: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface ParticipanteGasto {
  id: string;
  usuario_id: string;
  gasto_compartido_id: string;
  persona_id: string;
  monto_correspondiente: number;
  orden: number;
}

export interface Deuda {
  id: string;
  usuario_id: string;
  deudor_id: string;
  acreedor_id: string;
  participante_gasto_id: string | null;
  monto: number;
  descripcion: string;
  fecha: string;
  fecha_vencimiento: string | null;
  estado: 'pendiente' | 'parcial' | 'pagada' | 'cancelada';
  fecha_cancelacion: string | null;
  motivo_cancelacion: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface PagoSocial {
  id: string;
  usuario_id: string;
  clase: 'compra' | 'parte' | 'deuda' | 'origen_deuda';
  gasto_compartido_id: string | null;
  participante_gasto_id: string | null;
  deuda_id: string | null;
  monto: number;
  fecha: string;
  descripcion: string | null;
  movimiento_id: string | null;
  clave_operacion: string;
  estado: 'vigente' | 'anulado';
  fecha_anulacion: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface Tablas {
  usuarios: Usuario;
  credenciales_usuario: CredencialUsuario;
  depositos: Deposito;
  historial_saldos_deposito: HistorialSaldoDeposito;
  preferencias: Preferencias;
  recurrencias: Recurrencia;
  transferencias: Transferencia;
  movimientos: Movimiento;
  personas: Persona;
  salas: Sala;
  personas_sala: PersonaSala;
  gastos_compartidos: GastoCompartido;
  participantes_gasto: ParticipanteGasto;
  deudas: Deuda;
  pagos_sociales: PagoSocial;
}
