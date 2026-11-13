export function avisosHabilitados(generales:boolean,permiso:string){
 return generales&&permiso==='Permitidas';
}
export function estadoEntregaAvisos(generales:boolean,permiso:string){
 if(!generales)return 'Desactivadas en AHRE';
 if(permiso==='Permitidas')return 'Activadas';
 if(permiso==='Sin permiso'||permiso==='Desactivadas en Ajustes')return 'Bloqueadas en Android';
 if(permiso==='No disponible')return 'No disponibles en este dispositivo';
 return 'Comprobando permiso del teléfono…';
}
