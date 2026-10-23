import { useContext, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import EncabezadoPrincipal from '../components/MainHeader';
import EncabezadoSeccion from '../components/SectionHeader';
import { RUTAS } from '../constants/routes';
import { ContextoApariencia } from '../contexts/AppearanceContext';
import { crearEstilosGlobales } from '../styles/globalStyles';
import { crearEstilosSocial } from '../styles/SocialScreenStyles';

const SALAS_SIMULADAS = Object.freeze([
  {
    id: 'bariloche', nombre: 'Viaje Bariloche', descripcion: 'Gastos del viaje entre amigos', icono: 'airplane-outline',
    participantes: [
      { id: 'thiago', nombre: 'Thiago', iniciales: 'TH', balance: 'saldado', resumen: 'Está al día' },
      { id: 'tomas', nombre: 'Tomás', iniciales: 'TO', balance: 'debe', resumen: 'Debe $ 8.000' },
      { id: 'joaquin', nombre: 'Joaquín', iniciales: 'JO', balance: 'recibe', resumen: 'Debe recibir $ 4.000' },
      { id: 'lucia', nombre: 'Lucía', iniciales: 'LU', balance: 'recibe', resumen: 'Debe recibir $ 4.000' },
    ],
    gastos: [
      { id: 'cena', descripcion: 'Cena', monto: '$ 48.000', pago: 'Thiago', fecha: '18 sep 2026', distribucion: 'Entre 4 participantes' },
      { id: 'combustible', descripcion: 'Combustible', monto: '$ 32.000', pago: 'Joaquín', fecha: '17 sep 2026', distribucion: 'Entre 4 participantes' },
    ],
  },
  {
    id: 'cena-amigos', nombre: 'Cena con amigos', descripcion: 'Una sala lista para registrar gastos', icono: 'restaurant-outline',
    participantes: [
      { id: 'thiago', nombre: 'Thiago', iniciales: 'TH', balance: 'saldado', resumen: 'Está al día' },
      { id: 'ana', nombre: 'Ana', iniciales: 'AN', balance: 'saldado', resumen: 'Está al día' },
      { id: 'fede', nombre: 'Federico', iniciales: 'FE', balance: 'saldado', resumen: 'Está al día' },
      { id: 'maria', nombre: 'María', iniciales: 'MA', balance: 'saldado', resumen: 'Está al día' },
      { id: 'juan', nombre: 'Juan', iniciales: 'JU', balance: 'saldado', resumen: 'Está al día' },
      { id: 'sofia', nombre: 'Sofía', iniciales: 'SO', balance: 'saldado', resumen: 'Está al día' },
    ],
    gastos: [],
  },
]);

const SECCIONES_SALA = Object.freeze([
  { id: 'participantes', nombre: 'Participantes', icono: 'people-outline' },
  { id: 'gastos', nombre: 'Gastos', icono: 'receipt-outline' },
  { id: 'balances', nombre: 'Balances', icono: 'swap-horizontal-outline' },
]);
const ETIQUETAS_BALANCE = Object.freeze({ debe: 'Debe', recibe: 'Debe recibir', saldado: 'Saldado' });

export default function PantallaSocial({ navigation: navegacion }) {
  const { tema } = useContext(ContextoApariencia);
  const { bottom: margenInferior } = useSafeAreaInsets();
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = crearEstilosSocial(tema, margenInferior);
  const [cargando, establecerCargando] = useState(true);
  const [error, establecerError] = useState(false);
  const [mostrarSalas, establecerMostrarSalas] = useState(true);
  const [salaSeleccionada, establecerSalaSeleccionada] = useState(null);
  const [seccionSala, establecerSeccionSala] = useState('participantes');
  const [modal, establecerModal] = useState(null);
  const [gastoSeleccionado, establecerGastoSeleccionado] = useState(null);
  const [avisoFormulario, establecerAvisoFormulario] = useState(false);

  useEffect(() => {
    const temporizador = setTimeout(() => establecerCargando(false), 650);
    return () => clearTimeout(temporizador);
  }, []);

  const abrirPantallaSecundaria = (ruta) => navegacion.getParent()?.navigate(ruta);
  const abrirModal = (tipo) => { establecerAvisoFormulario(false); establecerModal(tipo); };
  const cerrarModal = () => {
    establecerModal(null);
    establecerGastoSeleccionado(null);
    establecerAvisoFormulario(false);
  };
  const abrirSala = (sala) => {
    establecerSalaSeleccionada(sala);
    establecerSeccionSala('participantes');
  };
  const tituloModal = modal === 'crear' ? 'Crear sala' : modal === 'unirse' ? 'Unirse a una sala' : 'Agregar gasto';

  return (
    <SafeAreaView edges={['top']} style={estilosGlobales.areaSegura}>
      <View style={estilosGlobales.pantalla}>
        {salaSeleccionada ? (
          <EncabezadoSeccion tema={tema} titulo={salaSeleccionada.nombre} descripcion="Consultá la actividad de esta sala." alVolver={() => establecerSalaSeleccionada(null)} />
        ) : (
          <EncabezadoPrincipal tema={tema} titulo="Social" descripcion="Organizá gastos compartidos con otras personas."
            alAbrirNotificaciones={() => abrirPantallaSecundaria(RUTAS.NOTIFICACIONES)}
            alAbrirPerfil={() => abrirPantallaSecundaria(RUTAS.PERFIL)} />
        )}

        <ScrollView key={salaSeleccionada?.id || 'salas'} showsVerticalScrollIndicator={false}>
          <View style={estilos.contenido}>
            {cargando ? (
              <View accessibilityLabel="Cargando salas" style={[estilosGlobales.tarjeta, estilos.grupo]}>
                <Text style={estilosGlobales.textoSecundario}>Cargando salas…</Text>
                <View style={estilos.lineaCarga} /><View style={estilos.lineaCarga} />
              </View>
            ) : error ? (
              <View style={[estilosGlobales.tarjeta, estilos.estadoVacio]}>
                <Ionicons color={tema.error} name="alert-circle-outline" size={36} />
                <Text style={estilosGlobales.encabezadoSeccion}>No pudimos mostrar las salas</Text>
                <Text style={estilosGlobales.textoSecundario}>Intentá cargar la información de nuevo.</Text>
                <Pressable accessibilityRole="button" onPress={() => establecerError(false)} style={estilosGlobales.botonSecundario}>
                  <Text style={estilosGlobales.textoBotonSecundario}>Reintentar</Text>
                </Pressable>
              </View>
            ) : salaSeleccionada ? (
              <>
                <View style={[estilosGlobales.tarjeta, estilos.cabeceraSala]}>
                  <View style={estilos.iconoSalaGrande}><Ionicons color={tema.botonPrincipal} name={salaSeleccionada.icono} size={30} /></View>
                  <Text style={estilosGlobales.subtitulo}>{salaSeleccionada.nombre}</Text>
                  <Text style={estilosGlobales.textoSecundario}>{salaSeleccionada.descripcion}</Text>
                  <Text style={estilosGlobales.textoAyuda}>{salaSeleccionada.participantes.length} participantes · {salaSeleccionada.gastos.length} gastos</Text>
                </View>
                <Pressable accessibilityRole="button" onPress={() => abrirModal('gasto')} style={estilosGlobales.botonPrincipal}>
                  <Text style={estilosGlobales.textoBotonPrincipal}>+ Agregar gasto</Text>
                </Pressable>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.pestanas}>
                  {SECCIONES_SALA.map((seccion) => (
                    <Pressable key={seccion.id} accessibilityRole="tab" accessibilityState={{ selected: seccionSala === seccion.id }}
                      onPress={() => establecerSeccionSala(seccion.id)} style={[estilos.pestana, seccionSala === seccion.id && estilos.pestanaActiva]}>
                      <Ionicons color={seccionSala === seccion.id ? tema.botonPrincipalTexto : tema.textoSecundario} name={seccion.icono} size={18} />
                      <Text style={[estilos.textoPestana, seccionSala === seccion.id && estilos.textoPestanaActiva]}>{seccion.nombre}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                {seccionSala === 'participantes' ? (
                  <View style={estilos.grupo}>
                    <Text accessibilityRole="header" style={estilosGlobales.encabezadoSeccion}>Participantes</Text>
                    {salaSeleccionada.participantes.map((persona) => (
                      <View key={persona.id} style={[estilosGlobales.tarjeta, estilos.filaPersona]}>
                        <View style={estilos.avatar}><Text style={estilos.textoAvatar}>{persona.iniciales}</Text></View>
                        <View style={estilos.textoFlexible}><Text style={estilosGlobales.texto}>{persona.nombre}</Text><Text style={estilosGlobales.textoSecundario}>{persona.resumen}</Text></View>
                        <EtiquetaBalance persona={persona} estilos={estilos} />
                      </View>
                    ))}
                  </View>
                ) : null}
                {seccionSala === 'gastos' ? (
                  <View style={estilos.grupo}>
                    <Text accessibilityRole="header" style={estilosGlobales.encabezadoSeccion}>Gastos compartidos</Text>
                    {salaSeleccionada.gastos.length === 0 ? (
                      <EstadoVacio icono="receipt-outline" titulo="Todavía no hay gastos" descripcion="Los gastos de esta sala aparecerán acá." estilos={estilos} estilosGlobales={estilosGlobales} tema={tema} />
                    ) : salaSeleccionada.gastos.map((gasto) => (
                      <Pressable key={gasto.id} accessibilityRole="button" onPress={() => establecerGastoSeleccionado(gasto)} style={[estilosGlobales.tarjeta, estilos.filaGasto]}>
                        <View style={estilos.iconoLista}><Ionicons color={tema.botonPrincipal} name="receipt-outline" size={22} /></View>
                        <View style={estilos.textoFlexible}><Text style={estilosGlobales.texto}>{gasto.descripcion}</Text><Text style={estilosGlobales.textoSecundario}>Pagó: {gasto.pago} · {gasto.fecha}</Text><Text style={estilosGlobales.textoAyuda}>{gasto.distribucion}</Text></View>
                        <Text style={estilos.montoGasto}>{gasto.monto}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                {seccionSala === 'balances' ? (
                  <View style={estilos.grupo}>
                    <Text accessibilityRole="header" style={estilosGlobales.encabezadoSeccion}>Balances entre participantes</Text>
                    <Text style={estilosGlobales.textoSecundario}>Resumen de ejemplo de cómo se distribuirían los saldos de la sala.</Text>
                    {salaSeleccionada.participantes.every((persona) => persona.balance === 'saldado') ? (
                      <EstadoVacio icono="checkmark-circle-outline" titulo="Sin balances pendientes" descripcion="Todas las personas están al día." estilos={estilos} estilosGlobales={estilosGlobales} tema={tema} />
                    ) : salaSeleccionada.participantes.map((persona) => (
                      <View key={persona.id} style={[estilosGlobales.tarjeta, estilos.filaBalance]}>
                        <Ionicons color={persona.balance === 'debe' ? tema.error : persona.balance === 'recibe' ? tema.exito : tema.textoSecundario}
                          name={persona.balance === 'debe' ? 'arrow-up-circle-outline' : persona.balance === 'recibe' ? 'arrow-down-circle-outline' : 'checkmark-circle-outline'} size={26} />
                        <View style={estilos.textoFlexible}><Text style={estilosGlobales.texto}>{persona.nombre}</Text><Text style={estilosGlobales.textoSecundario}>{persona.resumen}</Text></View>
                        <EtiquetaBalance persona={persona} estilos={estilos} />
                      </View>
                    ))}
                    <View style={[estilosGlobales.tarjeta, estilos.grupo]}>
                      <Text style={estilosGlobales.etiqueta}>Detalle de distribución</Text>
                      <Text style={estilosGlobales.textoSecundario}>La relación entre quién pagó y quién debe se mostrará acá cuando se incorpore el cálculo de balances.</Text>
                    </View>
                  </View>
                ) : null}
                <Pressable accessibilityRole="button" onPress={() => establecerSalaSeleccionada(null)} style={estilosGlobales.botonTexto}>
                  <Text style={estilosGlobales.textoBotonTexto}>Volver a mis salas</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={estilos.filaTitulo}>
                  <View style={estilos.textoFlexible}><Text accessibilityRole="header" style={estilosGlobales.subtitulo}>Mis salas</Text><Text style={estilosGlobales.textoSecundario}>Compartí los gastos de cada grupo.</Text></View>
                  <View style={estilos.contador}><Text style={estilos.textoContador}>{mostrarSalas ? SALAS_SIMULADAS.length : 0}</Text></View>
                </View>
                {mostrarSalas ? (
                  <View style={estilos.grupo}>
                    {SALAS_SIMULADAS.map((sala) => (
                      <Pressable key={sala.id} accessibilityRole="button" onPress={() => abrirSala(sala)} style={[estilosGlobales.tarjeta, estilos.tarjetaSala]}>
                        <View style={estilos.iconoLista}><Ionicons color={tema.botonPrincipal} name={sala.icono} size={24} /></View>
                        <View style={estilos.textoFlexible}><Text style={estilosGlobales.encabezadoSeccion}>{sala.nombre}</Text><Text style={estilosGlobales.textoSecundario}>{sala.participantes.length} participantes</Text><Text style={estilosGlobales.textoAyuda}>{sala.descripcion}</Text></View>
                        <Ionicons color={tema.textoSecundario} name="chevron-forward" size={22} />
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <EstadoVacio icono="people-outline" titulo="Todavía no participás en ninguna sala" descripcion="Creá una sala o unite a una para organizar gastos compartidos." estilos={estilos} estilosGlobales={estilosGlobales} tema={tema} />
                )}
                <View style={estilos.grupo}>
                  <Pressable accessibilityRole="button" onPress={() => abrirModal('crear')} style={estilosGlobales.botonPrincipal}><Text style={estilosGlobales.textoBotonPrincipal}>Crear sala</Text></Pressable>
                  <Pressable accessibilityRole="button" onPress={() => abrirModal('unirse')} style={estilosGlobales.botonSecundario}><Text style={estilosGlobales.textoBotonSecundario}>Unirse a sala</Text></Pressable>
                </View>
                <View style={estilos.grupo}>
                  <Pressable accessibilityRole="button" onPress={() => establecerMostrarSalas((anterior) => !anterior)} style={estilosGlobales.botonTexto}>
                    <Text style={estilosGlobales.textoBotonTexto}>{mostrarSalas ? 'Ver ejemplo sin salas' : 'Ver salas de ejemplo'}</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={() => establecerError(true)} style={estilosGlobales.botonTexto}>
                    <Text style={estilosGlobales.textoBotonTexto}>Ver ejemplo de error</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </View>

      <Modal animationType="fade" onRequestClose={cerrarModal} transparent visible={modal !== null || gastoSeleccionado !== null}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={estilos.fondoModal}>
          <Pressable accessibilityLabel="Cerrar" accessibilityRole="button" onPress={cerrarModal} style={estilos.cierreFondo} />
          <View accessibilityViewIsModal style={estilos.tarjetaModal}>
            <View style={estilos.filaModal}>
              <Text style={estilosGlobales.encabezadoSeccion}>{gastoSeleccionado ? gastoSeleccionado.descripcion : tituloModal}</Text>
              <Pressable accessibilityLabel="Cerrar" accessibilityRole="button" onPress={cerrarModal} style={estilos.botonCerrar}><Ionicons color={tema.textoPrincipal} name="close" size={22} /></Pressable>
            </View>
            {gastoSeleccionado ? (
              <View style={estilos.grupo}>
                <Text style={estilosGlobales.monto}>{gastoSeleccionado.monto}</Text>
                <Text style={estilosGlobales.texto}>Pagó: {gastoSeleccionado.pago}</Text>
                <Text style={estilosGlobales.texto}>Fecha: {gastoSeleccionado.fecha}</Text>
                <Text style={estilosGlobales.textoSecundario}>{gastoSeleccionado.distribucion}</Text>
                <Pressable accessibilityRole="button" onPress={cerrarModal} style={estilosGlobales.botonSecundario}><Text style={estilosGlobales.textoBotonSecundario}>Volver a gastos</Text></Pressable>
              </View>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" style={estilos.desplazamientoModal}>
                <View style={estilos.grupo}>
                  <Text style={estilosGlobales.textoSecundario}>{modal === 'crear' ? 'Poné un nombre para identificar los gastos del grupo.' : modal === 'unirse' ? 'Ingresá el código de una sala cuando esté disponible.' : 'Representá un gasto del grupo. La división se definirá más adelante.'}</Text>
                  <CampoFormulario etiqueta={modal === 'crear' ? 'Nombre de la sala' : modal === 'unirse' ? 'Código de la sala' : 'Descripción'} estilos={estilos} estilosGlobales={estilosGlobales} tema={tema} />
                  {modal === 'crear' ? <CampoFormulario etiqueta="Descripción (opcional)" estilos={estilos} estilosGlobales={estilosGlobales} tema={tema} /> : null}
                  {modal === 'gasto' ? (
                    <>
                      <CampoFormulario etiqueta="Monto" teclado="decimal-pad" estilos={estilos} estilosGlobales={estilosGlobales} tema={tema} />
                      <Text style={estilosGlobales.etiqueta}>Quién pagó</Text>
                      <View style={estilos.campoInformativo}><Text style={estilosGlobales.textoSecundario}>Seleccionar participante</Text><Ionicons color={tema.textoSecundario} name="chevron-down" size={20} /></View>
                      <Text style={estilosGlobales.etiqueta}>Participantes involucrados</Text>
                      <View style={estilos.campoInformativo}><Text style={estilosGlobales.textoSecundario}>Seleccionar participantes</Text><Ionicons color={tema.textoSecundario} name="chevron-down" size={20} /></View>
                    </>
                  ) : null}
                  {avisoFormulario ? <Text accessibilityRole="alert" style={estilosGlobales.textoAyuda}>Esta acción estará disponible en una próxima etapa.</Text> : null}
                  <Pressable accessibilityRole="button" onPress={() => establecerAvisoFormulario(true)} style={estilosGlobales.botonPrincipal}>
                    <Text style={estilosGlobales.textoBotonPrincipal}>{modal === 'crear' ? 'Crear' : modal === 'unirse' ? 'Unirse' : 'Agregar gasto'}</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={cerrarModal} style={estilosGlobales.botonTexto}><Text style={estilosGlobales.textoBotonTexto}>Cancelar</Text></Pressable>
                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function EstadoVacio({ icono, titulo, descripcion, estilos, estilosGlobales, tema }) {
  return (
    <View style={[estilosGlobales.tarjeta, estilos.estadoVacio]}>
      <Ionicons color={tema.foco} name={icono} size={34} />
      <Text style={[estilosGlobales.encabezadoSeccion, estilos.textoCentrado]}>{titulo}</Text>
      <Text style={[estilosGlobales.textoSecundario, estilos.textoCentrado]}>{descripcion}</Text>
    </View>
  );
}

function EtiquetaBalance({ persona, estilos }) {
  return <Text style={[estilos.etiquetaBalance, persona.balance === 'debe' && estilos.balanceDebe, persona.balance === 'recibe' && estilos.balanceRecibe]}>{ETIQUETAS_BALANCE[persona.balance]}</Text>;
}

function CampoFormulario({ etiqueta, teclado = 'default', estilos, estilosGlobales, tema }) {
  return (
    <View style={estilos.grupoCampo}>
      <Text style={estilosGlobales.etiqueta}>{etiqueta}</Text>
      <TextInput accessibilityLabel={etiqueta} keyboardType={teclado} placeholder={etiqueta} placeholderTextColor={tema.textoSecundario} style={estilosGlobales.campo} />
    </View>
  );
}
