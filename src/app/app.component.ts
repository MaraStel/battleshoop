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

  private grid: number[][] = new Array(10)
                              .fill(0)
                              .map(() => 
                                new Array(10).fill(0)
  );
  
  title = 'battleshoop';

  ngOnInit() {

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

    const col = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
    
    if (this.canvas){
      
      let [x, y] = this.getGrid(event.offsetX, event.offsetY);

      if (this.ctx){
        this.redrawGrid();
        this.ctx.strokeStyle = 'red';
        this.ctx.beginPath();
        this.ctx.rect(x*this.bw/10+2, y*this.bh/10+2, this.bw/10-3, this.bh/10-3);
        this.ctx.stroke();
      }
    }
  }

  mouseLeft(event: MouseEvent){
    this.redrawGrid();
  }

  mouseClicked(event: MouseEvent){
    
    let [x, y] = this.getGrid(event.offsetX, event.offsetY);
    this.grid[x][y]=1;
    console.log(this.grid);
  }

  getGrid(offsetX: number, offsetY: number): [number, number]{
    let x = Math.min(Math.floor(offsetX*10/this.bw), 9);
    let y = Math.min(Math.floor(offsetY*10/this.bh), 9);
    return [x, y];
  }

  redrawGrid(){
    // Padding
    const p = 0;
    if (this.ctx){
      this.ctx.clearRect(0, 0, this.bw, this.bh);
      this.ctx.beginPath();

      for (var x = 0; x <= this.bw; x += (this.bw/10)) {
        this.ctx.moveTo(0.5 + x + p, p);
        this.ctx.lineTo(0.5 + x + p, this.bh + p);
      }

      for (var x = 0; x <= this.bh; x += (this.bh/10)) {
        this.ctx.moveTo(p, 0.5 + x + p);
        this.ctx.lineTo(this.bw + p, 0.5 + x + p);
      }
      this.ctx.strokeStyle = "black";
      this.ctx.stroke();

      for(let i=0; i<10;i++){
        for(let j=0; j<10; j++){
          if(this.grid[i][j]===1){
            this.ctx.fillStyle = 'blue';
          }else{
            this.ctx.fillStyle = 'lightblue';
          }
        this.ctx.fillRect(i*this.bw/10+2, j*this.bh/10+2, this.bw/10-3, this.bh/10-3);
        }
      }
    }  
  }
}
