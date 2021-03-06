import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { Component, ViewChild, ElementRef, OnInit, QueryList, ViewChildren, Inject } from '@angular/core';
import { Player } from './Player';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

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
  
  private preTargets: {x: number, y: number}[] = new Array;
  private followUpTargets: {ship: string, x: number, y: number}[] = new Array;

  private fleet = [

    { name: "cv", size: 5, count: 1 },
    { name: "bb", size: 4, count: 1 },
    { name: "cg", size: 3, count: 1 },
    { name: "ss", size: 3, count: 1 },
    { name: "dd", size: 2, count: 1 }

  ]

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

    this.checkerBoard();
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
      this.opforTurn();
    }
    this.redrawGrid(this.playerA);
    this.redrawGrid(this.playerB);
  }

  opforTurn(){
    let rand: number;
    let impact: string;
    let x: number, y: number, ships: number;
    ships = this.playerB.fleetHealth.size;
    if(this.followUpTargets.length>0){
      rand = Math.floor(Math.random() * this.followUpTargets.length);
      x = this.followUpTargets[rand].x;
      y = this.followUpTargets[rand].y;
      impact = this.evaluateShot(x, y, this.playerB);
      this.followUpTargets.splice(rand, 1);
    }else{
      rand = Math.floor(Math.random() * this.preTargets.length);
      x = this.preTargets[rand].x;
      y = this.preTargets[rand].y;
      impact = this.evaluateShot(x, y, this.playerB);
      this.preTargets.splice(rand, 1);
    }
    if( impact != "sea"){
      if(this.playerB.fleetHealth.size < ships){
        this.followUpTargets = this.followUpTargets.filter(o => {
          o.ship != impact
        })
      }else {
        //x, y-1
        if(this.isEligible(impact, x, y-1)){
          this.followUpTargets.push({ship: impact, x: x, y: y-1})
        }
        //x, y+1
        if(this.isEligible(impact, x, y+1)){
          this.followUpTargets.push({ship: impact, x: x, y: y+1})
        }
        //x-1, y
        if(this.isEligible(impact, x-1, y)){
          this.followUpTargets.push({ship: impact, x: x-1, y: y})
        }
        //x+1, y
        if(this.isEligible(impact, x+1, y)){
          this.followUpTargets.push({ship: impact, x: x+1, y: y})
        }
      }

    }
    console.log(this.followUpTargets);
  }

  isEligible(ship: string, x:number ,y:number ):boolean{
    if(0 <= x && x < this.cols && 0 <= y && y < this.rows){
      if(!this.playerB.grid[x][y].revealed){
        if(!this.followUpTargets.find(o => {
        o.ship === ship && o.x === x && o.y === y})){
          return true
        }
      }
    }
    return false
  }

  /*
  * Adds alternating coordinates to a pre-selected list for the "random" tagetting mode
  * This enables the use of the "only check every other space" strategy which guarantees 
  * *finding* every boat in just 50 turns compared to up to 99 for a fully random approach.
  */  
  checkerBoard(){
    let start = Math.random() < 0.5;
    let offset = 0;
    for(let i = 0; i < this.rows; i++){
      if(start){
        offset = i%2;
      }else{
        offset = (i+1)%2;
      }
      for(let j = 0; j < this.cols/2; j++){
        this.preTargets.push({x: i, y: 2 * j + offset});
      }
    }
  }

  evaluateShot(x: number, y:number, player: Player):string{
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
        let victory = false;
        if(player.name === "P1"){
          victory = true;
        }
        this.openDialog(victory, player.name);
      }
    }
    return player.grid[x][y].content;
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

  reload(){
    this.ngOnInit();
    this.actions = new Array;
    this.followUpTargets = new Array;
  }

  openDialog(victory: boolean, winner: string): void {
    let dialogRef = this.dialog.open(EndGameDialog, {
      width: '250px',
      data: { name: winner, victory: victory?"Victory!":"Defeat!"}
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

export class EndGameDialog {

  constructor(
    public dialogRef: MatDialogRef<EndGameDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }
  
    
  onNoClick(): void {
    this.dialogRef.close();
  }

}
