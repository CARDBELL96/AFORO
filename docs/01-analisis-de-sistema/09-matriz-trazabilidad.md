# Matriz de Trazabilidad del Análisis del Sistema — AFORO

**Sistema**: Plataforma de Descubrimiento, Venta y Validación de Entradas para Eventos y Conciertos en Vivo  
**Documento**: `docs/01-analisis-de-sistema/09-matriz-trazabilidad.md`  
**Versión**: `1.1.0` | **Fecha**: `2026-10-21`

---

## 1. Propósito de la Matriz y Criterios de Honestidad Técnica

Esta matriz establece el hilo conductor riguroso entre las dimensiones del análisis del sistema:
1. **Requisitos Funcionales (RF)**: Comportamientos específicos demandados por los actores del ecosistema (AFORO Web, Studio, Access y API Core).
2. **Requisitos No Funcionales (RNF)**: Atributos cuantitativos de calidad bajo ISO/IEC 25010 (Desempeño, Fiabilidad, Seguridad, Usabilidad, etc.).
3. **Reglas de Negocio (RN)**: Invariantes y políticas de dominio que gobiernan el inventario, los pagos y los accesos.
4. **Escenarios de Atributos de Calidad (EAC)**: Especificaciones canónicas del SEI (Fuente, Estímulo, Artefacto, Entorno, Respuesta, Medida).
5. **Artefactos Afectados y Estado de Realidad Técnica**:
   - `[IMPLEMENTADO EN WEB]`: Código programado y verificado en `src/` con pruebas automatizadas (`npm run check`).
   - `[DEMO EN WEB]`: Funcionalidad simulada en frontend mediante datos estáticos o `localStorage` (sin backend).
   - `[DISEÑO PROPUESTO]`: Módulos de backend o aplicaciones especializadas formalizadas a nivel arquitectónico, con metas de diseño cuantitativas pendientes de comprobación empírica en fases posteriores.

---

## 2. Matriz de Trazabilidad Integral

