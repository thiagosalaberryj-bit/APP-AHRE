import type { Deposito, Movimiento, Recurrencia } from '../database/types';

export type CamposValidables = Record<string, unknown>;
export type ImporteEntrada = string | number;
export interface DatosRegistro { nombre: string; correo: string; contrasena: string; confirmacion: string; }
export type DatosIngreso = Pick<DatosRegistro, 'correo' | 'contrasena'> & { recordar?: boolean };
export type DatosPerfil = Pick<DatosRegistro, 'nombre' | 'correo'>;
export type DatosDeposito = {nombre:string;tipo:string | null;icono:string} & {
  saldo_inicial?: ImporteEntrada; descripcion?: string | null; color?: string | null;
};
export interface DatosMovimiento {
  monto: ImporteEntrada; descripcion: string; deposito_id: string | null; categoria: string | null;
  fecha: Date | string; hora: string; recurrente: boolean; frecuencia?: string;
}
export interface FiltrosHistorial {
  tipo?: string | null; categoriaIds?: string[] | null; depositoIds?: string[] | null;
  desde?: string | null; hasta?: string | null; montoMinimo?: number | null; montoMaximo?: number | null;
  texto?: string; busqueda?: string; cursor?: { fecha_hora: string; id: string } | null;
}
export type MovimientoVisible = Movimiento & { deposito_nombre?: string; deposito?: string };
