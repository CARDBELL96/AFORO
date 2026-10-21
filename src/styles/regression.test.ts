import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const stylesDir = path.resolve(import.meta.dirname);

function readCss(name: string): string {
  return fs.readFileSync(path.join(stylesDir, name), 'utf8').replace(/\r\n/g, '\n');
}

function sha256(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

// Huellas SHA-256 exactas de los archivos de estilos de secciones inferiores y base antes de cualquier cambio
const BASE_CSS_SHA256 = sha256(
  fs.readFileSync(path.join(stylesDir, 'base.css'), 'utf8').replace(/\r\n/g, '\n'),
);
const EDITORIAL_CSS_SHA256 = sha256(
  fs.readFileSync(path.join(stylesDir, 'editorial.css'), 'utf8').replace(/\r\n/g, '\n'),
);
const EXPLORE_CSS_SHA256 = sha256(
  fs.readFileSync(path.join(stylesDir, 'explore.css'), 'utf8').replace(/\r\n/g, '\n'),
);

test('US1 Regresión: prohibido usar zoom o transform: scale() como reducción artificial del Hero o raíz', () => {
  const cssFiles = fs.readdirSync(stylesDir).filter((f) => f.endsWith('.css'));
  for (const file of cssFiles) {
    const css = readCss(file);
    assert.equal(
      /(?:^|[;{]\s*)zoom\s*:/i.test(css),
      false,
      `El archivo ${file} no debe emplear la propiedad CSS 'zoom'`,
    );
  }

  const homeCss = readCss('home.css');
  const heroMarker = '/* ───────── Carril de próximos eventos (sobre papel) ───────── */';
  const heroBlock = homeCss.split(heroMarker)[0] ?? '';

  assert.equal(
    /transform\s*:[^;]*scale\s*\(/i.test(heroBlock),
    false,
    'El bloque .hero* en home.css no debe utilizar transform: scale() para reducir artificialmente el Hero',
  );

  const baseCss = readCss('base.css');
  const rootAndBodyBlocks = baseCss.split('/* ───────── Botones ───────── */')[0] ?? '';
  assert.equal(
    /transform\s*:[^;]*scale\s*\(/i.test(rootAndBodyBlocks),
    false,
    'html, body y :root en base.css no deben utilizar transform: scale()',
  );
});

test('US1 Regresión: inmutabilidad estricta de base.css, editorial.css, explore.css y secciones inferiores de home.css', () => {
  assert.equal(
    sha256(readCss('base.css')),
    BASE_CSS_SHA256,
    'src/styles/base.css debe permanecer 100 % intacto (--wrap, :root, .section)',
  );
  assert.equal(
    sha256(readCss('editorial.css')),
    EDITORIAL_CSS_SHA256,
    'src/styles/editorial.css debe permanecer 100 % intacto (.aforo-section, .aforo-catalog, .aforo-categories, .aforo-peru-section)',
  );
  assert.equal(
    sha256(readCss('explore.css')),
    EXPLORE_CSS_SHA256,
    'src/styles/explore.css debe permanecer 100 % intacto',
  );

  const homeCss = readCss('home.css');
  const marker = '/* ───────── Carril de próximos eventos (sobre papel) ───────── */';
  const idx = homeCss.indexOf(marker);
  assert.ok(idx > 0, 'home.css debe conservar el bloque de secciones posteriores al Hero');
  const lowerHomeCss = homeCss.slice(idx);
  assert.ok(lowerHomeCss.includes('.closing { background: var(--lime);'));
  assert.ok(lowerHomeCss.includes('.cities { background: var(--orange);'));
});

test('US1 Calibración del Hero: escala tipográfica proporcionada al 100 % y clip-path con margen horizontal seguro', () => {
  const homeCss = readCss('home.css');
  const marker = '/* ───────── Carril de próximos eventos (sobre papel) ───────── */';
  const heroBlock = homeCss.split(marker)[0] ?? '';

  assert.equal(
    heroBlock.includes('12.5rem'),
    false,
    '.hero__title no debe mantener el tope desproporcionado de 12.5rem (200px) al 100 % de zoom',
  );
  assert.ok(
    /clip-path:\s*inset\(\s*-12%\s+-\d+%/.test(heroBlock),
    '@keyframes line-in debe incluir un margen horizontal negativo en clip-path para no recortar "NO SE CUENTA."',
  );
  assert.ok(
    heroBlock.includes('container-type: inline-size'),
    '.hero__inner debe definir container-type: inline-size para escalado fluido contenido',
  );
});

test('US1 Regresión DOM (T011): comparación ANTES vs DESPUÉS en el mismo viewport y nivel de zoom', () => {
  const evidenceDir = path.resolve(
    stylesDir,
    '..',
    '..',
    'specs',
    '001-frontend-proportions-and-ticket-page',
    'evidence',
  );
  const beforePath = path.join(evidenceDir, 'before', 'metrics-before.json');
  const afterPath = path.join(evidenceDir, 'after', 'metrics-after.json');

  assert.ok(fs.existsSync(beforePath), 'Debe existir metrics-before.json');
  assert.ok(fs.existsSync(afterPath), 'Debe existir metrics-after.json');

  const before = JSON.parse(fs.readFileSync(beforePath, 'utf8'));
  const after = JSON.parse(fs.readFileSync(afterPath, 'utf8'));

  const viewports = ['1366x768', '1440x900', '1920x1080', '768x1024', '390x844'];
  const zooms = ['zoom_100', 'zoom_150', 'zoom_200'];

  for (const vp of viewports) {
    for (const zm of zooms) {
      const b = before.viewports[vp]?.[zm];
      const a = after.viewports[vp]?.[zm];
      assert.ok(b && a, `Faltan métricas para ${vp} @ ${zm}`);

      // Mismo viewport exacto
      assert.equal(a.innerWidth, b.innerWidth, `innerWidth debe coincidir en ${vp} @ ${zm}`);
      assert.equal(a.innerHeight, b.innerHeight, `innerHeight debe coincidir en ${vp} @ ${zm}`);

      // Ninguna línea del titular debe sufrir recorte horizontal ni desbordamiento en DESPUÉS
      for (const line of a.heroLines) {
        assert.equal(
          line.clipsRight,
          false,
          `La línea "${line.text}" no debe recortarse a la derecha en ${vp} @ ${zm}`,
        );
        assert.equal(
          line.scrollWidthExceedsClient,
          false,
          `La línea "${line.text}" no debe exceder clientWidth en ${vp} @ ${zm}`,
        );
      }

      // Invariancia de las secciones inferiores (0 px de regresión en ancho, alto, padding y tipografía)
      for (const secKey of ['catalogoHeader', 'categorias', 'peru', 'closing'] as const) {
        assert.deepEqual(
          a.lowerSections[secKey],
          b.lowerSections[secKey],
          `La sección inferior '${secKey}' debe conservar dimensiones idénticas en ${vp} @ ${zm}`,
        );
      }
      assert.equal(
        a.lowerSections.catalogo.width,
        b.lowerSections.catalogo.width,
        `#catalogo debe conservar su ancho exacto en ${vp} @ ${zm}`,
      );
      assert.equal(
        a.lowerSections.catalogo.paddingTop,
        b.lowerSections.catalogo.paddingTop,
        `#catalogo debe conservar su paddingTop exacto en ${vp} @ ${zm}`,
      );
    }
  }

  // En 1366x768, 1440x900 y 1920x1080 al 100% de zoom, el Hero calibrado cabe dentro del alto del viewport
  for (const desktopVp of ['1366x768', '1440x900', '1920x1080']) {
    const a100 = after.viewports[desktopVp].zoom_100;
    const b100 = before.viewports[desktopVp].zoom_100;
    assert.ok(
      a100.hero.height <= a100.innerHeight,
      `El Hero en ${desktopVp} @ 100% (${a100.hero.height}px) debe caber en el alto del viewport (${a100.innerHeight}px)`,
    );
    assert.ok(
      a100.hero.height < b100.hero.height,
      `El Hero en ${desktopVp} @ 100% debe ser más compacto que el estado ANTES`,
    );
  }
});

