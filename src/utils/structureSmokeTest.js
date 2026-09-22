import { ROUTES } from '../constants/routes';

/**
 * Prueba de humo mínima para comprobar que la navegación puede importar sus
 * rutas. Se reemplazará por pruebas automatizadas cuando se incorpore un test
 * runner.
 */
export function runStructureSmokeTest() {
  return Boolean(
    ROUTES.INICIO &&
      ROUTES.LOGIN &&
      ROUTES.REGISTRO &&
      ROUTES.PRINCIPAL &&
      ROUTES.DASHBOARD &&
      ROUTES.MOVIMIENTOS &&
      ROUTES.NUEVO &&
      ROUTES.ESTADISTICAS &&
      ROUTES.SOCIAL,
  );
}
