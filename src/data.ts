const K = 1.25; // bigger K = face-centered vertices get farther from face
const ALPHA = 0.25; // bigger ALPHA = vertices on edges get farther from true vertices

function without<T>(ar: T[], x: T) {
  return ar.filter(y => y != x);
}

export type Point3d = [number, number, number];

export type Quad = [Point3d, Point3d, Point3d, Point3d];

type FlagCb<T> = (
  d1: Dim, i1: number,
  d2: Dim, i2: number,
  d3: Dim, i3: number
) => T;

type _ForEdgeCb<T> = (
  d1: Dim, d2: Dim, d3: Dim,
  i2: number, i3: number
) => T;

type ForEdgeCb<T> = (src: Point3d, dst: Point3d) => T;

function maybePush<T>(v: T[], f: () => T) {
  try {
    v.push(f())
  }
  catch (e) {
    if (e != "cancel")
      throw e;
  }
}

type Dim = number;
function forFaceVertexPair<T>(f: FlagCb<T>): T[] {
  const rv: T[] = [];
  [0, 1, 2].forEach(d1 => { //  choice of face direction
    [-1, 1].forEach(i1 => { // choice of face side
      without([0, 1, 2], d1).forEach(d2 => { // vertex dimension 1
        [0, 1, 2].filter(y => y > d2 && y != d1).forEach(d3 => { // vertex dimension 2
          [-1, 1].forEach(i2 => {
            [-1, 1].forEach(i3 => {
              maybePush(rv, () => f(d1, i1, d2, i2, d3, i3));
            });
          });
        });
      });
    });
  });
  return rv;
}

function _forEdge<T>(f: _ForEdgeCb<T>): T[] {
  const rv: T[] = [];
  [0, 1, 2].forEach(d1 => {
    without([0, 1, 2], d1).forEach(d2 => {
      [0, 1, 2].filter(y => y > d2 && y != d1).forEach(d3 => {
        [-1, 1].forEach(i2 => {
          [-1, 1].forEach(i3 => {
            maybePush(rv, () => f(d1, d2, d3, i2, i3));
          });
        });
      });
    });
  });
  return rv;
}

function forEdge<T>(f: ForEdgeCb<T>): T[] {
  return _forEdge((d1, d2, d3, i2, i3) => {
    const src: Point3d = [0, 0, 0];
    const dst: Point3d = [0, 0, 0];
    src[d1] = -1;
    dst[d1] = 1;
    src[d2] = i2;
    src[d3] = i3;
    dst[d2] = i2;
    dst[d3] = i3;
    return f(src, dst);
  });
}

function forFlag<T>(f: FlagCb<T>): T[] {
  const rv: T[] = [];
  [0, 1, 2].forEach(d1 => { //  choice of face direction
    [-1, 1].forEach(i1 => { // choice of face side
      without([0, 1, 2], d1).forEach(d2 => { // choice of edge direction
        [-1, 1].forEach(i2 => { // choice of edge side
          without(without([0, 1, 2], d1), d2).forEach(d3 => { // vertex remaining direction
            [-1, 1].forEach(i3 => { // choice of vertex side
              maybePush(rv, () => f(d1, i1, d2, i2, d3, i3));
            });
          });
        });
      });
    });
  });
  return rv;
}

function lerp1(a: number, b: number, t: number): number {
  return a * (1 - t) + b * t;
}

function lerp(a: Point3d, b: Point3d, t: number) {
  return a.map((x, i) => lerp1(a[i], b[i], t));
}

function dmap(f: (x: number) => number): Point3d {
  return [f(0), f(1), f(2)];
}

function lerp22(pts: Quad, i: number, j: number): Point3d {
  return dmap(d => {
    return pts[0][d] * i * j + pts[1][d] * (1 - i) * j +
      pts[2][d] * i * (1 - j) + pts[3][d] * (1 - i) * (1 - j);
  });
}

function mkWideFaces(): Quad[] {
  return _forEdge<Quad>((d1, d2, d3, i2, i3) => {
    const pts: Quad = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];
    // [[-1, -1, -1 + 2 * ALPHA],
    // [0, -1 + K * ALPHA, 0],
    // [-1 + K * ALPHA, 0, 0],
    // [-1, -1, 1 - 2 * ALPHA]]
    // in this case d1 = 2
    pts[0][d1] = -(1 - 2 * ALPHA);
    pts[0][d2] = i2;
    pts[0][d3] = i3;

    pts[1][d2] = i2 * (1 - K * ALPHA);

    pts[2][d3] = i3 * (1 - K * ALPHA);

    pts[3][d1] = 1 - 2 * ALPHA;
    pts[3][d2] = i2;
    pts[3][d3] = i3;

    return pts;
  });
}

function mkNarrowFaces(): Quad[] {
  return forFaceVertexPair<Quad>((d1, i1, d2, i2, d3, i3) => {
    //    if (i1 == -1) throw "cancel";
    const pts: Quad = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];

    pts[0][d1] = i1;
    pts[0][d2] = i2;
    pts[0][d3] = i3 * (1 - 2 * ALPHA);

    pts[1][d1] = i1 * (1 - K * ALPHA);

    pts[2][d1] = i1 * (1 + K * ALPHA);

    pts[3][d1] = i1;
    pts[3][d2] = i2 * (1 - 2 * ALPHA);
    pts[3][d3] = i3;

    return pts;
  });
}

export const wideFaces = mkWideFaces();
export const narrowFaces = mkNarrowFaces();
