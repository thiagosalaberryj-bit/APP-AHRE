import { presente } from './helpers/assertions.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import { preparar } from './helpers/localDatabase.ts';
import { interfazSocial } from './helpers/socialInterface.ts';

test('los filtros exclusivos separan pendientes de saldadas y un pago sube la deuda por actividad',async prueba=>{
 const e=await preparar(prueba);await e.prepararDatosPrueba();
 const datos=await e.cargarSocial(),persona=datos.personas[0],deposito=datos.depositos[0];
 const antigua=await e.crearDeudaPersonal({personaId:persona.id,direccion:'debo',monto:100,descripcion:'Antigua recién pagada'});
 const saldada=await e.crearDeudaPersonal({personaId:persona.id,direccion:'debo',monto:50,descripcion:'Deuda terminada'});
 e.base.prepare('UPDATE deudas SET fecha=?,fecha_actualizacion=? WHERE id=?').run('2020-01-01T12:00:00.000Z','2020-01-01T12:00:00.000Z',antigua.id);
 await e.registrarPagoDeuda({deudaId:saldada.id,monto:50,claveOperacion:'saldada-filtro'},{depositoId:deposito.id});
 await e.registrarPagoDeuda({deudaId:antigua.id,monto:10,claveOperacion:'actividad-filtro'},{depositoId:deposito.id});
 const vista=interfazSocial(e,'claro');await vista.abrir(vista.rutas.PERSONAS_SOCIAL);
 assert.ok(!vista.texto().includes('Todas las direcciones'));assert.ok(!vista.todos().some(n=>n.type==='Pressable'&&n.props.accessibilityLabel==='Pendientes'));
 assert.ok(vista.todos().some(n=>n.type==='ScrollView'&&n.props.horizontal===true));
 await vista.pulsar('Debo');
 assert.ok(vista.texto().includes('Antigua recién pagada'));assert.ok(!vista.texto().includes('Deuda terminada'));
 const tarjetas=vista.todos().filter(n=>n.type==='Pressable'&&String(n.props.accessibilityHint||'').includes('Abre toda'));
 assert.ok(String(tarjetas[0].props.accessibilityLabel).includes('Antigua recién pagada'));
 await vista.pulsar('Saldadas');assert.ok(vista.texto().includes('Deuda terminada'));assert.ok(!vista.texto().includes('Antigua recién pagada'));
});

for(const tema of ['claro','oscuro'] as const)test(`la invitación copia el enlace completo y compartir abre una acción separada en ${tema}`,async prueba=>{
  const e=await preparar(prueba),vista=interfazSocial(e,tema),enlace='https://ahre.example.test/invitacion/#'+'a'.repeat(64);
  await vista.abrirInvitacion({enlace,nombre:'Sofi',alCerrar:()=>{}});
  const campo=presente(vista.todos().find(n=>n.type==='TextInput'&&n.props.accessibilityLabel==='Enlace personal para compartir'));
  assert.equal(campo.props.multiline,false);assert.equal(campo.props.value,enlace);
  assert.ok(!vista.texto().includes('Enlace copiado'));
  await vista.pulsar('Copiar enlace de invitación');
  assert.deepEqual(vista.copias,[enlace]);assert.ok(vista.texto().includes('Enlace copiado'));
  assert.equal(vista.compartidos.length,0);
  await vista.pulsar('Compartir por una app');
  assert.equal(vista.compartidos.length,1);assert.ok(vista.compartidos[0].message.includes(enlace));
});

for(const tema of ['claro','oscuro'] as const)test(`el administrador ve las solicitudes pendientes desde la sala en ${tema}`,async prueba=>{
  const e=await preparar(prueba);await e.prepararDatosPrueba();
  const datos=await e.cargarSocial(),sala=datos.salas[0];
  const propia=presente(e.base.prepare('SELECT id FROM personas WHERE es_usuario_actual=1').get());
  const respuesta={sala:{id:sala.id,nombre:sala.nombre,descripcion:'',icono:sala.icono,color:sala.color,fecha:sala.fechaISO,estado:'abierta',revision:1,participantes:[{id:propia.id,nombre:'Vos',activa:true},{id:datos.personas[0].id,nombre:datos.personas[0].nombre,activa:true}],gastos:[]},personaPropiaId:propia.id,administrador:true,solicitudes:[{id:'pedido-1',personaId:datos.personas[0].id,gasto_id:null,texto:'Cambiar la descripción a Cena',estado:'pendiente',fecha:new Date().toISOString()}]};
  e.base.prepare('INSERT INTO salas_online_locales(usuario_id,sala_id,datos,administrador,persona_propia_id,fecha_actualizacion) VALUES(?,?,?,?,?,?)').run(datos.usuarioId,sala.id,JSON.stringify(respuesta),1,propia.id,new Date().toISOString());
  let actualizaciones=0;
  const vista=interfazSocial({...e,sincronizarSocialOnline:async()=>{actualizaciones++;}},tema);
  await vista.abrir(vista.rutas.SALA_SOCIAL,{salaId:sala.id});
  assert.ok(!vista.texto().includes('Solicitudes por persona'));
  await vista.pulsar('Sección de sala: Personas');
  assert.ok(vista.todos().some(n=>n.type==='Pressable'&&n.props.accessibilityLabel==='Solicitudes de '+datos.personas[0].nombre&&vista.texto(n).includes('1')));
  assert.ok(!vista.texto().includes('Cambiar la descripción a Cena'));
  await vista.pulsar('Solicitudes de '+datos.personas[0].nombre);await vista.abrir(vista.rutas.REGISTRO_SOCIAL,vista.destinos.at(-1)![1] as import('../src/social/types.ts').ParametrosSociales);
  assert.ok(vista.texto().includes('Cambiar la descripción a Cena'));
  assert.equal(vista.buscarBoton('Aceptar').props.disabled,false);
  assert.equal(vista.buscarBoton('Rechazar').props.disabled,false);
  assert.equal(actualizaciones,0);
  await vista.pulsar('Volver a integrantes');await vista.abrir(vista.rutas.SALA_SOCIAL,vista.destinos.findLast(d=>(d[1] as {tipo?:string}|undefined)?.tipo==='personaSala')![1] as import('../src/social/types.ts').ParametrosSociales);await vista.pulsar('Sección de sala: Personas');
  await vista.pulsar('Agregar personas a la sala');
  assert.ok(!vista.texto().includes('Enlace personal y QR'));
  assert.ok(vista.todos().some(n=>n.type==='TextInput'&&n.props.accessibilityLabel==='Buscar personas para agregar'));
});

for(const fallo of ['rechazo','error'] as const)test(`la copia con ${fallo} muestra el fallo y permite seguir compartiendo`,async prueba=>{
  const e=await preparar(prueba),vista=interfazSocial(e,'claro',{copiarTexto:async()=>{if(fallo==='error')throw new Error('sin portapapeles');return false;}});
  await vista.abrirInvitacion({enlace:'https://ahre.example.test/invitacion/#'+'a'.repeat(64),nombre:'Sofi',alCerrar:()=>{}});
  await vista.pulsar('Copiar enlace de invitación');
  assert.ok(vista.texto().includes('No se pudo copiar'));assert.ok(!vista.texto().includes('Enlace copiado'));
  assert.equal(vista.buscarBoton('Compartir por una app').props.disabled,false);
});

test('aceptar un enlace abre directamente la sala y las invitaciones ajenas no consumen el cupo propio',async prueba=>{
  const e=await preparar(prueba);await e.prepararDatosPrueba();
  const datos=await e.cargarSocial(),sala=datos.salas[0];
  let aceptaciones=0;
  const vista=interfazSocial({...e,
    cargarSocial:async()=>({...datos,salas:[sala,...Array.from({length:3},(_,i)=>({...sala,id:'invitada-'+i,administrador:false,online:true}))]}),
    aceptarInvitacionOnline:async(token:string)=>{assert.equal(token,'a'.repeat(64));aceptaciones++;return {salaId:sala.id};},
  },'claro');
  await vista.abrir();await vista.pulsar('Salas');assert.equal(vista.buscarBoton('Crear sala').props.disabled,false);
  await vista.pulsar('Unirme a sala');
  await vista.llenar('Enlace de invitación','https://ahre.example.test/invitacion/#'+'a'.repeat(64));
  await vista.pulsar('Aceptar invitación');
  assert.equal(aceptaciones,1);
  assert.ok(vista.destinos.some(d=>d[0]===vista.rutas.SALA_SOCIAL&&(d[1] as {salaId?:string})?.salaId===sala.id));
});

