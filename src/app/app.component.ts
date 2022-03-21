import { Component, ViewChild, ElementRef, OnInit, OnChanges, QueryList, ViewChildren } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  
  @ViewChild('canvas', { static: true })
  canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChildren("actionLog")
  actionLog!: QueryList<ElementRef>;
  
  
  private ctx!: CanvasRenderingContext2D | null;

  private bw = 0;
  private bh = 0;
  private rows = 10;
  private cols = 10;

  private col = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  private grid: Cell[][] = new Array(this.rows)
                              .fill(0)
                              .map(() => 
                                new Array(this.cols)
                                .fill(0)
                                .map(() => new Cell)
  );
  
  private fleet = [

    { name: "cv", size: 5, count: 1 },
    { name: "bb", size: 4, count: 1 },
    { name: "cg", size: 3, count: 1 },
    { name: "ss", size: 3, count: 1 },
    { name: "dd", size: 2, count: 1 }

  ]
  
  private fleetHealth = new Map<string, number>();
 
  actions: string[] = new Array;

  title = 'battleshoop';

  ngOnInit() {

    this.setupFleet();

    if (this.canvas){

      this.ctx = this.canvas.nativeElement.getContext('2d');
      this.bw = this.canvas.nativeElement.width;
      this.bh = this.canvas.nativeElement.height;
 
      this.redrawGrid();
    }
  }

  ngAfterViewInit() {
    if(this.actionLog){
      this.actionLog.changes.subscribe(() => {
        if (this.actionLog && this.actionLog.last) {
          this.actionLog.last.nativeElement.focus();
        }
      });
    }  
  }
  
  ngOnChange(){
    console.log("change");
  }

  mouseMoved(event: MouseEvent) {
    
    if (this.canvas){
      
      let [x, y] = this.getGrid(event.offsetX, event.offsetY);

      if (this.ctx){
        this.redrawGrid();
        this.ctx.strokeStyle = 'red';
        this.ctx.beginPath();
        this.ctx.rect(x*this.bw/this.cols+2, y*this.bh/this.rows+2, this.bw/this.cols-3, this.bh/this.rows-3);
        this.ctx.stroke();
      }
    }
  }

  mouseLeft(event: MouseEvent){
    this.redrawGrid();
  }

  mouseClicked(event: MouseEvent){
    
    let [x, y] = this.getGrid(event.offsetX, event.offsetY);
    if(!this.grid[x][y].revealed){
      this.grid[x][y].revealed=true;
      if(this.grid[x][y].content==="sea"){
        this.actions.push(this.col[x]+(y+1)+" miss!");
      }else{
        this.actions.push(this.col[x]+(y+1)+" "+this.grid[x][y].content+" hit!");
        let hp = this.fleetHealth.get(this.grid[x][y].content);
        if(hp){
          hp--;
          if(hp > 0){
            this.fleetHealth.set(this.grid[x][y].content, hp);
          }else{
            this.fleetHealth.delete(this.grid[x][y].content);
            this.actions.push(this.grid[x][y].content + " sunk!");
          }
        }
        if(this.fleetHealth.size == 0){
          this.actions.push("Fleet sunk!");
        }
        console.log(this.fleetHealth);
      }
    }
    
    this.redrawGrid();
  }

  setupFleet(){
    let placed:boolean, hor:boolean, clear:boolean;
    let x:number, y:number;
    this.fleet.forEach(ship => {
      for(let cnt=0; cnt< ship.count; cnt++){
        placed = false;
        /*
         This technically has the potential to deadlock but at 5 boats and a 10x10 grid it usually retries like 0-2 times total.
         @TODO: Make sure this terminates! 
        */
        do{
          clear = true;

          hor = (Math.random()<0.5);

          if(hor){
            x = Math.floor(Math.random() * (this.cols - ship.size));
            y = Math.floor(Math.random() * this.rows);
            for(let i = x; i < x+ship.size; i++){
              if(this.grid[i][y].content!="sea"){
                clear = false;
                break
              }
            }
            if(clear){
              for(let i = x; i < x+ship.size; i++){
                this.grid[i][y].content = ship.name + cnt;
                console.log("Placed "+ship.name+" horizontally");
              }
              placed = true;
              
            }
          }else{
            x = Math.floor(Math.random() * this.cols);
            y = Math.floor(Math.random() * (this.rows - ship.size));
            for(let i = y; i < y+ship.size; i++){
              if(this.grid[x][i].content!="sea"){
                clear = false;
                break
              }
            }
            if(clear){
              for(let i = y; i < y+ship.size; i++){
                this.grid[x][i].content = ship.name + cnt;
                console.log("Placed "+ship.name+" vertically");
              }
              placed = true;
              
            }
          }
          if(placed){
            this.fleetHealth.set((ship.name + cnt), ship.size);
          }
        }while(!placed);
      }
    });
  
    console.log(this.grid);
    console.log(this.fleetHealth);

  }

  getGrid(offsetX: number, offsetY: number): [number, number]{
    let x = Math.min(Math.floor(offsetX*this.cols/this.bw), this.cols-1);
    let y = Math.min(Math.floor(offsetY*this.cols/this.bh), this.rows-1);
    return [x, y];
  }

  redrawGrid(){
    // Padding
    const p = 0;
    if (this.ctx){
      this.ctx.clearRect(0, 0, this.bw, this.bh);
      this.ctx.beginPath();

      for (var x = 0; x <= this.bw; x += (this.bw/this.cols)) {
        this.ctx.moveTo(0.5 + x + p, p);
        this.ctx.lineTo(0.5 + x + p, this.bh + p);
      }

      for (var x = 0; x <= this.bh; x += (this.bh/this.rows)) {
        this.ctx.moveTo(p, 0.5 + x + p);
        this.ctx.lineTo(this.bw + p, 0.5 + x + p);
      }
      this.ctx.strokeStyle = "black";
      this.ctx.stroke();

      for(let i=0; i<this.rows;i++){
        for(let j=0; j<this.cols; j++){
          if(!this.grid[i][j].revealed){
            this.ctx.fillStyle = 'lightblue';
          }else{
            if(this.grid[i][j].content==="sea"){
              this.ctx.fillStyle = 'blue';
            }else{
              this.ctx.fillStyle = 'red';
            }
          }  
        this.ctx.fillRect(i*this.bw/this.cols+2, j*this.bh/this.rows+2, this.bw/this.cols-3, this.bh/this.rows-3);
        }
      }
    }  
  }

  reload(event: MouseEvent){
    this.grid = new Array(this.rows)
                  .fill(0)
                  .map(() => 
                    new Array(this.cols)
                      .fill(0)
                      .map(() => new Cell)
);
    console.log(this.grid);
    this.setupFleet();
    this.redrawGrid();
    this.actions = new Array;
  }
}

class Cell{
  public revealed: boolean;
  public content: string;

  constructor(){
    this.revealed = false;
    this.content = "sea";
  }
}