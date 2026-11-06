import { StyleSheet } from 'react-native';
import type { Tema } from './colors';
import { crearEstilosTarjetaRegistroFinanciero } from './FinancialRecordCardStyles';

export function crearEstilosTarjetaDeuda(tema: Tema) {
  const comunes = crearEstilosTarjetaRegistroFinanciero(tema);
  return StyleSheet.create({
    ...comunes,
    persona: comunes.metadatos,
  });
}
