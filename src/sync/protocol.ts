// Orden de dependencias para incorporar datos de una cuenta local existente.
export const TABLAS_SYNC = ['usuarios', 'depositos', 'historial_saldos_deposito', 'preferencias', 'recurrencias', 'transferencias', 'movimientos', 'ejecuciones_recurrencia', 'personas', 'salas', 'personas_sala', 'gastos_compartidos', 'participantes_gasto', 'deudas', 'pagos_sociales'] as const;
export type TablaSync = typeof TABLAS_SYNC[number];
export type FilaSync = Record<string, string | number | null>;
export interface CambioSync { tabla: TablaSync; accion: 'guardar' | 'eliminar'; datos: FilaSync; }
export interface LoteSync { id: string; base: number; generacion:number; cambios: CambioSync[]; }
export interface VersionSync { revision: number; lote: LoteSync; }

export interface ReparacionPerfil {
  usuarioId: string; lote: string; correoAnterior: string; correoNuevo: string; huella: string;
}
