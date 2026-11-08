import type { Conexion } from './types';

export function esBloqueoSQLite(error: unknown) {
  const fallo = error as {message?:unknown;code?:unknown;errcode?:unknown;extendedCode?:unknown} | null;
  const codigo = Number(fallo?.errcode ?? fallo?.extendedCode);
  return /database (?:is |table is )?(?:locked|busy)/i.test(String(fallo?.message || ''))
    || /SQLITE_(?:BUSY|LOCKED)/i.test(String(fallo?.code || ''))
    || (Number.isInteger(codigo) && [5,6].includes(codigo & 0xff));
}

// Solo se reintentan sentencias de control. Nunca se repite el callback financiero.
export async function ejecutarControlSQLite(conexion: Conexion, sql: string) {
  for(let intento=0;;intento++) {
    try { await conexion.execAsync(sql);return; }
    catch(error) {
      if(intento>=3 || !esBloqueoSQLite(error))throw error;
      await new Promise<void>(resolver=>setTimeout(resolver,100 * 2 ** intento));
    }
  }
}

export async function enTransaccionSQLite<T>(conexion: Conexion, operacion:()=>Promise<T>) {
  let iniciada=false;
  let paso='reservar-escritura';
  try {
    await ejecutarControlSQLite(conexion,'BEGIN IMMEDIATE;');
    iniciada=true;
    paso='ejecutar-escritura';
    const resultado=await operacion();
    paso='confirmar-escritura';
    await ejecutarControlSQLite(conexion,'COMMIT;');
    return resultado;
  } catch(error) {
    if(error && typeof error==='object') {
      try { Object.defineProperty(error,'pasoSQLite',{value:paso,configurable:true}); } catch { /* Mantener el error original. */ }
    }
    // BEGIN puede fallar sin abrir una transacción. Tampoco debe ocultarse el
    // fallo original si SQLite ya revirtió por su cuenta o falla el ROLLBACK.
    if(iniciada) {
      try { await conexion.execAsync('ROLLBACK;'); } catch { /* Mantener el error original. */ }
    }
    throw error;
  }
}
