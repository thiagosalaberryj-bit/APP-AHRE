export function tiempoHastaRecurrencia(fecha:string,activa:boolean,ahora=Date.now()){
  if(!activa)return 'Pausado';
  const diferencia=Date.parse(fecha)-ahora;
  if(!Number.isFinite(diferencia))return 'Revisá la próxima fecha';
  if(diferencia<=0)return 'Pendiente de registro';
  const minutos=Math.ceil(diferencia/60000);
  if(minutos<60)return minutos===1?'En menos de un minuto':'En '+minutos+' min';
  const horas=Math.floor(minutos/60),resto=minutos%60;
  if(horas<24)return 'En '+horas+' h'+(resto?' '+resto+' min':'');
  const dias=Math.floor(horas/24),horasRestantes=horas%24;
  return 'En '+dias+(dias===1?' día':' días')+(horasRestantes?' y '+horasRestantes+' h':'');
}
