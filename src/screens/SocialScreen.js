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

const PERSONAS_SIMULADAS = Object.freeze([
  { id: 'tomas', nombre: 'Tomás', iniciales: 'TO', tipo: 'me_deben', monto: '$ 8.000' },
  { id: 'joaquin', nombre: 'Joaquín', iniciales: 'JO', tipo: 'debo', monto: '$ 4.000' },
  { id: 'lucia', nombre: 'Lucía', iniciales: 'LU', tipo: 'saldado', monto: '' },
  { id: 'ana', nombre: 'Ana', iniciales: 'AN', tipo: 'saldado', monto: '' },
  { id: 'federico', nombre: 'Federico', iniciales: 'FE', tipo: 'saldado', monto: '' },
]);

const SALAS_SIMULADAS = Object.freeze([
  {
    id: 'cena-viernes', nombre: 'Cena del viernes', fecha: '18 sep 2026',
    descripcion: 'Una salida a comer entre amigos', icono: 'restaurant-outline',
    estado: 'abierta', participantes: ['tomas', 'joaquin', 'lucia'],
    gastos: [
      { id: 'cena', descripcion: 'Cena', monto: '$ 48.000', pago: 'Tomás', fecha: '18 sep 2026', distribucion: 'Entre 4 personas' },
    ],
    balances: [
      { personaId: 'tomas', tipo: 'debe', resumen: 'Debe $ 8.000' },
      { personaId: 'joaquin', tipo: 'recibe', resumen: 'Debe recibir $ 4.000' },
      { personaId: 'lucia', tipo: 'recibe', resumen: 'Debe recibir $ 4.000' },
    ],
  },
  {
    id: 'asado-domingo', nombre: 'Asado del domingo', fecha: '20 sep 2026',
    descripcion: 'Compras para el encuentro', icono: 'flame-outline',
    estado: 'abierta', participantes: ['lucia', 'ana'],
    gastos: [], balances: [],
  },
  {
    id: 'cine-agosto', nombre: 'Salida al cine', fecha: '15 ago 2026',
    descripcion: 'Entradas y comida', icono: 'film-outline',
    estado: 'cerrada', participantes: ['tomas', 'federico'],
    gastos: [
      { id: 'entradas', descripcion: 'Entradas', monto: '$ 24.000', pago: 'Thiago', fecha: '15 ago 2026', distribucion: 'Entre 3 personas' },
    ],
    balances: [],
  },
]);

const SECCIONES_SALA = Object.freeze([
  { id: 'participantes', nombre: 'Participantes', icono: 'people-outline' },
  { id: 'gastos', nombre: 'Gastos', icono: 'receipt-outline' },
  { id: 'balances', nombre: 'Balances', icono: 'swap-horizontal-outline' },
]);

function obtenerPersona(id) {
  return PERSONAS_SIMULADAS.find((persona) => persona.id === id);
}

function descripcionDeuda(persona) {
  if (persona.tipo === 'me_deben') return 'Me debe ' + persona.monto;
  if (persona.tipo === 'debo') return 'Le debo ' + persona.monto;
  return 'Estamos al día';
}

