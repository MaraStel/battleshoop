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
  
  title = 'battleshoop';

  mouseMoved(event: MouseEvent) {
    //console.log("x: "+event.offsetX+" y: "+event.offsetY)
    const col = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
    if (this.canvas){
      // Box width
      const bw = this.canvas.nativeElement.width;
      // Box height
      const bh = this.canvas.nativeElement.height;
      let x = Math.min(Math.floor(event.offsetX*10/bw), 9);
      let y = Math.floor(event.offsetY*10/bw)+1;
      console.log(col[x]+y);
    }
  }
  ngOnInit() {
    console.log("init");
    if (this.canvas){

      this.ctx = this.canvas.nativeElement.getContext('2d');
      // Box width
      const bw = this.canvas.nativeElement.width;
      // Box height
      const bh = this.canvas.nativeElement.height;
      // Padding
      const p = 0;

      if (this.ctx){
        
        for (var x = 0; x <= bw; x += (bw/10)) {
          this.ctx.moveTo(0.5 + x + p, p);
          this.ctx.lineTo(0.5 + x + p, bh + p);
        }

        for (var x = 0; x <= bh; x += (bh/10)) {
          this.ctx.moveTo(p, 0.5 + x + p);
          this.ctx.lineTo(bw + p, 0.5 + x + p);
        }
        this.ctx.strokeStyle = "black";
        this.ctx.stroke();
      }
    }

  }
  ngOnChange(){
    console.log("change");
  }
}
