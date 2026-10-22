// Kelvin's raster artwork uses the same textured sprite treatment as the crew.
// Sheet order: south/west/east/north, each idle + two steps, then four seats.
// Keep the public builder and row mapping so portraits, chat, holiday hats and
// every office pose all use this one design. Routing remains in office-life.js.
let artwork;
function loadArtwork() {
  if (!artwork) artwork = new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => { artwork = null; reject(new Error('Kelvin artwork could not load.')); };
    image.src = '/assets/kelvin-sprites.png';
  });
  return artwork;
}

export async function buildKelvin(row) {
  const atlas = await loadArtwork();
  const probe = document.createElement('canvas');
  probe.width = atlas.width; probe.height = atlas.height;
  const context = probe.getContext('2d', { willReadFrequently: true });
  context.drawImage(atlas, 0, 0);
  const { data } = context.getImageData(0, 0, atlas.width, atlas.height);
  const frames = Array.from({ length: 16 }, (_, index) => {
    const col = index % 4, gridRow = Math.floor(index / 4);
    const left = Math.round(col * atlas.width / 4), right = Math.round((col + 1) * atlas.width / 4);
    const top = Math.round(gridRow * atlas.height / 4), bottom = Math.round((gridRow + 1) * atlas.height / 4);
    let x0 = right, y0 = bottom, x1 = left, y1 = top;
    for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) {
      if (data[(y * atlas.width + x) * 4 + 3] < 32) continue;
      x0 = Math.min(x0, x); y0 = Math.min(y0, y);
      x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
    if (x1 < x0 || y1 < y0) throw new Error(`Kelvin pose ${index} is empty.`);
    // Retain a transparent edge for antialiasing without neighboring poses.
    x0 = Math.max(left, x0 - 2); y0 = Math.max(top, y0 - 2);
    x1 = Math.min(right - 1, x1 + 2); y1 = Math.min(bottom - 1, y1 + 2);
    return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  });
  // One scale per pose family avoids breathing/jitter as walking frames change.
  // drawFrame keeps the shared y=125 foot anchor and existing desk masks.
  const stand = frames.slice(0, 12), sit = frames.slice(12);
  for (const [poses, maxHeight, maxWidth] of [[stand, 120, 90], [sit, 98, 82]]) {
    const scale = Math.min(maxHeight / Math.max(...poses.map(f => f.h)), maxWidth / Math.max(...poses.map(f => f.w)));
    for (const frame of poses) frame.scale = scale;
  }
  return { stand: { atlas, rows: { [row]: stand } }, sit: { atlas, rows: { [row]: sit } } };
}
