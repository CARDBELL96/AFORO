# AFORO — Fusion (Edición Definitiva)

**AFORO Fusion** es la versión unificada y definitiva del frontend para **AFORO** (plataforma editorial de venta y gestión de entradas para conciertos, festivales y cultura en vivo en el Perú).

Combina lo mejor de las dos propuestas originales (`Aforo/` y `tf/`) bajo un único sistema de diseño **Brutalismo Editorial Peruano ("Pulso Nocturno")**:

1. **Hero & Primera Pantalla (`Aforo/`):**
   - Marquee superior en lima ácido (`#D8F36A`), titular editorial *«LA NOCHE / NO SE CUENTA. / se vive.»*, tarjeta destacada «PRÓXIMO» inclinada (`-1.5deg`) con botón directo para abrir el plano de sectores y franja crema de géneros musicales peruanos.
2. **Sección `01 // Programación en pulso` y Secciones Editoriales (`tf/`):**
   - Tabs de ciudades (`Todo el Perú`, `Lima`, `Cusco`, `Arequipa`, `Trujillo`, `Selva Central`), filtros combinables y conmutador dual de vista entre **Mosaico Editorial Asimétrico** y **Cronograma / Taquilla (Ledger)**.
   - Sección **`02 // Seis movimientos que mueven la escena`** (mosaico interactivo de escenas musicales).
   - Sección **`03 // Descubre el Perú en vivo`** (dossier regional con guía de recintos emblemáticos y selector de ciudad en tiempo real).
3. **Explorador Dedicado `/eventos` y Buscador `/` (`Aforo/`):**
   - Chips de géneros, panel lateral de filtros avanzados, conmutador Carteles/Lista, sincronización con URL y buscador instantáneo con atajo `/`.
4. **Doble Flujo de Compra Sincronizado (`tf/` + `Aforo/`):**
   - **Modal Rápido (`EventQuickModal`):** *Ficha Editorial & Plano de Sectores* con mapa SVG interactivo del recinto (`VenueStageMap`) y talón de entrada perforado (`TicketPicker`).
   - **Página Completa (`/eventos/:slug`):** Póster editorial, ficha técnica, mapa SVG interactivo de sectores sincronizado con el selector de entradas, carrito lateral (`CartDrawer`) con checkout simulado y grilla editorial *«Más noches con este pulso»*.
5. **Billetera Digital «Mis Entradas» (`TicketsModal`):**
   - Pases digitales con código QR dinámico y estado verificado.

## Comandos

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Ejecutar verificación completa (TypeScript + Tests unitarios + Build de producción)
npm run check
```
