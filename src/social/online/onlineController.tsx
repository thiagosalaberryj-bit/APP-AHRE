import {useEffect} from 'react';
import {AppState} from 'react-native';
import {obtenerSesionActual} from '../../authentication/sessionService';
import {URL_SERVIDOR} from '../../sync/remote';
import {recuperarEventosSociales,solicitarSocial} from './onlineService';
import {observarSocialOnline,leerSalasOnline} from './onlineStore';

export default function ControladorSocialOnline(){
  useEffect(()=>{
    let cerrado=false,ocupado=false,socket:WebSocket|null=null,usuarioConectado='',fallos=0,proximaConexion=0;
    const suscritos=new Set<string>();
    const suscribir=(canales:string[])=>{if(socket?.readyState===WebSocket.OPEN)for(const canal of canales)if(!suscritos.has(canal)&&suscritos.size<99){socket.send(JSON.stringify({canal}));suscritos.add(canal);}};
    const actualizar=async(forzar=false)=>{
      if(cerrado||ocupado||AppState.currentState!=='active')return;
      ocupado=true;
      try{
        const {usuario}=await obtenerSesionActual();
        if(!usuario){socket?.close();socket=null;usuarioConectado='';suscritos.clear();return;}
        if(usuarioConectado&&usuarioConectado!==usuario.id){socket?.close();socket=null;suscritos.clear();}
        const canales=await recuperarEventosSociales(forzar);
        if(cerrado||(await obtenerSesionActual()).usuario?.id!==usuario.id||AppState.currentState!=='active')return;
        const salas=await leerSalasOnline(usuario.id);
        const actuales=[...new Set([...canales,...salas.map(s=>'sala:'+s.sala.id)])];
        suscribir(actuales);
        if(!socket&&Date.now()>=proximaConexion){
          const {ticket}=await solicitarSocial<{ticket:string}>('/realtime-ticket',{});
          if(cerrado||(await obtenerSesionActual()).usuario?.id!==usuario.id||AppState.currentState!=='active')return;
          const conexion=new WebSocket(URL_SERVIDOR.replace(/^http/,'ws')+'/social/ws',['ahre.social.v1','ticket.'+ticket]);
          socket=conexion;usuarioConectado=usuario.id;suscritos.clear();
          conexion.onopen=()=>{fallos=0;suscribir(actuales);};
          conexion.onmessage=evento=>{try{const datos=JSON.parse(String(evento.data));if(datos.tipo!=='conectado')void actualizar();}catch{conexion.close();}};
          conexion.onerror=()=>conexion.close();
          conexion.onclose=()=>{if(socket===conexion){socket=null;suscritos.clear();proximaConexion=Date.now()+Math.min(30000,1000*2**Math.min(++fallos,5))+Math.random()*500;}};
        }
      }catch{socket?.close();socket=null;suscritos.clear();}
      finally{ocupado=false;}
    };
    const temporizador=setInterval(()=>{void actualizar();},15000);
    const dejar=observarSocialOnline(()=>{if(!ocupado)void actualizar();});
    const escucha=AppState.addEventListener('change',estado=>{if(estado==='active'){proximaConexion=0;void actualizar(true);}else{socket?.close();socket=null;suscritos.clear();}});
    void actualizar(true);return()=>{cerrado=true;clearInterval(temporizador);dejar();escucha.remove();socket?.close();};
  },[]);
  return null;
}
