type Vector = [number, number];

// const hullPadding = 60;

const vecScale = function (scale: number, v: Vector) {
  // Returns the vector 'v' scaled by 'scale'.
  return [scale * v[0], scale * v[1]] as Vector;
};

const vecSum = function (pv1: Vector, pv2: Vector) {
  // Returns the sum of two vectors, or a combination of a point and a vector.
  return [pv1[0] + pv2[0], pv1[1] + pv2[1]] as Vector;
};

const unitNormal = function (p0: Vector, p1: Vector) {
  // Returns the unit normal to the line segment from p0 to p1.
  const n = [p0[1] - p1[1], p1[0] - p0[0]];
  const nLength = Math.sqrt(n[0] * n[0] + n[1] * n[1]);
  return [n[0] / nLength, n[1] / nLength] as Vector;
};

export const roundedHull = function (
  polyPoints: Vector[],
  hullPadding: number
) {
  // Returns the SVG path data string representing the polygon, expanded and rounded.

  // Handle special cases
  if (!polyPoints || polyPoints.length < 1) return "";
  if (polyPoints.length === 1) return roundedHull1(polyPoints, hullPadding);
  if (polyPoints.length === 2) return roundedHull2(polyPoints, hullPadding);

  let segments = new Array(polyPoints.length);

  // Calculate each offset (outwards) segment of the convex hull.
  for (let segmentIndex = 0; segmentIndex < segments.length; ++segmentIndex) {
    const p0 =
      segmentIndex === 0
        ? polyPoints[polyPoints.length - 1]
        : polyPoints[segmentIndex - 1];
    const p1 = polyPoints[segmentIndex];

    // Compute the offset vector for the line segment, with length = hullPadding.
    const offset = vecScale(hullPadding, unitNormal(p0, p1));

    segments[segmentIndex] = [vecSum(p0, offset), vecSum(p1, offset)];
  }

  const arcData = "A " + [hullPadding, hullPadding, "0,0,0,"].join(",");

  segments = segments.map(function (segment, index) {
    let pathFragment = "";
    if (index === 0) {
      pathFragment = "M " + segments[segments.length - 1][1] + " ";
    }
    pathFragment += arcData + segment[0] + " L " + segment[1];

    return pathFragment;
  });

  return segments.join(" ");
};

const roundedHull1 = function (polyPoints: Vector[], hullPadding: number) {
  // Returns the path for a rounded hull around a single point (a circle).

  const p1 = [polyPoints[0][0], polyPoints[0][1] - hullPadding];
  const p2 = [polyPoints[0][0], polyPoints[0][1] + hullPadding];

  return (
    "M " +
    p1 +
    " A " +
    [hullPadding, hullPadding, "0,0,0", p2].join(",") +
    " A " +
    [hullPadding, hullPadding, "0,0,0", p1].join(",")
  );
};

const roundedHull2 = function (polyPoints: Vector[], hullPadding: number) {
  // Returns the path for a rounded hull around two points (a "capsule" shape).

  const offsetVector = vecScale(
    hullPadding,
    unitNormal(polyPoints[0], polyPoints[1])
  );
  const invOffsetVector = vecScale(-1, offsetVector);

  const p0 = vecSum(polyPoints[0], offsetVector);
  const p1 = vecSum(polyPoints[1], offsetVector);
  const p2 = vecSum(polyPoints[1], invOffsetVector);
  const p3 = vecSum(polyPoints[0], invOffsetVector);

  return (
    "M " +
    p0 +
    " L " +
    p1 +
    " A " +
    [hullPadding, hullPadding, "0,0,0", p2].join(",") +
    " L " +
    p3 +
    " A " +
    [hullPadding, hullPadding, "0,0,0", p0].join(",")
  );
};
