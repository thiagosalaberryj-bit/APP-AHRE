import assert from 'node:assert/strict';
import test from 'node:test';

import { interpretarComprobante, interpretarImporteOcr, reconstruirLineasOcr, prepararItemsComprobante } from '../src/ocr/receiptParser.js';

test('prepara ítems editables por línea sin usar el total como importe de cada producto', () => {
  assert.deepEqual(prepararItemsComprobante(['Pizzas 2 x 100,00 200,00', 'Bebida $ 1.500,50', 'Producto sin importe']), [
    { descripcion: 'Pizzas 2 x 100,00', monto: 200 }, { descripcion: 'Bebida', monto: 1500.5 }, { descripcion: 'Producto sin importe', monto: null },
  ]);
});

const TICKET_BALANZA = `BALANZAS ELECTRONI CAS KRETZ SA
RUTA NAC NRO 9 kn 276 PUEBLO ESTHER - SANTA FE
DATOS ALHACENADOS EN MENORIA
FECHA: 15/10/26
HORA: 11:56
0.960k9 4000.00$/kg 3840.00S
T:0005
UND :A
01 ART. TOTAL($ ) 3840.00
TOTAL DE VENTA PESABLE
01 ART.
0.960k9
MUCHAS GRACIAS POR SU COMPRA`;

test('interpreta fecha y total del ticket real de balanza reportado por el líder', () => {
  const resultado = interpretarComprobante({ texto: TICKET_BALANZA });
  assert.equal(resultado.fecha, '15/10/2026');
  assert.equal(resultado.monto, 3840);
  assert.ok(resultado.descripcion.includes('0.960k9 4000.00$/kg 3840.00S'));
});

test('busca el importe después de TOTAL e ignora el contador de artículos anterior', () => {
  assert.equal(interpretarComprobante({ texto: '01 ART. TOTAL($ ) 3840.00' }).monto, 3840);
  assert.equal(interpretarComprobante({ texto: '12 ART. TOTAL A PAGAR $ 1.234,56' }).monto, 1234.56);
  assert.equal(interpretarComprobante({ texto: 'TOTAL 1200,00 1300,00' }).monto, null);
});

test('admite años cortos, puntos y espacios habituales entre componentes de fecha', () => {
  assert.equal(interpretarComprobante({ texto: 'FECHA: 15 / 10 / 26' }).fecha, '15/10/2026');
  assert.equal(interpretarComprobante({ texto: 'FECHA: 15.10.2026' }).fecha, '15/10/2026');
  assert.equal(interpretarComprobante({ texto: 'FECHA: 31/02/26' }).fecha, null);
});

test('la geometría no impide recuperar una fecha legible en el texto original', () => {
  const resultado = interpretarComprobante({ texto: 'FECHA: 15/10/26', lineas: [
    { texto: 'FECHA: 15/', x: 0, y: 0, alto: 20 },
    { texto: '10/26', x: 100, y: 35, alto: 20 },
  ] });
  assert.equal(resultado.fecha, '15/10/2026');
});

test('recupera el total del texto original si sus fragmentos quedaron en filas separadas', () => {
  const resultado = interpretarComprobante({ texto: '01 ART. TOTAL($ ) 3840.00', lineas: [
    { texto: '3840.00', x: 150, y: 0, alto: 20 },
    { texto: '01 ART. TOTAL($ )', x: 0, y: 35, alto: 20 },
  ] });
  assert.equal(resultado.monto, 3840);
});

test('normaliza importes con separadores locales e internacionales', () => {
  for (const valor of ['1.234,56', '1,234.56', '1234,56', '1234.56']) assert.equal(interpretarImporteOcr(valor), 1234.56);
  assert.equal(interpretarImporteOcr('1.234'), 1234);
  assert.equal(interpretarImporteOcr('-23,50'), null);
});

test('separa productos y total de subtotal, impuestos, efectivo y vuelto', () => {
  const resultado = interpretarComprobante({ texto: 'ALMACÉN\n14/09/2026\nLeche 2 x 1.900,00 3.800,00\nPan 3.500,00\nSUBTOTAL 7.300,00\nIVA 1.533,00\nTOTAL A PAGAR 8.833,00\nEFECTIVO 10.000,00\nVUELTO 1.167,00' });
  assert.equal(resultado.monto, 8833);
  assert.equal(resultado.fecha, '14/09/2026');
  assert.equal(resultado.productos.length, 2);
  assert.equal(resultado.descripcion, 'ALMACÉN\nLeche 2 x 1.900,00 3.800,00\nPan 3.500,00');
});

test('no elige arbitrariamente entre totales de igual prioridad', () => {
  const resultado = interpretarComprobante({ texto: 'TOTAL 1.234,00\nTOTAL 2.345,00' });
  assert.equal(resultado.monto, null);
  assert.equal(resultado.candidatosMonto.length, 2);
});

