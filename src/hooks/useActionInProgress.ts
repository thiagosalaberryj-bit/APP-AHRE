import { useEffect, useState } from 'react';
import { observarOperacionFinanciera, operacionFinancieraEnCurso } from '../social/financialOperation';

export function useAccionEnCurso() {
  const [ocupado,cambiar]=useState(operacionFinancieraEnCurso());
  useEffect(()=>observarOperacionFinanciera(()=>cambiar(operacionFinancieraEnCurso())),[]);
  return ocupado;
}
