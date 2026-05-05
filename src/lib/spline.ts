export interface HscScaledAnchor {
  hscHalf: number;
  scaled: number;
}

export function buildMonotoneSpline(anchors: HscScaledAnchor[]): (hscHalf: number) => number {
  const n = anchors.length;
  const xs = anchors.map((a) => a.hscHalf);
  const ys = anchors.map((a) => a.scaled);

  const delta = new Array(n - 1);
  for (let i = 0; i < n - 1; i++) {
    const dx = xs[i + 1] - xs[i];
    delta[i] = dx !== 0 ? (ys[i + 1] - ys[i]) / dx : 0;
  }

  const m = new Array(n);
  for (let i = 1; i < n - 1; i++) {
    if (delta[i - 1] * delta[i] <= 0) {
      m[i] = 0;
    } else {
      const w1 = 2 * delta[i] + delta[i - 1];
      const w2 = delta[i] + 2 * delta[i - 1];
      m[i] = (w1 + w2) / (w1 / delta[i - 1] + w2 / delta[i]);
    }
  }
  m[0] = delta[0];
  m[n - 1] = delta[n - 2];

  return (hscHalf: number) => {
    if (hscHalf <= xs[0]) return ys[0];
    for (let i = 0; i < n - 1; i++) {
      if (hscHalf >= xs[i] && hscHalf <= xs[i + 1]) {
        const h = xs[i + 1] - xs[i];
        if (h === 0) return ys[i]; // collapsed segment
        const t = (hscHalf - xs[i]) / h;
        const t2 = t * t;
        const t3 = t2 * t;
        const h00 = 2 * t3 - 3 * t2 + 1;
        const h10 = t3 - 2 * t2 + t;
        const h01 = -2 * t3 + 3 * t2;
        const h11 = t3 - t2;
        return h00 * ys[i] + h10 * h * m[i] + h01 * ys[i + 1] + h11 * h * m[i + 1];
      }
    }
    return ys[n - 1];
  };
}
