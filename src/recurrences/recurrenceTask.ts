import * as TaskManager from 'expo-task-manager';
import { procesarRecurrencias } from './recurrenceService';

TaskManager.defineTask('ahre-recurrences', async () => {
  await procesarRecurrencias();
  return {estado: 'completado'};
});

export async function registrarTareaRecurrencias() {
  if(await TaskManager.isAvailableAsync()&&await TaskManager.isTaskRegisteredAsync('ahre-recurrences'))await TaskManager.unregisterTaskAsync('ahre-recurrences');
}
