import type { ReactNode } from 'react';
import type { ViewStyle, TextStyle, ImageStyle, StyleProp } from 'react-native';
import type { Tema } from '../styles/colors';
import type { crearEstilosGlobales } from '../styles/globalStyles';
import type { crearEstilosEgreso } from '../styles/expenseStyles';
import type { Categoria, NombreIcono } from '../constants/movimientos';
import type { Deposito } from '../database/types';

export type Estilos = Record<string, ViewStyle & TextStyle & ImageStyle>;
export type EstilosGlobales = ReturnType<typeof crearEstilosGlobales>;
export type EstilosMovimiento = Partial<{ [Clave in keyof ReturnType<typeof crearEstilosEgreso>]: Clave extends 'colorIndicador' ? string : ViewStyle & TextStyle & ImageStyle }> & Partial<Record<'opcionDepositoFiltro'|'iconoDepositoFiltro'|'seleccionDepositoFiltro'|'listaDepositosFiltro'|'listaDepositos'|'accionesDepositosFiltro'|'textoAccionDepositoFiltro', ViewStyle & TextStyle>>;
export interface Aspecto { tema: Tema; estilosGlobales: EstilosGlobales; estilosMovimiento?: EstilosMovimiento; }
export interface SelectorCategoriaProps extends Aspecto {
  categorias?: readonly (Pick<Categoria, 'id'|'nombre'|'icono'> & Partial<Categoria>)[]; seleccionadaId?: string | null; alSeleccionar?: (id: string) => void;
  etiqueta?: string; seleccionMultiple?: boolean; seleccionadasIds?: string[];
  alCambiarMulti?: (ids: string[]) => void; variante?: string; cantidadPrincipales?: number; carrusel?: boolean;
  estiloTarjeta?: StyleProp<ViewStyle>; usarColorIconoComoRelleno?: boolean; error?: string | null;
}
export interface SelectorDepositoProps extends Aspecto {
  depositos?: readonly (Partial<Deposito> & { id: string; nombre: string; saldoTexto?: string })[];
  seleccionadoId?: string | null; alSeleccionar?: (id: string) => void; etiqueta?: string;
  seleccionMultiple?: boolean; seleccionadasIds?: string[]; alCambiarMulti?: (ids: string[]) => void;
  enLinea?: boolean; error?: string | null;
}
export interface SelectorFechaProps {
  tema: Tema; estilosMovimiento: EstilosMovimiento; valor: Date; alSeleccionar: (fecha: Date) => void;
  etiqueta?: string; textoValor?: string | null; enLinea?: boolean; rangoInicio?: Date | null; rangoFin?: Date | null;
  mantenerAbiertoAlSeleccionar?: boolean; resaltarExtremosRango?: boolean;
}
export interface MontoProps extends Aspecto {
  etiqueta?: string; valor: string; alCambiarTexto: (valor: string) => void; alLimpiar: () => void; error?: string | null;
}
export interface BotonPrincipalProps {
  estilosGlobales: EstilosGlobales;
  estilosAutenticacion: {colorIndicador:string;botonPrincipal:StyleProp<ViewStyle>;botonPresionado:StyleProp<ViewStyle>;textoBoton:StyleProp<TextStyle>;textoProcesando:StyleProp<TextStyle>};
  titulo: string; cargando?: boolean; deshabilitado?: boolean; alPresionar: () => void;
}
export interface EncabezadoProps {
  tema?: Tema; titulo?: string; descripcion?: string; altura?: number; alVolver?: () => void;
  alAbrirNotificaciones?: () => void; alAbrirPerfil?: () => void;
}
export interface ContenedorAuthProps { tema: Tema; titulo: string; descripcion: string; children?: ReactNode; }
export interface ToggleProps { tema: Tema; valor: boolean; alCambiar: (valor: boolean) => void; etiquetaAccesibilidad?: string; }
export interface AvisoProps { duracion: number; mensaje: string; onDismiss: () => void; tipo: 'error' | 'exito' | 'informacion'; margenSuperior: number; }
export type Frecuencia = { id: string; nombre: string };
export interface RecurrenciaProps { tema: Tema; estilosMovimiento: EstilosMovimiento; valor: boolean; alCambiar: (valor: boolean) => void; frecuencias: readonly Frecuencia[]; frecuenciaSeleccionada: string; alCambiarFrecuencia: (id: string) => void; }
export interface TarjetaMovimientoProps { tema: Tema; estilos: Estilos; movimiento: import('./forms').MovimientoVisible; alPresionar: (movimiento: import('./forms').MovimientoVisible, categoria: Partial<Categoria>) => void; soloHora?: boolean; }
export interface Notificacion { id: string; titulo: string; descripcion: string; fechaHora: string; tipo: string; icono: NombreIcono; leida?: boolean; }
