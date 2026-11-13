package expo.modules.recurrenceworker

import android.app.AlarmManager
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ModuloAlarmasExactas : Module() {
  override fun definition() = ModuleDefinition {
    Name("AhreExactAlarms")
    AsyncFunction("permitidas") {
      val contexto = appContext.reactContext ?: throw IllegalStateException("Contexto no disponible")
      Build.VERSION.SDK_INT < Build.VERSION_CODES.S ||
        (contexto.getSystemService(Context.ALARM_SERVICE) as AlarmManager).canScheduleExactAlarms()
    }
    AsyncFunction("abrirAjustes") {
      val contexto = appContext.reactContext ?: throw IllegalStateException("Contexto no disponible")
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val paquete = Uri.parse("package:${contexto.packageName}")
        try {
          contexto.startActivity(Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, paquete).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        } catch (_: ActivityNotFoundException) {
          contexto.startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, paquete).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        }
      }
    }
  }
}
