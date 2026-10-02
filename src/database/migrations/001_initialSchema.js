export const VERSION_ESQUEMA_INICIAL = 1;

export async function aplicarEsquemaInicial(baseDatos) {
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

    CREATE TABLE IF NOT EXISTS personas (
      id TEXT PRIMARY KEY NOT NULL,
      usuario_id TEXT NOT NULL,
      nombre TEXT NOT NULL,
      correo_electronico TEXT,
      es_usuario_actual INTEGER NOT NULL DEFAULT 0 CHECK (es_usuario_actual IN (0, 1)),
      activa INTEGER NOT NULL DEFAULT 1 CHECK (activa IN (0, 1)),
      fecha_creacion TEXT NOT NULL,
      fecha_actualizacion TEXT NOT NULL,
      UNIQUE (usuario_id, id),
      FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS gastos_compartidos (
      id TEXT PRIMARY KEY NOT NULL,
      usuario_id TEXT NOT NULL,
      movimiento_id TEXT NOT NULL UNIQUE,
      descripcion TEXT NOT NULL,
      monto_total REAL NOT NULL,
      fecha TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'parcial', 'saldado', 'cancelado')),
      fecha_creacion TEXT NOT NULL,
      fecha_actualizacion TEXT NOT NULL,
      UNIQUE (usuario_id, id),
      FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE RESTRICT,
      FOREIGN KEY (movimiento_id) REFERENCES movimientos (id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS deudas (
      id TEXT PRIMARY KEY NOT NULL,
      usuario_id TEXT NOT NULL,
      persona_id TEXT NOT NULL,
      gasto_compartido_id TEXT,
      tipo TEXT NOT NULL CHECK (tipo IN ('debo', 'me_deben')),
      monto REAL NOT NULL,
      descripcion TEXT NOT NULL,
      fecha TEXT NOT NULL,
      fecha_vencimiento TEXT,
      estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'parcial', 'pagada', 'cancelada')),
      movimiento_id TEXT,
      fecha_creacion TEXT NOT NULL,
      fecha_actualizacion TEXT NOT NULL,
      FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE RESTRICT,
      FOREIGN KEY (usuario_id, persona_id) REFERENCES personas (usuario_id, id) ON DELETE RESTRICT,
      FOREIGN KEY (usuario_id, gasto_compartido_id)
        REFERENCES gastos_compartidos (usuario_id, id) ON DELETE RESTRICT,
      FOREIGN KEY (movimiento_id) REFERENCES movimientos (id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS participantes_gasto (
      id TEXT PRIMARY KEY NOT NULL,
      gasto_compartido_id TEXT NOT NULL,
      persona_id TEXT NOT NULL,
      monto_correspondiente REAL NOT NULL,
      deuda_id TEXT UNIQUE,
      UNIQUE (gasto_compartido_id, persona_id),
      FOREIGN KEY (gasto_compartido_id) REFERENCES gastos_compartidos (id) ON DELETE RESTRICT,
      FOREIGN KEY (persona_id) REFERENCES personas (id) ON DELETE RESTRICT,
      FOREIGN KEY (deuda_id) REFERENCES deudas (id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS pagos_deuda (
      id TEXT PRIMARY KEY NOT NULL,
      deuda_id TEXT NOT NULL,
      monto REAL NOT NULL,
      fecha TEXT NOT NULL,
      movimiento_id TEXT NOT NULL UNIQUE,
      descripcion TEXT,
      FOREIGN KEY (deuda_id) REFERENCES deudas (id) ON DELETE RESTRICT,
      FOREIGN KEY (movimiento_id) REFERENCES movimientos (id) ON DELETE RESTRICT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_personas_usuario_actual_unico
      ON personas (usuario_id) WHERE es_usuario_actual = 1;
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
    CREATE INDEX IF NOT EXISTS idx_personas_usuario_nombre
      ON personas (usuario_id, nombre);
    CREATE INDEX IF NOT EXISTS idx_gastos_usuario_fecha
      ON gastos_compartidos (usuario_id, fecha DESC);
    CREATE INDEX IF NOT EXISTS idx_participantes_persona
      ON participantes_gasto (persona_id);
    CREATE INDEX IF NOT EXISTS idx_deudas_usuario_estado_fecha
      ON deudas (usuario_id, estado, fecha DESC);
    CREATE INDEX IF NOT EXISTS idx_deudas_persona
      ON deudas (persona_id);
    CREATE INDEX IF NOT EXISTS idx_pagos_deuda_fecha
      ON pagos_deuda (deuda_id, fecha DESC);

    CREATE TRIGGER IF NOT EXISTS trg_gastos_compartidos_solo_egresos
    BEFORE INSERT ON gastos_compartidos
    FOR EACH ROW
    WHEN NOT EXISTS (
      SELECT 1
      FROM movimientos
      JOIN depositos ON depositos.id = movimientos.deposito_id
      WHERE movimientos.id = NEW.movimiento_id
        AND movimientos.tipo = 'egreso'
        AND depositos.usuario_id = NEW.usuario_id
    )
    BEGIN
      SELECT RAISE(ABORT, 'el gasto compartido requiere un movimiento de egreso');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_gastos_compartidos_solo_egresos_actualizacion
    BEFORE UPDATE OF movimiento_id ON gastos_compartidos
    FOR EACH ROW
    WHEN NOT EXISTS (
      SELECT 1
      FROM movimientos
      JOIN depositos ON depositos.id = movimientos.deposito_id
      WHERE movimientos.id = NEW.movimiento_id
        AND movimientos.tipo = 'egreso'
        AND depositos.usuario_id = NEW.usuario_id
    )
    BEGIN
      SELECT RAISE(ABORT, 'el gasto compartido requiere un movimiento de egreso');
    END;

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

    CREATE TRIGGER IF NOT EXISTS trg_pagos_deuda_movimiento_insert
    BEFORE INSERT ON pagos_deuda
    FOR EACH ROW
    WHEN NOT EXISTS (
      SELECT 1
      FROM deudas
      JOIN movimientos ON movimientos.id = NEW.movimiento_id
      JOIN depositos ON depositos.id = movimientos.deposito_id
      WHERE deudas.id = NEW.deuda_id
        AND depositos.usuario_id = deudas.usuario_id
        AND (
          (deudas.tipo = 'debo' AND movimientos.tipo = 'egreso') OR
          (deudas.tipo = 'me_deben' AND movimientos.tipo = 'ingreso')
        )
    )
    BEGIN
      SELECT RAISE(ABORT, 'el pago requiere un movimiento válido para la deuda');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_pagos_deuda_movimiento_update
    BEFORE UPDATE OF deuda_id, movimiento_id ON pagos_deuda
    FOR EACH ROW
    WHEN NOT EXISTS (
      SELECT 1
      FROM deudas
      JOIN movimientos ON movimientos.id = NEW.movimiento_id
      JOIN depositos ON depositos.id = movimientos.deposito_id
      WHERE deudas.id = NEW.deuda_id
        AND depositos.usuario_id = deudas.usuario_id
        AND (
          (deudas.tipo = 'debo' AND movimientos.tipo = 'egreso') OR
          (deudas.tipo = 'me_deben' AND movimientos.tipo = 'ingreso')
        )
    )
    BEGIN
      SELECT RAISE(ABORT, 'el pago requiere un movimiento válido para la deuda');
    END;
  `);
}
