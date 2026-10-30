import { COLORES_DEPOSITOS } from '../styles/colors';
export const PERSONAS_SIMULADAS = Object.freeze([{
  id: 'tomas',
  porCobrar: '$ 4.000',
  porPagar: '$ 2.000',
  nombre: 'Tomás',
  apellido: 'Pérez',
  apodo: 'Tomi',
  iniciales: 'TO'
}, {
  id: 'joaquin',
  porCobrar: '$ 0',
  porPagar: '$ 4.000',
  nombre: 'Joaquín',
  apellido: 'Ramos',
  apodo: 'Joaco',
  iniciales: 'JO'
}, {
  id: 'lucia',
  porCobrar: '$ 0',
  porPagar: '$ 0',
  nombre: 'Lucía',
  apellido: 'Gómez',
  apodo: 'Lu',
  iniciales: 'LU'
}, {
  id: 'ana',
  porCobrar: '$ 0',
  porPagar: '$ 3.000',
  nombre: 'Ana',
  apellido: 'Martínez',
  apodo: 'Ani',
  iniciales: 'AN'
}, {
  id: 'federico',
  porCobrar: '$ 1.500',
  porPagar: '$ 0',
  nombre: 'Federico',
  apellido: 'López',
  apodo: 'Fede',
  iniciales: 'FE'
}, {
  id: 'carla',
  porCobrar: '$ 2.000',
  porPagar: '$ 0',
  nombre: 'Carla',
  apellido: 'Torres',
  apodo: 'Carlita',
  iniciales: 'CA'
}, {
  id: 'diego',
  porCobrar: '$ 0',
  porPagar: '$ 0',
  nombre: 'Diego',
  apellido: 'Suárez',
  apodo: 'Diegui',
  iniciales: 'DI'
}]);
export const PERSONA_ACTUAL = Object.freeze({
  id: 'vos',
  nombre: 'Vos',
  iniciales: 'YO'
});
export const DEUDAS_SIMULADAS = Object.freeze([{
  id: 'cine',
  fecha: '2026-08-15',
  personaId: 'tomas',
  descripcion: 'Su entrada al cine',
  origen: 'Salida al cine · Sala cerrada',
  salaId: 'cine-agosto',
  tipo: 'me_deben',
  monto: '$ 8.000',
  pendiente: '$ 4.000',
  estado: 'Pago parcial · Recibiste $ 4.000'
}, {
  id: 'transporte',
  fecha: '2026-09-19',
  personaId: 'tomas',
  descripcion: 'Viaje en colectivo',
  origen: 'Deuda personal',
  tipo: 'debo',
  monto: '$ 2.000',
  pendiente: '$ 2.000',
  estado: 'Pendiente'
}, {
  id: 'compra',
  fecha: '2026-09-21',
  personaId: 'joaquin',
  descripcion: 'Compra que hizo por vos',
  origen: 'Deuda personal',
  tipo: 'debo',
  monto: '$ 4.000',
  pendiente: '$ 4.000',
  estado: 'Pendiente'
}, {
  id: 'almuerzo',
  fecha: '2026-09-23',
  personaId: 'ana',
  descripcion: 'Tu parte del almuerzo',
  origen: 'Deuda personal',
  tipo: 'debo',
  monto: '$ 3.000',
  pendiente: '$ 3.000',
  estado: 'Pendiente'
}, {
  id: 'cafe',
  fecha: '2026-09-24',
  personaId: 'federico',
  descripcion: 'Su parte del café',
  origen: 'Deuda personal',
  tipo: 'me_deben',
  monto: '$ 1.500',
  pendiente: '$ 1.500',
  estado: 'Pendiente'
}, {
  id: 'merienda',
  fecha: '2026-09-25',
  personaId: 'carla',
  descripcion: 'Su parte de la merienda',
  origen: 'Deuda personal',
  tipo: 'me_deben',
  monto: '$ 2.000',
  pendiente: '$ 2.000',
  estado: 'Pendiente'
}, {
  id: 'entrada-federico',
  fecha: '2026-08-15',
  personaId: 'federico',
  descripcion: 'Su entrada al cine',
  origen: 'Salida al cine · Sala cerrada',
  salaId: 'cine-agosto',
  tipo: 'me_deben',
  monto: '$ 8.000',
  saldada: true,
  estado: 'Saldado'
}]);
export const LIMITE_SALAS_ACTIVAS = 3;
export const ICONOS_SALA = Object.freeze([{
  id: 'restaurant-outline',
  nombre: 'Comida'
}, {
  id: 'cafe-outline',
  nombre: 'Merienda'
}, {
  id: 'people-outline',
  nombre: 'Encuentro'
}, {
  id: 'film-outline',
  nombre: 'Cine'
}, {
  id: 'car-outline',
  nombre: 'Transporte'
}, {
  id: 'home-outline',
  nombre: 'Casa'
}, {
  id: 'airplane-outline',
  nombre: 'Viaje'
}, {
  id: 'gift-outline',
  nombre: 'Regalo'
}]);
export const NOMBRES_COLORES_SALA = Object.freeze(['Verde suave', 'Azul suave', 'Violeta', 'Rosa', 'Amarillo suave']);
export const SALAS_SIMULADAS = Object.freeze([{
  id: 'cena-viernes',
  nombre: 'Cena del viernes',
  fecha: '18 sep 2026',
  creadaEl: '2026-09-16',
  totalGastado: '$ 54.000',
  porCobrar: '$ 16.000',
  porPagar: '$ 2.000',
  descripcion: 'Una salida a comer entre amigos',
  icono: 'restaurant-outline',
  color: COLORES_DEPOSITOS[0],
  categoriaId: 'alimentacion',
  estado: 'abierta',
  participantes: ['tomas', 'joaquin', 'lucia'],
  gastos: [{
    id: 'pizzas',
    descripcion: 'Pizzas',
    monto: '$ 32.000',
    fecha: '18 sep 2026',
    pagadorId: 'vos',
    distribucion: 'Partes iguales · $ 16.000 por persona',
    partes: [{
      personaId: 'vos',
      monto: '$ 16.000',
      resumen: 'Tu parte pagada',
      tipo: 'saldado'
    }, {
      personaId: 'tomas',
      monto: '$ 16.000',
      resumen: 'Te debe $ 16.000',
      tipo: 'debe'
    }]
  }, {
    id: 'bebidas',
    descripcion: 'Bebidas',
    monto: '$ 16.000',
    fecha: '18 sep 2026',
    pagadorId: 'lucia',
    distribucion: 'Partes iguales · $ 8.000 por persona',
    partes: [{
      personaId: 'joaquin',
      monto: '$ 8.000',
      resumen: 'Le debe $ 8.000 a Lucía',
      tipo: 'debe'
    }, {
      personaId: 'lucia',
      monto: '$ 8.000',
      resumen: 'Su parte pagada',
      tipo: 'saldado'
    }]
  }, {
    id: 'taxi',
    descripcion: 'Taxi de regreso',
    monto: '$ 6.000',
    fecha: '18 sep 2026',
    pagadorId: 'lucia',
    distribucion: 'Partes iguales · $ 2.000 por persona',
    partes: [{
      personaId: 'vos',
      monto: '$ 2.000',
      resumen: 'Le debés $ 2.000 a Lucía',
      tipo: 'debe'
    }, {
      personaId: 'tomas',
      monto: '$ 2.000',
      resumen: 'Ya le dio su parte a Lucía',
      tipo: 'saldado'
    }, {
      personaId: 'lucia',
      monto: '$ 2.000',
      resumen: 'Su parte pagada',
      tipo: 'saldado'
    }]
  }]
}, {
  id: 'merienda-hoy',
  nombre: 'Merienda de hoy',
  fecha: 'Hoy',
  creadaEl: '2026-10-29',
  totalGastado: '$ 0',
  porCobrar: '$ 0',
  porPagar: '$ 0',
  descripcion: 'Recién creada. Agregá el primer gasto cuando lo necesites.',
  icono: 'cafe-outline',
  color: COLORES_DEPOSITOS[4],
  categoriaId: 'alimentacion',
  estado: 'abierta',
  participantes: ['lucia', 'ana'],
  gastos: []
}, {
  id: 'picada',
  nombre: 'Picada del sábado',
  fecha: '12 sep 2026',
  creadaEl: '2026-09-10',
  totalGastado: '$ 36.000',
  porCobrar: '$ 0',
  porPagar: '$ 0',
  descripcion: 'Todos pagaron su parte en el momento',
  icono: 'cafe-outline',
  color: COLORES_DEPOSITOS[3],
  categoriaId: 'alimentacion',
  estado: 'cerrada',
  participantes: ['lucia', 'ana'],
  gastos: [{
    id: 'picada',
    descripcion: 'Picada',
    monto: '$ 36.000',
    fecha: '12 sep 2026',
    pagadorId: 'vos',
    distribucion: 'Partes iguales · $ 12.000 por persona',
    partes: [{
      personaId: 'vos',
      monto: '$ 12.000',
      resumen: 'Tu parte pagada',
      tipo: 'saldado'
    }, {
      personaId: 'lucia',
      monto: '$ 12.000',
      resumen: 'Ya pagó su parte',
      tipo: 'saldado'
    }, {
      personaId: 'ana',
      monto: '$ 12.000',
      resumen: 'Ya pagó su parte',
      tipo: 'saldado'
    }]
  }]
}, {
  id: 'cine-agosto',
  nombre: 'Salida al cine',
  fecha: '15 ago 2026',
  creadaEl: '2026-08-14',
  totalGastado: '$ 24.000',
  porCobrar: '$ 4.000',
  porPagar: '$ 0',
  descripcion: 'La sala cerró; el pago pendiente sigue activo',
  icono: 'film-outline',
  color: COLORES_DEPOSITOS[2],
  categoriaId: 'entretenimiento',
  estado: 'cerrada',
  participantes: ['tomas', 'federico'],
  gastos: [{
    id: 'entradas',
    descripcion: 'Entradas',
    monto: '$ 24.000',
    fecha: '15 ago 2026',
    pagadorId: 'vos',
    distribucion: 'Montos manuales',
    partes: [{
      personaId: 'vos',
      monto: '$ 8.000',
      resumen: 'Tu parte pagada',
      tipo: 'saldado'
    }, {
      personaId: 'tomas',
      monto: '$ 8.000',
      pendiente: '$ 4.000',
      resumen: 'Pagó $ 4.000 · Te debe $ 4.000',
      tipo: 'debe'
    }, {
      personaId: 'federico',
      monto: '$ 8.000',
      resumen: 'Ya pagó su parte',
      tipo: 'saldado'
    }]
  }]
}]);
export const SECCIONES_SALA = Object.freeze([{
  id: 'balances',
  nombre: 'Balances',
  icono: 'swap-horizontal-outline'
}, {
  id: 'gastos',
  nombre: 'Gastos',
  icono: 'receipt-outline'
}, {
  id: 'participantes',
  nombre: 'Personas',
  icono: 'people-outline'
}]);
export const TICKET_SOCIAL_SIMULADO = Object.freeze({
  montoTexto: '$ 48.000',
  productos: [{
    nombre: 'Pizzas',
    importe: '32000',
    importeTexto: '$ 32.000'
  }, {
    nombre: 'Bebidas',
    importe: '16000',
    importeTexto: '$ 16.000'
  }]
});
