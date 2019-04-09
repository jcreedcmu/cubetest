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

    const level = Math.sin(t * 0.1);

    d.strokeStyle = "#40cfcf";
    d.lineWidth = 0.5;
    [-3, -1, 1].forEach(i => {
      [-3, -1, 1].forEach(j => {
        const mathRect = { p: { x: i, y: j }, sz: { x: 2, y: 2 } };
        this.m_strokeRect(d, mathRect);
      });
    });

    function proj(p: Point3d): Point {
      return { x: p[0] + p[1] * level * 0.5, y: p[2] };
    }

    d.strokeStyle = "black";
    d.lineWidth = 0.5;

    wideFaces.forEach((face, i) => {
      if (1) {
        d.beginPath();
        this.m_moveTo(d, proj(face[0]));
        this.m_lineTo(d, proj(face[1]));
        this.m_lineTo(d, proj(face[3]));
        this.m_lineTo(d, proj(face[2]));
        d.closePath();
        d.stroke();
      }
    });

    narrowFaces.forEach((face, i) => {
      if (1) {
        d.beginPath();
        this.m_moveTo(d, proj(face[0]));
        this.m_lineTo(d, proj(face[1]));
        this.m_lineTo(d, proj(face[3]));
        this.m_lineTo(d, proj(face[2]));
        d.closePath();
        d.stroke();
      }
    });

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