| Requisito Funcional (RF) | Requisito No Funcional (RNF) | Regla de Negocio (RN) | Escenario de Calidad (EAC) | Artefacto Afectado | Estado de Realidad Técnica |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-WEB-01** (Catálogo y Filtros)<br>**RF-WEB-02** (Conmutación Mosaico/Ledger)<br>**RF-COR-01** (Consulta Pública API) | **RNF-PE-04** (Meta: p95 $< 200\text{ ms}$)<br>**RNF-US-01** (Proporción nativa al 100 %)<br>**RNF-US-02** (Sin recorte horizontal) | — | **EAC-01** (Ráfaga en preventa: meta 2500 req/s, p95 $< 250\text{ ms}$) | [`src/components/PulseCatalogSection.tsx`](../../src/components/PulseCatalogSection.tsx),<br>[`src/components/SearchOverlay.tsx`](../../src/components/SearchOverlay.tsx),<br>`[DISEÑO PROPUESTO]` Módulo Catálogo Backend | `[IMPLEMENTADO EN WEB]` (UI fluida a 60 fps)<br>`[DISEÑO PROPUESTO]` (Backend: meta de diseño) |
| **RF-WEB-04** (Navegación segura nueva pestaña) | **RNF-SE-03** (`target="_blank" rel="noopener noreferrer"`) | — | — | [`src/components/EventCard.tsx`](../../src/components/EventCard.tsx),<br>[`src/router.tsx`](../../src/router.tsx) | `[IMPLEMENTADO EN WEB]` (Prueba unitaria en [`src/router.test.ts`](../../src/router.test.ts)) |
| **RF-WEB-05** (Ficha del concierto)<br>**RF-WEB-07** (Desplazamiento automático `#entradas`) | **RNF-PE-01** (Foco accesible $< 1000\text{ ms}$) | — | — | [`src/pages/EventDetail.tsx`](../../src/pages/EventDetail.tsx) | `[IMPLEMENTADO EN WEB]` (Medido experimentalmente: `33.64 ms`) |
| **RF-WEB-06** (Mapa ⇄ Lista de sectores)<br>**RF-WEB-08** (Selección visual y topes)<br>**RF-WEB-09** (Carrito lateral reactivo) | **RNF-PE-02** ($\ge 60\text{ fps}$ renderizado)<br>**RNF-PE-03** (Sync multi-pestaña $< 100\text{ ms}$) | **RN-02** (Selección visual no bloquea servidor)<br>**RN-04** (Tope 4 entradas por zona) | — | [`src/components/VenueStageMap.tsx`](../../src/components/VenueStageMap.tsx),<br>[`src/components/TicketPicker.tsx`](../../src/components/TicketPicker.tsx),<br>[`src/components/CartDrawer.tsx`](../../src/components/CartDrawer.tsx),<br>[`src/lib/store.tsx`](../../src/lib/store.tsx) (`StoreProvider`),<br>[`src/lib/cart.ts`](../../src/lib/cart.ts) | `[IMPLEMENTADO EN WEB]` (Sync medido: `36.2 ms`; tope 4 validado en [`Stepper.tsx`](../../src/components/Stepper.tsx)) |
| **RF-WEB-11** (Transparencia MODO DEMO) | **RNF-US-01** (Composición al 100 %)<br>**RNF-US-03** (Accesibilidad WCAG AA) | **RN-02** (Aviso explícito de no reserva de aforo) | — | [`src/components/TicketPicker.tsx`](../../src/components/TicketPicker.tsx),<br>[`src/components/CartDrawer.tsx`](../../src/components/CartDrawer.tsx) | `[IMPLEMENTADO EN WEB]` (Etiquetas visibles de advertencia) |
| **RF-WEB-12** (Solicitud de reserva formal)<br>**RF-COR-02** (Bloqueo transaccional de inventario) | **RNF-PE-05** (Meta: $\ge 1500\text{-}2500\text{ req/s}$)<br>**RNF-RE-01** (Meta: Disponibilidad 99.9 %) | **RN-01** (Invariante de no sobreventa: $\text{Sold} + \text{Holds} \le \text{Capacity}$)<br>**RN-03** (Reserva temporal con TTL de 10 min) | **EAC-02** (Contención por últimos cupos: 0 sobreventas, meta $< 300\text{ ms}$) | `[DISEÑO PROPUESTO]` Módulo Reservas,<br>`[DISEÑO PROPUESTO]` PostgreSQL / Redis | `[DISEÑO PROPUESTO]` (Meta de diseño arquitectónico; simulado en Web con modo DEMO) |
| **RF-COR-03** (Liberación de reservas vencidas) | **RNF-RE-01** (Disponibilidad 99.9 %) | **RN-03** (Liberación automática tras 10 min) | **EAC-03** (Meta: Liberación en $< 2\text{ s}$ tras vencer TTL de 600 s) | `[DISEÑO PROPUESTO]` Redis Keyspace Listener,<br>`[DISEÑO PROPUESTO]` Módulo Reservas | `[DISEÑO PROPUESTO]` (Meta de diseño arquitectónico) |
| **RF-WEB-13** (Procesamiento de pagos)<br>**RF-COR-04** (Cobros idempotentes y webhooks) | **RNF-RE-02** (Tolerancia a fallos de pasarela)<br>**RNF-SE-04** (PCI-DSS tokenización) | **RN-05** (Idempotencia estricta vía `Idempotency-Key`) | **EAC-04** (Caída de pasarela y reintentos: 0 cobros dobles, meta $< 80\text{ ms}$) | `[DISEÑO PROPUESTO]` Módulo Pagos,<br>Pasarela externa (Culqi / Niubiz) | `[DISEÑO PROPUESTO]` (Simulado en Web emitiendo `ACTIVA_DEMO`) |
| **RF-WEB-10** (Billetera digital «Mis Entradas»)<br>**RF-COR-05** (Emisión criptográfica) | **RNF-SE-01** (Autenticidad del QR; firma asimétrica preferida vs HMAC sujeta a ADR) | **RN-06** (Emisión atómica tras pago confirmado)<br>**RN-07** (Máquina de estados: `ISSUED` ➔ `ACTIVE`) | **EAC-06** (Detección de ticket adulterado: 0 ingresos no autorizados) | [`src/components/TicketsModal.tsx`](../../src/components/TicketsModal.tsx),<br>`[DISEÑO PROPUESTO]` Módulo Tickets Backend | `[DEMO EN WEB]` (Pases `ACTIVA_DEMO`)<br>`[DISEÑO PROPUESTO]` (Mecanismo criptográfico diferido a ADR) |
| **RF-STU-01..06** (Gestión editorial, recintos, fases, taquilla en vivo) | **RNF-MA-01** (Modularidad)<br>**RNF-MA-02** (Arquitectura Hexagonal) | **RN-01** (Aforo máximo autorizado) | — | `[DISEÑO PROPUESTO]` AFORO Studio SPA,<br>`[DISEÑO PROPUESTO]` Módulos Catálogo e Inventario | `[DISEÑO PROPUESTO]` (Aplicación planificada para fases posteriores) |
| **RF-ACC-01..06** (Control de acceso en puerta, escaneo y modo offline) | **RNF-PE-06** (Meta escaneo: $< 350\text{ ms}$)<br>**RNF-RE-03** (Operación offline sin cortes)<br>**RNF-SE-01** (Firma QR)<br>**RNF-SE-02** (Anti-reúso en puerta) | **RN-06** (Firma criptográfica sujeta a ADR)<br>**RN-07** (Transición `ACTIVE` ➔ `USED`)<br>**RN-08** (Verificación local vs atómica online vs reconciliación) | **EAC-05** (Corte de red: validación offline continua, meta $< 300\text{ ms}$, riesgo CAP inter-puerta documentado)<br>**EAC-06** (QR clonado: alerta meta $< 200\text{ ms}$) | `[DISEÑO PROPUESTO]` AFORO Access PWA / App Móvil,<br>`[DISEÑO PROPUESTO]` Módulo Accesos Backend | `[DISEÑO PROPUESTO]` (Cliente especializado y backend propuestos) |

---

## 3. Síntesis de Cobertura y Trazabilidad

- **Requisitos Funcionales (RF)**: 13 especificados para AFORO Web (11 implementados/demo en frontend, 2 diseñados para checkout/pagos), 6 diseñados para AFORO Studio, 6 diseñados para AFORO Access y 7 diseñados para API Core Backend.
- **Requisitos No Funcionales (RNF)**: 18 requisitos cuantitativos alineados a ISO/IEC 25010, separando claramente los resultados empíricos medidos en frontend de los objetivos de diseño pendientes de validación para el backend y las terminales de puerta.
- **Reglas de Negocio (RN)**: 8 reglas de dominio formalizadas, incluyendo tope de 4 entradas por zona, reserva temporal con TTL de 10 minutos, tratamiento criptográfico con ADR diferido y análisis del teorema CAP para operación offline.
- **Escenarios de Atributos de Calidad (EAC)**: 6 escenarios canónicos del SEI (`EAC-01` a `EAC-06`) con metas de diseño explícitas y riesgos operativos asumidos.
- **Verificación Técnica**: La suite de pruebas de frontend se mantiene íntegramente operativa (`30/30` pruebas aprobadas en [`npm run check`](../../package.json)).
