import type { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { ParametrosSociales } from '../social/types';
import type { Categoria } from '../constants/movimientos';
import type { MovimientoVisible } from '../types/forms';
import type { RUTAS } from '../constants/routes';

export type NombreRuta = (typeof RUTAS)[keyof typeof RUTAS];
export interface ParametrosPantalla extends ParametrosSociales {
  screen?: NombreRuta; depositoId?: string; movimientoId?: string; categoria?: Partial<Categoria> & {color?:string};
  tipoMovimiento?: string; anio?: number; mes?: number; movimiento?: Partial<MovimientoVisible>;
  deposito_nombre?: string; destino?: string;
}
export type ParametrosNavegacion = { [Ruta in NombreRuta]: ParametrosPantalla | undefined };
export type PropiedadesPantalla = NativeStackScreenProps<ParametrosNavegacion, NombreRuta>;
export type PropiedadesPestana = BottomTabScreenProps<ParametrosNavegacion, NombreRuta>;
export type NavegacionRaiz = NativeStackNavigationProp<ParametrosNavegacion, NombreRuta>;
