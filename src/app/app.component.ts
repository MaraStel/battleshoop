import { Component, ViewChild, ElementRef, OnInit, OnChanges, QueryList, ViewChildren } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  
  @ViewChild('canvasA', { static: true })
  canvasA!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasB', { static: true })
  canvasB!: ElementRef<HTMLCanvasElement>;
  @ViewChildren("actionLog")
  actionLog!: QueryList<ElementRef>;
  
  private bw = 0;
  private bh = 0;
  private rows = 10;
  private cols = 10;

  private col = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  private playerA!: Player;
  private playerB!: Player;
  
  private fleet = [

    { name: "cv", size: 5, count: 1 },
    { name: "bb", size: 4, count: 1 },
    { name: "cg", size: 3, count: 1 },
    { name: "ss", size: 3, count: 1 },
    { name: "dd", size: 2, count: 1 }

  ]

  
    //let ctx = canvas.nativeElement.getContext('2d');
   
 
  actions: string[] = new Array;

  title = 'battleshoop';

  ngOnInit() {

    if (this.canvasA){
      let ctx = this.canvasA.nativeElement.getContext('2d');
      if(ctx){
        this.playerA = new Player(this.rows, this.cols, ctx, false);
        this.bw = this.canvasA.nativeElement.width;
        this.bh = this.canvasA.nativeElement.height;
        this.setupFleet(this.playerA);
        this.redrawGrid(this.playerA);
      }
    }
    if (this.canvasB){
      let ctx = this.canvasB.nativeElement.getContext('2d');
      if(ctx){
        this.playerB = new Player(this.rows, this.cols, ctx, true);
        this.setupFleet(this.playerB);
        this.redrawGrid(this.playerB);
      }
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
    
    if (this.canvasA){
      
      let [x, y] = this.getGrid(event.offsetX, event.offsetY);

      if (this.playerA.ctx){
        this.redrawGrid(this.playerA);
        this.playerA.ctx.strokeStyle = 'red';
        this.playerA.ctx.beginPath();
        this.playerA.ctx.rect(x*this.bw/this.cols+2, y*this.bh/this.rows+2, this.bw/this.cols-3, this.bh/this.rows-3);
        this.playerA.ctx.stroke();
      }
    }
  }

  mouseClicked(event: MouseEvent){
    
    let [x, y] = this.getGrid(event.offsetX, event.offsetY);
    if(!this.playerA.grid[x][y].revealed){
      this.playerA.grid[x][y].revealed=true;
      if(this.playerA.grid[x][y].content==="sea"){
        this.actions.push("P1 "+this.col[x]+(y+1)+" miss!");
      }else{
        this.actions.push("P1 "+this.col[x]+(y+1)+" "+this.playerA.grid[x][y].content+" hit!");
        let hp = this.playerA.fleetHealth.get(this.playerA.grid[x][y].content);
        if(hp){
          hp--;
          if(hp > 0){
            this.playerA.fleetHealth.set(this.playerA.grid[x][y].content, hp);
          }else{
            this.playerA.fleetHealth.delete(this.playerA.grid[x][y].content);
            this.actions.push("P1 "+this.playerA.grid[x][y].content + " sunk!");
          }
        }
        if(this.playerA.fleetHealth.size == 0){
          this.actions.push("P1 Fleet sunk!");
        }
        console.log(this.playerA.fleetHealth);
      }
    }
    this.opforTurn();
    this.redrawGrid(this.playerA);
    this.redrawGrid(this.playerB);
  }

  opforTurn(){
    /*
    * Some major repition in here and, again, a (lesser?) chance to loop eternally
    * The second should resolve itself once we use an actual targeting strategy rather than pure random
    */
    let x:number, y:number;
    let hit = false;
    do{
      x = Math.floor(Math.random() * this.cols);
      y = Math.floor(Math.random() * this.rows);
      if(!this.playerB.grid[x][y].revealed){
        hit = true;
        this.playerB.grid[x][y].revealed=true;
        if(this.playerB.grid[x][y].content==="sea"){
          this.actions.push("P2 "+this.col[x]+(y+1)+" miss!");
        }else{
          this.actions.push("P2 "+this.col[x]+(y+1)+" "+this.playerB.grid[x][y].content+" hit!");
          let hp = this.playerB.fleetHealth.get(this.playerB.grid[x][y].content);
          if(hp){
            hp--;
            if(hp > 0){
             this.playerB.fleetHealth.set(this.playerB.grid[x][y].content, hp);
            }else{
              this.playerB.fleetHealth.delete(this.playerB.grid[x][y].content);
              this.actions.push("P2 "+this.playerB.grid[x][y].content + " sunk!");
            }
          }
          if(this.playerB.fleetHealth.size == 0){
            this.actions.push("P2 Fleet sunk!");
          }
        }
      }
    }while(!hit)
    console.log(this.playerB.grid);   
  }

  setupFleet(player: Player){
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
              if(player.grid[i][y].content!="sea"){
                clear = false;
                break
              }
            }
            if(clear){
              for(let i = x; i < x+ship.size; i++){
                player.grid[i][y].content = ship.name + cnt;
                console.log("Placed "+ship.name+" horizontally");
              }
              placed = true;
              
            }
          }else{
            x = Math.floor(Math.random() * this.cols);
            y = Math.floor(Math.random() * (this.rows - ship.size));
            for(let i = y; i < y+ship.size; i++){
              if(player.grid[x][i].content!="sea"){
                clear = false;
                break
              }
            }
            if(clear){
              for(let i = y; i < y+ship.size; i++){
                player.grid[x][i].content = ship.name + cnt;
                console.log("Placed "+ship.name+" vertically");
              }
              placed = true;
              
            }
          }
          if(placed){
            player.fleetHealth.set((ship.name + cnt), ship.size);
          }
        }while(!placed);
      }
    });
  
    console.log(player.grid);
    console.log(player.fleetHealth);
    return {player};

  }

  getGrid(offsetX: number, offsetY: number): [number, number]{
    let x = Math.min(Math.floor(offsetX*this.cols/this.bw), this.cols-1);
    let y = Math.min(Math.floor(offsetY*this.cols/this.bh), this.rows-1);
    return [x, y];
  }

  redrawGrid(player: Player){
    // Padding
    const p = 0;
    if (player.ctx){
      player.ctx.clearRect(0, 0, this.bw, this.bh);
      player.ctx.beginPath();

      for (var x = 0; x <= this.bw; x += (this.bw/this.cols)) {
        player.ctx.moveTo(0.5 + x + p, p);
        player.ctx.lineTo(0.5 + x + p, this.bh + p);
      }

      for (var x = 0; x <= this.bh; x += (this.bh/this.rows)) {
        player.ctx.moveTo(p, 0.5 + x + p);
        player.ctx.lineTo(this.bw + p, 0.5 + x + p);
      }
      player.ctx.strokeStyle = "black";
      player.ctx.stroke();

      for(let i=0; i<this.rows;i++){
        for(let j=0; j<this.cols; j++){
          if(!player.grid[i][j].revealed){
            if(player.grid[i][j].content!="sea" && player.vision){
              player.ctx.fillStyle = 'purple';
            }else{
              player.ctx.fillStyle = 'lightblue';
            }
            
          }else{
            if(player.grid[i][j].content==="sea"){
              player.ctx.fillStyle = 'blue';
            }else{
              player.ctx.fillStyle = 'red';
            }
          }  
          player.ctx.fillRect(i*this.bw/this.cols+2, j*this.bh/this.rows+2, this.bw/this.cols-3, this.bh/this.rows-3);
        }
      }
    }  
  }

  reload(event: MouseEvent){
    this.playerA = new Player(this.rows, this.cols, this.playerA.ctx, false);
    this.playerB = new Player(this.rows, this.cols, this.playerB.ctx, false);
    console.log(this.playerA.grid);
    console.log(this.playerB.grid);
    this.setupFleet(this.playerA);
    this.redrawGrid(this.playerA);
    this.setupFleet(this.playerB);
    this.redrawGrid(this.playerB);
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

class Player{
  public grid: Cell[][];
  public fleetHealth: Map<string, number>;
  public ctx: CanvasRenderingContext2D;
  public vision: boolean;

  constructor(rows: number, cols: number, ctx: CanvasRenderingContext2D, vision: boolean ){
    this.grid = new Array(rows)
    .fill(0)
    .map(() => 
      new Array(cols)
      .fill(0)
      .map(() => new Cell)
    );
    this.fleetHealth = new Map<string, number>();
    this.ctx = ctx;
    this.vision = vision;
    
  }
}