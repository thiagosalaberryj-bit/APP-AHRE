import type { Tema } from '../styles/colors';
import type { crearEstilosGlobales } from '../styles/globalStyles';
import type { crearEstilosEgreso } from '../styles/expenseStyles';
import type { GastoCompartido, PagoSocial } from '../database/types';

export interface AspectoSocial {
  tema: Tema;
  estilosGlobales: ReturnType<typeof crearEstilosGlobales>;
  estilosMovimiento: ReturnType<typeof crearEstilosEgreso>;
}

export interface Financiacion {
  depositoId?: string | null;
  movimientoId?: string | null;
  depositoNombre?: string;
  fecha?: string | null;
}

export interface PlanGasto {
  pagaron: string[];
  financiaciones: Record<string, Financiacion>;
}

export interface OperacionSocial {
  clave: string;
  clase?: 'compra' | 'parte' | 'deuda' | 'origen_deuda';
  gasto_compartido_id?: string;
  participante_gasto_id?: string;
  deuda_id?: string;
  monto: number;
  descripcion: string;
  tipoMovimiento?: 'ingreso' | 'egreso' | null;
  tipo?: 'ingreso' | 'egreso' | null;
  categoria?: string;
  fecha?: string;
  clave_operacion?: string;
}

export interface BorradorGasto {
  id?: string; claveOperacion?: string; salaId: string; gastoId?: string; version?: number;
  descripcion: string; monto: string | number; pagadorId: string; reparto: string;
  involucradas: string[]; pagaron: string[]; montosManuales?: Record<string, string | number>;
}
export interface DatosPersona { nombre: string; apellido: string; apodo: string; }
export interface DatosSala { id?: string; nombre: string; descripcion?: string; categoriaId: string; icono: string; color: string; fecha: string; personasIds: string[]; }
export interface DatosDeuda { id?: string; personaId: string; direccion: string; monto: string | number; descripcion: string; }
export interface DatosPago { deudaId: string; monto: string | number; claveOperacion: string; }
export type Financiaciones = Record<string, Financiacion | null>;
export type DatosOperacion = Partial<PagoSocial> & { monto: number; descripcion: string; fecha: string; tipoMovimiento?: 'ingreso' | 'egreso' | null; categoria?: string };
export type GastoBorradorPersistido = Pick<GastoCompartido, 'pagador_id' | 'descripcion' | 'monto_total'> & {id?:string};

export type SalaVista = import('./socialQueryService').SalaVisible;
export type GastoVista = SalaVista['gastos'][number];
export type DeudaVista = import('./socialQueryService').DeudaVisible;
export type PersonaVista = {
  id: string; nombre: string; apellido?: string | null; apodo?: string | null; iniciales: string; activa: boolean;
  porCobrar?: string; porPagar?: string;
};
export type EditorGasto = Omit<BorradorGasto, 'salaId' | 'monto' | 'montosManuales'> & {monto:string; montosManuales?:Record<string,string>};
export interface TicketSocial { id: string; items: { descripcion: string; monto: number | null }[]; }
export interface FilaGasto { id: string; claveOperacion: string; descripcion: string; monto: string; ajustes?: EditorGasto; depositoId?: string | null; }
export interface BorradorLista { filas: FilaGasto[]; depositoId: string | null; comun: EditorGasto; ultimoTicket?: string; }
export interface PlanOperaciones { diferido?: boolean; operaciones: { clave: string; tipo: string; monto: number; descripcion: string }[]; }
export interface ParametrosSociales { salaId?: string; personaId?: string; gastoId?: string; deudaId?: string; tipo?: string; todas?: boolean; modo?: string; ticketSocial?: TicketSocial; }
export interface AccionesSociales {
  abrirSala: (id: string) => void; abrirPersona: (id: string) => void;
  abrirRegistro: (tipo: string, datos?: ParametrosSociales) => void;
}
export interface ConfirmacionSocial { titulo: string; descripcion: string; textoConfirmar: string; }
export interface AccionesFormularioProps<Resultado> extends AspectoSocial {
  texto: string; peligro?: boolean; deshabilitado?: boolean; confirmacion?: ConfirmacionSocial;
  alGuardar: (financiaciones: Financiaciones) => Promise<Resultado>;
  preparar?: () => PlanOperaciones | Promise<PlanOperaciones>; alExito?: (resultado: Resultado) => void | Promise<void>;
  mostrarNota?: boolean; recargarAntesDeCerrar?: boolean; mensajeExito?: string | ((resultado: Resultado) => string);
}
