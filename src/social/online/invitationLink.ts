export function leerEnlaceInvitacion(texto:string,origen:string){
  try{
    const url=new URL(texto.trim());
    const esWeb=url.origin===new URL(origen).origin&&url.pathname==='/invitacion/'&&url.protocol==='https:';
    const esApp=url.protocol==='ahre:'&&url.hostname==='invitation';
    if(!esWeb&&!esApp)return null;
    const fragmento=esWeb?url.hash.slice(1):url.searchParams.get('token');
    const global=esWeb?fragmento?.startsWith('sala='):url.searchParams.get('global')==='1';
    const token=global&&esWeb?fragmento?.slice(5):fragmento;
    const canje=esApp?url.searchParams.get('canje')||undefined:undefined;
    if(!token||!/^[a-f0-9]{64}$/.test(token)||canje&&(canje.length>180||!/^[a-zA-Z0-9:-]+$/.test(canje)))return null;
    return {token,canje,...(global?{global:true}:{})};
  }catch{return null;}
}
