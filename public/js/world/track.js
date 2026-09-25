// The flight plan. Journey progress p (0..1, from scrolling) maps to the
// drone's position along the route and to the light, weather and exposure.
// Every column is interpolated with a monotone cubic, so the drone never
// stops, never jerks and never overshoots a keyframe.

// columns: p, z, clearance (m above the smoothed ground), pitch (deg),
//          night (0..1), sun elevation (deg), sun azimuth (deg, 0 = ahead/east,
//          'T' = straight behind the temple), moon elevation (deg),
//          haze, cloud, fog density, exposure, aim at temple (0..1)
const FULL = [
  [0.000, -900, 950, 7, 1, -30, 0, 7, 0, 0, 0.00015, 2.3, 0],
  [0.060, -300, 820, 5, 1, -30, 0, 8, 0, 0, 0.00015, 2.3, 0],
  [0.125, 650, 300, -3, 1, -30, 0, 10, 0, 0, 0.00016, 2.3, 0],
  [0.165, 1350, 120, 0, 1, -30, 0, 12, 0, 0, 0.00017, 2.3, 0],
  [0.255, 2700, 92, 2, 1, -30, 0, 15, 0, 0, 0.00017, 2.3, 0],
  [0.320, 3650, 105, 3, 1, -30, 0, 17, 0, 0, 0.00017, 2.3, 0],
  [0.350, 4150, 420, 10, 1, -30, 0, 18, 0, 0.05, 0.00017, 2.2, 0],
  [0.380, 4750, 1450, 7, 1, -30, 0, 18, 0, 0.55, 0.00017, 2.0, 0],
  [0.402, 5200, 1980, 0, 0.5, 20, 55, 18, 0, 1, 0.00012, 1.1, 0],
  [0.428, 5750, 1900, -4, 0, 22, 55, 18, 0, 0.55, 0.0001, 0.62, 0],
  [0.458, 6450, 950, -9, 0, 22, 56, 18, 0, 0.08, 0.00009, 0.62, 0],
  [0.490, 7100, 110, -3, 0, 23, 58, 18, 0, 0, 0.00009, 0.62, 0],
  [0.560, 8300, 26, 0, 0, 24, 60, 18, 0, 0, 0.00009, 0.62, 0],
  [0.630, 9700, 23, 1, 0, 24, 60, 18, 0, 0, 0.00009, 0.62, 0],
  [0.655, 10300, 40, 2, 0, 24, 60, 18, 0.2, 0, 0.0001, 0.64, 0],
  [0.680, 11000, 80, 2, 0, 18, 45, 18, 0.8, 0, 0.00012, 0.8, 0],
  [0.700, 11500, 90, 1, 0.2, -8, 'T', 22, 1, 0, 0.00018, 1.4, 0],
  [0.725, 12200, 48, 2, 0.12, -6, 'T', 24, 0.3, 0, 0.0002, 1.35, 0.2],
  [0.750, 13000, 26, 3, 0.06, -5, 'T', 24, 0, 0, 0.0002, 1.3, 0.6],
  [0.790, 13760, 14, 5, 0.02, -3.5, 'T', 24, 0, 0, 0.00019, 1.25, 1],
  [0.850, 14010, 11, 6, 0, 0.2, 'T', 24, 0, 0, 0.00017, 1.05, 1],
  [0.905, 14115, 20, 4, 0, 2.6, 'T', 24, 0, 0, 0.00015, 0.95, 1],
  [0.950, 14235, 62, -6, 0, 5, 'T', 24, 0, 0, 0.00013, 0.85, 0.3],
  [1.000, 14700, 150, -7, 0, 9, 'T', 24, 0, 0, 0.00012, 0.8, 0],
];

