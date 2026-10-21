# Feature Specification: Ajuste de Proporciones del Hero al 100 % y Página Independiente de Detalle y Compra

**Feature Branch**: `001-frontend-proportions-and-ticket-page`

**Created**: 2026-10-20

**Status**: Draft (Revised)

**Input**: User description: "Ajustar exclusivamente la primera pantalla de la página principal (Hero) para lograr una composición equilibrada de forma nativa al 100 % de zoom (equivalente a cómo se percibe hoy al 70 %), conservando intactas las dimensiones, composición y estilo de las secciones inferiores («Programación en pulso», «Seis movimientos», «Descubre el Perú» y catálogo), e implementar la nueva experiencia de detalle y compra en página completa abierta en pestaña independiente (/eventos/:slug y /eventos/:slug#entradas) con transparencia del modo DEMO y conservación temporal de EventQuickModal."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Primera Pantalla (Hero) Equilibrada al 100 % de Zoom sin Alterar Secciones Posteriores (Priority: P1)

Un visitante ingresa a la página principal de AFORO Web con el navegador configurado al **100 % de zoom** en resoluciones de escritorio habituales (`1366×768`, `1440×900` y `1920×1080`), tabletas y móviles. El usuario visualiza una primera pantalla (**Hero**) más compacta, proporcionada y correctamente alineada —con la misma sensación de equilibrio visual que antes solo se apreciaba al configurar el zoom al 70 %—, donde el titular principal se muestra completo sin recortes horizontales, el subtítulo y los botones guardan una escala armónica, y existe un equilibrio intencional entre los elementos de la izquierda y la derecha. Al desplazarse hacia abajo, las secciones posteriores («Programación en pulso», «Seis movimientos que mueven la escena», «Descubre el Perú en vivo» y demás vistas del catálogo) conservan intactas sus dimensiones, composición, distribución y estilo actuales.

**Why this priority**: Corrige de forma quirúrgica la desproporción y el recorte horizontal de la primera pantalla (Hero) al 100 % de zoom sin alterar ni degradar las secciones inferiores que ya cuentan con el diseño y proporciones deseados.

**Independent Test**: Puede verificarse abriendo la portada (`/`) al 100 % de zoom en viewports de `1366×768`, `1440×900`, `1920×1080`, `768×1024` y `390×844`, comprobando que el Hero muestra su titular íntegro, proporciones equilibradas y alineación limpia entre izquierda y derecha, y verificando que las secciones inferiores mantienen exactamente su estructura, tamaños y espaciados originales.

**Acceptance Scenarios**:

1. **Given** un navegador al 100 % de zoom en resoluciones de `1366×768`, `1440×900` o `1920×1080`, **When** el usuario visualiza la primera pantalla (Hero), **Then** las tres líneas del titular principal («LA NOCHE / NO SE CUENTA. / se vive.») se muestran completas sin ningún carácter recortado horizontalmente, acompañadas por el subtítulo, los botones de acción, la tarjeta del próximo evento y la franja inferior con proporciones compactas y equilibradas equivalentes a la referencia del 70 % de zoom.
2. **Given** la primera pantalla (Hero) en resoluciones de escritorio al 100 % de zoom, **When** el usuario observa la composición general entre el bloque editorial izquierdo y los elementos informativos/decorativos de la derecha, **Then** ambos lados mantienen una relación de escala, separación y alineación equilibrada dentro de la altura visible de la portada.
3. **Given** el usuario desplazándose desde el Hero hacia las secciones «01 // Programación en pulso», «02 // Seis movimientos que mueven la escena», «03 // Descubre el Perú en vivo» y el resto del catálogo, **When** inspecciona sus títulos, barras de filtros, tarjetas, imágenes y espaciados, **Then** dichas secciones conservan sin reducciones ni alteraciones sus dimensiones, distribución y composición originales.
4. **Given** la portada de AFORO Web, **When** el usuario incrementa el zoom del navegador (125 %–200 %) o navega desde tabletas y móviles, **Then** el Hero se adapta fluidamente manteniendo todos sus textos legibles y sus controles accionables sin solapamientos ni recortes.