for(const tema of ['claro','oscuro'] as const)test(`Social ubica los acuerdos en deudas y permite revisar un enlace inválido en ${tema}`,async prueba=>{
  const e=await preparar(prueba);await e.prepararDatosPrueba();
  const vista=interfazSocial(e,tema);await vista.abrir();
  assert.ok(!vista.texto().includes('Actualizar acuerdos'));
  assert.ok(!vista.texto().includes('Acuerdos online'));
  assert.ok(!vista.texto().includes('Unirme a sala'));
  assert.ok(!vista.texto().includes('Compartir deuda'));
  await vista.pulsar('Salas');
  await vista.pulsar('Unirme a sala');
  await vista.llenar('Enlace de invitación','https://otro.test/no-valido');
  await vista.pulsar('Aceptar invitación');
  assert.ok(vista.texto().includes('no es una invitación válida'));
  await vista.pulsar('Cerrar invitación');
  assert.ok(!vista.texto().includes('Aceptar invitación'));
});

for (const tema of ['claro','oscuro'] as const) {
  test(`el selector común de depósitos permite selección individual y múltiple sin perder la última opción en ${tema}`, async prueba => {
    const e = await preparar(prueba);
    const opciones = [{ id: 'uno', nombre: 'Caja', icono: 'cash-outline', color: '#BED5C8' }, { id: 'dos', nombre: 'Cuenta', icono: 'star-outline', color: '#CEC0E1' }];
    const vista = interfazSocial(e, tema);
    let ids = ['uno'];
    await vista.abrirSelectorDepositos({ depositos: opciones, seleccionMultiple: true, seleccionadasIds: ids, impedirSeleccionVacia: true, alCambiarMulti: nuevos => { ids = nuevos; } });
    await vista.pulsar('Depósito');
    assert.equal(vista.buscarBoton('Caja', true).props.disabled, true);
    await vista.pulsar('Cuenta', true); assert.deepEqual(ids, ['uno', 'dos']);
    await vista.pulsar('Caja', true); assert.deepEqual(ids, ['dos']);
    assert.equal(vista.buscarBoton('Cuenta', true).props.disabled, true);
    await vista.pulsar('Seleccionar todos los depósitos'); assert.deepEqual(ids, ['uno', 'dos']);
    await vista.pulsar('Listo');
    assert.ok(JSON.stringify(vista.buscarBoton('Depósito').props.accessibilityValue).includes('Todos los depósitos'));
    const individual = interfazSocial(e, tema);
    let elegido = '';
    await individual.abrirSelectorDepositos({ depositos: opciones, alSeleccionar: id => { elegido = id; } });
    await individual.pulsar('Depósito'); await individual.pulsar('Cuenta', true);
    assert.equal(elegido, 'dos');
    assert.ok(JSON.stringify(individual.buscarBoton('Depósito').props.accessibilityValue).includes('Cuenta'));
    assert.ok(individual.todos().some(n => n.type === 'Icon' && n.props.name === 'star-outline'));
    assert.equal(individual.todos().filter(n => n.type === 'Modal' && n.props.visible).length, 0);
    individual.mostrarTeclado(); await individual.pulsar('Depósito');
    assert.equal(individual.todos().filter(n => n.type === 'Modal' && n.props.visible).length, 0, 'no se abre mientras se está cerrando el teclado');
    await individual.ocultarTeclado();
    const modal = presente(individual.todos().find(n => n.type === 'Modal' && n.props.visible));
    assert.equal(modal.props.navigationBarTranslucent, true);
    assert.equal(modal.props.statusBarTranslucent, true);
    (modal.props.onShow as () => void)(); await individual.asentar();
    const flotante = presente(individual.todos().find(n => Array.isArray(n.props.style) && n.props.style.some(estilo => estilo && typeof estilo === 'object' && 'top' in estilo && 'maxHeight' in estilo)));
    const ancla = (flotante.props.style as {top?:number;maxHeight?:number}[]).find(estilo => estilo?.top !== undefined && estilo.maxHeight !== undefined)!;
    assert.equal(ancla.top, 220 + 64 + 4, 'la lista deja visibles los 64 puntos del campo y no usa el desplazamiento de la ventana nativa');
    await individual.pulsar('Cerrar selector de depósito');
  });

  test(`los desplegables y la vista previa del reparto conservan personas y montos en ${tema}`, async prueba => {
    const e = await preparar(prueba); await e.prepararDatosPrueba({ incluirSocial: false });
    const ana = presente(await e.guardarPersona({ nombre: 'Ana', apellido: 'Pérez', apodo: 'Ani' }));
    const bruno = presente(await e.guardarPersona({ nombre: 'Bruno', apellido: 'Díaz', apodo: 'Bru' }));
    const sala = await e.crearSala({ nombre: 'Reparto', fecha: '2026-10-30',  icono: 'restaurant-outline', color: '#BED5C8', personasIds: [ana.id, bruno.id] });
    const vista = interfazSocial(e, tema);
    await vista.abrir(vista.rutas.REGISTRO_SOCIAL, { tipo: 'gasto', salaId: sala.id });
    await vista.llenar('Importe del ítem', '100');
    assert.ok(vista.texto().includes('$ 33,34'));
    assert.ok(vista.texto().includes('$ 33,33'));
    await vista.pulsar('Quién pagó');
    const menu = presente(vista.todos().filter(n => n.type === 'Modal' && n.props.visible).at(-1));
    (menu.props.onShow as () => void)(); await vista.asentar();
    const ventanaMenu = presente(vista.todos(presente(vista.todos().filter(n => n.type === 'Modal' && n.props.visible).at(-1)).children).find(n => Array.isArray(n.props.style) && n.props.style.some(estilo => estilo && typeof estilo === 'object' && 'top' in estilo && 'maxHeight' in estilo)));
    const posicion = (ventanaMenu.props.style as {top?:number;maxHeight?:number}[]).find(estilo => estilo?.top !== undefined && estilo.maxHeight !== undefined)!;
    assert.ok(posicion.top! + 24 >= 220 + 38 + 4, 'el menú comienza debajo del control: ' + JSON.stringify(posicion));
    await vista.pulsar('Ana');
    assert.ok(JSON.stringify(vista.buscarBoton('Quién pagó').props.accessibilityValue).includes('Ana'));
    await vista.pulsar('Personas involucradas'); await vista.pulsar('Bruno'); await vista.pulsar('Listo');
    assert.ok(vista.texto().includes('$ 50,00'));
    assert.ok(!vista.texto().includes('$ 33,33'));
    await vista.pulsar('Cómo se reparte: Manual');
    await vista.llenar('Parte de Vos', '40'); await vista.llenar('Parte de Ana', '70');
    assert.ok(vista.texto().includes('Excede el importe por $ 10,00'));
    await vista.pulsar('Cómo se reparte: Iguales');
    assert.ok(vista.texto().includes('$ 50,00'));
    await vista.pulsar('Cómo se reparte: Manual');
    assert.ok(vista.texto().includes('Excede el importe por $ 10,00'));
    await vista.llenar('Parte de Ana', '60');
    assert.ok(vista.texto().includes('El reparto coincide con el importe.'));
    assert.equal((await e.cargarSocial()).salas[0].gastos.length, 0);
  });

  test(`el encabezado mensual compartido permite plegar y recuperar las deudas en ${tema}`, async prueba => {
    const e = await preparar(prueba); await e.prepararDatosPrueba();
    const vista = interfazSocial(e, tema);
    await vista.abrir(vista.rutas.PERSONAS_SOCIAL);
    const encabezado = presente(vista.todos().find(n => n.type === 'Pressable' && (n.props.accessibilityState as {expanded?:boolean})?.expanded === true));
    const titulo = String(encabezado.props.accessibilityLabel);
    const cantidadAbierta = vista.todos().length;
    await vista.pulsar(titulo);
    assert.equal((vista.buscarBoton(titulo).props.accessibilityState as {expanded:boolean}).expanded, false);
    assert.ok(vista.todos().length < cantidadAbierta, 'plegar retira las tarjetas del mes');
    await vista.pulsar(titulo);
    assert.equal((vista.buscarBoton(titulo).props.accessibilityState as {expanded:boolean}).expanded, true);
    assert.equal(vista.todos().length, cantidadAbierta);
  });
}

