// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// MULTI-COLOR-SPACE CONVERSIONS (HSV, HWB, OKLCH)

// === INTERNAL HELPERS ===

function computeRgbHueUnit(r, g, b, max, d) {
  if (d === 0) return 0;
  let h;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
      break;
  }
  return h / 6;
}

function hsvToUnitRgb(h, s, v) {
  const wrappedH = (((h % 1) + 1) % 1);
  const i = Math.floor(wrappedH * 6);
  const f = wrappedH * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: return [v, t, p];
    case 1: return [q, v, p];
    case 2: return [p, v, t];
    case 3: return [p, q, v];
    case 4: return [t, p, v];
    default: return [v, p, q];
  }
}

// === HSV (h in [0, 1), s in [0, 1], v in [0, 1]) ===

function convertRgbColorVectorToHsvColorVector(rgbColorVector) {
  const r = rgbColorVector[0] / 255;
  const g = rgbColorVector[1] / 255;
  const b = rgbColorVector[2] / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  const h = computeRgbHueUnit(r, g, b, max, d);
  const s = max === 0 ? 0 : d / max;
  const v = max;

  return [h, s, v];
}

function convertRgbColorToHsvColorVector(rgbColor) {
  return convertRgbColorVectorToHsvColorVector(convertRgbColorToRgbColorVector(rgbColor));
}

function convertHsvColorVectorToRgbColorVector(hsvColorVector) {
  const h = hsvColorVector[0];
  const s = clamp(hsvColorVector[1], 0, 1);
  const v = clamp(hsvColorVector[2], 0, 1);

  const [r, g, b] = hsvToUnitRgb(h, s, v);
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// === HWB (h in [0, 1), w in [0, 1], b in [0, 1]; CSS Color 4) ===

function convertRgbColorVectorToHwbColorVector(rgbColorVector) {
  const r = rgbColorVector[0] / 255;
  const g = rgbColorVector[1] / 255;
  const b = rgbColorVector[2] / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  const h = computeRgbHueUnit(r, g, b, max, d);
  const w = min;
  const bl = 1 - max;

  return [h, w, bl];
}

function convertRgbColorToHwbColorVector(rgbColor) {
  return convertRgbColorVectorToHwbColorVector(convertRgbColorToRgbColorVector(rgbColor));
}

function convertHwbColorVectorToRgbColorVector(hwbColorVector) {
  const h = hwbColorVector[0];
  const w = clamp(hwbColorVector[1], 0, 1);
  const b = clamp(hwbColorVector[2], 0, 1);

  if (w + b >= 1) {
    const gray = Math.round((w / (w + b)) * 255);
    return [gray, gray, gray];
  }

  const [pr, pg, pb] = hsvToUnitRgb(h, 1, 1);
  const factor = 1 - w - b;
  return [
    Math.round((pr * factor + w) * 255),
    Math.round((pg * factor + w) * 255),
    Math.round((pb * factor + w) * 255),
  ];
}

// === OKLCH (L in [0, 1], C >= 0, H in [0, 360); Björn Ottosson / CSS Color 4) ===

function gamSrgb(linearRgb) {
  return linearRgb.map((val) => {
    const sign = val < 0 ? -1 : 1;
    const abs = Math.abs(val);
    if (abs <= 0.0031308) {
      return 12.92 * val;
    }
    return sign * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055);
  });
}

function linearSrgbToOklab(linearRgb) {
  const [r, g, b] = linearRgb;

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return [
    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  ];
}

function oklabToLinearSrgb(oklab) {
  const [L, a, b] = oklab;

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}

function oklchToLinearSrgb(L, C, H) {
  const rad = (H * Math.PI) / 180;
  return oklabToLinearSrgb([L, C * Math.cos(rad), C * Math.sin(rad)]);
}

function isInLinearSrgbGamut(linearRgb) {
  const eps = 1e-6;
  return (
    linearRgb[0] >= -eps && linearRgb[0] <= 1 + eps &&
    linearRgb[1] >= -eps && linearRgb[1] <= 1 + eps &&
    linearRgb[2] >= -eps && linearRgb[2] <= 1 + eps
  );
}

function convertRgbColorVectorToOklchColorVector(rgbColorVector) {
  const linear = linSrgb(rgbColorVector.map((c) => c / 255));
  const [L, a, b] = linearSrgbToOklab(linear);
  const C = Math.sqrt(a * a + b * b);

  if (C < 1e-7) {
    return [clamp(L, 0, 1), 0, 0];
  }

  let H = (Math.atan2(b, a) * 180) / Math.PI;
  if (H < 0) H += 360;

  return [clamp(L, 0, 1), C, H];
}

function convertRgbColorToOklchColorVector(rgbColor) {
  return convertRgbColorVectorToOklchColorVector(convertRgbColorToRgbColorVector(rgbColor));
}

function convertOklchColorVectorToRgbColorVector(oklchColorVector) {
  const L = clamp(oklchColorVector[0], 0, 1);
  const C = Math.max(0, oklchColorVector[1]);
  const H = (((oklchColorVector[2] % 360) + 360) % 360);

  if (L <= 0) return [0, 0, 0];
  if (L >= 1) return [255, 255, 255];

  let linear = oklchToLinearSrgb(L, C, H);

  // CSS Color 4 gamut mapping: reduce chroma via binary search while preserving L and H
  if (!isInLinearSrgbGamut(linear)) {
    let lo = 0;
    let hi = C;
    for (let i = 0; i < 16; i++) {
      const mid = (lo + hi) / 2;
      if (isInLinearSrgbGamut(oklchToLinearSrgb(L, mid, H))) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    linear = oklchToLinearSrgb(L, lo, H);
  }

  const clampedLinear = linear.map((c) => clamp(c, 0, 1));
  const srgb = gamSrgb(clampedLinear);
  return srgb.map((c) => Math.round(clamp(c, 0, 1) * 255));
}
