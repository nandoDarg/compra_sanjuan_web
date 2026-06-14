import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const BRAND_TEAL = '#2F6C5D';
const BRAND_ORANGE = '#ED8436';
const ICON_VIEWBOX = { x: 107, y: 215, width: 257, height: 242 };
const ICON_RADIUS = Number((ICON_VIEWBOX.width * 0.15).toFixed(2));

type SizeSpec = {
  width: number;
  height: number;
};

type TargetSpec = {
  output: string;
  kind: 'square-png' | 'ico' | 'og-image';
  size?: number;
  width?: number;
  height?: number;
};

const STANDARD_TARGETS: TargetSpec[] = [
  { output: 'favicon.ico', kind: 'ico', size: 32 },
  { output: 'favicon-16x16.png', kind: 'square-png', size: 16 },
  { output: 'favicon-32x32.png', kind: 'square-png', size: 32 },
  { output: 'android-chrome-192x192.png', kind: 'square-png', size: 192 },
  { output: 'android-chrome-512x512.png', kind: 'square-png', size: 512 },
  { output: 'apple-touch-icon.png', kind: 'square-png', size: 180 },
  { output: 'og-image.png', kind: 'og-image', width: 1200, height: 630 },
];

const ICON_RELATED_PATTERN = /(favicon|icon|apple-touch|android-chrome|mstile|og-image)/i;

function extractFirstPathD(svg: string): string {
  const pathTagMatch = svg.match(/<path\b[^>]*>/i);
  if (!pathTagMatch) {
    throw new Error('No se encontro ningun <path> en public/logo-navbar.svg');
  }

  const tag = pathTagMatch[0];
  const dMatch = tag.match(/\sd="([^"]+)"/) ?? tag.match(/\sd='([^']+)'/);
  if (!dMatch) {
    throw new Error('No se encontro el atributo d del primer path en public/logo-navbar.svg');
  }

  return dMatch[1].trim();
}

function extractHandshakePath(firstPathD: string): string {
  const marker = 'ZM';
  const markerIndex = firstPathD.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error('No se encontro el separador esperado "ZM" para aislar el icono de manos');
  }

  return firstPathD.slice(markerIndex + 1).trim();
}

function buildIconSvg(handshakePathD: string): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${ICON_VIEWBOX.x} ${ICON_VIEWBOX.y} ${ICON_VIEWBOX.width} ${ICON_VIEWBOX.height}">`,
    `<rect x="${ICON_VIEWBOX.x}" y="${ICON_VIEWBOX.y}" width="${ICON_VIEWBOX.width}" height="${ICON_VIEWBOX.height}" rx="${ICON_RADIUS}" fill="${BRAND_TEAL}"/>`,
    `<path fill="${BRAND_ORANGE}" d="${handshakePathD}"/>`,
    '</svg>',
  ].join('');
}

async function renderSquarePng(iconSvg: string, size: number): Promise<Buffer> {
  return sharp(Buffer.from(iconSvg))
    .resize(size, size, { fit: 'contain', background: BRAND_TEAL })
    .png()
    .toBuffer();
}

async function renderOgImage(iconSvg: string, width: number, height: number): Promise<Buffer> {
  const padding = Math.round(Math.min(width, height) * 0.17);
  const iconSize = Math.min(width, height) - padding * 2;
  const iconBuffer = await sharp(Buffer.from(iconSvg))
    .resize(iconSize, iconSize, { fit: 'contain', background: BRAND_TEAL })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: BRAND_TEAL,
    },
  })
    .composite([
      {
        input: iconBuffer,
        left: Math.floor((width - iconSize) / 2),
        top: Math.floor((height - iconSize) / 2),
      },
    ])
    .png()
    .toBuffer();
}

function parseSizeFromFileName(fileName: string): SizeSpec | null {
  if (/og-image/i.test(fileName)) {
    return { width: 1200, height: 630 };
  }
  if (/apple-touch-icon/i.test(fileName)) {
    return { width: 180, height: 180 };
  }

  const sizeMatch = fileName.match(/(\d+)x(\d+)/i);
  if (sizeMatch) {
    const width = Number(sizeMatch[1]);
    const height = Number(sizeMatch[2]);
    if (Number.isFinite(width) && Number.isFinite(height)) {
      return { width, height };
    }
  }

  if (/\.ico$/i.test(fileName)) {
    return { width: 32, height: 32 };
  }

  if (/favicon/i.test(fileName)) {
    return { width: 32, height: 32 };
  }

  return null;
}

function dedupeTargets(targets: TargetSpec[]): TargetSpec[] {
  const map = new Map<string, TargetSpec>();
  for (const target of targets) {
    map.set(target.output, target);
  }
  return [...map.values()];
}

async function collectDynamicTargets(publicDir: string): Promise<TargetSpec[]> {
  const entries = await fs.readdir(publicDir, { withFileTypes: true });
  const targets: TargetSpec[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    const name = entry.name;
    const isPngOrIco = /\.(png|ico)$/i.test(name);
    if (!isPngOrIco || !ICON_RELATED_PATTERN.test(name)) {
      continue;
    }

    const size = parseSizeFromFileName(name);
    if (!size) {
      continue;
    }

    if (/\.ico$/i.test(name)) {
      targets.push({ output: name, kind: 'ico', size: size.width });
      continue;
    }

    if (/og-image/i.test(name)) {
      targets.push({ output: name, kind: 'og-image', width: size.width, height: size.height });
      continue;
    }

    if (size.width === size.height) {
      targets.push({ output: name, kind: 'square-png', size: size.width });
    }
  }

  return targets;
}

async function writeTarget(publicDir: string, iconSvg: string, target: TargetSpec): Promise<void> {
  const outputPath = path.join(publicDir, target.output);

  if (target.kind === 'square-png') {
    const size = target.size ?? 32;
    const buffer = await renderSquarePng(iconSvg, size);
    await fs.writeFile(outputPath, buffer);
    console.log(`OVERWROTE ${target.output} ${size}x${size}`);
    return;
  }

  if (target.kind === 'ico') {
    const size = target.size ?? 32;
    const pngBuffer = await renderSquarePng(iconSvg, size);
    const icoBuffer = await pngToIco(pngBuffer);
    await fs.writeFile(outputPath, icoBuffer);
    console.log(`OVERWROTE ${target.output} ${size}x${size}`);
    return;
  }

  const width = target.width ?? 1200;
  const height = target.height ?? 630;
  const buffer = await renderOgImage(iconSvg, width, height);
  await fs.writeFile(outputPath, buffer);
  console.log(`OVERWROTE ${target.output} ${width}x${height}`);
}

async function main(): Promise<void> {
  const rootDir = process.cwd();
  const publicDir = path.join(rootDir, 'public');
  const logoPath = path.join(publicDir, 'logo-navbar.svg');
  const iconSvgPath = path.join(publicDir, 'icon.svg');

  const logoSvg = await fs.readFile(logoPath, 'utf8');
  const firstPathD = extractFirstPathD(logoSvg);
  const handshakePathD = extractHandshakePath(firstPathD);
  const iconSvg = buildIconSvg(handshakePathD);

  await fs.writeFile(iconSvgPath, iconSvg, 'utf8');
  console.log('OVERWROTE icon.svg vector');

  const discoveredTargets = await collectDynamicTargets(publicDir);
  const targets = dedupeTargets([...STANDARD_TARGETS, ...discoveredTargets]);

  for (const target of targets) {
    await writeTarget(publicDir, iconSvg, target);
  }
}

main().catch((error) => {
  console.error('[generate-icons] Error:', error);
  process.exitCode = 1;
});