test('no interpreta CUIT, fecha, subtotal o pago como total', () => {
  assert.equal(interpretarComprobante({ texto: 'CUIT 30-12345678-9\n14/09/2026\nSUBTOTAL 500,00\nEFECTIVO 1.000,00' }).monto, null);
});

test('acepta un importe en la fila siguiente a TOTAL, sin tomar otro concepto', () => {
  assert.equal(interpretarComprobante({ texto: 'TOTAL\n$ 1.250,50' }).monto, 1250.5);
  assert.equal(interpretarComprobante({ texto: 'TOTAL\nEFECTIVO 2.000,00' }).monto, null);
});

test('valida el calendario y no confunde vencimiento con fecha de compra', () => {
  assert.equal(interpretarComprobante({ texto: '31/02/2026' }).fecha, null);
  assert.equal(interpretarComprobante({ texto: '2026-09-14\nCAE Vencimiento 24/09/2026' }).fecha, '14/09/2026');
  assert.equal(interpretarComprobante({ texto: '14-09-2026' }).fecha, '14/09/2026');
  assert.equal(interpretarComprobante({ texto: '14/09/2026\n15/09/2026' }).fecha, null);
});

test('reconstruye columnas OCR por posición antes de interpretar productos y total', () => {
  const resultado = { texto: '', lineas: [
    { texto: '120,00', x: 220, y: 10, alto: 20 },
    { texto: 'TOTAL', x: 0, y: 60, alto: 20 },
    { texto: 'Pan', x: 0, y: 10, alto: 20 },
    { texto: '120,00', x: 220, y: 61, alto: 20 },
  ] };
  assert.deepEqual(reconstruirLineasOcr(resultado), ['Pan 120,00', 'TOTAL 120,00']);
  assert.equal(interpretarComprobante(resultado).monto, 120);
  assert.deepEqual(interpretarComprobante(resultado).productos, ['Pan 120,00']);
});

test('conserva el nombre si cantidad y precios aparecen en la línea siguiente', () => {
  const resultado = interpretarComprobante({ texto: 'LECHE ENTERA\n2 x 1900,00 3800,00\nTOTAL 3800,00' });
  assert.deepEqual(resultado.productos, ['LECHE ENTERA — 2 x 1900,00 3800,00']);
});

test('una imagen sin texto produce campos incompletos sin información inventada', () => {
  const resultado = interpretarComprobante({ texto: '' });
  assert.equal(resultado.monto, null);
  assert.equal(resultado.fecha, null);
  assert.equal(resultado.descripcion, '');
  assert.deepEqual(resultado.productos, []);
});

test('conserva una descripción larga para que la persona pueda resumirla sin perder el original', () => {
  const texto = `${Array.from({ length: 40 }, (_, indice) => `Producto ${indice} 100,00`).join('\n')}\nTOTAL 4000,00`;
  const resultado = interpretarComprobante({ texto });
  assert.equal(resultado.productos.length, 40);
  assert.ok(resultado.descripcion.length > 500);
});

test('reconoce TOTALCS$) como total y nunca lo agrega como producto', () => {
  const resultado = interpretarComprobante({ texto: 'ALMACEN\nPan $1500\nTOTALCS$) 1500,00\nEFECTIVO 2000,00' });
  assert.equal(resultado.monto, 1500);
  assert.deepEqual(resultado.productos, ['Pan $1500']);
  assert.equal(resultado.descripcion, 'ALMACEN\nPan $1500');
});

test('no confunde el nombre Totalcare con la etiqueta TOTAL', () => {
  const resultado = interpretarComprobante({ texto: 'FARMACIA\nShampoo Totalcare $3000\nTOTAL 3000,00' });
  assert.deepEqual(resultado.productos, ['Shampoo Totalcare $3000']);
});

test('conserva nombres de producto en varias líneas y pesos/precios de la fila siguiente', () => {
  const resultado = interpretarComprobante({ texto: 'ALMACEN\nGALLETITAS\nSURTIDAS\n2 x 1000,00 2000,00\nTOTAL 2000,00' });
  assert.deepEqual(resultado.productos, ['GALLETITAS — SURTIDAS — 2 x 1000,00 2000,00']);
});

test('admite precios enteros en una tabla sin mezclar la dirección o el CUIT', () => {
  const resultado = interpretarComprobante({ texto: 'KIOSCO 24\nCALLE FALSA 123\nCUIT 30-12345678-9\nDESCRIPCION CANT PRECIO IMPORTE\nAgua 1 1500\nPan 2 2000\nTOTAL 3500' });
  assert.equal(resultado.comercio, 'KIOSCO 24');
  assert.deepEqual(resultado.productos, ['Agua 1 1500', 'Pan 2 2000']);
  assert.equal(resultado.descripcion, 'KIOSCO 24\nAgua 1 1500\nPan 2 2000');
});

test('conserva la hora explícita del comprobante, validando sus componentes', () => {
  assert.equal(interpretarComprobante({ texto: TICKET_BALANZA }).hora, '11:56');
  assert.equal(interpretarComprobante({ texto: 'HORA: 29:80' }).hora, null);
});
