import {useEffect,useState} from 'react';
import {observarSocialOnline,obtenerSalaOnline} from '../socialService';
import {useDatosSociales} from '../SocialDataContext';

type Detalle=Awaited<ReturnType<typeof obtenerSalaOnline>>;
const lecturas=new Map<string,Promise<Detalle>>();
function consultar(usuarioId:string,id:string){
  const clave=usuarioId+':'+id,pendiente=lecturas.get(clave);
  if(pendiente)return pendiente;
  const lectura=obtenerSalaOnline(id).finally(()=>{if(lecturas.get(clave)===lectura)lecturas.delete(clave);});
  lecturas.set(clave,lectura);return lectura;
}
export default function useSalaOnline(id:string,online=true){
  const {usuarioId}=useDatosSociales();
  const [estado,cambiar]=useState<{clave:string;detalle:Detalle}|null>(null),clave=usuarioId+':'+id;
  useEffect(()=>{
    let activo=true,version=0;
    const cargar=(novedad=false)=>{
      if(!online){cambiar(null);return;}
      const actual=++version;
      const anterior=novedad?lecturas.get(clave):null;
      const lectura=anterior?anterior.catch(()=>null).then(()=>consultar(usuarioId,id)):consultar(usuarioId,id);
      void lectura.then(detalle=>{if(activo&&actual===version)cambiar({clave,detalle});}).catch(()=>{if(activo&&actual===version)cambiar(null);});
    };
    cargar();const dejar=observarSocialOnline(()=>cargar(true));return()=>{activo=false;dejar();};
  },[id,online,usuarioId]);
  return online&&estado?.clave===clave?estado.detalle:null;
}