export default function PantallaSocial({ navigation: navegacion, route: ruta }) {
  const { tema } = useContext(ContextoApariencia);
  const { bottom: margenInferior } = useSafeAreaInsets();
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = crearEstilosSocial(tema, margenInferior);
  const sala = SALAS_SIMULADAS.find((item) => item.id === ruta?.params?.salaId);
  const esDetalle = Boolean(ruta?.params?.salaId);
  const [cargando, establecerCargando] = useState(true);
  const [error, establecerError] = useState(false);
  const [mostrarSalas, establecerMostrarSalas] = useState(true);
  const [seccionSala, establecerSeccionSala] = useState('participantes');
  const [modal, establecerModal] = useState(null);
  const [gastoSeleccionado, establecerGastoSeleccionado] = useState(null);
  const [avisoFormulario, establecerAvisoFormulario] = useState(false);
  const [personaDeuda, establecerPersonaDeuda] = useState(PERSONAS_SIMULADAS[0].id);
  const [tipoDeuda, establecerTipoDeuda] = useState('me_deben');
  const [personasAgregadas, establecerPersonasAgregadas] = useState([]);
  const [personasMarcadas, establecerPersonasMarcadas] = useState([]);

  useEffect(() => {
    const temporizador = setTimeout(() => establecerCargando(false), 650);
    return () => clearTimeout(temporizador);
  }, []);

  const participantesSala = sala
    ? [...sala.participantes, ...personasAgregadas].map(obtenerPersona).filter(Boolean)
    : [];
  const personasDisponibles = sala
    ? PERSONAS_SIMULADAS.filter((persona) => !participantesSala.some((participante) => participante.id === persona.id))
    : [];

  const abrirModal = (tipo) => {
    establecerAvisoFormulario(false);
    establecerPersonasMarcadas([]);
    establecerModal(tipo);
  };
  const cerrarModal = () => {
    establecerModal(null);
    establecerGastoSeleccionado(null);
    establecerAvisoFormulario(false);
  };
  const abrirSala = (salaElegida) => {
    navegacion.getParent()?.navigate(RUTAS.SALA_SOCIAL, { salaId: salaElegida.id });
  };
  const alternarPersonaMarcada = (id) => {
    establecerPersonasMarcadas((anteriores) => (
      anteriores.includes(id) ? anteriores.filter((actual) => actual !== id) : [...anteriores, id]
    ));
  };
  const agregarParticipantes = () => {
    establecerPersonasAgregadas((anteriores) => [...anteriores, ...personasMarcadas]);
    cerrarModal();
  };
  const tituloModal = {
    persona: 'Registrar persona', deuda: 'Registrar deuda', crear: 'Crear sala',
    unirse: 'Unirse a sala', gasto: 'Agregar gasto',
    participantes: 'Agregar participantes', cerrar: 'Cerrar sala',
    detalleGasto: gastoSeleccionado?.descripcion,
  }[modal];

  return (
    <SafeAreaView edges={['top']} style={estilosGlobales.areaSegura}>
      <View style={estilosGlobales.pantalla}>
        {esDetalle ? (
          <EncabezadoSeccion
            tema={tema}
            titulo={sala?.nombre || 'Sala'}
            descripcion="Gastos de esta ocasión"
            alVolver={() => navegacion.goBack()}
          />
        ) : (
          <EncabezadoPrincipal
            tema={tema}
            titulo="Social"
            descripcion="Personas, deudas y gastos compartidos."
            alAbrirNotificaciones={() => navegacion.getParent()?.navigate(RUTAS.NOTIFICACIONES)}
            alAbrirPerfil={() => navegacion.getParent()?.navigate(RUTAS.PERFIL)}
          />
        )}

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={estilos.contenido}>
            {cargando ? (
              <View style={[estilosGlobales.tarjeta, estilos.grupo]}>
                <Text style={estilosGlobales.textoSecundario}>Cargando información…</Text>
                <View style={estilos.lineaCarga} />
                <View style={estilos.lineaCarga} />
              </View>
            ) : error || (esDetalle && !sala) ? (
              <EstadoVacio
                icono="alert-circle-outline"
                titulo="No pudimos mostrar la información"
                descripcion="Intentá nuevamente."
                estilos={estilos} estilosGlobales={estilosGlobales} tema={tema}
              />
            ) : esDetalle ? (
              <>
                <View style={[estilosGlobales.tarjeta, estilos.grupo]}>
                  <View style={estilos.fila}>
                    <View style={estilos.iconoLista}><Ionicons color={tema.botonPrincipal} name={sala.icono} size={24} /></View>
                    <View style={estilos.textoFlexible}>
                      <Text style={estilosGlobales.subtitulo}>{sala.nombre}</Text>
                      <Text style={estilosGlobales.textoSecundario}>{sala.fecha} · {sala.estado === 'cerrada' ? 'Sala cerrada' : 'Sala abierta'}</Text>
                    </View>
                  </View>
                  <Text style={estilosGlobales.textoSecundario}>{sala.descripcion}</Text>
                  <Text style={estilosGlobales.textoAyuda}>{participantesSala.length + 1} participantes, incluyéndote</Text>
                </View>

                {sala.estado === 'abierta' ? (
                  <Pressable accessibilityRole="button" onPress={() => abrirModal('gasto')} style={estilosGlobales.botonPrincipal}>
                    <Text style={estilosGlobales.textoBotonPrincipal}>Agregar gasto</Text>
                  </Pressable>
                ) : null}

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.pestanas}>
                  {SECCIONES_SALA.map((seccion) => (
                    <Pressable
                      key={seccion.id}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: seccionSala === seccion.id }}
                      onPress={() => establecerSeccionSala(seccion.id)}
                      style={[estilos.pestana, seccionSala === seccion.id && estilos.pestanaActiva]}
                    >
                      <Ionicons color={seccionSala === seccion.id ? tema.botonPrincipalTexto : tema.textoSecundario} name={seccion.icono} size={18} />
                      <Text style={[estilos.textoPestana, seccionSala === seccion.id && estilos.textoPestanaActiva]}>{seccion.nombre}</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                {seccionSala === 'participantes' ? (
                  <View style={estilos.grupo}>
                    <Text accessibilityRole="header" style={estilosGlobales.encabezadoSeccion}>Participantes</Text>
                    <FilaPersona persona={{ id: 'actual', nombre: 'Vos', iniciales: 'YO', tipo: 'saldado', monto: '' }} resumen="Participante de esta sala" tema={tema} estilos={estilos} estilosGlobales={estilosGlobales} />
                    {participantesSala.map((persona) => {
                      const balance = sala.balances.find((item) => item.personaId === persona.id);
                      return (
                        <FilaPersona key={persona.id} persona={persona}
                          resumen={balance?.resumen || 'Sin saldo pendiente en esta sala'}
                          tipoBalance={balance?.tipo || 'saldado'}
                          tema={tema} estilos={estilos} estilosGlobales={estilosGlobales} />
                      );
                    })}
                    {sala.estado === 'abierta' ? (
                      <Pressable accessibilityRole="button" onPress={() => abrirModal('participantes')} style={estilosGlobales.botonSecundario}>
                        <Text style={estilosGlobales.textoBotonSecundario}>Agregar participantes</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}

                {seccionSala === 'gastos' ? (
                  <View style={estilos.grupo}>
                    <Text accessibilityRole="header" style={estilosGlobales.encabezadoSeccion}>Gastos de la ocasión</Text>
                    {sala.gastos.length === 0 ? (
                      <EstadoVacio icono="receipt-outline" titulo="Todavía no hay gastos" descripcion="Los gastos de esta sala aparecerán acá." estilos={estilos} estilosGlobales={estilosGlobales} tema={tema} />
                    ) : sala.gastos.map((gasto) => (
                      <Pressable
                        key={gasto.id}
                        accessibilityRole="button"
                        onPress={() => { establecerGastoSeleccionado(gasto); abrirModal('detalleGasto'); }}
                        style={[estilosGlobales.tarjeta, estilos.fila]}
                      >
                        <View style={estilos.iconoLista}><Ionicons color={tema.botonPrincipal} name="receipt-outline" size={22} /></View>
                        <View style={estilos.textoFlexible}>
                          <Text style={estilosGlobales.texto}>{gasto.descripcion}</Text>
                          <Text style={estilosGlobales.textoSecundario}>Pagó: {gasto.pago} · {gasto.fecha}</Text>
                          <Text style={estilosGlobales.textoAyuda}>{gasto.distribucion}</Text>
                        </View>
                        <Text style={estilos.montoGasto}>{gasto.monto}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}

                {seccionSala === 'balances' ? (
                  <View style={estilos.grupo}>
                    <Text accessibilityRole="header" style={estilosGlobales.encabezadoSeccion}>Balances de la sala</Text>
                    {sala.balances.length === 0 ? (
                      <EstadoVacio icono="checkmark-circle-outline" titulo="Sin balances pendientes" descripcion="Todas las personas están al día." estilos={estilos} estilosGlobales={estilosGlobales} tema={tema} />
                    ) : sala.balances.map((balance) => (
                      <View key={balance.personaId} style={[estilosGlobales.tarjeta, estilos.fila]}>
                        <Ionicons color={balance.tipo === 'debe' ? tema.error : tema.exito} name={balance.tipo === 'debe' ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline'} size={26} />
                        <View style={estilos.textoFlexible}>
                          <Text style={estilosGlobales.texto}>{obtenerPersona(balance.personaId)?.nombre}</Text>
                          <Text style={estilosGlobales.textoSecundario}>{balance.resumen}</Text>
                        </View>
                        <Text style={estilosGlobales.textoAyuda}>{balance.tipo === 'debe' ? 'Debe' : 'Debe recibir'}</Text>
                      </View>
                    ))}
                    {sala.balances.length > 0 ? (
                      <View style={[estilosGlobales.tarjeta, estilos.fila]}>
                        <Ionicons color={tema.exito} name="checkmark-circle-outline" size={26} />
                        <View style={estilos.textoFlexible}>
                          <Text style={estilosGlobales.texto}>Vos</Text>
                          <Text style={estilosGlobales.textoSecundario}>Estás al día</Text>
                        </View>
                        <Text style={estilosGlobales.textoAyuda}>Saldado</Text>
                      </View>
                    ) : null}
                    <View style={[estilosGlobales.tarjeta, estilos.grupo]}>
                      <Text style={estilosGlobales.etiqueta}>Detalle de distribución</Text>
                      <Text style={estilosGlobales.textoSecundario}>Acá se verá quién le debe a quién cuando se implemente el cálculo.</Text>
                    </View>
                  </View>
                ) : null}

                {sala.estado === 'abierta' ? (
                  <Pressable accessibilityRole="button" onPress={() => abrirModal('cerrar')} style={estilosGlobales.botonTexto}>
                    <Text style={estilosGlobales.textoBotonTexto}>Cerrar sala</Text>
                  </Pressable>
                ) : null}
                <Pressable accessibilityRole="button" onPress={() => navegacion.goBack()} style={estilosGlobales.botonTexto}>
                  <Text style={estilosGlobales.textoBotonTexto}>Volver a Social</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={estilos.grupo}>
                  <Text accessibilityRole="header" style={estilosGlobales.subtitulo}>Personas y deudas</Text>
                  <Text style={estilosGlobales.textoSecundario}>Consultá lo que debés o te deben, sin necesidad de una sala.</Text>
                  {PERSONAS_SIMULADAS.map((persona) => (
                    <FilaPersona key={persona.id} persona={persona} tema={tema} estilos={estilos} estilosGlobales={estilosGlobales} />
                  ))}
                  <Pressable accessibilityRole="button" onPress={() => abrirModal('deuda')} style={estilosGlobales.botonPrincipal}>
                    <Text style={estilosGlobales.textoBotonPrincipal}>Registrar deuda</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={() => abrirModal('persona')} style={estilosGlobales.botonSecundario}>
                    <Text style={estilosGlobales.textoBotonSecundario}>Registrar persona</Text>
                  </Pressable>
                </View>

                <View style={estilos.grupo}>
                  <Text accessibilityRole="header" style={estilosGlobales.subtitulo}>Salas recientes</Text>
                  <Text style={estilosGlobales.textoSecundario}>Una sala para cada salida o encuentro.</Text>
                  {mostrarSalas ? SALAS_SIMULADAS.filter((item) => item.estado === 'abierta').map((item) => (
                    <TarjetaSala key={item.id} sala={item} alAbrir={() => abrirSala(item)} tema={tema} estilos={estilos} estilosGlobales={estilosGlobales} />
                  )) : (
                    <EstadoVacio icono="people-outline" titulo="Todavía no participás en ninguna sala" descripcion="Creá una sala para una ocasión concreta." estilos={estilos} estilosGlobales={estilosGlobales} tema={tema} />
                  )}
                  <Pressable accessibilityRole="button" onPress={() => abrirModal('crear')} style={estilosGlobales.botonPrincipal}>
                    <Text style={estilosGlobales.textoBotonPrincipal}>Crear sala</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={() => abrirModal('unirse')} style={estilosGlobales.botonSecundario}>
                    <Text style={estilosGlobales.textoBotonSecundario}>Unirse a sala</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={() => establecerMostrarSalas((anterior) => !anterior)} style={estilosGlobales.botonTexto}>
                    <Text style={estilosGlobales.textoBotonTexto}>{mostrarSalas ? 'Ver ejemplo sin salas' : 'Ver salas de ejemplo'}</Text>
                  </Pressable>
                </View>

                <View style={estilos.grupo}>
                  <Text accessibilityRole="header" style={estilosGlobales.subtitulo}>Historial de salas cerradas</Text>
                  {SALAS_SIMULADAS.filter((item) => item.estado === 'cerrada').map((item) => (
                    <TarjetaSala key={item.id} sala={item} alAbrir={() => abrirSala(item)} tema={tema} estilos={estilos} estilosGlobales={estilosGlobales} />
                  ))}
                </View>

                <Pressable accessibilityRole="button" onPress={() => establecerError(true)} style={estilosGlobales.botonTexto}>
                  <Text style={estilosGlobales.textoBotonTexto}>Ver ejemplo de error</Text>
                </Pressable>
              </>
            )}
            {error ? (
              <Pressable accessibilityRole="button" onPress={() => establecerError(false)} style={estilosGlobales.botonSecundario}>
                <Text style={estilosGlobales.textoBotonSecundario}>Reintentar</Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </View>

      <Modal animationType="fade" onRequestClose={cerrarModal} transparent visible={modal !== null}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={estilos.fondoModal}>
          <Pressable accessibilityLabel="Cerrar" accessibilityRole="button" onPress={cerrarModal} style={estilos.cierreFondo} />
          <View accessibilityViewIsModal style={estilos.tarjetaModal}>
            <View style={estilos.filaModal}>
              <Text style={estilosGlobales.encabezadoSeccion}>{tituloModal}</Text>
              <Pressable accessibilityLabel="Cerrar" accessibilityRole="button" onPress={cerrarModal} style={estilos.botonCerrar}>
                <Ionicons color={tema.textoPrincipal} name="close" size={22} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" style={estilos.desplazamientoModal}>
              <View style={estilos.grupo}>
                {modal === 'participantes' ? (
                  <>
                    <Text style={estilosGlobales.textoSecundario}>Elegí entre tus personas registradas.</Text>
                    {personasDisponibles.length === 0 ? (
                      <Text style={estilosGlobales.textoSecundario}>Ya agregaste a todas las personas registradas.</Text>
                    ) : personasDisponibles.map((persona) => (
                      <Pressable key={persona.id} accessibilityRole="checkbox" accessibilityState={{ checked: personasMarcadas.includes(persona.id) }}
                        onPress={() => alternarPersonaMarcada(persona.id)} style={[estilosGlobales.tarjeta, estilos.fila]}>
                        <View style={estilos.avatar}><Text style={estilos.textoAvatar}>{persona.iniciales}</Text></View>
                        <Text style={[estilosGlobales.texto, estilos.textoFlexible]}>{persona.nombre}</Text>
                        <Ionicons color={tema.foco} name={personasMarcadas.includes(persona.id) ? 'checkbox' : 'square-outline'} size={24} />
                      </Pressable>
                    ))}
                    <Pressable accessibilityRole="button" onPress={agregarParticipantes} style={estilosGlobales.botonPrincipal}>
                      <Text style={estilosGlobales.textoBotonPrincipal}>Agregar seleccionadas</Text>
                    </Pressable>
                  </>
                ) : modal === 'detalleGasto' ? (
                  <>
                    <Text style={estilosGlobales.monto}>{gastoSeleccionado?.monto}</Text>
                    <Text style={estilosGlobales.texto}>Pagó: {gastoSeleccionado?.pago}</Text>
                    <Text style={estilosGlobales.texto}>Fecha: {gastoSeleccionado?.fecha}</Text>
                    <Text style={estilosGlobales.textoSecundario}>{gastoSeleccionado?.distribucion}</Text>
                  </>
                ) : modal === 'cerrar' ? (
                  <>
                    <Text style={estilosGlobales.textoSecundario}>Al cerrar una sala de una ocasión, aparecerá en el historial de salas cerradas.</Text>
                    <Text style={estilosGlobales.textoAyuda}>El cierre real estará disponible cuando se implemente el almacenamiento local.</Text>
                  </>
                ) : (
                  <>
                    {modal === 'deuda' ? (
                      <>
                        <Text style={estilosGlobales.etiqueta}>Persona registrada</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.pestanas}>
                          {PERSONAS_SIMULADAS.map((persona) => (
                            <Pressable key={persona.id} accessibilityRole="radio" accessibilityState={{ selected: personaDeuda === persona.id }}
                              onPress={() => establecerPersonaDeuda(persona.id)} style={[estilos.pestana, personaDeuda === persona.id && estilos.pestanaActiva]}>
                              <Text style={[estilos.textoPestana, personaDeuda === persona.id && estilos.textoPestanaActiva]}>{persona.nombre}</Text>
                            </Pressable>
                          ))}
                        </ScrollView>
                        <Text style={estilosGlobales.etiqueta}>Tipo de deuda</Text>
                        <View style={estilos.fila}>
                          {['me_deben', 'debo'].map((tipo) => (
                            <Pressable key={tipo} accessibilityRole="radio" accessibilityState={{ selected: tipoDeuda === tipo }}
                              onPress={() => establecerTipoDeuda(tipo)} style={[estilos.pestana, estilos.textoFlexible, tipoDeuda === tipo && estilos.pestanaActiva]}>
                              <Text style={[estilos.textoPestana, tipoDeuda === tipo && estilos.textoPestanaActiva]}>{tipo === 'debo' ? 'Yo debo' : 'Me deben'}</Text>
                            </Pressable>
                          ))}
                        </View>
                        <CampoFormulario etiqueta="Monto" teclado="decimal-pad" tema={tema} estilos={estilos} estilosGlobales={estilosGlobales} />
                        <CampoFormulario etiqueta="Descripción" tema={tema} estilos={estilos} estilosGlobales={estilosGlobales} />
                      </>
                    ) : null}
                    {modal === 'persona' ? (
                      <>
                        <CampoFormulario etiqueta="Nombre" tema={tema} estilos={estilos} estilosGlobales={estilosGlobales} />
                        <CampoFormulario etiqueta="Correo electrónico (opcional)" teclado="email-address" tema={tema} estilos={estilos} estilosGlobales={estilosGlobales} />
                      </>
                    ) : null}
                    {modal === 'crear' ? (
                      <>
                        <Text style={estilosGlobales.textoSecundario}>Pensá la sala para una salida o encuentro concreto.</Text>
                        <CampoFormulario etiqueta="Nombre de la ocasión" tema={tema} estilos={estilos} estilosGlobales={estilosGlobales} />
                        <CampoFormulario etiqueta="Fecha de la ocasión" tema={tema} estilos={estilos} estilosGlobales={estilosGlobales} />
                        <CampoFormulario etiqueta="Descripción (opcional)" tema={tema} estilos={estilos} estilosGlobales={estilosGlobales} />
                      </>
                    ) : null}
                    {modal === 'unirse' ? (
                      <>
                        <Text style={estilosGlobales.textoSecundario}>El mecanismo para compartir una sala se definirá en otra etapa. Esta vista no requiere conexión.</Text>
                        <CampoFormulario etiqueta="Código de la sala" tema={tema} estilos={estilos} estilosGlobales={estilosGlobales} />
                      </>
                    ) : null}
                    {modal === 'gasto' ? (
                      <>
                        <CampoFormulario etiqueta="Descripción" tema={tema} estilos={estilos} estilosGlobales={estilosGlobales} />
                        <CampoFormulario etiqueta="Monto" teclado="decimal-pad" tema={tema} estilos={estilos} estilosGlobales={estilosGlobales} />
                        <Text style={estilosGlobales.etiqueta}>Quién pagó</Text>
                        <View style={estilos.campoInformativo}><Text style={estilosGlobales.textoSecundario}>Seleccionar participante</Text></View>
                        <Text style={estilosGlobales.etiqueta}>Participantes involucrados</Text>
                        <View style={estilos.campoInformativo}><Text style={estilosGlobales.textoSecundario}>Seleccionar participantes</Text></View>
                      </>
                    ) : null}
                    {avisoFormulario ? (
                      <Text accessibilityRole="alert" style={estilosGlobales.textoAyuda}>Esta acción estará disponible cuando se implemente el registro local.</Text>
                    ) : null}
                    <Pressable accessibilityRole="button" onPress={() => establecerAvisoFormulario(true)} style={estilosGlobales.botonPrincipal}>
                      <Text style={estilosGlobales.textoBotonPrincipal}>{modal === 'crear' ? 'Crear' : modal === 'unirse' ? 'Unirse' : modal === 'gasto' ? 'Agregar gasto' : 'Registrar'}</Text>
                    </Pressable>
                  </>
                )}
                <Pressable accessibilityRole="button" onPress={cerrarModal} style={estilosGlobales.botonTexto}>
                  <Text style={estilosGlobales.textoBotonTexto}>{modal === 'detalleGasto' ? 'Volver' : 'Cancelar'}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function FilaPersona({ persona, resumen, tipoBalance, tema, estilos, estilosGlobales }) {
  const tipo = tipoBalance || persona.tipo;
  return (
    <View style={[estilosGlobales.tarjeta, estilos.fila]}>
      <View style={estilos.avatar}><Text style={estilos.textoAvatar}>{persona.iniciales}</Text></View>
      <View style={estilos.textoFlexible}>
        <Text style={estilosGlobales.texto}>{persona.nombre}</Text>
        <Text style={estilosGlobales.textoSecundario}>{resumen || descripcionDeuda(persona)}</Text>
      </View>
      <Ionicons color={tipo === 'saldado' ? tema.exito : tipo === 'debo' ? tema.error : tema.foco}
        name={tipo === 'saldado' ? 'checkmark-circle-outline' : 'swap-horizontal-outline'} size={22} />
    </View>
  );
}

function TarjetaSala({ sala, alAbrir, tema, estilos, estilosGlobales }) {
  return (
    <Pressable accessibilityRole="button" onPress={alAbrir} style={[estilosGlobales.tarjeta, estilos.fila]}>
      <View style={estilos.iconoLista}><Ionicons color={tema.botonPrincipal} name={sala.icono} size={24} /></View>
      <View style={estilos.textoFlexible}>
        <Text style={estilosGlobales.encabezadoSeccion}>{sala.nombre}</Text>
        <Text style={estilosGlobales.textoSecundario}>{sala.fecha} · {sala.participantes.length + 1} participantes</Text>
        <Text style={estilosGlobales.textoAyuda}>{sala.estado === 'cerrada' ? 'Cerrada' : sala.descripcion}</Text>
      </View>
      <Ionicons color={tema.textoSecundario} name="chevron-forward" size={22} />
    </Pressable>
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

function CampoFormulario({ etiqueta, teclado = 'default', estilos, estilosGlobales, tema }) {
  return (
    <View style={estilos.grupoCampo}>
      <Text style={estilosGlobales.etiqueta}>{etiqueta}</Text>
      <TextInput accessibilityLabel={etiqueta} keyboardType={teclado} placeholder={etiqueta}
        placeholderTextColor={tema.textoSecundario} style={estilosGlobales.campo} />
    </View>
  );
}
