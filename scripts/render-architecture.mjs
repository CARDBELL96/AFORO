/** Fuentes vectoriales deterministas de las vistas académicas de AFORO.
 * Uso: node scripts/render-architecture.mjs
 * PNG opcional: AFORO_SHARP_MODULE=ruta/al/modulo/sharp
 * Las fuentes Mermaid de los documentos describen las mismas relaciones;
 * este archivo controla la composición visual de estas tres vistas.
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
panel(45, 280, 1515, 555, 'API Core · Un proceso y un despliegue · Seis módulos pares');
box(115, 360, 345, 150, 'Catalog', ['Eventos, recintos y sectores', 'ICatalogModuleFacade'], 'blue');
box(625, 360, 345, 150, 'Reservations', ['Hold 600 s · cuota máxima 4', 'IReservationsModuleFacade'], 'pink');
box(1135, 360, 345, 150, 'Payments', ['Cobros y webhooks idempotentes', 'Pago + evento en la misma TX'], 'yellow');
box(115, 620, 345, 150, 'Identity', ['Autenticación y permisos', 'IIdentityModuleFacade'], 'purple');
box(625, 620, 345, 150, 'Access', ['Ingreso online y auditoría', 'Reconciliación offline'], 'green');
box(1135, 620, 345, 150, 'Tickets', ['Emisión y firma Ed25519', 'ITicketsModuleFacade'], 'purple');
arrow('625,435 460,435', 'consulta', 542, 422);
arrow('1135,435 970,435', 'confirma', 1052, 422);
arrow('970,695 1135,695', 'consume', 1052, 681);
arrow('210,220 210,280', 'HTTPS / JSON', 285, 255);
arrow('800,220 800,280', 'HTTPS / JSON', 880, 255);
arrow('1390,220 1390,250 1220,250 1220,280', 'HTTPS / JSON', 1400, 240);
text(675, 552, ['Relaciones entre módulos: contratos públicos en memoria.', 'Identity presta verificación transversal a los adaptadores de entrada.'], 18);
text(800, 875, ['Cada módulo accede exclusivamente a sus tablas mediante sus adaptadores.', 'Esta vista muestra módulos de negocio; los mecanismos auxiliares se detallan en el documento.'], 18);
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

// aforo-enfoque-general.png es la imagen original del usuario. No regenerar ni modificar.
