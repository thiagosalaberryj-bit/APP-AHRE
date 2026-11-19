# Eliminar mis datos desde Perfil

En **Perfil → Zona de peligro → Eliminar mis datos**, revisá la cuenta y el resumen
de depósitos, movimientos y deudas personales. Para confirmar, ingresá tu
contraseña actual y escribí `BORRAR MIS DATOS`. El flujo requiere conexión y
una versión del servidor que admita el reinicio de datos propios.

## Alcance

| Datos | Resultado |
| --- | --- |
| Registros privados de la cuenta | Se borran depósitos, movimientos, transferencias, recurrencias, fichas, salas privadas, deudas personales y pagos. |
| Preferencias e integraciones | Se restablecen las preferencias y se eliminan los avisos y el vínculo de Mercado Pago de AHRE, incluidos los resultados importados. |
| Dispositivo | Se descartan los cambios locales pendientes, se limpian cachés de la cuenta y se cancela su programación de avisos. |
| Acceso | Se conserva la cuenta con el mismo correo y contraseña. La app vuelve al inicio de sesión. |
| Otras personas | Conservan fichas, gastos compartidos, deudas, pagos contabilizados, depósitos y saldos. En la agenda, la cuenta que se desvinculó figura como **Sin vincular**. |
| Deudas compartidas | Las saldadas y perdonadas aparecen en el historial personal. Las pendientes conservan su importe y pagos confirmados y quedan en solo lectura con el aviso **Cuenta desvinculada**. |
| Salas compartidas | Se conserva el reparto y se retira el acceso de quien reinicia. Si era quien administraba la sala, la sala queda como historial. |

El reinicio actúa sobre datos de AHRE. Las transacciones y el dinero que
existen en la cuenta de Mercado Pago quedan en el proveedor.

## Confirmación y recuperación

La app espera las tareas activas antes de consultar o confirmar. Cuando las
filas que se van a borrar cambian, el servidor rechaza la confirmación y el
modal actualiza la vista previa para que la revises de nuevo.

Si se interrumpe la conexión, la app conserva un recibo en SecureStore. Solo
limpia SQLite al confirmar el resultado del servidor. Si el resultado queda
pendiente, cerrá y volvé a abrir AHRE con conexión para completar la operación.
Las otras cuentas actualizan sus vínculos y deudas al sincronizar Social.

## Verificación

`tests/dataReset.test.ts` cubre SQLite y la recuperación del recibo.
Los casos de reinicio de `tests/onlineIntegration.test.ts` usan cuentas ficticias
y una base MySQL aislada para verificar el flujo completo. Consultá la
[guía del entorno de pruebas](entorno.md#pruebas).
