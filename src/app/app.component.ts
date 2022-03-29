import { Component, ViewChild, ElementRef, OnInit, OnChanges, QueryList, ViewChildren, Injectable } from '@angular/core';
import { Player } from './Player';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';

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

  constructor(public dialog: MatDialog) {}

  ngOnInit() {

    if (this.canvasA){
      let ctx = this.canvasA.nativeElement.getContext('2d');
      if(ctx){
        this.playerA = new Player(this.rows, this.cols, ctx, false, "P1");
        this.bw = this.canvasA.nativeElement.width;
        this.bh = this.canvasA.nativeElement.height;
        this.setupFleet(this.playerA);
        this.redrawGrid(this.playerA);
      }
    }
    if (this.canvasB){
      let ctx = this.canvasB.nativeElement.getContext('2d');
      if(ctx){
        this.playerB = new Player(this.rows, this.cols, ctx, true, "AI");
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
      
      this.evaluateShot(x, y, this.playerA)
    }
    this.opforTurn();
    this.redrawGrid(this.playerA);
    this.redrawGrid(this.playerB);
  }

  opforTurn(){
    /*
    * again, a (lesser?) chance to loop eternally
    * This should resolve itself once we use an actual targeting strategy rather than pure random
    */
    let x:number, y:number;
    let hit = false;
    do{
      x = Math.floor(Math.random() * this.cols);
      y = Math.floor(Math.random() * this.rows);
      if(!this.playerB.grid[x][y].revealed){

        hit = true;
        this.evaluateShot(x, y, this.playerB);

      }
    }while(!hit)
    console.log(this.playerB.grid);   
  }

  evaluateShot(x: number, y:number, player: Player){
    player.grid[x][y].revealed=true;
    if(player.grid[x][y].content==="sea"){
      this.actions.push(player.name+": "+this.col[x]+(y+1)+" miss!");
    }else{
      this.actions.push(player.name+": "+this.col[x]+(y+1)+" "+player.grid[x][y].content+" hit!");
      let hp = player.fleetHealth.get(player.grid[x][y].content);
      if(hp){
        hp--;
        if(hp > 0){
          player.fleetHealth.set(player.grid[x][y].content, hp);
        }else{
          player.fleetHealth.delete(player.grid[x][y].content);
          this.actions.push(player.name+": "+player.grid[x][y].content + " sunk!");
        }
      }
      if(player.fleetHealth.size == 0){
        this.actions.push(player.name+": Opposing fleet sunk!");
        this.openDialog();
      }
    }
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
    /*this.playerA = new Player(this.rows, this.cols, this.playerA.ctx, false, "P1");
    this.playerB = new Player(this.rows, this.cols, this.playerB.ctx, false, "AI");
    console.log(this.playerA.grid);
    console.log(this.playerB.grid);
    this.setupFleet(this.playerA);
    this.redrawGrid(this.playerA);
    this.setupFleet(this.playerB);
    this.redrawGrid(this.playerB);
    this.actions = new Array;*/
    this.openDialog();
  }

  openDialog(): void {
    let dialogRef = this.dialog.open(DialogOverviewExampleDialog, {
      width: '250px',
     
    });

    dialogRef.afterClosed().subscribe(() => {
      console.log('The dialog was closed');
     
    });
  }
}
@Component({
  selector: 'app.component.dialog',
  templateUrl: 'app.component.dialog.html',
})

export class DialogOverviewExampleDialog {

  constructor(
    public dialogRef: MatDialogRef<DialogOverviewExampleDialog>,
    ) { }
  
    
  onNoClick(): void {
    this.dialogRef.close();
  }

}
