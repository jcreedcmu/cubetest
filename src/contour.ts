import * as u from './util';
import { STUB, Point } from './types';
const assign = STUB;

class App {
  c: HTMLCanvasElement;
  d: CanvasRenderingContext2D;
  wsize: Point;

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

  drawScaled() {
    const { d } = this;
    d.fillStyle = "red";
    d.fillRect(100, 100, 100, 100);
  }
}
