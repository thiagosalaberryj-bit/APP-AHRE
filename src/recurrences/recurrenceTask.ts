import * as TaskManager from 'expo-task-manager';
import ModuloRecurrencias from '../../modules/recurrence-worker';
import { procesarRecurrencias } from './recurrenceService';

TaskManager.defineTask('ahre-recurrences', async () => {
  await procesarRecurrencias();
  return {estado: 'completado'};
});

export async function registrarTareaRecurrencias() {
  if (ModuloRecurrencias && await TaskManager.isAvailableAsync()) await ModuloRecurrencias.registrar();
}
