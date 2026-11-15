export function posicionarSelectorDeposito({x,y,ancho,alto,anchoCapa,altoCapa,superior,inferior,cantidad,multiple}:{x:number;y:number;ancho:number;alto:number;anchoCapa:number;altoCapa:number;superior:number;inferior:number;cantidad:number;multiple:boolean}){
  const margen=12,separacion=4;
  const inicio=superior+margen,fin=altoCapa-inferior-margen;
  const abajo=Math.max(0,fin-y-alto-separacion),arriba=Math.max(0,y-separacion-inicio);
  const deseado=Math.min(320,cantidad*52+(multiple?76:0)+2);
  const abrirArriba=abajo<deseado&&arriba>abajo;
  const disponible=abrirArriba?arriba:abajo;
  const minimo=multiple?124:48;
  const usarVentana=disponible<minimo;
  const maxHeight=Math.max(0,Math.min(deseado,fin-inicio,usarVentana?fin-inicio:disponible));
  const topDeseado=usarVentana?inicio:abrirArriba?y-separacion-maxHeight:y+alto+separacion;
  const top=Math.max(inicio,Math.min(topDeseado,fin-maxHeight));
  const width=Math.max(0,Math.min(Math.max(ancho,240),360,anchoCapa-2*margen));
  return {left:Math.max(margen,Math.min(x,anchoCapa-width-margen)),top,width,maxHeight};
}