test('Gastos omite el acceso de edición rápida y conserva la edición individual sin duplicar ítems', async prueba => {
  const e = await preparar(prueba); await e.prepararDatosPrueba({ incluirSocial: false });
  const sala = await e.crearSala({ nombre: 'Edición', fecha: '2026-10-30',  icono: 'restaurant-outline', color: '#BED5C8', personasIds: [] });
  const deposito = (await e.cargarSocial()).depositos[0];
  await e.guardarGasto({ categoriaId: 'alimentacion', id: 'original', claveOperacion: 'original', salaId: sala.id, descripcion: 'Cena', monto: '100', reparto: 'iguales', pagadorId: 'vos', involucradas: ['vos'], pagaron: [] }, { compra: { depositoId: deposito.id } });
  const vista = interfazSocial(e, 'claro');
  await vista.abrir(vista.rutas.SALA_SOCIAL, { salaId: sala.id }); await vista.pulsar('Gastos');
  assert.ok(!vista.texto().includes('Edición rápida'));
  assert.ok(vista.texto().includes('Cena'));
  await vista.abrir(vista.rutas.GASTO_SOCIAL, { salaId: sala.id, gastoId: 'original' }); await vista.pulsar('Editar gasto');
  assert.deepEqual(vista.destinos.at(-1), [vista.rutas.REGISTRO_SOCIAL, { tipo: 'gasto', salaId: sala.id, gastoId: 'original' }]);
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL, { tipo: 'gasto', salaId: sala.id, gastoId: 'original' });
  await vista.llenar('Qué se pagó', 'Cena corregida'); await vista.llenar('Importe del ítem', '200'); await vista.pulsar('Guardar cambios');
  await vista.pulsar('Depósito'); await vista.pulsar('Efectivo de prueba', true);
  await vista.pulsar('Confirmar y guardar');
  const gastos = (await e.cargarSocial()).salas[0].gastos;
  assert.equal(gastos.length, 1); assert.equal(gastos[0].descripcion, 'Cena corregida'); assert.equal(gastos[0].montoNumero, 200);
});

test('la participación social permite altas sin saldo positivo', async prueba => {
  const e = await preparar(prueba); await e.prepararDatosPrueba({ incluirSocial: false });
  e.base.exec('UPDATE depositos SET saldo_actual = 0');
  const vista = interfazSocial(e, 'oscuro'); await vista.abrir();
  assert.ok(!vista.texto().includes('Primero, un depósito con dinero'));
  assert.ok(!vista.buscarBoton('Registrar deuda').props.disabled);
  await vista.pulsar('Salas');
  assert.ok(!vista.buscarBoton('Crear sala').props.disabled);
  await vista.pulsar('Cerrar opciones');
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL, { tipo: 'persona' });
  assert.ok(vista.todos().some(n => n.type === 'TextInput' && n.props.accessibilityLabel === 'Nombre'));
});

test('lista manual conserva filas, permite ajustes y guarda borradores con un depósito común', async prueba => {
  const e = await preparar(prueba); await e.prepararDatosPrueba({ incluirSocial: false });
  const sala = await e.crearSala({ nombre: 'Lista', fecha: '2026-10-30',  icono: 'restaurant-outline', color: '#BED5C8', personasIds: [] });
  const vista = interfazSocial(e, 'claro');
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL, { tipo: 'gasto', salaId: sala.id });
  await vista.pulsar('Registrar lista');
  await vista.llenar('Ítem 1', 'Comida'); await vista.llenar('Importe 1', '600');
  await vista.pulsar('Agregar otro ítem'); await vista.llenar('Ítem 2', 'Bebida'); await vista.llenar('Importe 2', '200');
  assert.ok(vista.texto().includes('Total $ 800,00'));
  assert.ok(!vista.texto().includes('Guardado local'));
  await vista.pulsar('Un ítem'); await vista.pulsar('Registrar lista');
  assert.equal(presente(vista.todos().find(n => n.type === 'TextInput' && n.props.accessibilityLabel === 'Ítem 2')).props.value, 'Bebida');
  await vista.pulsar('Ajustar ítem 2'); await vista.llenar('Importe del ítem', '300'); await vista.pulsar('Aplicar al ítem');
  assert.ok(vista.texto().includes('Total $ 900,00'));
  await vista.pulsar('Ajustar ítem 2'); await vista.llenar('Importe del ítem', '999'); await vista.pulsar('Cerrar edición del ítem');
  assert.ok(vista.texto().includes('Total $ 900,00'), 'cancelar la edición conserva el importe anterior');
  await vista.pulsar('Opciones rápidas · Aplicar a todos');
  await vista.pulsar('Ya pagados');
  assert.equal((vista.buscarBoton('Aplicar pagos a todos').props.accessibilityState as {checked:boolean}).checked, true);
  const manija = presente(vista.todos().find(n => n.props.accessibilityLabel === 'Deslizar hacia abajo para cerrar opciones rápidas'));
  const soltar = manija.props.onPanResponderRelease as (evento: unknown, gesto: {dy:number;dx:number;vy:number}) => void;
  soltar(null, { dy: 10, dx: 0, vy: 0 }); await vista.asentar();
  assert.equal((vista.buscarBoton('Aplicar pagos a todos').props.accessibilityState as {checked:boolean}).checked, true);
  soltar(null, { dy: 120, dx: 0, vy: 1 }); await vista.asentar();
  await vista.pulsar('Opciones rápidas · Aplicar a todos');
  assert.equal((vista.buscarBoton('Aplicar pagos a todos').props.accessibilityState as {checked:boolean}).checked, false);
  await vista.pulsar('Depósito'); await vista.pulsar('Efectivo de prueba', true);
  assert.equal((vista.buscarBoton('Aplicar depósito a todos').props.accessibilityState as {checked:boolean}).checked, true);
  await vista.pulsar('Aplicar a todos');
  await vista.pulsar('Guardar lista');
  const gastos = (await e.cargarSocial()).salas[0].gastos;
  assert.equal(gastos.length, 2); assert.equal(presente(gastos.find(g => g.descripcion === 'Bebida')).montoNumero, 300);
  assert.equal(presente(e.base.prepare('SELECT COUNT(*) AS n FROM movimientos').get()).n, e.MOVIMIENTOS_PRUEBA.length);
});

test('Social abre el OCR existente y recibe sus ítems en una lista editable sin egresos', async prueba => {
  const e = await preparar(prueba); await e.prepararDatosPrueba({ incluirSocial: false });
  const sala = await e.crearSala({ nombre: 'Ticket', fecha: '2026-10-30',  icono: 'restaurant-outline', color: '#BED5C8', personasIds: [] });
  const vista = interfazSocial(e, 'oscuro');
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL, { tipo: 'gasto', salaId: sala.id });
  assert.ok(!vista.texto().includes('Escanear'));
  await vista.pulsar('Registrar lista');
  await vista.pulsar('Escanear ticket');
  assert.deepEqual(vista.destinos.at(-1), [vista.rutas.OCR, { destino: 'social', salaId: sala.id }]);
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL, { tipo: 'gasto', salaId: sala.id, modo: 'lista', ticketSocial: { id: 'lectura-1', items: [{ descripcion: 'Pan', monto: 300 }, { descripcion: 'Bebida', monto: null }] } });
  assert.equal(presente(vista.todos().find(n => n.type === 'TextInput' && n.props.accessibilityLabel === 'Ítem 1')).props.value, 'Pan');
  await vista.pulsar('Guardar lista');
  assert.equal((await e.cargarSocial()).salas[0].gastos.length, 0);
  await vista.llenar('Importe 2', '200'); await vista.pulsar('Opciones rápidas · Aplicar a todos');
  await vista.pulsar('Aplicar depósito a todos');
  await vista.pulsar('Depósito'); await vista.pulsar('Efectivo de prueba', true); await vista.pulsar('Aplicar a todos');
  await vista.pulsar('Guardar lista');
  assert.equal((await e.cargarSocial()).salas[0].gastos.length, 2);
  assert.equal(presente(e.base.prepare('SELECT COUNT(*) AS n FROM movimientos').get()).n, e.MOVIMIENTOS_PRUEBA.length);
});

