import * as u from './util';
import { STUB, Point, Rect } from './types';
import { wideFaces, narrowFaces, Point3d, Quad } from './data';

const assign = STUB;

const SCALE = 6.5;

function flipy(p: Point): Point {
  return { x: p.x, y: -p.y };
}

function strokeRect(d: CanvasRenderingContext2D, r: Rect): void {
  d.strokeRect(r.p.x, r.p.y, r.sz.x, r.sz.y);
}

function moveTo(d: CanvasRenderingContext2D, p: Point): void {
  d.moveTo(p.x, p.y);
}

function lineTo(d: CanvasRenderingContext2D, p: Point): void {
  d.lineTo(p.x, p.y);
}

class App {
  c: HTMLCanvasElement;
  d: CanvasRenderingContext2D;
  wsize: Point;

  t: number = 0;

  constructor() {
    this.c = document.getElementById('c') as HTMLCanvasElement;
    this.d = this.c.getContext('2d') as CanvasRenderingContext2D;
  }

  resize() {
    const { c, d } = this;

    const ratio = devicePixelRatio;

    c.width = innerWidth;
    c.height = innerHeight;

    const ow = innerWidth;
    const oh = innerHeight;

    c.width = ow * ratio;
    c.height = oh * ratio;

    c.style.width = ow + 'px';
    c.style.height = oh + 'px';

    this.wsize = { x: c.width / ratio, y: c.height / ratio };
  }

  render() {
    const { d } = this;
    d.save();
    d.scale(devicePixelRatio, devicePixelRatio);
    this.drawScaled();
    d.restore();
  }

  mathToScreen(p: Point): Point {

    return u.vm2(flipy(p), this.wsize, (p, s) => s / 2 + p * this.wsize.y / SCALE);
  }

  mathDimToScreen(p: Point): Point {
    return u.vm(p, p => p * this.wsize.y / SCALE);
  }

  mathRectToScreen(r: Rect): Rect {
    return { p: this.mathToScreen(r.p), sz: flipy(this.mathDimToScreen(r.sz)) };
  }

  m_strokeRect(d: CanvasRenderingContext2D, r: Rect): void {
    strokeRect(d, this.mathRectToScreen(r));
  }

  m_moveTo(d: CanvasRenderingContext2D, p: Point): void {
    moveTo(d, this.mathToScreen(p));
  }

  m_lineTo(d: CanvasRenderingContext2D, p: Point): void {
    lineTo(d, this.mathToScreen(p));
  }

  drawScaled() {
    const { d, t, wsize } = this;
    d.clearRect(0, 0, wsize.x, wsize.y);

    const level = Math.sin(t * 0.01);

    d.fillText(level + '', 100, 100);
    d.strokeStyle = "#40cfcf";
    d.lineWidth = 0.5;
    [-3, -1, 1].forEach(i => {
      [-3, -1, 1].forEach(j => {
        const mathRect = { p: { x: i, y: j }, sz: { x: 2, y: 2 } };
        this.m_strokeRect(d, mathRect);
      });
    });

    function proj(p: Point3d): Point {
      return { x: p[0] + p[1] * level * 0.05, y: p[2] };
    }

    // if our quad is the four points (A, B, C, D)
    // we are going to draw the parametric surface
    //     P = uvA  + u'vB + uv'C + u'v'D
    // for u ∈ [0,1], v ∈ [0,1]
    // where u' = 1 - u and v' = 1 - v.

    // Assuming we fix some y ∈ [-1,1], what are the x and z values we
    // should draw? Let's say we know u as well, and try to solve for v.
    // y = P₂ = uvA₂  + u'vB₂ + uv'C₂ + u'v'D₂
    // y = v(uA₂  + u'B₂ - uC₂ - u'D₂) + uC₂ + u'D₂
    // v = (y - (uC₂ + u'D₂)) / (uA₂  + u'B₂ - (uC₂ + u'D₂))

    const drawQuad = (face: Quad) => {
      d.strokeStyle = "gray";
      d.lineWidth = 0.5;
      d.beginPath();
      this.m_moveTo(d, proj(face[0]));
      this.m_lineTo(d, proj(face[1]));
      this.m_lineTo(d, proj(face[3]));
      this.m_lineTo(d, proj(face[2]));
      d.closePath();
      d.stroke();

      d.strokeStyle = color;
      d.lineWidth = 1;
      const STEPS = 40;
      d.beginPath();
      let prevPoint = false;
      for (let i = 0; i <= STEPS; i++) {
        const u = i / STEPS;
        const y = level;
        const v = (y - (u * face[2][1] + (1 - u) * face[3][1])) /
          ((u * face[0][1] + (1 - u) * face[1][1])
            - (u * face[2][1] + (1 - u) * face[3][1]));
        if (v < 0 || v > 1) { prevPoint = false; continue; }
        const pt = {
          x: u * v * face[0][0] + (1 - u) * v * face[1][0] +
            u * (1 - v) * face[2][0] + (1 - u) * (1 - v) * face[3][0],
          y: u * v * face[0][2] + (1 - u) * v * face[1][2] +
            u * (1 - v) * face[2][2] + (1 - u) * (1 - v) * face[3][2],
        };
        if (prevPoint)
          this.m_lineTo(d, pt);
        else {
          this.m_moveTo(d, pt); prevPoint = true;
        }
      }
      d.stroke();
    }


    let color = "red";
    wideFaces.forEach(drawQuad);
    color = "blue";
    narrowFaces.forEach(drawQuad);
  }

  step() {
    this.t++;
    this.render();
  }
}

window.onload = () => {
  const app = new App();
  (window as any)['app'] = app;
  window.onresize = () => { app.resize(); app.render(); }
  app.resize();
  app.render();
  window.setInterval(() => app.step(), 50);
}
