export class UI {
  constructor(callbacks){
    this.panels={title:document.getElementById('titlePanel'),pause:document.getElementById('pausePanel'),win:document.getElementById('winPanel'),over:document.getElementById('gameOverPanel')};this.hud=document.getElementById('hud');this.touch=document.getElementById('touchControls');
    document.getElementById('startButton').onclick=()=>callbacks.start();document.getElementById('resumeButton').onclick=()=>callbacks.resume();document.getElementById('quitButton').onclick=()=>callbacks.menu();document.getElementById('nextButton').onclick=()=>callbacks.next();document.getElementById('winMenuButton').onclick=()=>callbacks.menu();document.getElementById('retryButton').onclick=()=>callbacks.retry();document.getElementById('overMenuButton').onclick=()=>callbacks.menu();document.getElementById('pauseButton').onclick=()=>callbacks.pause();
  }
  hideAll(){Object.values(this.panels).forEach(p=>p.classList.add('hidden'));this.hud.classList.add('hidden');this.touch.classList.add('hidden');}
  title(best){this.hideAll();this.panels.title.classList.remove('hidden');document.getElementById('menuBest').textContent=best;}
  playing(){this.hideAll();this.hud.classList.remove('hidden');this.touch.classList.remove('hidden');}
  paused(){this.hideAll();this.panels.pause.classList.remove('hidden');}
  win(level,score){this.hideAll();this.panels.win.classList.remove('hidden');document.getElementById('winText').textContent=`Level ${level} cleared with ${score} points. Pim is furious.`;}
  over(score,best){this.hideAll();this.panels.over.classList.remove('hidden');document.getElementById('gameOverText').textContent=`Final score: ${score} · Best run: ${best}`;}
  hudData(level,score,shards,total,stamina,hearts,quacks){document.getElementById('levelValue').textContent=level;document.getElementById('scoreValue').textContent=score;document.getElementById('shardValue').textContent=`${shards} / ${total}`;document.getElementById('staminaBar').style.width=`${Math.round(stamina*100)}%`;document.getElementById('heartValue').textContent='♥'.repeat(hearts)+'♡'.repeat(3-hearts);document.getElementById('quackCount').textContent='×'+quacks;}
}