for (const tema of ['claro', 'oscuro'] as const) test(`interfaces principales guardan y consultan datos reales en ${tema}`, async prueba => {
  const servicios = await preparar(prueba);
  await servicios.prepararDatosPrueba({ incluirSocial: false });
  const vista = interfazSocial(servicios, tema), rutas = vista.rutas;
  await vista.abrir();
  assert.ok(vista.texto().includes('No tenés deudas pendientes'));
  assert.ok(!vista.texto().includes('Datos simulados'));
  await vista.abrir(rutas.PERSONAS_SOCIAL, { todas: true });
  await vista.pulsar('Agregar persona');
  await vista.llenar('Nombre', 'Lucía'); await vista.llenar('Apellido', 'Gómez'); await vista.llenar('Apodo', 'Lu');
  await vista.pulsar('Registrar persona');
  assert.ok(vista.texto().includes('Lucía Gómez'));
  const persona = (await servicios.cargarSocial()).personas[0];
  await vista.abrir(rutas.PERSONA_SOCIAL, { personaId: persona.id });
  await vista.pulsar('Opciones de persona'); await vista.pulsar('Editar persona'); await vista.llenar('Apodo', 'Lucita'); await vista.pulsar('Guardar cambios');
  assert.ok(vista.texto().includes('Lucita'));
  await vista.abrir(rutas.REGISTRO_SOCIAL, { tipo: 'crear' });
  await vista.llenar('Nombre de la ocasión', 'Cena real');
  await vista.pulsar('Participantes');
  await vista.llenar('Buscar personas para agregar', 'Lucita');
  await vista.pulsar('Seleccionar a Lucía Gómez'); await vista.pulsar('Listo');
  await vista.pulsar('Participantes');
  assert.ok(vista.texto().includes('1 seleccionadas'));
  await vista.pulsar('Cerrar selección de personas');
  await vista.pulsar('Color de sala: Violeta');
  await vista.pulsar('Crear sala');
  const sala = (await servicios.cargarSocial()).salas[0];
  assert.equal(sala.nombre, 'Cena real');
  assert.equal(sala.color, '#CEC0E1');
  assert.deepEqual(vista.destinos.at(-1), [rutas.SALA_SOCIAL, { salaId: sala.id }]);
  await vista.abrir(rutas.REGISTRO_SOCIAL, { tipo: 'gasto', salaId: sala.id });
  await vista.llenar('Importe del ítem', '1200'); await vista.llenar('Qué se pagó', 'Pizzas reales');
  await vista.pulsar('Agregar gasto');
  assert.ok(vista.texto().includes('Confirmar movimiento'));
  await vista.pulsar('Depósito'); await vista.pulsar('Efectivo de prueba', true); await vista.pulsar('Confirmar y guardar');
  assert.deepEqual(vista.destinos.at(-1), ['Atrás']);
  const gasto = (await servicios.cargarSocial()).salas[0].gastos[0];
  assert.equal(gasto.montoNumero, 1200);
  await vista.abrir(rutas.SALA_SOCIAL, { salaId: sala.id });
  await vista.pulsar('Gastos');
  const tarjeta = vista.buscarBoton('Ver gasto Pizzas reales');
  assert.ok(!vista.texto(tarjeta).includes(gasto.fecha));
  assert.ok(vista.texto(tarjeta).includes('Pagó Vos · Partes iguales'));
  await vista.pulsar('Ver gasto Pizzas reales');
  assert.deepEqual(vista.destinos.at(-1), [rutas.GASTO_SOCIAL, { salaId: sala.id, gastoId: gasto.id }]);
  await vista.abrir(rutas.GASTO_SOCIAL, { salaId: sala.id, gastoId: gasto.id });
  assert.ok(vista.texto().includes('Pizzas reales'));
  await vista.abrir(rutas.REGISTRO_SOCIAL, { tipo: 'cerrar', salaId: sala.id });
  assert.ok(vista.texto().includes('Por cobrar')); assert.ok(vista.texto().includes('Por pagar'));
  await vista.pulsar('Confirmar cierre');
  assert.deepEqual(vista.destinos.at(-1), ['Atrás']);
  const deuda = (await servicios.cargarSocial()).deudas[0];
  assert.equal(deuda.pendienteNumero, 600);
  await vista.abrir(rutas.REGISTRO_SOCIAL, { tipo: 'detalleDeuda', deudaId: deuda.id });
  assert.ok(vista.texto().includes('Original')); assert.ok(vista.texto().includes('Recibiste'));
  await vista.pulsar('Ver persona');
  assert.deepEqual(vista.destinos.at(-1), [rutas.PERSONA_SOCIAL, { personaId: persona.id }]);
  await vista.abrir(rutas.REGISTRO_SOCIAL, { tipo: 'detalleDeuda', deudaId: deuda.id });
  await vista.pulsar('Ver sala de origen');
  assert.deepEqual(vista.destinos.at(-1), [rutas.SALA_SOCIAL, { salaId: sala.id }]);
  await vista.abrir(rutas.REGISTRO_SOCIAL, { tipo: 'pago', deudaId: deuda.id });
  await vista.pulsar('Otro importe'); await vista.llenar('Monto recibido', '100,50');
  await vista.pulsar('Registrar pago recibido');
  await vista.pulsar('Depósito'); await vista.pulsar('Efectivo de prueba', true); await vista.pulsar('Confirmar y guardar');
  assert.equal((await servicios.cargarSocial()).deudas[0].pendienteNumero, 499.5);
  await vista.abrir(rutas.PERSONAS_SOCIAL);
  assert.ok(vista.texto().includes('$ 499,5'));
  await vista.llenar('Buscar deudas por persona', 'lucita');
  assert.ok(vista.texto().includes('Pizzas reales'));
  await vista.abrir(rutas.REGISTRO_SOCIAL, { tipo: 'eliminarDeuda', deudaId: deuda.id });
  await vista.pulsar('Confirmar perdón');
  assert.equal((await servicios.cargarSocial()).deudas.length, 1);
  await vista.pulsar('Sí, perdonar deuda');
  assert.deepEqual(vista.destinos.at(-1), ['Atrás']);
  assert.equal((await servicios.cargarSocial()).deudas.length, 1);
  assert.equal((await servicios.cargarSocial()).deudas[0].perdonadoNumero,499.5);
  assert.ok(vista.avisos.every(m => ['Cambios guardados.', 'Pago registrado.', 'Deuda perdonada.'].includes(m)));
});

test('agenda, selección de integrantes y baja de personas persisten sin borrar deudas', async prueba => {
  const e = await preparar(prueba); await e.prepararDatosPrueba({ incluirSocial: false });
  const persona = await e.guardarPersona({ nombre: 'Ana', apellido: 'Pérez', apodo: 'Ani' });
  const sala = await e.crearSala({ nombre: 'Prueba', fecha: '2026-10-30',  icono: 'restaurant-outline', color: '#BED5C8', personasIds: [] });
  const vista = interfazSocial(e, 'oscuro'), rutas = vista.rutas;
  await vista.abrir(rutas.SALA_SOCIAL, { salaId: sala.id });
  await vista.pulsar('Personas'); await vista.pulsar('Agregar personas a la sala');
  await vista.pulsar('Seleccionar a Ana Pérez'); await vista.pulsar('Agregar seleccionadas');
  assert.ok((await e.cargarSocial()).salas[0].participantes.includes(presente(persona).id));
  await vista.pulsar('Quitar a Ana Pérez de la sala');
  assert.ok((await e.cargarSocial()).salas[0].participantes.includes(presente(persona).id));
  await vista.pulsar('Quitar de la sala');
  assert.equal((await e.cargarSocial()).salas[0].participantes.length, 0);
  await vista.abrir(rutas.REGISTRO_SOCIAL, { tipo: 'deuda', personaId: presente(persona).id });
  await vista.llenar('Monto de la deuda', '123,45'); await vista.llenar('Descripción', 'Compra'); await vista.pulsar('Registrar deuda');
  assert.equal((await e.cargarSocial()).deudas.length, 0);
  await vista.pulsar('Depósito'); await vista.pulsar('Efectivo de prueba', true); await vista.pulsar('Confirmar y guardar');
  assert.equal((await e.cargarSocial()).deudas[0].pendienteNumero, 123.45);
  await vista.abrir(rutas.PERSONA_SOCIAL, { personaId: presente(persona).id });
  await vista.pulsar('Opciones de persona'); await vista.pulsar('Eliminar persona'); await vista.pulsar('Sí, eliminar persona');
  assert.deepEqual(vista.destinos.at(-1), [rutas.PERSONAS_SOCIAL, { todas: true }]);
  const snapshot = await e.cargarSocial();
  assert.equal(snapshot.personas[0].activa, false); assert.equal(snapshot.deudas.length, 1);
  await vista.abrir(rutas.PERSONAS_SOCIAL, { todas: true }); assert.ok(!vista.texto().includes('Ana Pérez'));
  await vista.abrir(rutas.PERSONA_SOCIAL, { personaId: presente(persona).id }); await vista.pulsar('Opciones de persona'); await vista.pulsar('Reactivar persona');
  assert.equal((await e.cargarSocial()).personas[0].activa, true);
});