const WEDDING = [
  [0.000, 11650, 700, 7, 0.6, -12, 'T', 20, 0, 0, 0.00016, 1.6, 0],
  [0.140, 11950, 520, 4, 0.5, -11, 'T', 21, 0, 0, 0.00017, 1.55, 0],
  [0.260, 12350, 140, 1, 0.3, -8, 'T', 22, 0, 0, 0.00019, 1.45, 0.2],
  [0.340, 13000, 30, 3, 0.1, -6, 'T', 24, 0, 0, 0.0002, 1.35, 0.6],
  [0.430, 13760, 14, 5, 0.02, -3.5, 'T', 24, 0, 0, 0.00019, 1.25, 1],
  [0.610, 14010, 11, 6, 0, 0.2, 'T', 24, 0, 0, 0.00017, 1.05, 1],
  [0.760, 14115, 20, 4, 0, 2.6, 'T', 24, 0, 0, 0.00015, 0.95, 1],
  [0.900, 14235, 62, -6, 0, 5, 'T', 24, 0, 0, 0.00013, 0.85, 0.3],
  [1.000, 14700, 150, -7, 0, 9, 'T', 24, 0, 0, 0.00012, 0.8, 0],
];

// Captions: [id, in, out] in journey progress; lines inside a caption appear
// one after another between `in` and `lines` end.
export const CAPTIONS = {
  full: {
    screens: 19,
    list: [
      ['invite', 0.012, 0.08, 0],
      ['story', 0.085, 0.125, 0],
      ['sangeeth', 0.14, 0.2, 0],
      ['sg-details', 0.205, 0.32, 0.075],
      ['trans-1', 0.335, 0.375, 0],
      ['haldi', 0.42, 0.48, 0],
      ['hd-details', 0.485, 0.6, 0.065],
      ['trans-2', 0.615, 0.66, 0],
      ['wedding', 0.68, 0.73, 0],
      ['wd-details', 0.735, 0.875, 0.12],
      ['hyderabad', 0.905, 0.99, 0],
    ],
    // the three timeline lines; 7:54 lands as the sun meets the horizon
    lineAt: { 'wd-details': [0.745, 0.79, 0.83, 0.85] },
    dots: { invite: 0.04, story: 0.105, sangeeth: 0.165, haldi: 0.445, wedding: 0.7, venue: 0.94 },
    // journey progress -> 3D flight progress (the flight plan predates the
    // Hyderabad chapter, so it is stretched to fit)
    remap: [[0, 0], [0.14, 0.15], [0.335, 0.352], [0.42, 0.46], [0.615, 0.66], [0.68, 0.715], [0.79, 0.85], [0.875, 0.945], [1, 1]],
  },
  wedding: {
    screens: 10,
    list: [
      ['invite', 0.02, 0.14, 0],
      ['story', 0.145, 0.23, 0],
      ['wedding', 0.26, 0.35, 0],
      ['wd-details', 0.36, 0.74, 0.2],
      ['hyderabad', 0.8, 0.985, 0],
    ],
    lineAt: { 'wd-details': [0.38, 0.54, 0.64, 0.68] },
    dots: { invite: 0.06, story: 0.19, wedding: 0.3, venue: 0.86 },
    remap: [[0, 0], [0.26, 0.28], [0.54, 0.61], [0.74, 0.9], [1, 1]],
  },
};

export function remapP(kind, p) {
  const r = CAPTIONS[kind].remap;
  for (let i = 0; i < r.length - 1; i++) {
    if (p <= r[i + 1][0]) {
      const t = (p - r[i][0]) / (r[i + 1][0] - r[i][0]);
      return r[i][1] + (r[i + 1][1] - r[i][1]) * t;
    }
  }
  return 1;
}

// Fritsch-Carlson monotone cubic
function monotone(xs, ys) {
  const n = xs.length;
  const d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

const COLS = ['z', 'clr', 'pitch', 'night', 'sunE', 'sunAz', 'moonE', 'haze', 'cloud', 'fog', 'exp', 'aim'];

export function makeTrack(kind, templeAz) {
  const rows = kind === 'wedding' ? WEDDING : FULL;
  const xs = rows.map((r) => r[0]);
  const fns = {};
  COLS.forEach((c, i) => {
    const ys = rows.map((r) => (r[i + 1] === 'T' ? templeAz : r[i + 1]));
    fns[c] = monotone(xs, ys);
  });
  // sun azimuth jumps from the desert to the coast inside the haze; keep it
  // from sweeping across the sky by interpolating it separately
  return (p) => {
    const o = {};
    for (const c of COLS) o[c] = fns[c](p);
    return o;
  };
}
