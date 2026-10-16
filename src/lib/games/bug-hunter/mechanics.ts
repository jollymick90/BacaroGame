// Adapted from gift-secret-santa/src/games/starship-run/{character,game,tree}.ts.
// World approaches a stationary runner; sinusoidal jump and lane targets retained.
// Simulation time replaces wall-clock/frame-dependent movement. No browser dependency.
export const LANE=2.5, GAP=23, JUMP_TIME=.85;
export type Phase='intro'|'running'|'paused'|'over';
export type Obstacle={lane:number;kind:number;hit:boolean};
export type Row={index:number;z:number;lane:number;kind:number;caught:boolean;obstacles:Obstacle[]};
export function jumpHeight(t:number){return t<=0||t>=JUMP_TIME?0:2.65*Math.sin(Math.PI*t/JUMP_TIME);}
// Adapted axis-aligned overlap from Tree.collides; inset horizontally for forgiveness.
export function overlaps(x:number,y:number,z:number,ox:number,oz:number,height:number){return Math.abs(x-ox)<.88&&Math.abs(z-oz)<.7&&y<height-.12;}
export function makeRow(index:number,rng:()=>number=Math.random):Row{
 const lane=index===0?0:Math.floor(rng()*3)-1;
 const obstacles:Obstacle[]=[];
 if(index>1){const blocked=[-1,0,1].filter(l=>l!==lane);obstacles.push({lane:blocked[index%2],kind:index%3,hit:false});if(index>10&&index%3===0)obstacles.push({lane:blocked[1-index%2],kind:(index+1)%3,hit:false});}
 return {index,z:-12-index*GAP,lane,kind:index%4,caught:false,obstacles};
}
export type RunnerEvent={type:'capture';kind:number;row:Row}|{type:'hit'};
export class Runner{
 phase:Phase='intro';health=3;distance=0;time=0;lane=0;x=0;y=0;jumpTime=-1;invulnerable=0;caught=0;collection=[0,0,0,0];rows:Row[]=[];next=8;speed=8;
 rng:()=>number; onEvent:(e:RunnerEvent)=>void=()=>{};
 constructor(rng:()=>number=Math.random){this.rng=rng;this.reset();this.phase='intro';}
 reset(){this.health=3;this.distance=0;this.time=0;this.lane=0;this.x=0;this.y=0;this.jumpTime=-1;this.invulnerable=0;this.caught=0;this.collection=[0,0,0,0];this.next=8;this.speed=8;this.rows=Array.from({length:8},(_,i)=>makeRow(i,this.rng));}
 start(){this.reset();this.phase='running';}
 pause(){if(this.phase==='running')this.phase='paused';}
 resume(){if(this.phase==='paused')this.phase='running';}
 move(direction:number){if(this.phase==='running')this.lane=Math.max(-1,Math.min(1,this.lane+direction));}
 jump(){if(this.phase==='running'&&this.jumpTime<0)this.jumpTime=0;}
 hit(){if(this.phase!=='running'||this.invulnerable>0)return;this.health--;this.invulnerable=2;this.onEvent({type:'hit'});if(!this.health)this.phase='over';}
 update(delta:number){
  if(this.phase!=='running')return;
  const dt=Math.min(.05,Math.max(0,delta));this.time+=dt;this.speed=Math.min(15,8+this.time*.055);this.distance+=this.speed*dt;this.invulnerable=Math.max(0,this.invulnerable-dt);
  const target=this.lane*LANE;this.x+=Math.sign(target-this.x)*Math.min(Math.abs(target-this.x),dt*15);
  if(this.jumpTime>=0){this.jumpTime+=dt;this.y=jumpHeight(this.jumpTime);if(this.jumpTime>=JUMP_TIME)this.jumpTime=-1;}
  for(const row of this.rows){
   row.z+=this.speed*dt;
   if(!row.caught&&Math.abs(row.z)<1.4&&Math.abs(this.x-row.lane*LANE)<1.05&&this.y<1.9){row.caught=true;this.caught++;this.collection[row.kind]++;this.onEvent({type:'capture',kind:row.kind,row});}
   for(const o of row.obstacles)if(!o.hit&&overlaps(this.x,this.y,0,o.lane*LANE,row.z,[1.25,1.6,.65][o.kind])){o.hit=true;this.hit();}
   if(this.phase!=='running')break;
   if(row.z>8){const next=makeRow(this.next++,this.rng);next.z=Math.min(...this.rows.map(r=>r.z))-GAP;Object.assign(row,next);}
  }
 }
}