test('la interfaz vincula un movimiento existente y conserva el saldo', async prueba => {
  const e = await preparar(prueba); await e.prepararDatosPrueba({ incluirSocial: false });
  const persona = await e.guardarPersona({ nombre: 'Tomás', apellido: 'Pérez', apodo: 'Tomi' });
  const deuda = await e.crearDeudaPersonal({ personaId: presente(persona).id, direccion: 'debo', monto: '1500', descripcion: 'Transporte compartido' });
  const anterior = presente(e.base.prepare('SELECT SUM(saldo_actual) AS saldo FROM depositos').get()).saldo;
  const vista = interfazSocial(e, 'claro');
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL, { tipo: 'pago', deudaId: deuda.id });
  await vista.pulsar('Registrar pago realizado'); await vista.pulsar('Ya registrado');
  await vista.pulsar('Transporte de prueba', true); await vista.pulsar('Confirmar y guardar');
  assert.equal(presente(e.base.prepare('SELECT SUM(saldo_actual) AS saldo FROM depositos').get()).saldo, anterior);
  assert.equal(presente(e.base.prepare('SELECT COUNT(*) AS n FROM movimientos').get()).n, e.MOVIMIENTOS_PRUEBA.length);
  assert.ok((await e.cargarSocial()).deudas[0].saldada);
});

test('todos pagaron solicita cada movimiento propio y cierra sin generar deudas', async prueba => {
  const e = await preparar(prueba); await e.prepararDatosPrueba({ incluirSocial: false });
  const personas = await Promise.all(['Ana', 'Lucía'].map(nombre => e.guardarPersona({ nombre, apellido: 'Pérez', apodo: nombre })));
  const sala = await e.crearSala({ nombre: 'Cena saldada', fecha: '2026-10-30',  icono: 'restaurant-outline', color: '#BED5C8', personasIds: personas.map(p => presente(p).id) });
  const saldoAnterior = Number(presente(e.base.prepare('SELECT SUM(saldo_actual) AS saldo FROM depositos').get()).saldo);
  const vista = interfazSocial(e, 'oscuro');
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL, { tipo: 'gasto', salaId: sala.id });
  await vista.llenar('Importe del ítem', '900'); await vista.llenar('Qué se pagó', 'Cena completa');
  await vista.pulsar('Ver pagos'); await vista.pulsar('Todos ya pagaron su parte');
  await vista.pulsar('Agregar gasto');
  assert.ok(vista.texto().includes('1 de 3'));
  await vista.pulsar('Depósito'); await vista.pulsar('Efectivo de prueba', true); await vista.pulsar('Continuar');
  assert.ok(vista.texto().includes('2 de 3'));
  await vista.pulsar('Continuar');
  assert.ok(vista.texto().includes('3 de 3'));
  await vista.pulsar('Confirmar y guardar');
  assert.equal(presente(e.base.prepare('SELECT COUNT(*) AS n FROM pagos_sociales').get()).n, 0);
  assert.equal(presente(e.base.prepare('SELECT COUNT(*) AS n FROM movimientos').get()).n, e.MOVIMIENTOS_PRUEBA.length);
  assert.equal(presente(e.base.prepare('SELECT SUM(saldo_actual) AS saldo FROM depositos').get()).saldo, saldoAnterior);
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL, { tipo: 'cerrar', salaId: sala.id });
  await vista.pulsar('Confirmar cierre');
  assert.equal(presente(e.base.prepare('SELECT COUNT(*) AS n FROM pagos_sociales').get()).n, 3);
  assert.equal(presente(e.base.prepare('SELECT COUNT(*) AS n FROM movimientos').get()).n, e.MOVIMIENTOS_PRUEBA.length + 3);
  assert.equal(presente(e.base.prepare('SELECT SUM(saldo_actual) AS saldo FROM depositos').get()).saldo, saldoAnterior - 300);
  assert.equal((await e.cargarSocial()).deudas.length, 0);
  assert.equal((await e.cargarSocial()).salas[0].estado, 'cerrada');
});

test('registrar deuda a cobrar exige elegir origen y el cobro recupera el adelanto', async prueba => {
  const e = await preparar(prueba); await e.prepararDatosPrueba({ incluirSocial: false });
  const persona = await e.guardarPersona({ nombre: 'Ana', apellido: 'Pérez', apodo: 'Ani' });
  const saldo = () => presente(e.base.prepare('SELECT SUM(saldo_actual) AS saldo FROM depositos').get()).saldo;
  const inicial = saldo(), vista = interfazSocial(e, 'claro');
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL, { tipo: 'deuda', personaId: presente(persona).id });
  await vista.llenar('Monto de la deuda', '800'); await vista.llenar('Descripción', 'Adelanto del almuerzo');
  await vista.pulsar('Registrar deuda');
  assert.ok(vista.texto().includes('Pagás') && vista.texto().includes('$ 800'));
  await vista.pulsar('Cerrar selección de movimiento');
  assert.equal(saldo(), inicial); assert.equal((await e.cargarSocial()).deudas.length, 0);
  await vista.pulsar('Registrar deuda'); await vista.pulsar('Depósito'); await vista.pulsar('Efectivo de prueba', true); await vista.pulsar('Confirmar y guardar');
  const deuda = (await e.cargarSocial()).deudas[0];
  assert.equal(saldo(), Number(inicial) - 800); assert.equal(deuda.pendienteNumero, 800);
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL, { tipo: 'detalleDeuda', deudaId: deuda.id });
  assert.ok(vista.texto().includes('Adelanto · Efectivo de prueba'));
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL, { tipo: 'pago', deudaId: deuda.id });
  await vista.pulsar('Registrar pago recibido'); await vista.pulsar('Depósito'); await vista.pulsar('Efectivo de prueba', true); await vista.pulsar('Confirmar y guardar');
  assert.equal(saldo(), inicial); assert.ok((await e.cargarSocial()).deudas[0].saldada);
  assert.equal(vista.avisos.at(-1), 'Deuda saldada.');
  assert.deepEqual(vista.destinos.at(-1), [vista.rutas.PRINCIPAL, { screen: vista.rutas.SOCIAL }]);
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL, { tipo: 'detalleDeuda', deudaId: deuda.id });
  assert.ok(!vista.texto().includes('Eliminar deuda'));
});

