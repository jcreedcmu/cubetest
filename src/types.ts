export type Dict<T> = { [k: string]: T };
export type Point = { x: number, y: number };
export type Color = { r: number, g: number, b: number };
export type BadRect = { p: Point, w: number, h: number };
export type Rect = { p: Point, sz: Point };
export type Ctx = CanvasRenderingContext2D;
export const STUB = "stub";
