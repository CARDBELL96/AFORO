/** Fuentes vectoriales deterministas de las vistas académicas de AFORO.
 * Uso: node scripts/render-architecture.mjs
 * PNG opcional: AFORO_SHARP_MODULE=ruta/al/modulo/sharp
 * Las fuentes Mermaid de los documentos describen las mismas relaciones;
 * este archivo controla la composición visual de estas cuatro vistas.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const output = path.resolve('docs/diagramas-exportados');
const colors = { blue: '#e8f2ff', purple: '#f0eaff', green: '#e6f5ed', pink: '#fdeaf2', yellow: '#fff4d6', gray: '#f0f4f8' };
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
let parts;
function text(x, y, lines, size = 18, anchor = 'middle', weight = 400, color = '#18243b') {
  parts.push(`<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${lines.map((s, i) => `<tspan x="${x}" dy="${i ? size * 1.4 : 0}">${esc(s)}</tspan>`).join('')}</text>`);
}
function box(x, y, w, h, title, lines = [], fill = 'blue') {
  parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${colors[fill] || fill}" stroke="#8b9ab2" stroke-width="1.5"/>`);
  text(x + w / 2, y + 31, [title], 21, 'middle', 700);
  if (lines.length) text(x + w / 2, y + 62, lines, 17);
}
function panel(x, y, w, h, title) {
  parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="#faf8ff" stroke="#7852b7" stroke-width="2"/>`);
  text(x + w / 2, y + 33, [title], 22, 'middle', 700);
}
function arrow(points, label, lx, ly, realization = false) {
  parts.push(`<polyline points="${points}" fill="none" stroke="#405576" stroke-width="2" ${realization ? 'stroke-dasharray="7 5"' : ''} marker-end="url(#${realization ? 'realization' : 'arrow'})"/>`);
  if (label) {
    const width = label.length * 8 + 18;
    parts.push(`<rect x="${lx - width / 2}" y="${ly - 18}" width="${width}" height="25" rx="5" fill="white"/>`);
    text(lx, ly, [label], 15);
  }
}
function start(title, subtitle, height) {
  parts = [`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="${height}" viewBox="0 0 1600 ${height}" role="img" aria-labelledby="title desc"><title id="title">${esc(title)}</title><desc id="desc">${esc(subtitle)}</desc><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#405576"/></marker><marker id="realization" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="10" markerHeight="10" orient="auto"><path d="M1 1 L11 6 L1 11 Z" fill="white" stroke="#405576"/></marker></defs><rect width="1600" height="${height}" fill="white"/>`];
  text(45, 48, [title], 32, 'start', 700);
  text(45, 80, [subtitle], 18, 'start');
}
async function save(name) {
  const svg = parts.join('\n') + '</svg>\n';
  await fs.writeFile(path.join(output, name + '.svg'), svg);
  if (process.env.AFORO_SHARP_MODULE) {
    const sharp = require(process.env.AFORO_SHARP_MODULE);
    await sharp(Buffer.from(svg), { density: 144 }).png().toFile(path.join(output, name + '.png'));
  }
  console.log(name);
}

start('AFORO | Componentes de API Core', 'C3 · Monolito modular · DISEÑO PROPUESTO — BACKEND NO IMPLEMENTADO', 1100);
box(45, 110, 330, 110, 'AFORO Web', ['Consulta, reserva y compra', 'Frontend implementado / compra DEMO']);
box(635, 110, 330, 110, 'AFORO Studio', ['Gestión de eventos', 'Diseño propuesto']);
box(1225, 110, 330, 110, 'AFORO Access', ['Validación y reconciliación', 'Diseño propuesto']);
panel(45, 280, 1515, 555, 'API Core · Un proceso y un despliegue · Seis módulos pares y un worker auxiliar');
box(85, 360, 345, 150, 'Catalog', ['Eventos, recintos y sectores', 'ICatalogModuleFacade'], 'blue');
box(505, 360, 345, 150, 'Reservations', ['Hold 600 s · cuota máxima 4', 'IReservationsModuleFacade'], 'pink');
box(925, 360, 345, 150, 'Payments', ['Cobros y webhooks idempotentes', 'Pago + evento en la misma TX'], 'yellow');
box(85, 620, 345, 150, 'Identity', ['Autenticación y permisos', 'IIdentityModuleFacade'], 'purple');
box(505, 620, 345, 150, 'Access', ['Ingreso online y auditoría', 'Reconciliación offline'], 'green');
box(925, 620, 345, 150, 'Tickets', ['Emisión y firma Ed25519', 'ITicketsModuleFacade'], 'purple');
arrow('505,435 430,435', 'consulta', 468, 422);
arrow('925,435 850,435', 'confirma', 888, 422);
arrow('850,695 925,695', 'consume', 888, 681);
arrow('210,220 210,280', 'HTTPS / JSON', 285, 255);
arrow('800,220 800,280', 'HTTPS / JSON', 880, 255);
arrow('1390,220 1390,250 1220,250 1220,280', 'HTTPS / JSON', 1400, 240);
text(675, 552, ['Relaciones entre módulos: contratos públicos en memoria.', 'Identity presta verificación transversal a los adaptadores de entrada.'], 18);
box(1340, 340, 220, 175, 'OutboxProcessor', ['Worker interno', 'Lee Outbox en PostgreSQL', 'Reclamo recuperable', 'Entrega al menos una vez'], 'green');
arrow('1450,515 1450,695 1270,695', 'despacha a Tickets', 1430, 590);
text(800, 875, ['Cada módulo accede exclusivamente a sus tablas mediante sus adaptadores.', 'Payments persiste el evento en PostgreSQL; el worker lo recupera y despacha.'], 18);
box(45, 930, 350, 115, 'PostgreSQL 16', ['Única fuente de verdad', 'Persistencia por módulo'], 'gray');
box(435, 930, 350, 115, 'Redis 7 · auxiliar', ['Caché y señales de expiración', 'No decide disponibilidad'], 'green');
box(825, 930, 350, 115, 'Pasarelas de pago', ['Culqi / Niubiz / Stripe', 'Integración exclusiva de Payments'], 'yellow');
box(1215, 930, 340, 115, 'Servicio de correo', ['Envío de entradas', 'Integración de Tickets'], 'purple');
await save('C3-modulos');

function reservations(name, title) {
  start(title, 'Vista interna representativa · Reservations · DISEÑO PROPUESTO — NO IMPLEMENTADO', 1120);
  panel(330, 120, 850, 795, 'Reservations · Aplicación y dominio');
  box(40, 160, 250, 130, 'Entrada HTTP', ['ReservationsController', 'Adaptador primario'], 'blue');
  box(40, 345, 250, 135, 'ExpirationSweepTrigger', ['Invoca liberación de holds', 'Adaptador primario'], 'blue');
  box(40, 600, 250, 140, 'Payments', ['Consumidor externo al módulo', 'Invoca fachada en memoria'], 'yellow');
  box(370, 620, 370, 145, 'Puerto de entrada', ['IReservationsModuleFacade', 'Implementa:', 'ReservationsModuleFacadeImpl'], 'purple');
  box(370, 180, 370, 155, 'Casos de uso · aplicación', ['HoldTicketsUseCase', 'ReleaseExpiredHoldsUseCase'], 'purple');
  box(790, 180, 350, 150, 'Puerto de salida', ['IReservationUnitOfWork', 'Transacción y persistencia'], 'green');
  box(790, 620, 350, 145, 'Puerto de salida', ['ITimerNotifier', 'Alarma auxiliar post-commit'], 'green');
  box(370, 405, 370, 160, 'Dominio puro', ['SectorInventory · Reservation', 'Vendidas + holds ≤ capacidad', 'Cuota máxima 4 · vigencia 600 s'], 'pink');
  box(1220, 180, 340, 150, 'Adaptador secundario', ['PostgreSQLReservationAdapter', 'PostgreSQL 16 · SELECT FOR UPDATE'], 'gray');
  box(1220, 620, 340, 145, 'Adaptador secundario', ['RedisTTLTimerAdapter', 'Redis 7 · señal de expiración'], 'gray');
  arrow('290,230 370,230', 'invoca', 330, 215);
  arrow('290,415 330,415 330,295 370,295', '', 0, 0);
  arrow('290,670 370,670', 'invoca', 330, 655);
  arrow('740,255 790,255', '', 0, 0);
  arrow('740,315 755,315 755,650 790,650', '', 0, 0);
  arrow('650,335 650,405', 'usa entidades', 710, 375);
  arrow('740,700 765,700 765,300 790,300', '', 0, 0);
  arrow('740,730 790,730', '', 0, 0);
  arrow('1220,250 1140,250', 'implementa', 1180, 232, true);
  arrow('1220,690 1140,690', 'implementa', 1180, 674, true);
  text(750, 825, ['Aplicación invoca contratos; los adaptadores implementan esos contratos.', 'El dominio no importa controladores, casos de uso, drivers ni SDK externos.'], 18);
  text(800, 970, ['Línea continua: uso / invocación. Línea discontinua con triángulo: realización de interfaz.', 'Adaptadores primarios y secundarios pertenecen a infraestructura.', 'Catalog, Payments, Tickets, Access e Identity aplican la misma separación interna.'], 19);
  return save(name);
}
await reservations('C3-hexagonal', 'AFORO | Puertos, adaptadores y dominio');
await reservations('reservations-hexagonal', 'AFORO | Arquitectura hexagonal de Reservations');

start('AFORO | Arquitectura hexagonal en un monolito modular', 'Vista conceptual del enfoque · DISEÑO PROPUESTO — BACKEND NO IMPLEMENTADO', 1030);
panel(320, 130, 950, 700, 'API Core · Seis módulos independientes en el mismo proceso');
box(35, 240, 245, 155, 'Clientes', ['AFORO Web', 'AFORO Studio', 'AFORO Access'], 'blue');
box(35, 480, 245, 155, 'Entrada', ['Controladores REST', 'Validación de solicitudes', 'Autenticación y RBAC'], 'blue');
const modules = [['Catalog','Eventos, recintos y sectores','blue'],['Reservations','Holds, cuota y aforo','pink'],['Payments','Cobros e idempotencia','yellow'],['Identity','Usuarios y permisos','purple'],['Access','Ingresos y auditoría','green'],['Tickets','Emisión y firma QR','purple']];
for (let i=0;i<modules.length;i++) {
  const [name, purpose, color] = modules[i], x=350+(i%3)*300, y=210+Math.floor(i/3)*280;
  box(x,y,280,225,name,[purpose],color);
  text(x+140,y+110,['Puertos de entrada y salida'],15,'middle',700);
  text(x+140,y+145,['Aplicación · casos de uso'],16);
  parts.push(`<rect x="${x+20}" y="${y+166}" width="240" height="40" rx="12" fill="white" stroke="#7852b7"/>`);
  text(x+140,y+192,['Dominio propio · reglas'],16,'middle',700);
}
box(1310, 210, 255, 160, 'Persistencia', ['PostgreSQL 16', 'Única fuente de verdad', 'Redis 7 auxiliar'], 'gray');
box(1310, 440, 255, 155, 'Sistemas externos', ['Pasarelas de pago', 'Servicio de correo'], 'yellow');
arrow('155,395 155,480', 'HTTPS / JSON', 220, 440);
arrow('280,560 320,560', '',0,0);
arrow('1270,290 1310,290','',0,0);
arrow('1270,525 1310,525','',0,0);
text(800, 785, ['Cada módulo tiene adaptadores propios; los módulos colaboran mediante fachadas públicas.', 'Outbox: evento persistido y worker interno recuperable entre Payments y Tickets.'], 17);
text(800, 890, ['Estilo: monolito modular. Enfoque interno: puertos y adaptadores en cada módulo.', 'Los seis módulos no son capas ni caras de un único dominio compartido.', 'Web implementada en modo DEMO; Studio, Access e integraciones corresponden al diseño propuesto.'], 20);
await save('aforo-enfoque-general');