test('Le debo no pide depósito al crearla y registra solo el egreso al pagarla', async prueba => {
  const e = await preparar(prueba); await e.prepararDatosPrueba({ incluirSocial: false });
  const persona = await e.guardarPersona({ nombre: 'Ana', apellido: 'Pérez', apodo: 'Ani' });
  const saldo = () => presente(e.base.prepare('SELECT SUM(saldo_actual) AS saldo FROM depositos').get()).saldo;
  const inicial = saldo(), vista = interfazSocial(e, 'oscuro');
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL, { tipo: 'deuda', personaId: presente(persona).id });
  await vista.pulsar('Le debo');
  assert.ok(!vista.texto().includes('Me prestó dinero'));
  await vista.llenar('Monto de la deuda', '400'); await vista.llenar('Descripción', 'Préstamo'); await vista.pulsar('Registrar deuda');
  const deuda = (await e.cargarSocial()).deudas[0];
  assert.equal(deuda.pendienteNumero, 400); assert.equal(deuda.movimientoOrigen, null);
  assert.equal(saldo(), inicial); assert.equal(presente(e.base.prepare('SELECT COUNT(*) AS n FROM movimientos').get()).n, e.MOVIMIENTOS_PRUEBA.length);
  assert.deepEqual(vista.destinos.at(-1), ['Atrás']);
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL, { tipo: 'pago', deudaId: deuda.id });
  await vista.pulsar('Registrar pago realizado');
  assert.ok(vista.texto().includes('Pagás') && vista.texto().includes('$ 400'));
  await vista.pulsar('Depósito'); await vista.pulsar('Efectivo de prueba', true); await vista.pulsar('Confirmar y guardar');
  assert.equal(saldo(), Number(inicial) - 400); assert.ok((await e.cargarSocial()).deudas[0].saldada);
  assert.equal(presente(e.base.prepare('SELECT COUNT(*) AS n FROM movimientos').get()).n, e.MOVIMIENTOS_PRUEBA.length + 1);
});

test('la agenda muestra inmediatamente el alta aunque hubiera una búsqueda anterior', async prueba => {
  const e = await preparar(prueba); await e.prepararDatosPrueba({ incluirSocial: false });
  const vista = interfazSocial(e, 'claro');
  await vista.abrir(vista.rutas.PERSONAS_SOCIAL, { todas: true });
  await vista.llenar('Buscar persona registrada', 'No coincide');
  await vista.pulsar('Agregar persona');
  await vista.llenar('Nombre', 'María'); await vista.llenar('Apellido', 'Pérez'); await vista.llenar('Apodo', 'Maru');
  await vista.pulsar('Registrar persona');
  assert.ok(vista.texto().includes('María Pérez'));
  assert.equal(presente(vista.todos().find(n => n.type === 'TextInput' && n.props.accessibilityLabel === 'Buscar persona registrada')).props.value, '');
});

test('las cards y el detalle de deuda mantienen el truncado de textos largos', async prueba => {
  const e = await preparar(prueba); await e.prepararDatosPrueba({ incluirSocial: false });
  const persona = await e.guardarPersona({ nombre: 'Nombre muy largo para el contacto de pruebas', apellido: 'Apellido muy largo para probar la tarjeta', apodo: 'Contacto' });
  const descripcion = 'Descripción extensa '.repeat(15).trim();
  const deuda = await e.crearDeudaPersonal({ personaId: presente(persona).id, direccion: 'debo', monto: '999999999999,99', descripcion });
  const vista = interfazSocial(e, 'oscuro');
  await vista.abrir();
  const textos = vista.todos().filter(n => n.type === 'Text' && (String(n.children).includes(descripcion) || String(n.children).includes('999.999.999.999')));
  assert.ok(textos.length >= 3);
  for (const texto of textos) { assert.equal(texto.props.numberOfLines, 1); assert.equal(texto.props.ellipsizeMode, 'tail'); }
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL, { tipo: 'detalleDeuda', deudaId: deuda.id });
  const titulo = vista.todos().find(n => n.type === 'Text' && String(n.children).includes(descripcion));
  assert.equal(String(presente(titulo).children), descripcion);
  assert.equal(presente(titulo).props.numberOfLines, 1);
  assert.equal(presente(titulo).props.ellipsizeMode, 'tail');
});

for(const tema of ['claro','oscuro'] as const)test(`los acuerdos se administran en el detalle de la deuda de cada persona en ${tema}`,async prueba=>{
  const e=await preparar(prueba);await e.prepararDatosPrueba();
  const inicial=await e.cargarSocial();await e.crearDeudaPersonal({personaId:inicial.personas[0].id,direccion:'me_deben',monto:100,descripcion:'Deuda propia a cobrar'},{depositoId:inicial.depositos[0].id});
  const datos=await e.cargarSocial(),deuda=presente(datos.deudas.find(d=>d.tipo==='me_deben'&&!d.salaId&&!d.saldada));
  const acuerdos=[{id:'acuerdo-personal',origenLocalId:deuda.id,salaId:null,descripcion:'Acuerdo elegido',monto:deuda.montoNumero,pendiente:deuda.pendienteNumero,estado:'aceptada',esDeudor:false,esAcreedor:true,puedeDecidir:false,pagos:[{id:'pago-recibido',monto:10,estado:'informado',fecha:new Date().toISOString()}]},
    {id:'otra-propuesta',origenLocalId:null,salaId:null,descripcion:'Otra propuesta sin asociar',monto:20,pendiente:20,estado:'propuesta',esDeudor:true,esAcreedor:false,puedeDecidir:true,pagos:[]}];
  e.base.prepare('INSERT INTO datos_sociales_online(usuario_id,clave,datos) VALUES(?,?,?)').run(datos.usuarioId,'deudas',JSON.stringify(acuerdos));
  const decisiones:unknown[][]=[];
  const vista=interfazSocial({...e,obtenerVistaSincronizacion:()=>({estado:'online',pendientes:0}),confirmarPagoConSeleccion:async(id,depositoId)=>{decisiones.push([id,depositoId]);return {pagoId:id};},sincronizarSocialOnline:async()=>{}},tema);
  await vista.abrir(vista.rutas.PERSONAS_SOCIAL);
  assert.ok(vista.texto().includes('Otra propuesta sin asociar'));
  assert.ok(!vista.texto().includes('Acuerdo elegido'));
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'detalleDeuda',deudaId:deuda.id});
  assert.ok(vista.texto().includes('Historial de la deuda'));assert.ok(!vista.texto().includes('Acuerdo con esta persona'));
  assert.ok(vista.texto().includes('Por confirmar. Revisá si recibiste el dinero.'));
  assert.ok(!vista.texto().includes('Otra propuesta sin asociar'));
  assert.ok(!vista.texto().includes('Confirmar'));
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'pago',deudaId:deuda.id,pagoId:'pago-recibido'});
  await vista.pulsar('Depósito');await vista.pulsar('Efectivo de prueba',true);await vista.pulsar('Confirmar');
  assert.equal(decisiones.length,1);assert.equal(decisiones[0][0],'pago-recibido');
});



for(const tema of ['claro','oscuro'] as const)test(`Social conserva Unirme solo en inicio y las deudas de persona se pliegan con su cantidad en ${tema}`,async prueba=>{
  const e=await preparar(prueba);await e.prepararDatosPrueba();
  const datos=await e.cargarSocial(),deuda=presente(datos.deudas.find(d=>!d.saldada));
  const vista=interfazSocial(e,tema);await vista.abrir();
  assert.equal(vista.buscarBoton('Salas').props.disabled,undefined);assert.ok(!vista.texto().includes('Unirme a sala'));assert.ok(!vista.texto().includes('Compartir deuda'));
  await vista.abrir(vista.rutas.SALA_SOCIAL);
  assert.ok(!vista.texto().includes('Mis salas'));assert.ok(!vista.texto().includes('Unirme a sala'));
  await vista.abrir(vista.rutas.PERSONA_SOCIAL,{personaId:deuda.personaId});
  assert.ok(!vista.texto().includes('Ver sala de origen'));
  assert.ok(!vista.todos().some(n=>n.type==='Pressable'&&['Registrar mi pago','Registrar pago recibido','Eliminar deuda'].includes(String(n.props.accessibilityLabel))));
  const titulo=deuda.tipo==='debo'?'Lo que le debés':'Lo que te debe';
  assert.equal((vista.buscarBoton(titulo).props.accessibilityState as {expanded:boolean}).expanded,true);
  await vista.pulsar(titulo);assert.equal((vista.buscarBoton(titulo).props.accessibilityState as {expanded:boolean}).expanded,false);
  assert.ok(!vista.texto().includes(deuda.descripcion));
  assert.ok(vista.texto().includes('Sin deudas')||vista.texto().includes('deudas'));
  await vista.pulsar(titulo);
  const tarjeta=presente(vista.todos().find(n=>n.type==='Pressable'&&String(n.props.accessibilityLabel||'').startsWith(deuda.descripcion+'.')));
  await vista.pulsar(String(tarjeta.props.accessibilityLabel));
  assert.deepEqual(vista.destinos.at(-1),[vista.rutas.REGISTRO_SOCIAL,{tipo:'detalleDeuda',deudaId:deuda.id}]);
});