---

### User Story 2 - Navegación Diferenciada a Ficha del Evento y Compra en Nueva Pestaña (Priority: P1)

Mientras explora la cartelera principal, el cronograma, el dossier regional o el explorador de eventos, el usuario puede distinguir claramente entre dos acciones para cada concierto: consultar la ficha general del evento (`/eventos/:slug`) o ir directamente a comprar/ver entradas (`/eventos/:slug#entradas`). Al seleccionar cualquiera de ellas, se abre la página completa correspondiente en una **nueva pestaña del navegador** mediante enlaces seguros, sin abrir la ventana modal emergente y sin saturar visualmente las tarjetas.

**Why this priority**: Sustituye la ventana emergente por una experiencia dedicada en pestaña nueva y permite distinguir desde cualquier tarjeta o listado la intención informativa frente a la intención de compra.

**Independent Test**: Puede probarse accionando «Ver evento / Ver concierto» y «Comprar / Ver entradas / Elegir sector» en las tarjetas y listados de la aplicación, comprobando que ambas abren una nueva pestaña segura en `/eventos/:slug` y `/eventos/:slug#entradas` respectivamente, mientras la pestaña original permanece intacta.

**Acceptance Scenarios**:

1. **Given** un evento mostrado en cualquier tarjeta o listado del catálogo, **When** el usuario selecciona la acción «Ver evento» / «Ver concierto» (o el título del concierto), **Then** se abre una nueva pestaña segura en `/eventos/:slug` posicionada al inicio de la página del concierto.
2. **Given** un evento mostrado en cualquier tarjeta o listado del catálogo, **When** el usuario selecciona la acción «Comprar» / «Ver entradas» / «Elegir sector», **Then** se abre una nueva pestaña segura en `/eventos/:slug#entradas` desplazando y enfocando automáticamente la sección de zonas y selección de entradas.
3. **Given** las tarjetas del explorador y de la cartelera con ambas acciones diferenciadas, **When** el usuario las visualiza, **Then** los controles de acción se integran de manera limpia y concisa sin saturar ni alterar las proporciones de las tarjetas.
4. **Given** el usuario con filtros activos en la pestaña principal, **When** abre uno o varios eventos en nuevas pestañas, **Then** la pestaña original conserva su posición de desplazamiento y sus filtros activos sin mostrar ningún modal emergente.

---

### User Story 3 - Experiencia Integral de Detalle, Recinto y Selección de Entradas en Página Completa (Priority: P1)

En la página independiente del evento (`/eventos/:slug` y `/eventos/:slug#entradas`), el usuario dispone de un espacio amplio y bien estructurado que reutiliza e integra los mejores elementos de la ficha de detalle y del antiguo modal de sectores: imagen principal, información del concierto, fecha y hora de puertas, recinto con ubicación y coordenadas, line-up, plano espacial interactivo de zonas sincronizado con la lista de sectores, precios y disponibilidad, selector de cantidades, información relevante para la compra y un resumen de selección con las opciones provisionales de **«Agregar al carrito»** y **«Emitir pase QR (Demo)»**.

**Why this priority**: Ofrece una experiencia de compra de página completa mucho más cómoda y rica que una ventana emergente, manteniendo la identidad *Pulso Nocturno*.

**Independent Test**: Puede verificarse abriendo `/eventos/:slug` y `/eventos/:slug#entradas` en una pestaña nueva, seleccionando sectores desde el plano o desde la lista, ajustando cantidades, verificando el resumen en vivo y probando tanto «Agregar al carrito» como «Emitir pase QR (Demo)».

**Acceptance Scenarios**:

