import MarcoEncabezado from '../ScreenHeaderFrame';
import { DesplazamientoEncabezado } from '../HeaderScrollView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import EncabezadoSeccion from '../SectionHeader';
import EncabezadoPrincipal from '../MainHeader';
import { RUTAS } from '../../constants/routes';
import EstadoVacio from './SocialEmptyState';
import { ContextoDatosSociales } from '../../social/SocialDataContext';
import BotonSocial from './SocialButton';
import RequisitoCreacionSocial from './SocialCreationGate';
import {useEffect,useState} from 'react';
import {operacionFinancieraEnCurso,observarOperacionFinanciera} from '../../social/financialOperation';
export default function MarcoSocial({
  contexto,
  children
}: {contexto: ReturnType<typeof import('../../social/useSocialScreen').default>; children?: import('react').ReactNode}) {
  const {
    aspecto,
    navegacion,
    esSecundaria,
    esRegistro,
    parametros,
    titulo,
    descripcion,
    cargando,
    noDisponible
  } = contexto;
  const {
    tema,
    estilos,
    estilosGlobales
  } = aspecto;
  const [bloqueado,cambiarBloqueado]=useState(operacionFinancieraEnCurso());
  useEffect(()=>observarOperacionFinanciera(()=>cambiarBloqueado(operacionFinancieraEnCurso())),[]);
  const requiereDeposito = esRegistro && ['crear', 'persona', 'deuda', 'gasto', 'pago'].includes(parametros.tipo || '') && !parametros.gastoId;
  useEffect(()=>(navegacion.addListener as unknown as (tipo:'beforeRemove',accion:(evento:{preventDefault:()=>void})=>void)=>()=>void)?.('beforeRemove',evento=>{if(operacionFinancieraEnCurso())evento.preventDefault();}),[navegacion]);
  return <ContextoDatosSociales.Provider value={contexto.social}><SafeAreaView edges={['top']} style={estilosGlobales.areaSegura}>
      <MarcoEncabezado style={estilosGlobales.pantalla} tema={tema} encabezado={esSecundaria ? <EncabezadoSeccion tema={tema} titulo={titulo} descripcion={descripcion} alVolver={() => {if(!operacionFinancieraEnCurso())navegacion.goBack();}} /> : <EncabezadoPrincipal tema={tema} titulo="Social" descripcion="Tus deudas y gastos compartidos." alAbrirNotificaciones={() => navegacion.getParent()?.navigate(RUTAS.NOTIFICACIONES)} alAbrirPerfil={() => navegacion.getParent()?.navigate(RUTAS.PERFIL)} />}>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={estilos.expandir}>
          <DesplazamientoEncabezado keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} showsVerticalScrollIndicator={false}>
            <View pointerEvents={bloqueado?'none':'auto'} style={[estilos.contenido, !esSecundaria && estilos.contenidoPanel, esRegistro && estilos.contenidoFormulario, esRegistro && parametros.tipo === 'gasto' && estilos.contenidoGasto]}>
              {cargando ? null : contexto.error ? <View style={estilos.grupo}><EstadoVacio icono="alert-circle-outline" titulo="No pudimos cargar Social" descripcion={contexto.error} {...aspecto} /><BotonSocial texto="Reintentar" alPresionar={contexto.recargar} {...aspecto} /></View> : noDisponible ? <EstadoVacio icono="alert-circle-outline" titulo="No pudimos mostrar la información" descripcion="Volvé a Social para elegir otro registro." {...aspecto} /> : <RequisitoCreacionSocial aplicar={requiereDeposito} {...aspecto}>{children}</RequisitoCreacionSocial>}
            </View>
          </DesplazamientoEncabezado>
        </KeyboardAvoidingView>
      </MarcoEncabezado>
    </SafeAreaView></ContextoDatosSociales.Provider>;
}
