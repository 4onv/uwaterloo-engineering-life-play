import { showSpin } from './chance.ts';
export type MiniType='wheel'|'plinko'|'scratch'|'dice'|'geese'|'swap';
export const MINI_NAMES:Record<MiniType,string>={wheel:'Campus prize wheel',plinko:'Plinko break',scratch:'Lucky scratch card',dice:'Roll with it',geese:'Goose crossing',swap:'EngSoc parts swap'};
export function launchMinigame(host:HTMLElement,type:MiniType,o:{reduced:boolean;random:()=>number;done:(score:number)=>void;cancel:()=>void;assessment:boolean}) {
  const timers:ReturnType<typeof setTimeout>[]=[];let closed=false;let started=false;let extraCleanup=()=>{};
  const later=(f:()=>void,ms:number)=>timers.push(setTimeout(()=>{if(!closed)f();},ms));
  const finish=(score:number)=>{if(closed)return;host.innerHTML=`<h2 id="dialog-title">${o.assessment?'Term outcome roll':'A little luck goes a long way.'}</h2><div class="result-score">${Math.round(score)}<small>/100</small></div><p>${o.assessment?'Your preparation and wellbeing modify this roll.':`+$${Math.round(score)*4} in-game cash`}</p><button class="primary" id="claim-result">${o.assessment?'Reveal term result':'Collect reward'}</button>`;host.querySelector('button')!.onclick=()=>o.done(score);};
  if(type==='wheel'){
    const scores=o.assessment?[0,15,30,45,60,75,90,100]:[30,55,70,85,100,45,80,65],selected=Math.floor(o.random()*8);
    extraCleanup=showSpin(host,{title:o.assessment?'Spin for your term result':MINI_NAMES[type],description:o.assessment?'No timing. No skill test. Let the wheel decide.':'One free spin this term. In-game rewards only.',labels:scores.map(String),selected,result:`Your roll: ${scores[selected]} / 100`,reduced:o.reduced,done:()=>o.done(scores[selected])});
  }else if(type==='plinko'){
    host.innerHTML=`<h2 id="dialog-title">Plinko break</h2><p>Pick a lane. The pegs decide the rest.</p><div class="plinko-board"><div class="drop-ball"></div>${Array.from({length:7},(_,r)=>Array.from({length:7},(_,c)=>`<i style="left:${8+c*12+(r%2)*6}%;top:${15+r*9}%"></i>`).join('')).join('')}<div class="plinko-bins">${[30,55,80,100,80,55,30].map(n=>`<span>${n}</span>`).join('')}</div></div><div class="drop-options">${[1,2,3,4,5].map(n=>`<button class="secondary" data-lane="${n}">${n}</button>`).join('')}</div>`;
    host.querySelectorAll<HTMLButtonElement>('[data-lane]').forEach(button=>button.onclick=()=>{if(started)return;started=true;host.querySelectorAll('button').forEach(b=>b.disabled=true);let x=20+Number(button.dataset.lane)*10,row=0;const ball=host.querySelector<HTMLElement>('.drop-ball')!;ball.style.left=`${x}%`;ball.style.opacity='1';const bounce=()=>{row++;x=Math.max(7,Math.min(93,x+(o.random()<.5?-7:7)));ball.style.left=`${x}%`;ball.style.top=`${10+row*9}%`;if(row<8)later(bounce,o.reduced?20:170);else later(()=>finish([30,55,80,100,80,55,30][Math.min(6,Math.floor(x/100*7))]),o.reduced?100:400);};later(bounce,100);});
  }else if(type==='scratch'){
    const score=[25,50,75,100][Math.floor(o.random()*4)];let count=0;
    host.innerHTML=`<h2 id="dialog-title">Lucky scratch card</h2><p>Reveal the nine tiles. Your prize is already waiting.</p><div class="scratch-grid">${Array.from({length:9},(_,i)=>`<button class="scratch-tile" data-tile="${i}" aria-label="Reveal tile ${i+1}">✦</button>`).join('')}</div><p class="mini-hint">Every card wins. In-game currency only.</p>`;
    host.querySelectorAll<HTMLButtonElement>('[data-tile]').forEach((b,i)=>b.onclick=()=>{if(b.disabled)return;b.disabled=true;b.classList.add('revealed');b.textContent=i%3===0?'★':i%3===1?'◆':'●';if(++count===9)later(()=>finish(score),400);});
  } else if(type==='geese'){
    let distance = 0;
    const renderCrossing = () => {
      const risk = [15,30,50][distance];
      const bank = [20,45,70][distance];
      host.innerHTML = `<h2 id="dialog-title">Goose crossing</h2><p>Cut across the path to the library. Each clear crossing raises your score. A goose can send you back to the start.</p>
        <div class="crossing-track" aria-label="${distance} of 3 crossings cleared">${['Gate','Creek','Green','DC'].map((stop,i)=>`<span class="${i===distance?'here':''}">${stop}</span>`).join('')}</div>
        <div class="arcade-buttons"><button class="primary" data-cross>Cross · ${risk}% goose chance</button>
        <button class="secondary" data-bank>Take the detour · bank ${bank} points</button></div>`;
      host.querySelector<HTMLButtonElement>('[data-bank]')!.onclick = () => finish(bank);
      host.querySelector<HTMLButtonElement>('[data-cross]')!.onclick = () => {
        const blocked = o.random()*100 < risk;
        extraCleanup = showSpin(host,{title:'Who has the right of way?',description:'One crossing at a time.',labels:['Goose','Clear'],weights:[risk/100,1-risk/100],selected:blocked?0:1,
          result:blocked?'A goose claims the path. You finish with 5 points.':'Clear crossing!',reduced:o.reduced,
          done:() => { if(blocked) finish(5); else if(++distance===3) finish(100); else renderCrossing(); }});
      };
    };
    renderCrossing();
  } else if(type==='swap'){
    const parts = [{name:'Bag of resistors',score:25},{name:'Servo motor',score:60},{name:'Scope probe',score:95}];
    for(let i=parts.length-1;i>0;i--){const j=Math.floor(o.random()*(i+1));[parts[i],parts[j]]=[parts[j],parts[i]];}
    host.innerHTML = '<h2 id="dialog-title">EngSoc parts swap</h2><p>Three closed bins hold surplus parts worth 25, 60 or 95 points. Open one, then keep it or trade it away.</p><div class="parts-bins"></div>';
    const bins = host.querySelector<HTMLElement>('.parts-bins')!;
    parts.forEach((part,index) => {
      const bin = document.createElement('button');
      bin.className = 'secondary'; bin.textContent = 'Bin '+(index+1);
      bin.onclick = () => {
        const other=parts.filter((_,i)=>i!==index);
        host.innerHTML = `<h2 id="dialog-title">${part.name}</h2><div class="result-score">${part.score}<small>/100</small></div><p>Keep your find or trade for one of the two unopened bins.</p><div class="arcade-buttons"><button class="primary" data-keep>Keep the part</button><button class="secondary" data-trade>Spin for a trade</button></div>`;
        host.querySelector<HTMLButtonElement>('[data-keep]')!.onclick=()=>finish(part.score);
        host.querySelector<HTMLButtonElement>('[data-trade]')!.onclick=()=>{
          const pick=Math.floor(o.random()*2);
          extraCleanup=showSpin(host,{title:'Parts exchange',description:'Both remaining bins have equal odds.',labels:other.map(p=>String(p.score)),selected:pick,
            result:other[pick].name,reduced:o.reduced,done:()=>finish(other[pick].score)});
        };
      };
      bins.append(bin);
    });
  }else{
    const a=1+Math.floor(o.random()*6),b=1+Math.floor(o.random()*6),score=Math.round((a+b)/12*100);
    host.innerHTML='<h2 id="dialog-title">Roll with it</h2><p>Two dice. One small bit of luck.</p><div class="dice-pair"><span>?</span><span>?</span></div><button class="primary">Roll the dice</button>';
    host.querySelector('button')!.onclick=()=>{if(started)return;started=true;host.querySelector('button')!.disabled=true;const faces=['⚀','⚁','⚂','⚃','⚄','⚅'];let tick=0;const roll=()=>{tick++;host.querySelectorAll('.dice-pair span').forEach((el,i)=>el.textContent=tick<10?faces[(tick+i*2)%6]:faces[(i?b:a)-1]);if(tick<10)later(roll,o.reduced?10:90);else later(()=>finish(score),500);};roll();};
  }
  return ()=>{closed=true;timers.forEach(clearTimeout);extraCleanup();};
}