1. **Given** un usuario que abre `/eventos/:slug`, **When** se presenta la página completa del concierto, **Then** se muestran de forma integrada la imagen principal, información del concierto, fecha y ubicación, recinto, line-up, plano interactivo de zonas, precios, cantidades, información relevante para la compra y resumen de selección bajo la identidad visual de AFORO.
2. **Given** la sección de recinto y entradas (`#entradas`) en la página del concierto, **When** el usuario selecciona una zona en el plano espacial del recinto o en la lista de sectores, **Then** ambos elementos se sincronizan mostrando el sector activo, su precio en soles (`S/`), su porcentaje/estado de disponibilidad referencial y sus condiciones de acceso.
3. **Given** una selección activa de entradas en `/eventos/:slug#entradas`, **When** el usuario ajusta la cantidad de entradas y revisa el resumen de selección, **Then** puede elegir entre agregar la selección al carrito o emitir un pase QR de demostración, sincronizándose el resultado con todas las pestañas abiertas de la aplicación.

---

### User Story 4 - Transparencia del Modo Demostración y Regla de Reserva (Priority: P2)

En toda la experiencia de selección de entradas, resumen de compra, carrito y emisión de pases QR de prueba, la interfaz distingue explícitamente las operaciones simuladas (`DEMO`) de una transacción real, dejando claro que seleccionar entradas visualmente no bloquea inventario y que la opción «Emitir pase QR (Demo)» es una simulación local mientras no esté conectado el backend transaccional.

**Why this priority**: Garantiza el cumplimiento estricto del principio de honestidad técnica e integridad de dominio establecido en la Constitution de AFORO.

**Independent Test**: Puede verificarse comprobando en `/eventos/:slug#entradas`, en el carrito y en «Mis Entradas» que las etiquetas y avisos identifican inequívocamente el carácter simulado (`DEMO`) de los datos y pases generados.

**Acceptance Scenarios**:

1. **Given** el usuario en la sección de compra de `/eventos/:slug#entradas`, **When** revisa los sectores, el resumen de selección y el botón «Emitir pase QR (Demo)», **Then** se muestra una identificación clara de que los datos son simulados (`DEMO`) y de que la selección visual en pantalla no bloquea inventario real.
2. **Given** el usuario que acciona «Emitir pase QR (Demo)» desde la página del evento o desde el carrito, **When** se genera el pase digital en «Mis Entradas», **Then** el pase se presenta explícitamente con estado de demostración (`ACTIVA_DEMO`) sin aparentar un cobro financiero real.

---

### Edge Cases

