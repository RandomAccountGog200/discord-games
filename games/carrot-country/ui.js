export class UI {
  constructor(){this.ids={};document.querySelectorAll('[id]').forEach(e=>this.ids[e.id]=e);this.callbacks={};}
  on(name,fn){this.callbacks[name]=fn;}
  click(name){this.callbacks[name]?.();}
  bind(){
    this.ids['start-button'].onclick=()=>this.click('start');this.ids['how-button'].onclick=()=>{this.ids['how-text'].classList.toggle('hidden');this.click('click');};
    this.ids['pause-button'].onclick=()=>this.click('pause');this.ids['resume-button'].onclick=()=>this.click('resume');this.ids['pause-menu-button'].onclick=()=>this.click('menu');
    this.ids['next-day-button'].onclick=()=>this.click('next');this.ids['restart-button'].onclick=()=>this.click('restart');this.ids['end-menu-button'].onclick=()=>this.click('menu');
    this.ids['buy-seeds'].onclick=()=>this.click('seeds');this.ids['buy-fertilizer'].onclick=()=>this.click('fertilizer');this.ids['buy-can'].onclick=()=>this.click('can');
    document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>this.click('tool:'+b.dataset.tool));
  }
  show(which){['menu-screen','pause-screen','summary-screen','end-screen'].forEach(id=>this.ids[id].classList.toggle('hidden',id!==which));this.ids.hud.classList.toggle('hidden',which!=='playing');}
  text(id,value){this.ids[id].textContent=value;}
  menu(best){this.show('menu-screen');this.text('menu-best',best);this.ids.how-text.classList.add('hidden');}
  hud(g){this.show('playing');this.text('day-value',`${g.day} / 10`);this.text('time-value',`${Math.floor(g.time/60)}:${String(Math.ceil(g.time%60)).padStart(2,'0')}`);this.text('gold-value','$'+g.gold);this.text('energy-value',Math.ceil(g.energy));this.text('carrot-value',g.carrots);this.text('seed-value',g.seeds);this.text('fertilizer-value',g.fertilizer);this.text('weather-value',g.rain?'RAINY DAY':'CLEAR SKIES');this.text('goal-value',`ORDER: ${g.goal} (${g.todayHarvested}/${g.goal})`);this.text('tool-value',g.tool.toUpperCase());}
  summary(g,earn,bonus){this.show('summary-screen');this.text('summary-title',`DAY ${g.day} HARVEST`);this.text('summary-copy',g.todayHarvested>=g.goal?'Order fulfilled! The market is singing your name.':'The order was short, but tomorrow is another sunrise.');this.text('summary-carrots',g.todayHarvested);this.text('summary-earnings','$'+earn);this.text('summary-bonus','$'+bonus);this.text('next-day-label',g.day+1);}
  end(g,win,best){this.show('end-screen');this.text('end-title',win?'FARM COMPLETE!':'THE FARM WILTED');this.text('end-copy',win?'You turned a patch of dirt into a carrot empire. The golden carrot is yours!':'You ran out of seasons before the big order was filled. Every farmer learns from a bad harvest.');this.text('final-carrots',g.carrots);this.text('final-best',best);this.ids['end-icon'].textContent=win?'🥕':'🌧️';}
}