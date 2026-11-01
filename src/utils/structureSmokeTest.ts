import { RUTAS } from '../constants/routes';

/**
 * Prueba de humo mínima para comprobar que la navegación puede importar sus
 * rutas. Se reemplazará por pruebas automatizadas cuando se incorpore un test
 * runner.
 */
export function ejecutarPruebaHumoEstructura() {
  return Boolean(
    RUTAS.INICIO &&
      RUTAS.INICIO_SESION &&
      RUTAS.REGISTRO &&
      RUTAS.PRINCIPAL &&
      RUTAS.PANEL &&
      RUTAS.MOVIMIENTOS &&
      RUTAS.NUEVO &&
      RUTAS.ESTADISTICAS &&
      RUTAS.SOCIAL,
  );
}
