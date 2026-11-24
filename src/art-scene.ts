import type { GameState, Location } from './types.ts';
export class Scene {
  private canvas:HTMLCanvasElement;private ctx:CanvasRenderingContext2D;private state:GameState;private reduced=false;
  private images=new Map<Location,HTMLImageElement>();private raf=0;private frame=0;private previous:HTMLCanvasElement|null=null;private blend=1;
  private actionAt=-10000;private travelAt=-10000;private lastFrame=0;
  constructor(canvas:HTMLCanvasElement,state:GameState){this.canvas=canvas;this.ctx=canvas.getContext('2d')!;canvas.width=1672;canvas.height=941;this.state=state;
    for(const [loc,file]of Object.entries({e7:'e7-sunset.png',dana:'dc-library.png',plaza:'plaza-sunset.png',residence:'residence-night.png',work:'coop-office.png'})){
      const img=new Image();img.onload=()=>this.images.set(loc as Location,img);img.onerror=()=>{if(loc!=='e7'){const fallback=new Image();fallback.onload=()=>this.images.set(loc as Location,fallback);fallback.src=new URL('./art/e7-sunset.png',document.baseURI).href;}};img.src=new URL(`./art/${file}`,document.baseURI).href;
    }this.animate();
  }
  update(state:GameState,reduced=false){if(state.totalActions!==this.state.totalActions)this.actionAt=performance.now();if(state.location!==this.state.location){this.travelAt=performance.now();const old=document.createElement('canvas');old.width=this.canvas.width;old.height=this.canvas.height;old.getContext('2d')!.drawImage(this.canvas,0,0);this.previous=old;this.blend=0;}this.state=structuredClone(state);this.reduced=reduced;}
  destroy(){cancelAnimationFrame(this.raf);}
  private goose(x:number,y:number,t:number){const c=this.ctx;const leg=Math.sin(t*8)*5;c.fillStyle='#dfd8bb';c.fillRect(x,y,35,19);c.fillStyle='#343e37';c.fillRect(x+25,y-21,7,30);c.fillRect(x+25,y-25,15,8);c.fillStyle='#d6ad62';c.fillRect(x+39,y-21,9,4);c.fillStyle='#313b32';c.fillRect(x+7,y+18,3,11+leg);c.fillRect(x+24,y+18,3,11-leg);c.fillStyle='#7b7860';c.fillRect(x+5,y+4,19,8);}
  private effects(now:number){
    const c=this.ctx,t=now/1000,loc=this.state.location;
    if(this.state.campusCondition==='storm'||loc==='residence'){
      c.save();c.beginPath();c.rect(250,55,930,480);c.clip();c.strokeStyle='rgba(185,212,231,.3)';c.lineWidth=1.5;
      for(let i=0;i<65;i++){const x=240+(i*59+t*95)%980,y=30+(i*71+t*260)%540;c.beginPath();c.moveTo(x,y);c.lineTo(x-8,y+23);c.stroke();}c.restore();
    }else if(loc==='dana'){
      c.fillStyle='rgba(229,241,234,.55)';for(let i=0;i<35;i++){const x=420+(i*31+Math.sin(t+i)*12)%740,y=40+(i*43+t*23)%370;c.fillRect(x,y,3,3);}
    }else if(loc==='e7'||loc==='plaza'){
      c.save();c.beginPath();c.rect(180,60,1000,500);c.clip();
      for(let i=0;i<12;i++){const x=170+(i*103+t*24)%1010,y=40+(i*57+t*30)%520;c.save();c.translate(x,y);c.rotate(t*.7+i);c.fillStyle=i%2?'#b76e35b0':'#e4b04d99';c.fillRect(-3,-5,6,10);c.restore();}c.restore();
    }
    if(loc==='plaza'){const x=850+(t*22)%680;this.goose(x,825+Math.sin(t)*3,t);}
    if(loc==='work'||loc==='e7'){
      const x=loc==='work'?135:355,y=loc==='work'?480:510;c.fillStyle='rgba(166,225,187,.3)';for(let i=0;i<5;i++){const width=15+((Math.floor(t*3)+i*7)%30);c.fillRect(x,y+i*7,width,2);}c.fillStyle=`rgba(242,220,147,${.2+.2*Math.sin(t*3)})`;c.fillRect(x+45,y+30,3,7);
    }
    const actionTime=(now-this.actionAt)/1800;
    if(actionTime>=0&&actionTime<1){
      const x=570,y=620-actionTime*120;c.save();c.globalAlpha=Math.sin(actionTime*Math.PI);c.strokeStyle='#f1d290';c.fillStyle='#182c2ddd';c.lineWidth=3;c.fillRect(x-29,y-26,58,52);c.strokeRect(x-29,y-26,58,52);c.font='27px IBM Plex Sans';c.fillStyle='#f1d290';c.textAlign='center';c.fillText(loc==='residence'?'Zz':loc==='plaza'?'＋':loc==='dana'?'∑':loc==='work'?'{}':'⚙',x,y+9);c.restore();
      c.save();c.globalAlpha=1-actionTime;c.font='22px IBM Plex Sans';c.fillStyle='#fff2cb';c.shadowColor='#142727';c.shadowBlur=8;c.fillText('Week advanced · outcome rolled',90,735-actionTime*45);c.restore();
    }
    const travelling=(now-this.travelAt)/1300;
    if(travelling>=0&&travelling<1){
      const x=100+travelling*420,y=805,bob=Math.sin(travelling*35)*4;c.save();c.globalAlpha=Math.sin(travelling*Math.PI);c.fillStyle='#1b25277a';c.beginPath();c.ellipse(x,y+46,24,6,0,0,Math.PI*2);c.fill();c.fillStyle='#d9c0a0';c.fillRect(x-7,y-27+bob,14,17);c.fillStyle='#493a35';c.fillRect(x-9,y-33+bob,18,9);c.fillStyle='#c5c1b0';c.fillRect(x-12,y-10+bob,26,31);c.fillStyle='#475a69';c.fillRect(x-9,y+21,8,22+Math.sin(t*14)*4);c.fillRect(x+4,y+21,8,22-Math.sin(t*14)*4);c.restore();
    }
  }
  private animate=(now=performance.now())=>{
    if(now-this.lastFrame<1000/(this.reduced?12:30)){this.raf=requestAnimationFrame(this.animate);return;}this.lastFrame=now;
    const c=this.ctx,w=this.canvas.width,h=this.canvas.height,img=this.images.get(this.state.location)||this.images.get('e7');
    if(img){c.globalAlpha=1;c.drawImage(img,0,0,w,h);}else{c.fillStyle='#292c2f';c.fillRect(0,0,w,h);}
    if(this.previous&&this.blend<1&&!this.reduced){c.globalAlpha=1-this.blend;c.drawImage(this.previous,0,0);c.globalAlpha=1;this.blend+=.045;}else this.previous=null;
    // Very small, slow dust motes keep the background alive without hiding the art.
    if(!this.reduced){const t=this.frame*.003;for(let i=0;i<23;i++){const x=(130+i*67+Math.sin(t+i)*15)%w,y=90+(i*53+t*5)%660;c.fillStyle=`rgba(255,232,174,${.15+.2*Math.sin(t+i)**2})`;c.fillRect(x,y,1.5,1.5);}
      // Steam above the student's coffee, composed as translucent pixel wisps.
      if(this.state.location==='e7'){for(let i=0;i<3;i++){const y=575-((this.frame*.16+i*16)%50),x=445+Math.sin(t*3+i)*4;c.fillStyle=`rgba(233,218,190,${(y-525)/400})`;c.fillRect(x,y,2,7);}}
    }
    if(this.state.week===3){c.fillStyle='#11213a22';c.fillRect(0,0,w,h);}
    if(!this.reduced)this.effects(now);
    this.frame++;this.raf=requestAnimationFrame(this.animate);
  };
}