for(const tema of ['claro','oscuro'] as const)for(const fallo of [false,true])test(`Nueva deuda ofrece compartir antes de guardar y conserva el registro ante fallo=${fallo} en ${tema}`,async prueba=>{
  const e=await preparar(prueba);await e.prepararDatosPrueba();
  const datos=await e.cargarSocial(),persona=datos.personas[0];
  e.base.prepare('INSERT INTO datos_sociales_online(usuario_id,clave,datos) VALUES(?,?,?)').run(datos.usuarioId,'vinculos',JSON.stringify([{id:'vinculo',persona_id:persona.id,cuenta_id:'cuenta',nombre:persona.nombre,estado:'confirmado'}]));
  const propuestas:string[]=[];
  const vista=interfazSocial({...e,
    obtenerVistaSincronizacion:()=>({...e.obtenerVistaSincronizacion(),estado:'online'}),
    observarSincronizacion:f=>{f({...e.obtenerVistaSincronizacion(),estado:'online'});return()=>{};},
    sesionOnline:async()=>{const {usuario}=await e.obtenerSesionActual();assert.ok(usuario);return {usuario,token:'prueba'};},
    proponerDeudaOnline:async id=>{assert.ok(await e.deudasRepositorio.consultarPorId(id));propuestas.push(id);if(fallo)throw new Error('sin conexión de prueba');},
  },tema);
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'deuda',personaId:persona.id});
  await vista.pulsar('Le debo');await vista.llenar('Monto de la deuda','123');await vista.llenar('Descripción','Nueva deuda compartida');
  assert.equal(vista.buscarBoton('Proponer deuda online al registrar').props.disabled,false);
  await vista.pulsar('Proponer deuda online al registrar');
  assert.equal(propuestas.length,0);
  await vista.pulsar('Registrar deuda');
  const posteriores=(await e.cargarSocial()).deudas;
  assert.equal(posteriores.length,datos.deudas.length+1);
  const creada=presente(posteriores.find(d=>d.descripcion==='Nueva deuda compartida'));
  assert.deepEqual(propuestas,[creada.id]);
  if(fallo){
    assert.ok(vista.avisos.some(m=>m.includes('La deuda quedó guardada')));
    assert.deepEqual(vista.destinos.at(-1),[vista.rutas.REGISTRO_SOCIAL,{tipo:'detalleDeuda',deudaId:creada.id}]);
  }
});


for(const tema of ['claro','oscuro'] as const)test(`el perfil solicita un vínculo sin salas, muestra el pendiente y permite cancelarlo en ${tema}`,async prueba=>{
  const e=await preparar(prueba);await e.prepararDatosPrueba();const datos=await e.cargarSocial(),persona=datos.personas[0];
  const observadores=new Set<()=>void>(),enviadas:unknown[][]=[];
  const cache=(estado:string)=>{e.base.prepare('INSERT INTO datos_sociales_online(usuario_id,clave,datos) VALUES(?,?,?) ON CONFLICT(usuario_id,clave) DO UPDATE SET datos=excluded.datos').run(datos.usuarioId,'vinculos',JSON.stringify([{id:'vinculo-prueba',persona_id:persona.id,cuenta_id:'cuenta-sofi',nombre:'Sofi Cuenta',estado}]));for(const f of observadores)f();};
  const vista=interfazSocial({...e,
    obtenerVistaSincronizacion:()=>({...e.obtenerVistaSincronizacion(),estado:'online'}),
    observarSincronizacion:f=>{f({...e.obtenerVistaSincronizacion(),estado:'online'});return()=>{};},
    observarSocialOnline:f=>{observadores.add(f);return()=>{observadores.delete(f);};},
    solicitarVinculoOnline:async(id,correo)=>{enviadas.push([id,correo]);cache('solicitado');return {id:'vinculo-prueba'};},
    cancelarVinculoOnline:async id=>{assert.equal(id,'vinculo-prueba');cache('cancelado');},
  },tema);
  await vista.abrir(vista.rutas.PERSONA_SOCIAL,{personaId:persona.id});
  assert.ok(vista.texto().includes('Sin cuenta vinculada'));
  assert.ok(!vista.texto().includes('Vincular cuenta'));
  await vista.pulsar('Opciones de persona');await vista.pulsar('Vincular cuenta');await vista.llenar('Correo de la cuenta a vincular','sofi@example.test');
  await vista.pulsar('Enviar solicitud de vínculo');
  assert.deepEqual(enviadas,[[persona.id,'sofi@example.test']]);
  assert.ok(vista.texto().includes('Vínculo pendiente'));
  await vista.pulsar('Opciones de persona');await vista.pulsar('Gestionar vínculo');
  assert.ok(vista.texto().includes('Espera su aceptación'));
  assert.ok(!vista.texto().includes('Cuenta vinculada:'));
  await vista.pulsar('Cancelar solicitud de vínculo');assert.ok(vista.texto().includes('Sin cuenta vinculada'));
  cache('confirmado');await vista.asentar();
  assert.ok(vista.texto().includes('Cuenta vinculada'));
  assert.ok(!vista.todos().some(n=>n.type==='TextInput'&&n.props.accessibilityLabel==='Correo de la cuenta a vincular'));
  await vista.pulsar('Opciones de persona');await vista.pulsar('Ver cuenta vinculada');
  assert.ok(vista.texto().includes('Cuenta vinculada: Sofi Cuenta'));
  await vista.pulsar('Cerrar vínculo de cuenta');
  await vista.pulsar('Opciones de persona'); await vista.pulsar('Editar persona');
  const modal=presente(vista.todos().filter(n=>n.type==='Modal').at(-1));
  assert.ok(!vista.texto(modal).includes('Eliminar persona'));
  await vista.pulsar('Cerrar edición de persona');await vista.pulsar('Opciones de persona');assert.ok(!vista.buscarBoton('Eliminar persona').props.disabled);
  const despues=await e.cargarSocial();assert.deepEqual(despues.deudas,datos.deudas);assert.deepEqual(despues.salas,datos.salas);
});

for(const decision of ['aceptado','rechazado'] as const)test(`Personas permite responder un vínculo recibido: ${decision}, sin crear fichas ni deudas`,async prueba=>{
  const e=await preparar(prueba);await e.prepararDatosPrueba();const datos=await e.cargarSocial();
  const solicitudes=[{id:'solicitud-directa',persona_id:'',cuenta_id:'otra-cuenta',nombre:'Juan',estado:'solicitado',direccion:'recibida'}];
  e.base.prepare('INSERT INTO datos_sociales_online(usuario_id,clave,datos) VALUES(?,?,?)').run(datos.usuarioId,'vinculos',JSON.stringify(solicitudes));
  const respondidas:unknown[][]=[],observadores=new Set<()=>void>();
  const vista=interfazSocial({...e,
    obtenerVistaSincronizacion:()=>({...e.obtenerVistaSincronizacion(),estado:'online'}),
    observarSincronizacion:f=>{f({...e.obtenerVistaSincronizacion(),estado:'online'});return()=>{};},
    observarSocialOnline:f=>{observadores.add(f);return()=>{observadores.delete(f);};},
    responderVinculoOnline:async(id,respuesta)=>{respondidas.push([id,respuesta]);e.base.prepare("UPDATE datos_sociales_online SET datos='[]' WHERE usuario_id=? AND clave='vinculos'").run(datos.usuarioId);for(const f of observadores)f();},
  },'claro');
  await vista.abrir(vista.rutas.PERSONAS_SOCIAL,{todas:true});
  assert.ok(vista.texto().includes('Solicitudes de vínculo'));
  await vista.pulsar(decision==='aceptado'?'Aceptar vínculo':'Rechazar vínculo');
  assert.deepEqual(respondidas,[['solicitud-directa',decision]]);
  assert.ok(!vista.texto().includes('Solicitudes de vínculo'));
  const despues=await e.cargarSocial();assert.deepEqual(despues.deudas,datos.deudas);assert.deepEqual(despues.personas,datos.personas);
});


