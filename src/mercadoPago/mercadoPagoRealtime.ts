import { obtenerSesionActual } from '../authentication/sessionService';
import { obtenerSesionRemota, solicitarRemoto, URL_SERVIDOR } from '../sync/remote';

interface AccesoConsulta { url: string; ticket: string; canal: string; }
export interface DependenciasConsultaMp {
  obtenerAcceso: () => Promise<AccesoConsulta | null>;
  crearSocket: (url: string, protocolos: string[]) => WebSocket;
}
const dependenciasPredeterminadas: DependenciasConsultaMp = {
  async obtenerAcceso() {
    const { usuario } = await obtenerSesionActual();
    if (!usuario) return null;
    const remota = await obtenerSesionRemota(usuario.id);
    if (!remota) return null;
    const { ticket } = await solicitarRemoto<{ ticket: string }>('/social/realtime-ticket', {}, remota.token);
    if ((await obtenerSesionActual()).usuario?.id !== usuario.id) return null;
    return { url: URL_SERVIDOR.replace(/^http/, 'ws') + '/social/ws', ticket, canal: 'mp:' + usuario.id };
  },
  crearSocket: (url, protocolos) => new WebSocket(url, protocolos),
};

// Su propietario debe detenerlo al terminar el trabajo, perder foco o pasar a segundo plano.
export function seguirConsultaMp(trabajoId: string, version: string, actualizar: () => Promise<boolean>, cambiarConexion: (conectada: boolean) => void, dependencias = dependenciasPredeterminadas) {
  let cerrada = false, socket: WebSocket | null = null, fallos = 0, actualizando = false, otraActualizacion = false;
  let reintento: ReturnType<typeof setTimeout> | undefined, esperaConexion: ReturnType<typeof setTimeout> | undefined;
  const refrescar = async () => {
    if (cerrada) return;
    if (actualizando) { otraActualizacion = true; return; }
    actualizando = true;
    try { if (!await actualizar()) detener(); } catch { /* Se conserva la copia local; se recupera al reconectar. */ }
    finally { actualizando = false; if (otraActualizacion && !cerrada) { otraActualizacion = false; void refrescar(); } }
  };
  const programar = () => {
    if (cerrada || reintento) return;
    cambiarConexion(false);
    reintento = setTimeout(() => { reintento = undefined; void conectar(); }, Math.min(30000, 1000 * 2 ** Math.min(fallos++, 5)));
  };
  const conectar = async () => {
    try {
      const acceso = await dependencias.obtenerAcceso();
      if (cerrada) return;
      if (!acceso) { programar(); return; }
      const conexion = dependencias.crearSocket(acceso.url, ['ahre.social.v1', 'ticket.' + acceso.ticket]);
      socket = conexion;
      esperaConexion = setTimeout(() => conexion.close(), 8000);
      conexion.onopen = () => {
        clearTimeout(esperaConexion);
        if (cerrada) { conexion.close(); return; }
        fallos = 0; cambiarConexion(true); conexion.send(JSON.stringify({ canal: acceso.canal }));
      };
      conexion.onmessage = evento => {
        if (cerrada) return;
        try {
          const dato = JSON.parse(String(evento.data));
          if (dato.canal === acceso.canal && (dato.tipo === 'recuperar' || dato.tipo === 'mercado_pago' && dato.version === version && (!dato.trabajoId || dato.trabajoId === trabajoId))) void refrescar();
        } catch { conexion.close(); }
      };
      conexion.onerror = () => conexion.close();
      conexion.onclose = () => { clearTimeout(esperaConexion); if (socket === conexion) socket = null; programar(); };
    } catch { programar(); }
  };
  // Recupera el estado si se pierde un evento o el servidor todavía no publica el canal.
  const comprobacion = setInterval(() => { void refrescar(); }, 15000);
  const detener = () => { cerrada = true; clearTimeout(reintento); clearTimeout(esperaConexion); clearInterval(comprobacion); socket?.close(); };
  void conectar();
  return detener;
}
