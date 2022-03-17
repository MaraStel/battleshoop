import { Component, ViewChild, ElementRef, OnInit, OnChanges } from '@angular/core';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  
  @ViewChild('canvas', { static: true })
  canvas!: ElementRef<HTMLCanvasElement>;
  
  private ctx!: CanvasRenderingContext2D | null;

  private bw = 0;
  private bh = 0;
  private rows = 10;
  private cols = 10;

  private col = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  private grid: string[][] = new Array(this.rows)
                              .fill(0)
                              .map(() => 
                                new Array(this.cols).fill("fog")
  );

  private fleet = [

    { name: "cv", size: 5, count: 1 },
    { name: "bb", size: 4, count: 1},
    { name: "cg", size: 3, count: 1 },
    { name: "ss", size: 3, count: 1 },
    { name: "dd", size: 2, count: 1 }

  ]
  
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
    if(this.grid[x][y]==="fog"){
      this.grid[x][y]="sea";
    }else{
      this.grid[x][y]="hit";
    }
    this.redrawGrid();
  }

  setupFleet(){
    let placed:boolean, hor:boolean, clear:boolean;
    let x:number, y:number;
    console.log(this.fleet.length);
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
              if(this.grid[i][y]!="fog"){
                clear = false;
                break
              }
            }
            if(clear){
              for(let i = x; i < x+ship.size; i++){
                this.grid[i][y] = ship.name;
              }
              placed = true;
              console.log("Placed "+ship.name+" horizontally");
            }
          }else{
            x = Math.floor(Math.random() * this.cols);
            y = Math.floor(Math.random() * (this.rows - ship.size));
            for(let i = y; i < y+ship.size; i++){
              if(this.grid[x][i]!="fog"){
                clear = false;
                break
              }
            }
            if(clear){
              for(let i = y; i < y+ship.size; i++){
                this.grid[x][i] = ship.name;
              }
              placed = true;
              console.log("Placed "+ship.name+" vertically");
            }
          }
          if(!placed){
            console.log("fail");
          }
        }while(!placed);
      }
    });
    console.log(this.grid);

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
          if(this.grid[i][j]==="sea"){
            this.ctx.fillStyle = 'blue';
          }else if(this.grid[i][j]==="fog"){
            this.ctx.fillStyle = 'lightblue';
          }else if(this.grid[i][j]==="hit"){
            this.ctx.fillStyle = 'red';
          }else {
            this.ctx.fillStyle = 'purple';
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
                    new Array(this.cols).fill("fog")
    );
    console.log(this.grid);
    this.setupFleet();
    this.redrawGrid();
  }
}
