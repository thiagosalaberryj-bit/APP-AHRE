# Reconocimiento local de comprobantes

El módulo integra únicamente ML Kit Text Recognition 16.0.1, con el modelo
latino incluido en la dependencia Android `com.google.mlkit:text-recognition`.
No utiliza la variante que descarga el modelo mediante Play Services.

- Documentación: https://developers.google.com/ml-kit/vision/text-recognition/v2/android
- Términos de uso: https://developers.google.com/ml-kit/terms

Tesseract y sus modelos se retiraron después de la comparación en dispositivo
y la selección expresa de ML Kit por el líder. No se distribuyen en este módulo.
