package expo.modules.receiptocr

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.SystemClock
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

// Reconocimiento local con ML Kit. La interpretación permanece en TypeScript.
class ModuloOcrComprobantes : Module() {
  private val bloqueo = Any()

  override fun definition() = ModuleDefinition {
    Name("AhreReceiptOcr")

    // AsyncFunction ejecuta el trabajo fuera del hilo de interfaz.
    AsyncFunction("reconocer") { uri: String, motor: String ->
      synchronized(bloqueo) {
        require(motor == "mlkit") {
          "Motor no disponible"
        }
        val inicio = SystemClock.elapsedRealtime()
        val archivo = archivoTemporal(uri)
        val opciones = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(archivo.path, opciones)
        require(opciones.outWidth > 0 && opciones.outHeight > 0) { "Imagen inválida" }
        var muestreo = 1
        while (maxOf(opciones.outWidth, opciones.outHeight) / muestreo > 4096) muestreo *= 2
        val imagen = BitmapFactory.decodeFile(archivo.path, BitmapFactory.Options().apply {
          inSampleSize = muestreo
          inPreferredConfig = Bitmap.Config.ARGB_8888
        }) ?: error("No se pudo abrir la imagen")
        try {
          val resultado = leerMlKit(imagen)
          resultado + mapOf(
            "duracionMs" to SystemClock.elapsedRealtime() - inicio,
            "ancho" to imagen.width,
            "alto" to imagen.height
          )
        } finally {
          imagen.recycle()
        }
      }
    }

    // Solo borra copias temporales propias; jamás una imagen original de la galería.
    AsyncFunction("eliminarTemporal") { uri: String ->
      synchronized(bloqueo) { archivoTemporal(uri).let { !it.exists() || it.delete() } }
    }
  }

  private fun archivoTemporal(uri: String): File {
    val contexto = appContext.reactContext ?: error("Aplicación no disponible")
    val ubicacion = Uri.parse(uri)
    require(ubicacion.scheme == "file") { "Se requiere una imagen local" }
    val archivo = File(ubicacion.path ?: error("Imagen inválida")).canonicalFile
    require(archivo.path.startsWith(contexto.cacheDir.canonicalPath + File.separator)) {
      "La imagen debe estar en la caché de AHRE"
    }
    return archivo
  }

  private fun leerMlKit(imagen: Bitmap): Map<String, Any> {
    val reconocedor = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
    try {
      val resultado = Tasks.await(reconocedor.process(InputImage.fromBitmap(imagen, 0)))
      val lineas = resultado.textBlocks.flatMap { bloque ->
        bloque.lines.map { linea ->
          val limites = linea.boundingBox
          mapOf(
            "texto" to linea.text,
            "x" to (limites?.left ?: 0),
            "y" to (limites?.top ?: 0),
            "ancho" to (limites?.width() ?: 0),
            "alto" to (limites?.height() ?: 0)
          )
        }
      }
      return mapOf("texto" to resultado.text, "lineas" to lineas)
    } finally {
      reconocedor.close()
    }
  }

}
