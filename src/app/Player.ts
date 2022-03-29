import { Cell } from './Cell';

export class Player {
  public grid: Cell[][];
  public fleetHealth: Map<string, number>;
  public ctx: CanvasRenderingContext2D;
  public vision: boolean;
  public name: string;

  constructor(rows: number, cols: number, ctx: CanvasRenderingContext2D, vision: boolean, name: string) {
    this.grid = new Array(rows)
      .fill(0)
      .map(() => new Array(cols)
        .fill(0)
        .map(() => new Cell)
      );
    this.fleetHealth = new Map<string, number>();
    this.ctx = ctx;
    this.vision = vision;
    this.name = name;

  }
}
