package expo.modules.recurrenceworker

import android.content.Context
import androidx.annotation.Keep
import androidx.work.Data
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import expo.modules.interfaces.taskManager.TaskConsumer
import expo.modules.interfaces.taskManager.TaskConsumerInterface
import expo.modules.interfaces.taskManager.TaskExecutionCallback
import expo.modules.interfaces.taskManager.TaskInterface
import expo.modules.interfaces.taskManager.TaskManagerInterface
import expo.modules.interfaces.taskManager.TaskManagerUtilsInterface
import expo.modules.interfaces.taskManager.TaskServiceProviderHelper
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import java.util.concurrent.TimeUnit
import kotlin.coroutines.resume

class ModuloRecurrencias : Module() {
  override fun definition() = ModuleDefinition {
    Name("AhreRecurrenceWorker")
    AsyncFunction("registrar") {
      val administrador = appContext.legacyModule<TaskManagerInterface>()
        ?: throw IllegalStateException("El administrador de tareas no está disponible.")
      administrador.registerTask("ahre-recurrences", ConsumidorRecurrencias::class.java, emptyMap<String, Any>())
    }
  }
}

@Keep
class ConsumidorRecurrencias(contexto: Context?, utilidades: TaskManagerUtilsInterface?) :
  TaskConsumer(contexto, utilidades), TaskConsumerInterface {
  private var tarea: TaskInterface? = null
  override fun taskType() = "ahre-recurrences"
  override fun didRegister(task: TaskInterface) {
    tarea = task
    // Sin restricciones de red: la generación es completamente local.
    WorkManager.getInstance(context).enqueueUniquePeriodicWork(
      "ahre-recurrences", ExistingPeriodicWorkPolicy.KEEP,
      PeriodicWorkRequestBuilder<TrabajoRecurrencias>(15, TimeUnit.MINUTES)
        .setInputData(Data.Builder().putString("scope", task.appScopeKey).build()).build()
    )
  }
  override fun didUnregister() {
    tarea = null
    WorkManager.getInstance(context).cancelUniqueWork("ahre-recurrences")
  }
  fun ejecutar(confirmar: TaskExecutionCallback) { taskManagerUtils.executeTask(tarea, null, confirmar) }
}

@Keep
class TrabajoRecurrencias(contexto: Context, parametros: WorkerParameters) : CoroutineWorker(contexto, parametros) {
  override suspend fun doWork(): Result {
    val servicio = TaskServiceProviderHelper.getTaskServiceImpl(applicationContext) ?: return Result.retry()
    val consumidores = servicio.getTaskConsumers(inputData.getString("scope") ?: return Result.failure()).filterIsInstance<ConsumidorRecurrencias>()
    if (consumidores.isEmpty()) return Result.retry()
    for (consumidor in consumidores) {
      val correcto = withTimeoutOrNull(8 * 60 * 1000L) {
        suspendCancellableCoroutine<Boolean> { continuacion ->
          consumidor.ejecutar { respuesta ->
            val resultado = respuesta["result"] as? Map<*, *>
            if (continuacion.isActive) continuacion.resume(resultado?.get("estado") == "completado")
          }
        }
      } ?: false
      if (!correcto) return Result.retry()
    }
    return Result.success()
  }
}
