export class UI {
  constructor(){this.screens={menu:document.getElementById('menu'),pause:document.getElementById('pause'),upgrade:document.getElementById('upgrade'),gameover:document.getElementById('gameover'),win:document.getElementById('win')};this.hud=document.getElementById('hud');this.touch=document.getElementById('touch-controls');this.bestEl=document.getElementById('menu-best');}
  hideScreens(){Object.values(this.screens).forEach(s=>s.classList.remove('active'));}
  showMenu(best){this.hideScreens();this.screens.menu.classList.add('active');this.hud.style.display='none';this.touch.style.display='none';this.bestEl.textContent=best;}
  showGame(){this.hideScreens();this.hud.style.display='block';if(matchMedia('(pointer: coarse)').matches)this.touch.style.display='block';}
  showPause(){this.screens.pause.classList.add('active');}
  hidePause(){this.screens.pause.classList.remove('active');}
  showUpgrade(options,choose){this.hideScreens();this.screens.upgrade.classList.add('active');const box=document.getElementById('upgrade-cards');box.innerHTML='';options.forEach(o=>{const b=document.createElement('button');b.className='upgrade-card';b.innerHTML=`<b>${o.name}</b><span>${o.desc}</span>`;b.addEventListener('click',()=>choose(o.id),{once:true});box.appendChild(b);});}
  hud(wave,score,hp,max){document.getElementById('hud-wave').textContent=`${wave} / 6`;document.getElementById('hud-score').textContent=score;document.getElementById('health-bar').style.width=`${Math.max(0,hp/max*100)}%`;}
  banner(text){const b=document.getElementById('wave-banner');b.textContent=text;b.classList.add('show');setTimeout(()=>b.classList.remove('show'),1900);}
  showGameOver(score,wave,best){this.hideScreens();this.screens.gameover.classList.add('active');document.getElementById('gameover-stats').innerHTML=`Score <b>${score}</b> · Reached room <b>${wave}</b><br>Best score: <b>${best}</b>`;}
  showWin(score,best){this.hideScreens();this.screens.win.classList.add('active');document.getElementById('win-stats').innerHTML=`Final score <b>${score}</b><br>Best score: <b>${best}</b>`;}
}