- **Evento agotado (`sold_out`):** Al abrir `/eventos/:slug` o `/eventos/:slug#entradas` para un evento agotado, todos los sectores se muestran como agotados en el plano y en la lista, los selectores de cantidad y botones de compra/emisión permanecen deshabilitados, y se informa claramente al usuario.
- **Evento con sectores parcialmente agotados:** Los sectores agotados muestran su estado sin permitir selección, seleccionándose por defecto el primer sector con disponibilidad activa.
- **Titular del Hero en distintas resoluciones de escritorio y móviles:** En `1366×768`, `1440×900`, `1920×1080`, tabletas y móviles al 100 % de zoom, las líneas del titular («LA NOCHE / NO SE CUENTA. / se vive.») no deben cortarse en el borde derecho ni durante ni después de su animación de entrada.
- **Carga directa de `/eventos/:slug#entradas` en nueva pestaña:** Cuando la página termina de cargar los datos del evento, realiza el desplazamiento automático suave o directo hacia `#entradas` sin quedarse detenida en la parte superior.
- **Sincronización multi-pestaña:** Agregar entradas al carrito o emitir un pase QR (Demo) en la nueva pestaña actualiza automáticamente el contador del carrito y de «Mis Entradas» en la pestaña principal.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST ajustar **exclusivamente la primera pantalla de la página principal (Hero)** para que al **100 % de zoom del navegador** presente una composición más compacta, proporcionada y equilibrada, logrando de forma nativa la apariencia armónica que anteriormente se percibía al 70 % de zoom.
- **FR-002**: El ajuste del Hero al 100 % de zoom MUST aplicarse sobre las dimensiones reales de su titular principal, subtítulo, botones de acción, tarjeta de próximo evento, franja inferior, altura general y espaciados internos, quedando prohibido el uso de escalado global artificial (`zoom`, `transform: scale()` o reducción global del tamaño de fuente de la aplicación).
- **FR-003**: El titular principal del Hero («LA NOCHE / NO SE CUENTA. / se vive.») MUST visualizarse íntegro sin sufrir ningún recorte horizontal en sus caracteres finales en resoluciones de `1366×768`, `1440×900`, `1920×1080`, tabletas y móviles, manteniendo un equilibrio visual intencional entre los elementos de la izquierda y la derecha del Hero.
- **FR-004**: Las secciones posteriores al Hero en la página principal («01 // Programación en pulso», «02 // Seis movimientos que mueven la escena», «03 // Descubre el Perú en vivo» y cierre) y las demás vistas del catálogo MUST conservar intactas sus dimensiones, composición, distribución, tamaños de tarjetas, títulos, imágenes, filtros y espaciados actuales, sin aplicarles reducciones de escala.
- **FR-005**: Cualquier ajuste puntual fuera del Hero y de la nueva página de evento MUST limitarse estrictamente a integrar los enlaces de navegación en nueva pestaña o a corregir un desbordamiento real previamente justificado y aprobado.
- **FR-006**: El Hero y la página de detalle/compra MUST comportarse de forma responsive en `1366×768`, `1440×900`, `1920×1080`, tabletas y móviles, y mantener la legibilidad y funcionamiento cuando el usuario incremente el zoom del navegador (125 %–200 %).
- **FR-007**: Todas las tarjetas y listados de eventos MUST permitir distinguir claramente dos acciones sin saturar visualmente las tarjetas:
  - **Ver evento** → `/eventos/:slug`
  - **Comprar / Ver entradas** → `/eventos/:slug#entradas`
- **FR-008**: Ambas acciones (`/eventos/:slug` y `/eventos/:slug#entradas`) MUST abrirse en una **nueva pestaña del navegador** mediante enlaces seguros que preserven el estado y la seguridad de la pestaña de origen.
- **FR-009**: Al abrirse `/eventos/:slug#entradas` en una nueva pestaña, la página MUST posicionar y enfocar automáticamente al usuario en la sección de selección de zonas y entradas una vez disponibles los datos del concierto.
- **FR-010**: La página completa `/eventos/:slug` MUST reutilizar e integrar los mejores elementos de `EventDetail` y `EventQuickModal` bajo la identidad visual *Pulso Nocturno*, mostrando cómodamente:
  1. Información del concierto (artista, título, frase editorial, sinopsis, line-up con horarios y especificación acústica).
  2. Imagen principal del evento.
  3. Fecha, hora de inicio y apertura de puertas, así como ubicación general.
  4. Recinto o lugar del evento (dirección, distrito/ciudad, coordenadas y reglas de ingreso/edad).
  5. Zonas y tipos de entradas junto con el plano espacial interactivo del recinto sincronizado bidireccionalmente.
  6. Precios unitarios en soles (`S/`), porcentajes/estados de disponibilidad referencial y controles de cantidad por sector.
  7. Información relevante para realizar la compra (límites por operación, condiciones de acceso y estado de simulación).
  8. Resumen dinámico de la selección con las opciones provisionales **«Agregar al carrito»** y **«Emitir pase QR (Demo)»**.
- **FR-011**: Las acciones de agregar al carrito, guardar favoritos o emitir un pase QR (Demo) ejecutadas en la nueva pestaña MUST sincronizarse automáticamente con el resto de pestañas abiertas de AFORO Web.
- **FR-012**: La interfaz MUST identificar claramente en la página de compra, en el resumen de selección y en el botón «Emitir pase QR (Demo)» que los datos y pases corresponden a una simulación local (`DEMO`) sin conexión al backend real, y que seleccionar entradas visualmente no bloquea inventario.
- **FR-013**: El componente `src/components/EventQuickModal.tsx` MUST dejar de abrirse desde los botones de compra/entradas del catálogo, pero su archivo MUST conservarse temporalmente en el repositorio como referencia hasta que la nueva página de compra esté implementada y verificada.

### Key Entities *(include if feature involves data)*

- **Evento (`AforoEvent`)**: Concierto, festival o fecha cultural con su información editorial, técnica, geográfica, line-up, imagen principal, color de acento y colección de sectores.
- **Sector / Zona de Entrada (`TicketTier`)**: Localidad del recinto con nombre, precio en soles (`S/`), descripción de acceso, porcentaje de disponibilidad referencial y estado (`available`, `few`, `sold_out`).
- **Selección de Compra / Línea de Carrito (`CartLine`)**: Par evento-sector y cantidad seleccionada por el usuario para agregar al carrito o emitir como pase de demostración.
- **Pase Digital de Demostración (`DemoUserTicket`)**: Entrada digital simulada con código QR y estado explícito `ACTIVA_DEMO` almacenada en la billetera local «Mis Entradas».

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Al **100 % de zoom del navegador**, la primera pantalla (**Hero**) muestra el 100 % de las letras del titular principal («LA NOCHE / NO SE CUENTA. / se vive.») sin recortes horizontales y presenta una proporción compacta y equilibrada en `1366×768`, `1440×900` y `1920×1080`, sin emplear escalado artificial (`zoom` o `transform: scale`) sobre la página.
- **SC-002**: El 100 % de las secciones inferiores de la página principal («Programación en pulso», «Seis movimientos que mueven la escena», «Descubre el Perú en vivo» y cierre) conservan intactas sus dimensiones, distribución y estilo actuales al desplazarse debajo del Hero.
- **SC-003**: El 100 % de las tarjetas y filas de eventos ofrecen las acciones diferenciadas «Ver evento» (`/eventos/:slug`) y «Comprar / Ver entradas» (`/eventos/:slug#entradas`) abriéndose en una nueva pestaña segura, con `0` aperturas del modal emergente desde el catálogo.
- **SC-004**: Al abrir `/eventos/:slug#entradas` en una nueva pestaña, el usuario queda posicionado automáticamente en la estación de plano del recinto y selección de entradas en menos de 1 segundo tras la carga del evento.
- **SC-005**: En la página completa `/eventos/:slug`, el usuario puede seleccionar sectores desde el plano interactivo o la lista, ajustar cantidades, visualizar el resumen de su selección y ejecutar «Agregar al carrito» o «Emitir pase QR (Demo)» sincronizando el resultado entre pestañas abiertas.
- **SC-006**: Al incrementar el zoom del navegador al 150 % y 200 %, así como en tabletas y móviles, el Hero y la página completa del evento mantienen el 100 % de sus textos legibles y sus controles operativos sin solapamientos.
- **SC-007**: El 100 % de las pantallas y acciones de reserva/emisión identifican explícitamente el modo `DEMO`, sin presentar ninguna operación simulada como cobro financiero o bloqueo real de inventario.

## Assumptions

- Las secciones inferiores al Hero ya cuentan con el diseño, proporciones y distribución aprobados por el usuario, por lo que no deben ser redimensionadas.
- Las opciones «Agregar al carrito» y «Emitir pase QR (Demo)» se mantienen provisionalmente juntas en el resumen de selección de la página del evento hasta la futura integración con el backend transaccional.
- El archivo `src/components/EventQuickModal.tsx` se conserva sin eliminar en el árbol de código hasta la verificación final de la nueva página de compra.
