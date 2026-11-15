// Pausa temporal de tareas durante el reinicio de datos de cualquier cuenta.
let reiniciando = false;
const actividades = new Set<Promise<void>>();
export const reinicioEnCurso = () => reiniciando;
export function iniciarActividadReinicio() {
  if (reiniciando) return null;
  let terminar!: () => void;
  const promesa = new Promise<void>(resolver => { terminar = resolver; });
  actividades.add(promesa);
  return () => { actividades.delete(promesa); terminar(); };
}
export async function pausarParaReinicio() {
  if (reiniciando) throw new Error('Ya hay un reinicio en curso.');
  reiniciando = true;
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      Promise.all([...actividades]),
      new Promise<never>((_, rechazar) => { temporizador = setTimeout(() => rechazar(new Error('Esperá a que terminen las operaciones y volvé a intentar.')), 20000); }),
    ]);
  } catch (error) { reiniciando = false; throw error; }
  finally { clearTimeout(temporizador); }
  return () => { reiniciando = false; };
}
