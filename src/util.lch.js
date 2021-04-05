// Borrowing code from css.land/lch; full credits to Lea Verou and Chris Lilley, since I have no
//   idea what I'm doing and they obviously know their stuff!
function convertRgbColorVectorToLchColorVector(rgbColorVector) {
    rgbColorVector = rgbColorVector.map(t => t / 255); // convert to 0.0 to 1.0 form

    return labToLch(xyzToLab(d65ToD50(linSrgbToXyz(linSrgb(rgbColorVector)))));
}

// Lea Verou's routine for converting an array of sRGB values in the range 0.0 - 1.0 to linear
//   light (un-companded) form, per https://en.wikipedia.org/wiki/SRGB.
function linSrgb(RGB) {
    return RGB.map(function (val) {
        let sign = val < 0 ? -1 : 1;
        let abs = Math.abs(val);

        if (abs < 0.04045) {
            return val / 12.92;
        }

        return sign * (Math.pow((abs + 0.055) / 1.055, 2.4));
    });
}

// Lea Verou's routine for converting an array of linear-light sRGB values to CIE XYZ using sRGB's
//   own white, D65 (no chromatic adaptation).
function linSrgbToXyz(rgb) {
    var M = [
        [0.41239079926595934, 0.357584339383878, 0.1804807884018343],
        [0.21263900587151027, 0.715168678767756, 0.07219231536073371],
        [0.01933081871559182, 0.11919477979462598, 0.9505321522496607]
    ];
    return multiplyMatrices(M, rgb);
}

// Lea Verou's routine for Bradford chromatic adaptation from D65 to D50. The matrix below is the
//   result of three operations:
//   - convert from XYZ to retinal cone domain
//   - scale components from one reference white to another
//   - convert back to XYZ
//   Context: http://www.brucelindbloom.com/index.html?Eqn_ChromAdapt.html
function d65ToD50(XYZ) {

    var M = [
        [1.0478112, 0.0228866, -0.0501270],
        [0.0295424, 0.9904844, -0.0170491],
        [-0.0092345, 0.0150436, 0.7521316]
    ];

    return multiplyMatrices(M, XYZ);
}

// Lea Verou's routine for covertinig CIE XYZ to CIE Lab.
function xyzToLab(XYZ) {
    // Assuming XYZ is relative to D50, convert to CIE Lab from CIE standard, which now defines\
    //   these as a rational fraction.
    var ε = 216 / 24389; // 6^3/29^3
    var κ = 24389 / 27;  // 29^3/3^3
    var white = [0.96422, 1.00000, 0.82521]; // D50 reference white

    // Compute xyz, which is XYZ scaled relative to reference white
    var xyz = XYZ.map((value, i) => value / white[i]);

    // Now compute f
    var f = xyz.map(value => value > ε ? Math.cbrt(value) : (κ * value + 16) / 116);

    return [
        (116 * f[1]) - 16, 	 // L
        500 * (f[0] - f[1]), // a
        200 * (f[1] - f[2])  // b
    ];
}

// Lea Verou's routine for covertinig CIE Lab to Lch.
function labToLch(Lab) {
    // Convert to polar form
    var hue = Math.atan2(Lab[2], Lab[1]) * 180 / Math.PI;
    return [
        Lab[0], // L is still L
        Math.sqrt(Math.pow(Lab[1], 2) + Math.pow(Lab[2], 2)), // Chroma
        hue >= 0 ? hue : hue + 360 // Hue, in degrees [0 to 360)
    ];
}

// Lea Verou's MIT-licensed, handy matrix multiplication routine. No error handling for
//   incompatible dimensions! A is m x n. B is n x p. product is m x p.
function multiplyMatrices(A, B) {
    let m = A.length;

    if (!Array.isArray(A[0])) {
        // A is vector, convert to [[a, b, c, ...]]
        A = [A];
    }

    if (!Array.isArray(B[0])) {
        // B is vector, convert to [[a], [b], [c], ...]]
        B = B.map(x => [x]);
    }

    let p = B[0].length;
    let B_cols = B[0].map((_, i) => B.map(x => x[i])); // transpose B
    let product = A.map(row => B_cols.map(col => {
        if (!Array.isArray(row)) {
            return col.reduce((a, c) => a + c * row, 0);
        }

        return row.reduce((a, c, i) => a + c * (col[i] || 0), 0);
    }));

    if (m === 1) {
        product = product[0]; // Avoid [[a, b, c, ...]]
    }

    if (p === 1) {
        return product.map(x => x[0]); // Avoid [[a], [b], [c], ...]]
    }

    return product;
}