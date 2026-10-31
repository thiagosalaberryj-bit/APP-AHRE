import { crearRepositorio } from './repositoryFactory';

export const gastosCompartidosRepositorio = crearRepositorio({
  tabla: 'gastos_compartidos',
  campos: ["usuario_id","sala_id","pagador_id","descripcion","monto_total","fecha","reparto","plan_pagos","estado","version","fecha_creacion","fecha_actualizacion"],
  camposFiltrables: ["usuario_id","sala_id","estado"],
  ordenPredeterminado: 'id',
});
