import type { AspectoSocial } from '../../social/types';
import EstadoVacio from './SocialEmptyState';
export default function RegistroNoDisponible(aspecto: import('../../social/types').AspectoSocial) {
 return <EstadoVacio icono="lock-closed-outline" titulo="Registro no disponible" descripcion="Las salas cerradas son de solo lectura. Sus pagos se registran desde la persona." {...aspecto} />;
}