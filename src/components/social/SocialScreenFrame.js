import { SafeAreaView } from 'react-native-safe-area-context';
import { View, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import EncabezadoSeccion from '../SectionHeader';
import EncabezadoPrincipal from '../MainHeader';
import { RUTAS } from '../../constants/routes';
import EstadoVacio from './SocialEmptyState';
import { ContextoDatosSociales } from '../../social/SocialDataContext';
import BotonSocial from './SocialButton';
import RequisitoCreacionSocial from './SocialCreationGate';
export default function MarcoSocial({
  contexto,
  children
}) {
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
  const requiereDeposito = esRegistro && ['crear', 'persona', 'deuda', 'gasto', 'pago'].includes(parametros.tipo) && !parametros.gastoId;
  return <ContextoDatosSociales.Provider value={contexto.social}><SafeAreaView edges={['top']} style={estilosGlobales.areaSegura}>
      <View style={estilosGlobales.pantalla}>
        {esSecundaria ? <EncabezadoSeccion tema={tema} titulo={titulo} descripcion={descripcion} alVolver={() => navegacion.goBack()} /> : <EncabezadoPrincipal tema={tema} titulo="Social" descripcion="Tus deudas y gastos compartidos." alAbrirNotificaciones={() => navegacion.getParent()?.navigate(RUTAS.NOTIFICACIONES)} alAbrirPerfil={() => navegacion.getParent()?.navigate(RUTAS.PERFIL)} />}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={estilos.expandir}>
          <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} showsVerticalScrollIndicator={false}>
            <View style={[estilos.contenido, !esSecundaria && estilos.contenidoPanel, esRegistro && estilos.contenidoFormulario, esRegistro && parametros.tipo === 'gasto' && estilos.contenidoGasto]}>
              {cargando ? <View style={[estilosGlobales.tarjeta, estilos.grupo]}><Text style={estilosGlobales.textoSecundario}>Cargando información…</Text><View style={estilos.lineaCarga} /></View> : contexto.error ? <View style={estilos.grupo}><EstadoVacio icono="alert-circle-outline" titulo="No pudimos cargar Social" descripcion={contexto.error} {...aspecto} /><BotonSocial texto="Reintentar" alPresionar={contexto.recargar} {...aspecto} /></View> : noDisponible ? <EstadoVacio icono="alert-circle-outline" titulo="No pudimos mostrar la información" descripcion="Volvé a Social para elegir otro registro." {...aspecto} /> : <RequisitoCreacionSocial aplicar={requiereDeposito} {...aspecto}>{children}</RequisitoCreacionSocial>}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView></ContextoDatosSociales.Provider>;
}
