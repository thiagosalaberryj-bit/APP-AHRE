export interface OperacionMp {
  id: string; monto: number; moneda: string; descripcion: string; fecha: string; actualizado: string;
  estado: string; tipo: 'ingreso' | 'egreso' | null; categoria: string; contraparte: string | null;
  registrable: boolean; version: string; decision: 'pendiente' | 'registrado' | 'ignorado';
  movimientoId: string | null; revisionPendiente: boolean; huella: string;
  provisional?: boolean; pendienteConfirmacion?: boolean;
  origenSettlement?: 'search' | 'reporte' | 'ambos'; consultaSettlement?: string;
}
export interface VinculacionMp { deposito_id: string; cuenta_id: string; version: string; activa: number; meses: number; desde: string | null; hasta: string | null; error: string | null; }
export interface EstadoMp {
  identificacionDisponible?: boolean;
  settlement?: boolean;
  vinculacion: VinculacionMp | null; configurada: boolean; manualesRestantes: number;
  automatica?: { zona: string; usadaHoy: boolean; proximaDisponible: string };
  trabajo: { id: string; estado: string; desde: string; hasta: string; inicial: number; total: number; truncado: number; primera_fecha: string | null; error: string | null; soloIdentificacion?: number; procesados?: number;
    settlement?: {etapa: 'search' | 'configuracion' | 'reporte' | 'conciliacion'; conciliados: number; tramos: number}; } | null;
}
export function consultaMpEnCurso(trabajo: EstadoMp['trabajo']) {
  return trabajo?.estado === 'pendiente' || trabajo?.estado === 'procesando';
}
export function vistaPreviaMp(trabajo: EstadoMp['trabajo']) {
  return !trabajo?.soloIdentificacion && (consultaMpEnCurso(trabajo) || !!trabajo?.settlement && trabajo.estado === 'fallido');
}
export interface ConsultaMp {
  id: string; clase: 'automatica' | 'manual'; estado: string; desde: string; hasta: string;
  total: number; truncado: number; primera_fecha: string | null; error: string | null; creado: number;
}
export interface BorradorMp { tipo: 'ingreso' | 'egreso' | null; categoria: string; descripcion?: string; }
