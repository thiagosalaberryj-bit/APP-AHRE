import { StyleSheet } from 'react-native';
import type { Tema } from './colors';
import { crearEstilosTarjetaRegistroFinanciero } from './FinancialRecordCardStyles';

export function crearEstilosTarjetaMovimiento(tema: Tema) {
  const comunes = crearEstilosTarjetaRegistroFinanciero(tema);
  return StyleSheet.create({
    ...comunes,
    filaTitulo: comunes.fila,
    titulo: { ...comunes.titulo, flex: 1 },
    filaMetadatos: comunes.fila,
  });
}