for(const tema of ['claro','oscuro'] as const)test(`el menú Salas separa creación e invitación y permite unirse con el cupo completo en ${tema}`,async prueba=>{
  const e=await preparar(prueba);await e.prepararDatosPrueba();const datos=await e.cargarSocial();
  const vista=interfazSocial(e,tema);await vista.abrir();
  assert.ok(!vista.texto().includes('Nueva sala'));assert.ok(!vista.texto().includes('Unirme a sala'));
  await vista.pulsar('Salas');await vista.pulsar('Cerrar opciones');assert.equal(vista.destinos.length,0);
  await vista.pulsar('Salas');await vista.pulsar('Crear sala');
  assert.deepEqual(vista.destinos.at(-1),[vista.rutas.REGISTRO_SOCIAL,{tipo:'crear'}]);
  const llena=interfazSocial({...e,cargarSocial:async()=>({...datos,salas:Array.from({length:3},(_,i)=>({...datos.salas[0],id:'propia-'+i,administrador:true,estado:'abierta' as const}))})},tema);
  await llena.abrir();await llena.pulsar('Salas');
  assert.equal(llena.buscarBoton('Crear sala').props.disabled,true);
  assert.ok(!llena.buscarBoton('Unirme a sala').props.disabled);
  await llena.pulsar('Unirme a sala');
  assert.ok(llena.todos().some(n=>n.type==='TextInput'&&n.props.accessibilityLabel==='Enlace de invitación'));
  assert.ok(!llena.texto().includes('Crear sala'));
  await llena.pulsar('Cerrar invitación');await llena.pulsar('Salas');
  assert.ok(llena.texto().includes('Crear sala'));assert.ok(llena.texto().includes('Unirme a sala'));
});

for(const tema of ['claro','oscuro'] as const)test(`los tres puntos separan edición y eliminación y cancelar conserva el perfil en ${tema}`,async prueba=>{
  const e=await preparar(prueba);await e.prepararDatosPrueba();const datos=await e.cargarSocial(),persona=datos.personas[0];
  const vista=interfazSocial(e,tema);await vista.abrir(vista.rutas.PERSONA_SOCIAL,{personaId:persona.id});
  assert.ok(!vista.texto().includes('Eliminar persona'));
  await vista.pulsar('Opciones de persona');await vista.pulsar('Cerrar opciones tocando fuera');
  assert.ok(!vista.texto().includes('Editar persona'));
  await vista.pulsar('Opciones de persona');await vista.pulsar('Eliminar persona');
  assert.ok(vista.texto().includes('Sí, eliminar persona'));
  await vista.pulsar('Cerrar confirmación');
  assert.deepEqual((await e.cargarSocial()).personas,datos.personas);
  assert.deepEqual((await e.cargarSocial()).deudas,datos.deudas);
});


for(const tema of ['claro','oscuro'] as const)test(`filtros por dirección y resumen ampliable con historial de pagos en ${tema}`,async prueba=>{
  const e=await preparar(prueba);await e.prepararDatosPrueba();const inicial=await e.cargarSocial(),persona=inicial.personas[0],deposito=inicial.depositos[0];
  await e.crearDeudaPersonal({personaId:persona.id,direccion:'debo',monto:'70',descripcion:'Debo de prueba'});
  const creada=await e.crearDeudaPersonal({personaId:persona.id,direccion:'me_deben',monto:'60',descripcion:'Me deben de prueba'},{depositoId:deposito.id});
  await e.registrarPagoDeuda({deudaId:creada.id,monto:'15',claveOperacion:'pago-historial'},{depositoId:deposito.id});
  const datos=await e.cargarSocial();
  const vista=interfazSocial(e,tema);await vista.abrir(vista.rutas.PERSONAS_SOCIAL);
  await vista.pulsar('Debo');assert.equal(vista.buscarBoton('Debo').props.accessibilityState!==undefined,true);
  for(const deuda of datos.deudas.filter(d=>d.tipo==='me_deben'))assert.ok(!vista.todos().some(n=>n.type==='Pressable'&&String(n.props.accessibilityLabel||'').startsWith(deuda.descripcion+'.')));
  await vista.pulsar('Me deben');
  for(const deuda of datos.deudas.filter(d=>d.tipo==='debo'))assert.ok(!vista.todos().some(n=>n.type==='Pressable'&&String(n.props.accessibilityLabel||'').startsWith(deuda.descripcion+'.')));
  const deuda=presente(datos.deudas.find(d=>d.tipo==='me_deben'));
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'detalleDeuda',deudaId:deuda.id});
  await vista.pulsar('Ver importe Original');assert.ok(vista.texto().includes('Importe completo'));assert.ok(vista.texto().includes(deuda.monto));await vista.pulsar('Cerrar importe');
  assert.ok(vista.texto().includes('Historial de la deuda'));assert.ok(vista.texto().includes('Deuda registrada'));assert.ok(vista.texto().includes('Te pagó · $ 15'));
  await vista.pulsar('Ver persona');assert.deepEqual(vista.destinos.at(-1),[vista.rutas.PERSONA_SOCIAL,{personaId:deuda.personaId}]);
});

for(const tema of ['claro','oscuro'] as const)test(`perdonar una deuda local conserva historial y usa las mismas acciones de la online en ${tema}`,async prueba=>{
  const e=await preparar(prueba);await e.prepararDatosPrueba({vistaSocialOnline:true});
  const datos=await e.cargarSocial(),persona=datos.personas[0],deposito=datos.depositos[0];
  const deuda=await e.crearDeudaPersonal({personaId:persona.id,direccion:'me_deben',monto:100,descripcion:'Adelanto para perdonar'},{depositoId:deposito.id});
  await e.registrarPagoDeuda({deudaId:deuda.id,monto:25,claveOperacion:'abono-antes-perdon'},{depositoId:deposito.id});
  const saldo=e.base.prepare('SELECT SUM(saldo_actual) saldo FROM depositos').get()!.saldo;
  const cantidad=e.base.prepare('SELECT COUNT(*) n FROM movimientos').get()!.n;
  await assert.rejects(e.perdonarDeudaPersonal(deuda.id,100),/pendiente cambió/);
  const vista=interfazSocial(e,tema);
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'detalleDeuda',deudaId:deuda.id});
  const pago=vista.buscarBoton('Registrar pago recibido'),perdon=vista.buscarBoton('Perdonar deuda');
  const fila=presente(vista.todos().find(n=>n.type==='View'&&Array.isArray(n.children)&&n.children.includes(pago)&&n.children.includes(perdon)));
  assert.ok(fila);assert.ok(!vista.texto().includes('Eliminar deuda'));
  await vista.pulsar('Perdonar deuda');await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'eliminarDeuda',deudaId:deuda.id});
  await vista.pulsar('Confirmar perdón');await vista.pulsar('Sí, perdonar deuda');
  const cerrada=presente((await e.cargarSocial()).deudas.find(d=>d.id===deuda.id));
  assert.equal(cerrada.pendienteNumero,0);assert.equal(cerrada.perdonadoNumero,75);assert.equal(cerrada.estado,'Cerrada con perdón');
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'detalleDeuda',deudaId:deuda.id});
  assert.ok(vista.texto().includes('Perdonaste · $ 75'));assert.ok(vista.texto().includes('Te pagó · $ 25'));
  assert.deepEqual(vista.buscarBoton('Ver importe Recibiste').props.accessibilityValue,{text:'$ 25'});
  await e.perdonarDeudaPersonal(deuda.id,75);await vista.asentar();
  assert.equal(e.base.prepare('SELECT SUM(saldo_actual) saldo FROM depositos').get()!.saldo,saldo);
  assert.equal(e.base.prepare('SELECT COUNT(*) n FROM movimientos').get()!.n,cantidad);
  const propia=await e.crearDeudaPersonal({personaId:persona.id,direccion:'debo',monto:50,descripcion:'No puedo perdonarme solo'});
  await assert.rejects(e.perdonarDeudaPersonal(propia.id,50),/Solo quien cobra/);
});
