import SelectorSegmentado from '../SegmentedSelector';

const MODOS_GASTO = [{ id: 'uno', nombre: 'Un ítem' }, { id: 'lista', nombre: 'Registrar lista' }];

export default function SelectorModoGasto({ modo, alElegir, tema }: Pick<import('../../social/types').AspectoSocial,'tema'> & ({modo:string;alElegir:(modo:string)=>void})) {
  return <SelectorSegmentado tema={tema} opciones={MODOS_GASTO} valor={modo} alSeleccionar={alElegir} etiqueta="Agregar gasto" />;
}
