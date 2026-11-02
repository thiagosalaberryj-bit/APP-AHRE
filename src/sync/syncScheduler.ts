import type {VistaSync} from './syncService';

export function crearProgramadorSincronizacion({sincronizar,obtenerVista,estaActiva}:{sincronizar:(silenciosa:boolean)=>Promise<void>;obtenerVista:()=>Pick<VistaSync,'estado'|'pendientes'>;estaActiva:()=>boolean}){
  let cerrado=false,ocupado=false,pendiente=false,silenciosaPendiente=true,fallos=0;
  let trabajo:ReturnType<typeof setTimeout>|undefined,fondo:ReturnType<typeof setTimeout>|undefined;
  function programarFondo(){
    clearTimeout(fondo);fondo=undefined;
    if(cerrado||ocupado||pendiente||!estaActiva())return;
    const vista=obtenerVista();
    const demora=vista.estado==='offline'?Math.min(30000,2000*2**Math.min(fallos,4)):['online','sesion'].includes(vista.estado)?60000:0;
    if(vista.estado==='sincronizando'&&vista.pendientes){solicitar(false,0);return;}
    if(demora)fondo=setTimeout(()=>solicitar(true,0),demora);
  }
  function solicitar(silenciosa=false,demora=300){
    if(cerrado)return;
    pendiente=true;silenciosaPendiente=silenciosaPendiente&&silenciosa;
    clearTimeout(fondo);fondo=undefined;clearTimeout(trabajo);
    // Nunca descartar el aviso: si hay un envío en curso, se atiende al terminar.
    if(ocupado||!estaActiva())return;
    trabajo=setTimeout(()=>{void ejecutar();},demora);
  }
  async function ejecutar(){
    if(cerrado||ocupado||!pendiente||!estaActiva())return;
    const silenciosa=silenciosaPendiente;
    pendiente=false;silenciosaPendiente=true;ocupado=true;
    try{await sincronizar(silenciosa);}catch{/* El servicio publica el detalle del fallo. */}
    finally{
      ocupado=false;
      fallos=obtenerVista().estado==='offline'?fallos+1:0;
      if(pendiente)solicitar(silenciosaPendiente,0);else programarFondo();
    }
  }
  return {
    solicitar,
    actualizar:programarFondo,
    activar(){fallos=0;solicitar(true,0);},
    suspender(){clearTimeout(fondo);clearTimeout(trabajo);},
    cerrar(){cerrado=true;clearTimeout(fondo);clearTimeout(trabajo);},
  };
}
