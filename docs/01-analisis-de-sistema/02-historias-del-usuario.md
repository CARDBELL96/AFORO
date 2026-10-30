# Análisis del Sistema — 02. Historias de Usuario

**Sistema**: Plataforma de Descubrimiento, Venta y Validación de Entradas para Eventos y Conciertos en Vivo  
**Documento**: `docs/01-analisis-de-sistema/02-historias-del-usuario.md`  
**Versión**: `1.0.0` | **Fecha**: `2026-10-22`  
**Referencia Metodológica**: Metodología Ágil / Guía 04 de Arquitectura de Software  
**Alineación**: Conforme al catálogo de actores y especificación funcional

---

## 1. Convenciones y Estados de Implementación

Siguiendo el Principio IV de la Constitution del proyecto, las historias de usuario se clasifican según su estado verificable:
- `[IMPLEMENTADO EN WEB]`: Funcionalidad construida y respaldada por pruebas en `src/`.
- `[DEMO / SIMULADO]`: Funcionalidad interactiva en frontend con datos o almacenamiento local simulado.
- `[DISEÑO PROPUESTO]`: Historia formalizada a nivel de diseño arquitectónico y contratos para posterior construcción.

---

## 2. Historias de Usuario por Aplicación

### 2.1. AFORO Web (Asistente y Billetera Digital)

#### **HU-WEB-01: Exploración y Filtrado Multicriterio de Conciertos**
- **Estado**: `[IMPLEMENTADO EN WEB]`
- **Como**: Asistente a eventos musicales.
- **Quiero**: Filtrar los conciertos de la cartelera por ciudad, género musical y mes de la temporada.
- **Para**: Encontrar espectáculos de mi interés de forma inmediata sin recargar la página.
- **Criterios de Aceptación**:
  1. Filtros reactivos instantáneos combinables entre ciudad, género y fecha.
  2. Búsqueda por texto insensible a mayúsculas y diacríticos con atajo de teclado `/`.
  3. Soporte de vista en mosaico asimétrico o taquilla tipo ledger.

#### **HU-WEB-02: Selección de Sectores con Mapa Interactivo**
- **Estado**: `[IMPLEMENTADO EN WEB]`
- **Como**: Comprador de entradas.
- **Quiero**: Visualizar la distribución espacial del recinto en un mapa interactivo y seleccionar sectores.
- **Para**: Conocer la ubicación física del escenario y la disponibilidad visual de entradas.
- **Criterios de Aceptación**:
  1. El mapa SVG resalta el sector activo sincronizándose bidireccionalmente con la lista de precios.
  2. Al acceder con `#entradas`, la página ejecuta desplazamiento suave y posiciona el foco accesible.
  3. Control de cantidad por sector con tope estricto de 4 entradas por zona.

#### **HU-WEB-03: Carrito de Compras Persistente y Multi-Pestaña**
- **Estado**: `[IMPLEMENTADO EN WEB]`
- **Como**: Comprador de entradas.
- **Quiero**: Que las entradas añadidas al carrito se conserven y sincronicen entre pestañas abiertas.
- **Para**: Continuar mi proceso de compra sin perder la selección si abro una nueva ventana.
- **Criterios de Aceptación**:
  1. Persistencia local del carrito en el navegador.
  2. Sincronización en tiempo real entre pestañas mediante eventos `storage` nativos.

#### **HU-WEB-04: Reserva Preventiva de Entradas con Temporizador (Hold)**
- **Estado**: `[DISEÑO PROPUESTO]` *(En Web actual opera como `[DEMO / SIMULADO]`)*
- **Como**: Comprador en checkout.
- **Quiero**: Que el sistema reserve mis entradas durante 10 minutos (600 s) mientras completo el pago.
- **Para**: Evitar que otros usuarios compren mis entradas mientras introduzco mis datos bancarios.
- **Criterios de Aceptación**:
  1. Reserva atómica en backend protegida con bloqueo pesimista en PostgreSQL.
  2. Cuenta regresiva determinista de 600 segundos visible en pantalla.
  3. Si expira el tiempo sin confirmación de cobro, las entradas se liberan de inmediato al público.

#### **HU-WEB-05: Pago con Pasarela y Recepción de Pases Digitales QR**
- **Estado**: `[DISEÑO PROPUESTO]` *(En Web actual opera con emisión directa `ACTIVA_DEMO`)*
- **Como**: Comprador que ha reservado entradas.
- **Quiero**: Pagar con tarjeta mediante pasarela segura y recibir mis pases digitales con código QR firmado.
- **Para**: Tener acceso asegurado al recinto y almacenar mis pases en mi billetera web.
- **Criterios de Aceptación**:
  1. Integración con pasarela externa (Culqi / Niubiz / Stripe) con soporte 3D Secure e idempotencia.
  2. Código QR emitido con firma digital asimétrica Ed25519.
  3. Visualización de pases en la sección «Mis Entradas».

---

### 2.2. AFORO Studio (Organizadores y Promotores)

#### **HU-STU-01: Creación Editorial y Ficha Técnica de Concierto**
- **Estado**: `[DISEÑO PROPUESTO]`
- **Como**: Promotor de espectáculos.
- **Quiero**: Publicar un nuevo concierto detallando artista, fechas, sinopsis, recinto y line-up con horarios.
- **Para**: Habilitar la comercialización del evento en la plataforma pública.

#### **HU-STU-02: Distribución de Sectores y Asignación de Aforo**
- **Estado**: `[DISEÑO PROPUESTO]`
- **Como**: Administrador de recinto / Promotor.
- **Quiero**: Configurar la capacidad nominal física máxima por zona (ej. Campo A, Tribuna Occidente) y sus precios.
- **Para**: Garantizar que el aforo legal y físico del recinto no sea sobrepasado.

#### **HU-STU-03: Tablero de Control de Taquilla en Tiempo Real**
- **Estado**: `[DISEÑO PROPUESTO]`
- **Como**: Promotor de eventos.
- **Quiero**: Visualizar métricas en vivo de entradas vendidas, reservas en curso (holds activos) y aforo libre.
- **Para**: Monitorear la velocidad de venta y proyectar recaudaciones por sector.

---

### 2.3. AFORO Access (Operadores de Puerta y Control de Acceso)

#### **HU-ACC-01: Descarga Previa de Credenciales y Claves Públicas (Precarga)**
- **Estado**: `[DISEÑO PROPUESTO]`
- **Como**: Operador de puerta.
- **Quiero**: Sincronizar en mi terminal la clave pública del evento ($PK_E$) antes de abrir puertas.
- **Para**: Validar entradas aun si la conectividad móvil se interrumpe durante el ingreso.

#### **HU-ACC-02: Escaneo y Validación Online en Molinete**
- **Estado**: `[DISEÑO PROPUESTO]`
- **Como**: Operador de puerta.
- **Quiero**: Escanear el QR de la entrada y validar su autenticidad y estado de uso en menos de 500 ms.
- **Para**: Habilitar el torniquete de acceso de forma rápida y evitar aglomeraciones en la entrada.

#### **HU-ACC-03: Validación Offline de Contingencia y Reconciliación**
- **Estado**: `[DISEÑO PROPUESTO]`
- **Como**: Operador de puerta en una zona sin cobertura celular.
- **Quiero**: Validar criptográficamente el código QR localmente y registrar el ingreso en la memoria de la terminal.
- **Para**: No detener el flujo de asistentes durante caídas de red, reconciliando la bitácora al recuperar la conexión.

