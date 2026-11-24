export interface SpinOptions { title:string;description:string;labels:string[];weights?:number[];result:string;selected:number;reduced:boolean;done:()=>void;confirm?:string;onSpin?:()=>void }
export function showSpin(host:HTMLElement,o:SpinOptions){
  let ended=false;let timer:ReturnType<typeof setTimeout>;const n=o.labels.length;
  const weights=o.weights||o.labels.map(()=>1/n);let start=0;const arcs=weights.map(weight=>{const arc={start,end:start+weight*360,center:start+weight*180};start=arc.end;return arc;});
  host.innerHTML=`<h2 id="dialog-title">${o.title}</h2><p class="spin-description"></p><div class="chance-wheel-wrap"><div class="wheel-arrow"></div><div class="chance-wheel"><div class="wheel-labels"></div><div class="wheel-hub">W</div></div></div><div class="spin-result" aria-live="polite"></div><button class="primary spin-start">Spin the wheel</button>`;
  host.querySelector('.spin-description')!.textContent=o.description;
  const wheel=host.querySelector<HTMLElement>('.chance-wheel')!,labels=host.querySelector<HTMLElement>('.wheel-labels')!,button=host.querySelector<HTMLButtonElement>('.spin-start')!,result=host.querySelector<HTMLElement>('.spin-result')!;
  const colors=['#638a77','#c3a760','#548989','#a07866','#9eaa76','#7189a3','#b0a273','#8e7390'];
  wheel.style.background=`conic-gradient(${o.labels.map((_,i)=>`${n===2?(i===0?'#578c70':'#ad665b'):colors[i%8]} ${arcs[i].start}deg ${arcs[i].end}deg`).join(',')})`;
  o.labels.forEach((text,i)=>{const label=document.createElement('span');label.textContent=text;label.style.fontSize=n===2&&weights[i]<.15?'11px':'';label.style.transform=`translate(-50%,-50%) rotate(${arcs[i].center}deg) translateY(-94px) rotate(${-arcs[i].center}deg)`;labels.append(label);});
  button.onclick=()=>{if(ended){o.done();return;}if(button.disabled)return;button.disabled=true;o.onSpin?.();button.textContent='Spinning…';wheel.style.transitionDuration=o.reduced?'.15s':'2.1s';wheel.style.transform=`rotate(${1800-arcs[o.selected].center}deg)`;timer=setTimeout(()=>{ended=true;result.textContent=o.result;button.disabled=false;button.textContent=o.confirm||'Continue';button.focus();},o.reduced?200:2200);};
  return ()=>clearTimeout(timer);
}
