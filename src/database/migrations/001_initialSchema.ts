import type { Conexion } from '../types';

export const VERSION_ESQUEMA_INICIAL = 1;

export async function aplicarEsquemaInicial(baseDatos: Pick<Conexion, 'execAsync'>) {
  await baseDatos.execAsync(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY NOT NULL,
      nombre TEXT NOT NULL,
      correo_electronico TEXT NOT NULL,
      activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
      fecha_creacion TEXT NOT NULL,
      fecha_actualizacion TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS credenciales_usuario (
      usuario_id TEXT PRIMARY KEY NOT NULL,
      contrasena_verificador TEXT NOT NULL,
      fecha_creacion TEXT NOT NULL,
      fecha_actualizacion TEXT NOT NULL,
      FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS depositos (
      id TEXT PRIMARY KEY NOT NULL,
      usuario_id TEXT NOT NULL,
      nombre TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK (tipo IN ('efectivo', 'banco', 'billetera_virtual')),
      saldo_inicial REAL NOT NULL,
      saldo_actual REAL NOT NULL,
      icono TEXT NOT NULL,
      color TEXT,
      descripcion TEXT,
      activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
      fecha_creacion TEXT NOT NULL,
      fecha_actualizacion TEXT NOT NULL,
      UNIQUE (usuario_id, id),
      FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS historial_saldos_deposito (
      id TEXT PRIMARY KEY NOT NULL,
      deposito_id TEXT NOT NULL,
      saldo_anterior REAL NOT NULL,
      saldo_informado REAL NOT NULL,
      descripcion TEXT,
      fecha_hora TEXT NOT NULL,
      FOREIGN KEY (deposito_id) REFERENCES depositos (id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS preferencias (
      id TEXT PRIMARY KEY NOT NULL,
      usuario_id TEXT NOT NULL UNIQUE,
      deposito_predeterminado_id TEXT,
      notificaciones_activas INTEGER NOT NULL DEFAULT 1 CHECK (notificaciones_activas IN (0, 1)),
      idioma TEXT NOT NULL DEFAULT 'es' CHECK (idioma IN ('es', 'en')),
      apariencia TEXT NOT NULL DEFAULT 'sistema' CHECK (apariencia IN ('sistema', 'claro', 'oscuro')),
      fecha_creacion TEXT NOT NULL,
      fecha_actualizacion TEXT NOT NULL,
      FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE RESTRICT,
      FOREIGN KEY (usuario_id, deposito_predeterminado_id)
        REFERENCES depositos (usuario_id, id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS recurrencias (
      id TEXT PRIMARY KEY NOT NULL,
      deposito_id TEXT NOT NULL,
      categoria TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
      monto REAL NOT NULL,
      descripcion TEXT NOT NULL,
      frecuencia TEXT NOT NULL CHECK (frecuencia IN ('diaria', 'semanal', 'mensual', 'anual')),
      fecha_inicio TEXT NOT NULL,
      fecha_fin TEXT,
      proxima_ejecucion TEXT NOT NULL,
      activa INTEGER NOT NULL DEFAULT 1 CHECK (activa IN (0, 1)),
      fecha_creacion TEXT NOT NULL,
      fecha_actualizacion TEXT NOT NULL,
      FOREIGN KEY (deposito_id) REFERENCES depositos (id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS transferencias (
      id TEXT PRIMARY KEY NOT NULL,
      usuario_id TEXT NOT NULL,
      deposito_origen_id TEXT NOT NULL,
      deposito_destino_id TEXT NOT NULL,
      monto REAL NOT NULL CHECK (monto > 0),
      fecha_hora TEXT NOT NULL,
      descripcion TEXT,
      anulada INTEGER NOT NULL DEFAULT 0 CHECK (anulada IN (0, 1)),
      reversion_de_id TEXT,
      fecha_creacion TEXT NOT NULL,
      fecha_actualizacion TEXT NOT NULL,
      CHECK (deposito_origen_id <> deposito_destino_id),
      FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE RESTRICT,
      FOREIGN KEY (usuario_id, deposito_origen_id)
        REFERENCES depositos (usuario_id, id) ON DELETE RESTRICT,
      FOREIGN KEY (usuario_id, deposito_destino_id)
        REFERENCES depositos (usuario_id, id) ON DELETE RESTRICT,
      FOREIGN KEY (reversion_de_id) REFERENCES transferencias (id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS movimientos (
      id TEXT PRIMARY KEY NOT NULL,
      deposito_id TEXT NOT NULL,
      categoria TEXT NOT NULL,
      recurrencia_id TEXT,
      transferencia_id TEXT,
      tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso', 'transferencia_salida', 'transferencia_entrada')),
      monto REAL NOT NULL CHECK (monto > 0),
      descripcion TEXT NOT NULL,
      fecha_hora TEXT NOT NULL,
      anulado INTEGER NOT NULL DEFAULT 0 CHECK (anulado IN (0, 1)),
      reversion_de_id TEXT,
      fecha_creacion TEXT NOT NULL,
      fecha_actualizacion TEXT NOT NULL,
      CHECK (
        (tipo IN ('ingreso', 'egreso') AND transferencia_id IS NULL) OR
        (tipo IN ('transferencia_salida', 'transferencia_entrada') AND transferencia_id IS NOT NULL)
      ),
      CHECK (recurrencia_id IS NULL OR tipo IN ('ingreso', 'egreso')),
      FOREIGN KEY (deposito_id) REFERENCES depositos (id) ON DELETE RESTRICT,
      FOREIGN KEY (recurrencia_id) REFERENCES recurrencias (id) ON DELETE RESTRICT,
      FOREIGN KEY (transferencia_id) REFERENCES transferencias (id) ON DELETE RESTRICT,
      FOREIGN KEY (reversion_de_id) REFERENCES movimientos (id) ON DELETE RESTRICT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_correo_electronico_unico
      ON usuarios (LOWER(correo_electronico));
    CREATE INDEX IF NOT EXISTS idx_depositos_usuario_activo
      ON depositos (usuario_id, activo);
    CREATE INDEX IF NOT EXISTS idx_historial_saldos_deposito_fecha
      ON historial_saldos_deposito (deposito_id, fecha_hora DESC);
    CREATE INDEX IF NOT EXISTS idx_movimientos_deposito_fecha
      ON movimientos (deposito_id, fecha_hora DESC);
    CREATE INDEX IF NOT EXISTS idx_movimientos_fecha
      ON movimientos (fecha_hora DESC);
    CREATE INDEX IF NOT EXISTS idx_movimientos_categoria_fecha
      ON movimientos (categoria, fecha_hora DESC);
    CREATE INDEX IF NOT EXISTS idx_movimientos_tipo_fecha
      ON movimientos (tipo, fecha_hora DESC);
    CREATE INDEX IF NOT EXISTS idx_movimientos_recurrencia
      ON movimientos (recurrencia_id);
    CREATE INDEX IF NOT EXISTS idx_movimientos_transferencia
      ON movimientos (transferencia_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_movimientos_transferencia_tipo_unico
      ON movimientos (transferencia_id, tipo) WHERE transferencia_id IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_transferencias_reversion_unica
      ON transferencias (reversion_de_id) WHERE reversion_de_id IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_movimientos_reversion_unica
      ON movimientos (reversion_de_id) WHERE reversion_de_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_recurrencias_deposito_activa
      ON recurrencias (deposito_id, activa);
    CREATE INDEX IF NOT EXISTS idx_transferencias_usuario_fecha
      ON transferencias (usuario_id, fecha_hora DESC);
    CREATE TRIGGER IF NOT EXISTS trg_movimientos_transferencia_insert
    BEFORE INSERT ON movimientos
    FOR EACH ROW
    WHEN NEW.transferencia_id IS NOT NULL AND NOT EXISTS (
      SELECT 1
      FROM transferencias
      WHERE id = NEW.transferencia_id
        AND (
          (NEW.tipo = 'transferencia_salida' AND deposito_origen_id = NEW.deposito_id) OR
          (NEW.tipo = 'transferencia_entrada' AND deposito_destino_id = NEW.deposito_id)
        )
    )
    BEGIN
      SELECT RAISE(ABORT, 'el movimiento no coincide con el depósito de la transferencia');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_transferencia_reversion_insert
    BEFORE INSERT ON transferencias
    FOR EACH ROW
    WHEN NEW.reversion_de_id IS NOT NULL AND NOT EXISTS (
      SELECT 1
      FROM transferencias original
      WHERE original.id = NEW.reversion_de_id
        AND original.usuario_id = NEW.usuario_id
        AND original.deposito_origen_id = NEW.deposito_destino_id
        AND original.deposito_destino_id = NEW.deposito_origen_id
        AND original.monto = NEW.monto
    )
    BEGIN
      SELECT RAISE(ABORT, 'la reversión debe compensar la transferencia original');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_movimiento_reversion_insert
    BEFORE INSERT ON movimientos
    FOR EACH ROW
    WHEN NEW.reversion_de_id IS NOT NULL AND NOT EXISTS (
      SELECT 1
      FROM movimientos original
      WHERE original.id = NEW.reversion_de_id
        AND original.transferencia_id IS NULL
        AND original.deposito_id = NEW.deposito_id
        AND original.monto = NEW.monto
        AND original.anulado = 0
        AND (
          (original.tipo = 'ingreso' AND NEW.tipo = 'egreso') OR
          (original.tipo = 'egreso' AND NEW.tipo = 'ingreso')
        )
    )
    BEGIN
      SELECT RAISE(ABORT, 'el movimiento de reversión debe compensar uno original');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_movimientos_transferencia_update
    BEFORE UPDATE OF transferencia_id, deposito_id, tipo ON movimientos
    FOR EACH ROW
    WHEN NEW.transferencia_id IS NOT NULL AND NOT EXISTS (
      SELECT 1
      FROM transferencias
      WHERE id = NEW.transferencia_id
        AND (
          (NEW.tipo = 'transferencia_salida' AND deposito_origen_id = NEW.deposito_id) OR
          (NEW.tipo = 'transferencia_entrada' AND deposito_destino_id = NEW.deposito_id)
        )
    )
    BEGIN
      SELECT RAISE(ABORT, 'el movimiento no coincide con el depósito de la transferencia');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_movimientos_transferencia_anulacion
    BEFORE UPDATE OF anulado ON movimientos
    FOR EACH ROW
    WHEN NEW.anulado = 1
      AND OLD.anulado = 0
      AND OLD.transferencia_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM transferencias
        WHERE id = OLD.transferencia_id AND anulada = 0
      )
    BEGIN
      SELECT RAISE(ABORT, 'la transferencia debe anularse desde su repositorio');
    END;

  `);
  await aplicarEsquemaSocialInicial(baseDatos);
}

// Los servicios futuros deben completar las operaciones en una transacción.
const montoValido = (campo: string) => `typeof(${campo}) IN ('integer', 'real')
  AND ${campo} > 0 AND ${campo} <= 999999999999.99 AND ${campo} = ROUND(${campo}, 2)`;

async function aplicarEsquemaSocialInicial(baseDatos: Pick<Conexion, 'execAsync'>) {
  await baseDatos.execAsync(`
    CREATE TABLE IF NOT EXISTS personas (
      id TEXT PRIMARY KEY NOT NULL,
      usuario_id TEXT NOT NULL,
      nombre TEXT NOT NULL CHECK (LENGTH(TRIM(nombre)) > 0),
      apellido TEXT,
      apodo TEXT,
      nombre_normalizado TEXT NOT NULL CHECK (LENGTH(TRIM(nombre_normalizado)) > 0),
      apellido_normalizado TEXT,
      apodo_normalizado TEXT,
      correo_electronico TEXT,
      es_usuario_actual INTEGER NOT NULL DEFAULT 0 CHECK (es_usuario_actual IN (0, 1)),
      activa INTEGER NOT NULL DEFAULT 1 CHECK (activa IN (0, 1)),
      fecha_creacion TEXT NOT NULL,
      fecha_actualizacion TEXT NOT NULL,
      CHECK (es_usuario_actual = 0 OR activa = 1),
      CHECK (es_usuario_actual = 1 OR (
        apellido IS NOT NULL AND LENGTH(TRIM(apellido)) > 0
        AND apodo IS NOT NULL AND LENGTH(TRIM(apodo)) BETWEEN 1 AND 20
        AND apellido_normalizado IS NOT NULL AND LENGTH(TRIM(apellido_normalizado)) > 0
        AND apodo_normalizado IS NOT NULL AND LENGTH(TRIM(apodo_normalizado)) BETWEEN 1 AND 20
      )),
      UNIQUE (usuario_id, id),
      FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS salas (
      id TEXT PRIMARY KEY NOT NULL,
      usuario_id TEXT NOT NULL,
      nombre TEXT NOT NULL CHECK (LENGTH(TRIM(nombre)) > 0),
      descripcion TEXT,
      categoria TEXT NOT NULL CHECK (LENGTH(TRIM(categoria)) > 0),
      icono TEXT NOT NULL CHECK (LENGTH(TRIM(icono)) > 0),
      color TEXT NOT NULL CHECK (LENGTH(TRIM(color)) > 0),
      fecha TEXT NOT NULL CHECK (LENGTH(fecha) = 10 AND DATE(fecha, '+0 days') IS NOT NULL AND DATE(fecha, '+0 days') = fecha),
      estado TEXT NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada')),
      fecha_cierre TEXT,
      fecha_creacion TEXT NOT NULL,
      fecha_actualizacion TEXT NOT NULL,
      CHECK ((estado = 'abierta' AND fecha_cierre IS NULL) OR (estado = 'cerrada' AND fecha_cierre IS NOT NULL)),
      UNIQUE (usuario_id, id),
      FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS personas_sala (
      id TEXT PRIMARY KEY NOT NULL,
      usuario_id TEXT NOT NULL,
      sala_id TEXT NOT NULL,
      persona_id TEXT NOT NULL,
      activa INTEGER NOT NULL DEFAULT 1 CHECK (activa IN (0, 1)),
      fecha_alta TEXT NOT NULL,
      fecha_baja TEXT,
      CHECK ((activa = 1 AND fecha_baja IS NULL) OR (activa = 0 AND fecha_baja IS NOT NULL)),
      UNIQUE (usuario_id, sala_id, persona_id),
      FOREIGN KEY (usuario_id, sala_id) REFERENCES salas (usuario_id, id) ON DELETE RESTRICT,
      FOREIGN KEY (usuario_id, persona_id) REFERENCES personas (usuario_id, id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS gastos_compartidos (
      id TEXT PRIMARY KEY NOT NULL,
      usuario_id TEXT NOT NULL,
      sala_id TEXT NOT NULL,
      pagador_id TEXT NOT NULL,
      descripcion TEXT NOT NULL CHECK (LENGTH(TRIM(descripcion)) > 0),
      monto_total REAL NOT NULL CHECK (${montoValido('monto_total')}),
      fecha TEXT NOT NULL,
      reparto TEXT NOT NULL CHECK (reparto IN ('iguales', 'manual')),
      plan_pagos TEXT NOT NULL DEFAULT '{}',
      estado TEXT NOT NULL DEFAULT 'vigente' CHECK (estado IN ('vigente', 'cancelado')),
      version INTEGER NOT NULL DEFAULT 1 CHECK (typeof(version) = 'integer' AND version > 0),
      fecha_creacion TEXT NOT NULL,
      fecha_actualizacion TEXT NOT NULL,
      UNIQUE (usuario_id, id),
      FOREIGN KEY (usuario_id, sala_id) REFERENCES salas (usuario_id, id) ON DELETE RESTRICT,
      FOREIGN KEY (usuario_id, pagador_id) REFERENCES personas (usuario_id, id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS participantes_gasto (
      id TEXT PRIMARY KEY NOT NULL,
      usuario_id TEXT NOT NULL,
      gasto_compartido_id TEXT NOT NULL,
      persona_id TEXT NOT NULL,
      monto_correspondiente REAL NOT NULL CHECK (${montoValido('monto_correspondiente')}),
      orden INTEGER NOT NULL CHECK (typeof(orden) = 'integer' AND orden >= 0),
      UNIQUE (usuario_id, id),
      UNIQUE (usuario_id, gasto_compartido_id, persona_id),
      UNIQUE (usuario_id, gasto_compartido_id, orden),
      FOREIGN KEY (usuario_id, gasto_compartido_id) REFERENCES gastos_compartidos (usuario_id, id) ON DELETE RESTRICT,
      FOREIGN KEY (usuario_id, persona_id) REFERENCES personas (usuario_id, id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS deudas (
      id TEXT PRIMARY KEY NOT NULL,
      usuario_id TEXT NOT NULL,
      deudor_id TEXT NOT NULL,
      acreedor_id TEXT NOT NULL,
      participante_gasto_id TEXT UNIQUE,
      monto REAL NOT NULL CHECK (${montoValido('monto')}),
      descripcion TEXT NOT NULL CHECK (LENGTH(TRIM(descripcion)) > 0),
      fecha TEXT NOT NULL,
      fecha_vencimiento TEXT,
      estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'parcial', 'pagada', 'cancelada')),
      fecha_cancelacion TEXT,
      motivo_cancelacion TEXT,
      fecha_creacion TEXT NOT NULL,
      fecha_actualizacion TEXT NOT NULL,
      CHECK (deudor_id <> acreedor_id),
      CHECK ((estado = 'cancelada' AND fecha_cancelacion IS NOT NULL) OR (estado <> 'cancelada' AND fecha_cancelacion IS NULL)),
      UNIQUE (usuario_id, id),
      UNIQUE (usuario_id, id, participante_gasto_id),
      FOREIGN KEY (usuario_id, deudor_id) REFERENCES personas (usuario_id, id) ON DELETE RESTRICT,
      FOREIGN KEY (usuario_id, acreedor_id) REFERENCES personas (usuario_id, id) ON DELETE RESTRICT,
      FOREIGN KEY (usuario_id, participante_gasto_id) REFERENCES participantes_gasto (usuario_id, id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS pagos_sociales (
      id TEXT PRIMARY KEY NOT NULL,
      usuario_id TEXT NOT NULL,
      clase TEXT NOT NULL CHECK (clase IN ('compra', 'parte', 'deuda', 'origen_deuda')),
      gasto_compartido_id TEXT,
      participante_gasto_id TEXT,
      deuda_id TEXT,
      monto REAL NOT NULL CHECK (${montoValido('monto')}),
      fecha TEXT NOT NULL,
      descripcion TEXT,
      movimiento_id TEXT UNIQUE,
      clave_operacion TEXT NOT NULL CHECK (LENGTH(TRIM(clave_operacion)) > 0),
      estado TEXT NOT NULL DEFAULT 'vigente' CHECK (estado IN ('vigente', 'anulado')),
      fecha_anulacion TEXT,
      fecha_creacion TEXT NOT NULL,
      fecha_actualizacion TEXT NOT NULL,
      CHECK ((estado = 'vigente' AND fecha_anulacion IS NULL) OR (estado = 'anulado' AND fecha_anulacion IS NOT NULL)),
      CHECK (
        (clase = 'compra' AND gasto_compartido_id IS NOT NULL AND participante_gasto_id IS NULL AND deuda_id IS NULL)
        OR (clase = 'parte' AND participante_gasto_id IS NOT NULL AND gasto_compartido_id IS NULL)
        OR (clase IN ('deuda', 'origen_deuda') AND deuda_id IS NOT NULL AND participante_gasto_id IS NULL AND gasto_compartido_id IS NULL)
      ),
      UNIQUE (usuario_id, id),
      UNIQUE (usuario_id, clave_operacion),
      FOREIGN KEY (usuario_id, gasto_compartido_id) REFERENCES gastos_compartidos (usuario_id, id) ON DELETE RESTRICT,
      FOREIGN KEY (usuario_id, participante_gasto_id) REFERENCES participantes_gasto (usuario_id, id) ON DELETE RESTRICT,
      FOREIGN KEY (usuario_id, deuda_id) REFERENCES deudas (usuario_id, id) ON DELETE RESTRICT,
      FOREIGN KEY (usuario_id, deuda_id, participante_gasto_id) REFERENCES deudas (usuario_id, id, participante_gasto_id) ON DELETE RESTRICT,
      FOREIGN KEY (movimiento_id) REFERENCES movimientos (id) ON DELETE RESTRICT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_personas_usuario_actual_unico ON personas (usuario_id) WHERE es_usuario_actual = 1;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_personas_apodo_unico ON personas (usuario_id, apodo_normalizado) WHERE es_usuario_actual = 0;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_personas_nombre_unico ON personas (usuario_id, nombre_normalizado, apellido_normalizado) WHERE es_usuario_actual = 0;
    CREATE INDEX IF NOT EXISTS idx_personas_usuario_nombre ON personas (usuario_id, activa, nombre_normalizado, apellido_normalizado);
    CREATE INDEX IF NOT EXISTS idx_salas_usuario_estado ON salas (usuario_id, estado, fecha_creacion DESC);
    CREATE INDEX IF NOT EXISTS idx_personas_sala_persona ON personas_sala (usuario_id, persona_id, activa);
    CREATE INDEX IF NOT EXISTS idx_gastos_sala_fecha ON gastos_compartidos (usuario_id, sala_id, fecha DESC);
    CREATE INDEX IF NOT EXISTS idx_gastos_pagador ON gastos_compartidos (usuario_id, pagador_id);
    CREATE INDEX IF NOT EXISTS idx_participantes_persona ON participantes_gasto (usuario_id, persona_id);
    CREATE INDEX IF NOT EXISTS idx_deudas_usuario_estado_fecha ON deudas (usuario_id, estado, fecha DESC);
    CREATE INDEX IF NOT EXISTS idx_deudas_deudor ON deudas (usuario_id, deudor_id);
    CREATE INDEX IF NOT EXISTS idx_deudas_acreedor ON deudas (usuario_id, acreedor_id);
    CREATE INDEX IF NOT EXISTS idx_pagos_participacion ON pagos_sociales (usuario_id, participante_gasto_id, estado);
    CREATE INDEX IF NOT EXISTS idx_pagos_deuda_fecha ON pagos_sociales (usuario_id, deuda_id, fecha DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_compra_vigente_unica ON pagos_sociales (gasto_compartido_id) WHERE clase = 'compra' AND estado = 'vigente';
    CREATE UNIQUE INDEX IF NOT EXISTS idx_origen_deuda_unico ON pagos_sociales (deuda_id) WHERE clase = 'origen_deuda';
  `);

  // Las validaciones comunes también protegen las escrituras por UPDATE.
  for (const accion of ['INSERT', 'UPDATE']) {
    const sufijo = accion.toLowerCase();
    const cambiaPagador = accion === 'INSERT' ? '1' : 'NEW.pagador_id IS NOT OLD.pagador_id';
    const integranteActivo = accion === 'INSERT' ? 'AND ps.activa = 1 AND p.activa = 1' : '';
    await baseDatos.execAsync(`
      CREATE TRIGGER IF NOT EXISTS trg_salas_cupo_${sufijo}
      BEFORE ${accion} ON salas WHEN NEW.estado = 'abierta'
      AND (SELECT COUNT(*) FROM salas WHERE usuario_id = NEW.usuario_id AND estado = 'abierta' AND id <> NEW.id) >= 3
      BEGIN SELECT RAISE(ABORT, 'maximo de tres salas abiertas'); END;

      CREATE TRIGGER IF NOT EXISTS trg_pertenencia_valida_${sufijo}
      BEFORE ${accion} ON personas_sala
      BEGIN
        SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM salas WHERE id = NEW.sala_id AND usuario_id = NEW.usuario_id AND estado = 'abierta')
          THEN RAISE(ABORT, 'la sala debe estar abierta') END;
        SELECT CASE WHEN NEW.activa = 1 AND NOT EXISTS (SELECT 1 FROM personas WHERE id = NEW.persona_id AND usuario_id = NEW.usuario_id AND activa = 1)
          THEN RAISE(ABORT, 'la persona debe estar activa') END;
        SELECT CASE WHEN NEW.activa = 0 AND EXISTS (SELECT 1 FROM personas WHERE id = NEW.persona_id AND es_usuario_actual = 1)
          THEN RAISE(ABORT, 'no se puede quitar al usuario actual') END;
      END;

      CREATE TRIGGER IF NOT EXISTS trg_item_valido_${sufijo}
      BEFORE ${accion} ON gastos_compartidos
      BEGIN
        SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM salas WHERE id = NEW.sala_id AND usuario_id = NEW.usuario_id AND estado = 'abierta')
          THEN RAISE(ABORT, 'la sala debe estar abierta') END;
        SELECT CASE WHEN (${cambiaPagador}) AND NOT EXISTS (
          SELECT 1 FROM personas_sala ps JOIN personas p ON p.id = ps.persona_id
          WHERE ps.usuario_id = NEW.usuario_id AND ps.sala_id = NEW.sala_id AND ps.persona_id = NEW.pagador_id AND ps.activa = 1 AND p.activa = 1
        ) THEN RAISE(ABORT, 'el pagador debe estar activo en la sala') END;
      END;

      CREATE TRIGGER IF NOT EXISTS trg_parte_valida_${sufijo}
      BEFORE ${accion} ON participantes_gasto
      BEGIN
        SELECT CASE WHEN NOT EXISTS (
          SELECT 1 FROM gastos_compartidos g JOIN salas s ON s.id = g.sala_id
          JOIN personas_sala ps ON ps.sala_id = s.id AND ps.persona_id = NEW.persona_id
          JOIN personas p ON p.id = ps.persona_id
          WHERE g.id = NEW.gasto_compartido_id AND g.usuario_id = NEW.usuario_id
            AND s.estado = 'abierta' AND g.estado = 'vigente' ${integranteActivo}
        ) THEN RAISE(ABORT, 'la parte requiere un integrante activo y una sala abierta') END;
        SELECT CASE WHEN ROUND(NEW.monto_correspondiente * 100) + COALESCE((
          SELECT SUM(ROUND(monto_correspondiente * 100)) FROM participantes_gasto
          WHERE gasto_compartido_id = NEW.gasto_compartido_id AND id <> NEW.id
        ), 0) > (SELECT ROUND(monto_total * 100) FROM gastos_compartidos WHERE id = NEW.gasto_compartido_id)
          THEN RAISE(ABORT, 'las partes superan el total del item') END;
      END;

      CREATE TRIGGER IF NOT EXISTS trg_deuda_propia_${sufijo}
      BEFORE ${accion} ON deudas
      BEGIN
        SELECT CASE WHEN (
          SELECT SUM(es_usuario_actual) FROM personas WHERE usuario_id = NEW.usuario_id AND id IN (NEW.deudor_id, NEW.acreedor_id)
        ) IS NOT 1 THEN RAISE(ABORT, 'la deuda debe involucrar al usuario actual') END;
        SELECT CASE WHEN NEW.participante_gasto_id IS NOT NULL AND NOT EXISTS (
          SELECT 1 FROM participantes_gasto pg JOIN gastos_compartidos g ON g.id = pg.gasto_compartido_id
          WHERE pg.id = NEW.participante_gasto_id AND pg.usuario_id = NEW.usuario_id AND g.estado = 'vigente'
            AND pg.persona_id = NEW.deudor_id AND g.pagador_id = NEW.acreedor_id AND pg.monto_correspondiente = NEW.monto
        ) THEN RAISE(ABORT, 'la deuda debe coincidir con su parte original') END;
      END;

      CREATE TRIGGER IF NOT EXISTS trg_pago_valido_${sufijo}
      BEFORE ${accion} ON pagos_sociales WHEN NEW.estado = 'vigente'
      BEGIN
        SELECT CASE WHEN NOT EXISTS (
          WITH contexto AS (
            SELECT g.monto_total AS limite, p.es_usuario_actual AS propio, 'egreso' AS tipo
            FROM gastos_compartidos g JOIN salas s ON s.id = g.sala_id JOIN personas p ON p.id = g.pagador_id
            WHERE NEW.clase = 'compra' AND g.id = NEW.gasto_compartido_id AND g.usuario_id = NEW.usuario_id AND g.estado = 'vigente' AND s.estado = 'abierta'
            UNION ALL
            SELECT pg.monto_correspondiente, d.es_usuario_actual + a.es_usuario_actual,
              CASE WHEN d.es_usuario_actual = 1 THEN 'egreso' ELSE 'ingreso' END
            FROM participantes_gasto pg JOIN gastos_compartidos g ON g.id = pg.gasto_compartido_id
            JOIN salas s ON s.id = g.sala_id JOIN personas d ON d.id = pg.persona_id JOIN personas a ON a.id = g.pagador_id
            WHERE NEW.clase = 'parte' AND pg.id = NEW.participante_gasto_id AND pg.usuario_id = NEW.usuario_id
              AND g.estado = 'vigente' AND pg.persona_id <> g.pagador_id
              AND (s.estado = 'abierta' OR NEW.deuda_id IS NOT NULL)
              AND (NEW.deuda_id IS NULL OR EXISTS (SELECT 1 FROM deudas WHERE id = NEW.deuda_id AND participante_gasto_id = pg.id AND estado <> 'cancelada'))
            UNION ALL
            SELECT de.monto, 1, CASE WHEN d.es_usuario_actual = 1 THEN 'egreso' ELSE 'ingreso' END
            FROM deudas de JOIN personas d ON d.id = de.deudor_id
            WHERE NEW.clase = 'deuda' AND de.id = NEW.deuda_id AND de.usuario_id = NEW.usuario_id
              AND de.participante_gasto_id IS NULL AND de.estado <> 'cancelada'
            UNION ALL
            SELECT de.monto, 1, 'egreso'
            FROM deudas de JOIN personas d ON d.id = de.deudor_id
            WHERE NEW.clase = 'origen_deuda' AND de.id = NEW.deuda_id AND de.usuario_id = NEW.usuario_id
              AND de.participante_gasto_id IS NULL AND de.estado <> 'cancelada' AND d.es_usuario_actual = 0
          )
          SELECT 1 FROM contexto c WHERE
            (NEW.clase NOT IN ('compra', 'origen_deuda') OR NEW.monto = c.limite)
            AND ((c.propio = 0 AND NEW.movimiento_id IS NULL) OR (c.propio = 1 AND EXISTS (
              SELECT 1 FROM movimientos m JOIN depositos dep ON dep.id = m.deposito_id
              WHERE m.id = NEW.movimiento_id AND dep.usuario_id = NEW.usuario_id
                AND m.tipo = c.tipo AND m.monto = NEW.monto AND m.anulado = 0
                AND m.transferencia_id IS NULL AND m.reversion_de_id IS NULL
                AND NOT EXISTS (SELECT 1 FROM movimientos r WHERE r.reversion_de_id = m.id)
            )))
        ) THEN RAISE(ABORT, 'origen o movimiento incompatible con el pago') END;
        SELECT CASE WHEN NEW.clase = 'parte' AND ROUND(NEW.monto * 100) + COALESCE((
          SELECT SUM(ROUND(monto * 100)) FROM pagos_sociales WHERE clase = 'parte'
            AND participante_gasto_id = NEW.participante_gasto_id AND estado = 'vigente' AND id <> NEW.id
        ), 0) > (SELECT ROUND(monto_correspondiente * 100) FROM participantes_gasto WHERE id = NEW.participante_gasto_id)
          THEN RAISE(ABORT, 'el pago supera el pendiente de la parte') END;
        SELECT CASE WHEN NEW.clase = 'deuda' AND ROUND(NEW.monto * 100) + COALESCE((
          SELECT SUM(ROUND(monto * 100)) FROM pagos_sociales WHERE deuda_id = NEW.deuda_id AND clase = 'deuda' AND estado = 'vigente' AND id <> NEW.id
        ), 0) > (SELECT ROUND(monto * 100) FROM deudas WHERE id = NEW.deuda_id)
          THEN RAISE(ABORT, 'el pago supera el pendiente de la deuda') END;
      END;
    `);
  }

  await baseDatos.execAsync(`
    CREATE TRIGGER IF NOT EXISTS trg_sala_cerrada_inmutable BEFORE UPDATE ON salas WHEN OLD.estado = 'cerrada'
    BEGIN SELECT RAISE(ABORT, 'la sala cerrada es de solo lectura'); END;

    CREATE TRIGGER IF NOT EXISTS trg_item_dinero_inmutable BEFORE UPDATE ON gastos_compartidos
    WHEN (NEW.monto_total <> OLD.monto_total OR NEW.pagador_id <> OLD.pagador_id OR NEW.estado <> OLD.estado)
      AND EXISTS (SELECT 1 FROM pagos_sociales WHERE estado = 'vigente' AND (gasto_compartido_id = OLD.id
        OR participante_gasto_id IN (SELECT id FROM participantes_gasto WHERE gasto_compartido_id = OLD.id)))
    BEGIN SELECT RAISE(ABORT, 'corregir pagos antes de modificar el item'); END;

    CREATE TRIGGER IF NOT EXISTS trg_parte_pagada_inmutable BEFORE UPDATE ON participantes_gasto
    WHEN ROUND(NEW.monto_correspondiente * 100) < COALESCE((SELECT SUM(ROUND(monto * 100)) FROM pagos_sociales WHERE participante_gasto_id = OLD.id AND estado = 'vigente'), 0)
      OR EXISTS (SELECT 1 FROM deudas WHERE participante_gasto_id = OLD.id)
    BEGIN SELECT RAISE(ABORT, 'la parte tiene pagos o una deuda vinculada'); END;

    CREATE TRIGGER IF NOT EXISTS trg_item_total_repartido BEFORE UPDATE OF monto_total ON gastos_compartidos
    WHEN ROUND(NEW.monto_total * 100) < COALESCE((SELECT SUM(ROUND(monto_correspondiente * 100)) FROM participantes_gasto WHERE gasto_compartido_id = OLD.id), 0)
    BEGIN SELECT RAISE(ABORT, 'el total no puede ser menor que las partes guardadas'); END;

    CREATE TRIGGER IF NOT EXISTS trg_parte_borrado_seguro BEFORE DELETE ON participantes_gasto
    WHEN EXISTS (SELECT 1 FROM pagos_sociales WHERE participante_gasto_id = OLD.id)
      OR EXISTS (SELECT 1 FROM deudas WHERE participante_gasto_id = OLD.id)
      OR EXISTS (SELECT 1 FROM gastos_compartidos g JOIN salas s ON s.id = g.sala_id WHERE g.id = OLD.gasto_compartido_id AND s.estado = 'cerrada')
    BEGIN SELECT RAISE(ABORT, 'conservar la participacion historica'); END;

    CREATE TRIGGER IF NOT EXISTS trg_deuda_origen_inmutable BEFORE UPDATE ON deudas
    WHEN NEW.deudor_id <> OLD.deudor_id OR NEW.acreedor_id <> OLD.acreedor_id OR NEW.monto <> OLD.monto
      OR NEW.participante_gasto_id IS NOT OLD.participante_gasto_id OR (OLD.estado = 'cancelada' AND NEW.estado <> 'cancelada')
    BEGIN SELECT RAISE(ABORT, 'conservar el origen y la cancelacion de la deuda'); END;

    CREATE TRIGGER IF NOT EXISTS trg_deuda_saldada_conservar BEFORE UPDATE OF estado ON deudas
    WHEN NEW.estado = 'cancelada' AND OLD.estado <> 'cancelada' AND (
      SELECT COALESCE(SUM(ROUND(monto * 100)), 0) FROM pagos_sociales
      WHERE deuda_id = OLD.id AND estado = 'vigente' AND clase <> 'origen_deuda'
    ) >= ROUND(OLD.monto * 100)
    BEGIN SELECT RAISE(ABORT, 'una deuda saldada se conserva en el historial'); END;

    CREATE TRIGGER IF NOT EXISTS trg_pago_nuevo_vigente BEFORE INSERT ON pagos_sociales WHEN NEW.estado <> 'vigente'
    BEGIN SELECT RAISE(ABORT, 'el nuevo pago debe estar vigente'); END;

    CREATE TRIGGER IF NOT EXISTS trg_pago_historial_inmutable BEFORE UPDATE ON pagos_sociales
    WHEN NEW.clase <> OLD.clase OR NEW.gasto_compartido_id IS NOT OLD.gasto_compartido_id
      OR NEW.participante_gasto_id IS NOT OLD.participante_gasto_id OR NEW.monto <> OLD.monto
      OR NEW.movimiento_id IS NOT OLD.movimiento_id OR NEW.fecha <> OLD.fecha OR NEW.clave_operacion <> OLD.clave_operacion
      OR (OLD.deuda_id IS NOT NULL AND NEW.deuda_id IS NOT OLD.deuda_id)
      OR (OLD.estado = 'anulado' AND NEW.estado <> 'anulado')
    BEGIN SELECT RAISE(ABORT, 'anular y conservar el pago en lugar de reescribirlo'); END;

    CREATE TRIGGER IF NOT EXISTS trg_pago_sala_cerrada BEFORE UPDATE OF estado ON pagos_sociales
    WHEN NEW.estado <> OLD.estado AND EXISTS (
      SELECT 1 FROM gastos_compartidos g JOIN salas s ON s.id = g.sala_id WHERE s.estado = 'cerrada'
        AND (g.id = OLD.gasto_compartido_id OR g.id = (SELECT gasto_compartido_id FROM participantes_gasto WHERE id = OLD.participante_gasto_id))
    ) AND (OLD.clase = 'compra' OR OLD.deuda_id IS NULL)
    BEGIN SELECT RAISE(ABORT, 'el historial cerrado solo admite pagos de deudas propias'); END;

    CREATE TRIGGER IF NOT EXISTS trg_deuda_nueva_pendiente BEFORE INSERT ON deudas
    BEGIN
      SELECT CASE WHEN NEW.participante_gasto_id IS NULL AND EXISTS (
        SELECT 1 FROM personas WHERE id IN (NEW.deudor_id, NEW.acreedor_id) AND activa = 0
      ) THEN RAISE(ABORT, 'la nueva deuda personal requiere personas activas') END;
      SELECT CASE WHEN NEW.participante_gasto_id IS NOT NULL AND COALESCE((
        SELECT SUM(ROUND(monto * 100)) FROM pagos_sociales WHERE participante_gasto_id = NEW.participante_gasto_id AND estado = 'vigente'
      ), 0) >= ROUND(NEW.monto * 100) THEN RAISE(ABORT, 'la parte ya esta cubierta') END;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_movimiento_social_identidad BEFORE UPDATE ON movimientos
    WHEN (NEW.deposito_id IS NOT OLD.deposito_id OR NEW.tipo IS NOT OLD.tipo OR NEW.monto IS NOT OLD.monto
      OR NEW.transferencia_id IS NOT OLD.transferencia_id OR NEW.reversion_de_id IS NOT OLD.reversion_de_id)
      AND EXISTS (SELECT 1 FROM pagos_sociales WHERE movimiento_id = OLD.id)
    BEGIN SELECT RAISE(ABORT, 'conservar los datos del movimiento vinculado a Social'); END;
  `);

  const referenciasInmutables = {
    personas: ['es_usuario_actual'],
    salas: [],
    personas_sala: ['sala_id', 'persona_id'],
    gastos_compartidos: ['sala_id'],
    participantes_gasto: ['gasto_compartido_id', 'persona_id'],
    deudas: [],
    pagos_sociales: [],
  };
  for (const [tabla, campos] of Object.entries(referenciasInmutables)) {
    const condicion = ['id', 'usuario_id', ...campos].map(campo => `NEW.${campo} IS NOT OLD.${campo}`).join(' OR ');
    await baseDatos.execAsync(`
      CREATE TRIGGER IF NOT EXISTS trg_${tabla}_identidad BEFORE UPDATE ON ${tabla} WHEN ${condicion}
      BEGIN SELECT RAISE(ABORT, 'los identificadores sociales son inmutables'); END;
    `);
    if (tabla !== 'participantes_gasto') {
      await baseDatos.execAsync(`
        CREATE TRIGGER IF NOT EXISTS trg_${tabla}_conservar BEFORE DELETE ON ${tabla}
        BEGIN SELECT RAISE(ABORT, 'conservar el historial social mediante baja logica'); END;
      `);
    }
  }
}
