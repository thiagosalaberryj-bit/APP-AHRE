import type { Conexion } from '../database/types';
import { depositosRepositorio } from '../database/repositories/depositsRepository';
import { CATEGORIAS_EGRESO, CATEGORIAS_INGRESO } from '../constants/movimientos';
import { COLORES_DEPOSITOS } from '../styles/colors';
import { CUENTA_PRUEBA } from './developmentData';

const CANTIDAD_MOVIMIENTOS = 10000;
const IMPORTES = [450, 1000, 1850.5, 3200, 5000, 8750.75, 15600, 42350, 125000, 1250000];

// La conexión debe pertenecer a la transacción de preparación: depósito y
// movimientos se confirman juntos o se revierten por completo.
export async function prepararVolumenMovimientos(usuarioId: string, conexion: Conexion) {
  if (!__DEV__) throw new Error('La carga masiva solo está disponible en desarrollo.');
  const cuenta = await conexion.getFirstAsync<{ id: string }>(`
    SELECT u.id FROM usuarios u JOIN sync_authorization a ON a.usuario_id = u.id
    WHERE u.id = ? AND u.correo_electronico = ? AND u.activo = 1
      AND a.dispositivo_id = 'prueba-local' AND a.generacion = 0 AND a.revocada = 0
  `, [usuarioId, CUENTA_PRUEBA.correo]);
  if (!cuenta) throw new Error('La carga masiva requiere la cuenta local de pruebas sin sincronización.');

  const depositoId = `prueba:${usuarioId}:deposito:volumen-v1`;
  const prefijo = `prueba:${usuarioId}:volumen-v1:`;
  const idMovimiento = (indice: number) => prefijo + String(indice).padStart(5, '0');
  const ahora = new Date();
  const fechaCreacion = ahora.toISOString();
  let deposito = await depositosRepositorio.consultarPorId(depositoId, conexion);
  if (deposito && (deposito.usuario_id !== usuarioId || !deposito.activo)) {
    throw new Error('El depósito de volumen no está disponible. Se conservaron sus datos.');
  }
  const existentes = await conexion.getAllAsync<{ id: string; deposito_id: string }>(
    'SELECT id, deposito_id FROM movimientos WHERE substr(id, 1, ?) = ?', [prefijo.length, prefijo],
  );
  if (existentes.length) {
    const esperados = new Set(Array.from({ length: CANTIDAD_MOVIMIENTOS }, (_, indice) => idMovimiento(indice)));
    if (!deposito || existentes.length !== CANTIDAD_MOVIMIENTOS || existentes.some(fila => fila.deposito_id !== depositoId || !esperados.has(fila.id))) {
      throw new Error('La carga de volumen está incompleta. Se conservaron los datos existentes.');
    }
    // Incluye anulados: reentrar nunca repone ni modifica movimientos de prueba.
    return;
  }
  if (!deposito) deposito = await depositosRepositorio.crear({
    id: depositoId, usuario_id: usuarioId, nombre: 'Volumen · 10.000 movimientos',
    tipo: 'banco', saldo_inicial: 1000000, icono: 'bar-chart-outline', color: COLORES_DEPOSITOS[1],
    descripcion: '10.000 movimientos ficticios, solo locales y sin sincronización.',
    fecha_creacion: new Date(ahora.getFullYear() - 3, ahora.getMonth(), 1).toISOString(),
  }, conexion);

  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).getTime();
  const transcurrido = Math.max(1, ahora.getTime() - inicioMes + 1);
  // Cada par ingreso/egreso tiene igual importe y fecha: saldo neto cero.
  // 7.000 registros del mes actual y 3.000 repartidos en los 23 meses anteriores.
  // Lotes de 80 filas mantienen menos de 999 parámetros por sentencia SQLite.
  for (let inicio = 0; inicio < CANTIDAD_MOVIMIENTOS / 2; inicio += 40) {
    const valores: (string | number)[] = [];
    const filas: string[] = [];
    for (let par = inicio; par < Math.min(inicio + 40, CANTIDAD_MOVIMIENTOS / 2); par++) {
      const fecha = par < 3500
        ? new Date(inicioMes + (par * 9973001) % transcurrido).toISOString()
        : new Date(ahora.getFullYear(), ahora.getMonth() - 1 - (par - 3500) % 23, 1 + par % 28, 12, par % 60).toISOString();
      for (const tipo of ['ingreso', 'egreso'] as const) {
        const categorias = tipo === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO;
        const categoria = categorias[par % categorias.length];
        const indice = par * 2 + (tipo === 'egreso' ? 1 : 0);
        valores.push(idMovimiento(indice), depositoId, categoria.id, tipo, IMPORTES[par % IMPORTES.length],
          `Volumen ${String(indice + 1).padStart(5, '0')} · ${categoria.nombre}`, fecha, fechaCreacion, fechaCreacion);
        filas.push('(?, ?, ?, ?, ?, ?, ?, ?, ?)');
      }
    }
    // Inserción exclusiva de fixtures válidos. Los triggers de SQLite conservan
    // el diario local; el saldo no cambia porque cada lote contiene pares enteros.
    await conexion.runAsync(`INSERT INTO movimientos
      (id, deposito_id, categoria, tipo, monto, descripcion, fecha_hora, fecha_creacion, fecha_actualizacion)
      VALUES ${filas.join(', ')}`, valores);
  }
}
