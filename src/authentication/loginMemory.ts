import * as SecureStore from 'expo-secure-store';

const CLAVE_RECORDATORIO = 'ahre.ingreso.recordatorio';
export async function leerRecordatorioIngreso():Promise<{recordar:boolean;correo:string}>{
  const guardado=await SecureStore.getItemAsync(CLAVE_RECORDATORIO);
  if(!guardado)return {recordar:true,correo:''};
  try{const datos=JSON.parse(guardado);return {recordar:datos.recordar!==false,correo:datos.recordar!==false&&typeof datos.correo==='string'?datos.correo:''};}
  catch{return {recordar:true,correo:''};}
}
export async function guardarRecordatorioIngreso(correo:string,recordar:boolean){
  await SecureStore.setItemAsync(CLAVE_RECORDATORIO,JSON.stringify({recordar,correo:recordar?correo.trim().toLowerCase():''}));
}

export async function limpiarCorreoRecordado(){await SecureStore.deleteItemAsync(CLAVE_RECORDATORIO);}
