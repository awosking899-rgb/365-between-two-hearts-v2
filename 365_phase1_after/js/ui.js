// واجهة المستخدم: الشاشات، قوائم الإيقاف، الإعدادات، ونوافذ الذكريات المتنوعة
(function(){
  var UI=G.UI={viewerOpen:false,menuOpen:false,onExplore:null,onResume:null,onRestart:null,onStartOver:null};
  var $=G.$,timers=[],curCleanup=null,returnTo=null;
  function later(fn,ms){var t=setTimeout(fn,ms);timers.push(t);return t;}
  function clearTimers(){timers.forEach(clearTimeout);timers=[];}
  function esc(s){return String(s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];});}
  function show(id){$(id).classList.remove('hidden');}
  function hide(id){$(id).classList.add('hidden');}

  UI.setProgress=function(p,txt){$('loadFill').style.width=Math.round(p*100)+'%'; if(txt)$('startStatus').textContent=txt;};
  UI.ready=function(hasJourney){
    $('startStatus').textContent=''; $('btnStart').disabled=false;
    $('loadBar').style.visibility='hidden';
    if(hasJourney){ $('btnStart').classList.add('hidden'); show('btnContinue'); show('btnNew'); }
  };
  UI.hideStart=function(){hide('start');};
  UI.showHud=function(on){ if(on) show('hud'); else hide('hud'); };
  UI.fade=function(on){ $('fade').classList.toggle('on',!!on); };
  var toastT=0;
  UI.toast=function(txt){
    var el=$('regionToast'); el.textContent=txt; el.classList.add('show');
    clearTimeout(toastT); toastT=setTimeout(function(){el.classList.remove('show');},3800);
  };
  var exploreOn=false;
  UI.setExplore=function(label){
    if(label){ $('exploreLabel').textContent=label; if(!exploreOn){show('btnExplore');exploreOn=true;} }
    else if(exploreOn){hide('btnExplore');exploreOn=false;}
  };
  UI.error=function(msg){ $('errText').textContent=msg; show('error'); };

  // ===== قوائم =====
  function anyMenu(){ return !$('pause').classList.contains('hidden')||!$('settings').classList.contains('hidden')||!$('memlist').classList.contains('hidden')||!$('confirm').classList.contains('hidden'); }
  UI.openPause=function(){ if(UI.viewerOpen) return; show('pause'); UI.menuOpen=true; if(document.pointerLockElement) document.exitPointerLock(); };
  UI.closeMenus=function(){ ['pause','settings','memlist','confirm'].forEach(hide); UI.menuOpen=false; };
  UI.confirm=function(text,yes){ $('confirmText').textContent=text; show('confirm'); $('cYes').onclick=function(){hide('confirm'); yes();}; $('cNo').onclick=function(){hide('confirm');}; };

  var SET;
  UI.bindSettings=function(){
    SET=G.Save.data.settings;
    function apply(){ G.Audio.setVolumes(SET); G.Save.save(); if(UI.onSettings) UI.onSettings(); }
    var map=[['sMusic','music'],['sVoice','voice'],['sSfx','sfx']];
    map.forEach(function(m){ var el=$(m[0]); el.value=Math.round(SET[m[1]]*100); el.oninput=function(){SET[m[1]]=el.value/100;apply();}; });
    $('sMusicOff').checked=!SET.musicOn; $('sMusicOff').onchange=function(){SET.musicOn=!this.checked;apply();};
    $('sSfxOff').checked=!SET.sfxOn; $('sSfxOff').onchange=function(){SET.sfxOn=!this.checked;apply();};
    $('sLock').checked=!!SET.lock; $('sLock').onchange=function(){SET.lock=this.checked;apply();};
    $('sQuality').value=SET.quality; $('sQuality').onchange=function(){SET.quality=this.value;apply();};
    $('saveNote').textContent=G.Save.available?'':'الحفظ التلقائي غير متاح في هذا المتصفح (التخزين المحلي معطّل).';
  };
  UI.init=function(){
    $('pResume').onclick=function(){G.Audio.click();UI.closeMenus();UI.onResume&&UI.onResume();};
    $('pSettings').onclick=function(){G.Audio.click();hide('pause');show('settings');};
    $('sBack').onclick=function(){G.Audio.click();hide('settings');show('pause');};
    $('pMemories').onclick=function(){G.Audio.click();hide('pause');UI.fillMemList();show('memlist');};
    $('mlBack').onclick=function(){G.Audio.click();hide('memlist');show('pause');};
    $('pStartOver').onclick=function(){G.Audio.click();UI.confirm('سيعود اللاعب إلى بداية الرحلة. الذكريات التي استكشفتِها تبقى محفوظة. هل تريدين ذلك؟',function(){UI.closeMenus();UI.onStartOver&&UI.onStartOver();});};
    $('pRestart').onclick=function(){G.Audio.click();UI.confirmRestart();};
    $('vClose').onclick=function(){G.Audio.click();UI.closeViewer();};
    $('btnExplore').onclick=function(){UI.onExplore&&UI.onExplore();};
    $('btnPause').onclick=function(){G.Audio.click();UI.openPause();};
    $('actExit').onclick=function(){G.Audio.click();if(G.Act)G.Act.cancel();};
    window.addEventListener('keydown',function(e){
      if(e.code==='Escape'){ if(UI.viewerOpen){UI.closeViewer();} }
    });
  };
  UI.confirmRestart=function(){
    UI.confirm('إعادة الرحلة ستمسح التقدّم والذكريات المستكشفة وتبدأ من جديد. هل أنتِ متأكدة؟',function(){ UI.closeViewer(true); UI.closeMenus(); UI.onRestart&&UI.onRestart(); });
  };
  function nameOf(id){
    if(G.MEM[id]) return G.MEM[id].title;
    if(G.ACT_INFO&&G.ACT_INFO[id]) return 'نشاط: '+G.ACT_INFO[id].t;
    if(/^birthday_/.test(id)) return 'ستوري عيد الميلاد '+G.ar(parseInt(id.split('_')[1],10));
    if(/^photos_/.test(id)) return 'صورة من المعرض';
    var a=G.AUDIO.filter(function(x){return x.id===id;})[0]; if(a) return 'صوت: '+a.title;
    return id;
  }
  UI.fillMemList=function(){
    var g=$('memGrid'); g.innerHTML=''; var ids=Object.keys(G.Save.data.seen);
    if(!ids.length){ g.innerHTML='<div class="note" style="grid-column:1/-1">لم تستكشفي أي ذكرى بعد.</div>'; return; }
    ids.forEach(function(id){ var b=document.createElement('button'); b.className='memitem'; b.innerHTML=esc(nameOf(id)); b.onclick=function(){ G.Audio.click(); returnTo='memlist'; hide('memlist'); UI.openById(id,true); }; g.appendChild(b); });
  };
  UI.openById=function(id,replay){
    if(G.MEM[id]) return UI.openMemory(id);
    if(G.ACT_INFO&&G.ACT_INFO[id]){ var ai=G.ACT_INFO[id]; return UI.openCustom(ai.t,'<h3>'+ai.t+'</h3><div>'+ai.d+'</div>','glow'); }
    var m=/^(birthday|photos)_(\d+)$/.exec(id);
    if(m){ var set=m[1]==='birthday'?'birthday':'gallery'; return UI.openSet(set,Math.max(0,G.SETS[set].indexOf(id))); }
    var a=G.AUDIO.filter(function(x){return x.id===id;})[0]; if(a) return UI.openAudio(a);
  };

  // ===== نافذة الذكرى =====
  function open(){ UI.viewerOpen=true; $('viewer').classList.remove('hidden'); $('viewer').style.zIndex=returnTo?'60':'30'; $('vStage').innerHTML=''; clearTimers(); if(document.pointerLockElement) document.exitPointerLock(); }
  UI.closeViewer=function(silent){
    if(!UI.viewerOpen) return;
    clearTimers(); if(curCleanup){curCleanup();curCleanup=null;}
    G.Audio.stopVoice(); G.fx.finale=0;
    $('viewer').classList.add('hidden'); $('vStage').innerHTML=''; UI.viewerOpen=false;
    if(returnTo&&!silent){ var r=returnTo; returnTo=null; UI.fillMemList(); show(r); UI.menuOpen=true; }
    else returnTo=null;
    if(UI.onViewerClose&&!silent) UI.onViewerClose();
  };
  function seen(id){ var first=G.Save.markSeen(id); if(UI.onSeen) UI.onSeen(id,first); }
  function title(t){ var d=document.createElement('div'); d.className='v-title'; d.textContent=t||''; $('vStage').appendChild(d); }

  // نافذة بطاقة عامة (نتائج الأنشطة) — لا تُسجَّل ضمن الذكريات
  UI.openCustom=function(ttl,html,style){
    open(); G.Audio.chime(true); title(ttl);
    var c=document.createElement('div'); c.className='card '+(style||'glass'); c.innerHTML=html; $('vStage').appendChild(c);
  };
  UI.actHud=function(o){
    var el=$('actHud'); if(!o){ el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    $('actTitle').textContent=o.title||''; $('actInfo').textContent=o.info||'';
    var b=$('actBar'); b.style.display=o.bar===undefined||o.bar===null?'none':'block';
    if(o.bar!==undefined&&o.bar!==null){ $('actFill').style.width=Math.round(G.clamp(o.bar,0,1)*100)+'%'; $('actFill').className=o.danger?'bad':''; }
    var t=$('actTilt'); t.style.display=o.tilt===undefined||o.tilt===null?'none':'block';
    if(o.tilt!==undefined&&o.tilt!==null){ $('actTiltDot').style.left=(50+G.clamp(o.tilt,-1,1)*46)+'%'; }
    $('actExit').style.display=o.noExit?'none':'flex';
  };
  UI.actSay=function(txt){ var s=$('actSay'); if(!txt){ s.classList.remove('show'); return; } s.textContent=txt; s.classList.add('show'); };
  UI.openMemory=function(key){
    var m=G.MEM[key]; if(!m) return; open(); seen(key); G.Audio.chime(true);
    var st=$('vStage');
    if(m.kind==='image'){ UI.showImageList([m.img],0,m.title,[m.caption||'']); return; }
    title(m.title);
    if(m.kind==='card'){ var c=document.createElement('div'); c.className='card '+(m.style||'glass'); c.innerHTML=m.html; st.appendChild(c); return; }
    if(m.kind==='words'){ renderWords(m); return; }
    if(m.kind==='chat'){ renderChat(); return; }
    if(m.kind==='finale'){ renderFinale(); return; }
  };
  UI.showImageList=function(list,idx,ttl,caps,opts){
    opts=opts||{}; var st=$('vStage'); st.innerHTML=''; title(ttl);
    var i=idx;
    var wrap=document.createElement('div'); wrap.className=opts.story?'story':'photo-wrap'; st.appendChild(wrap);
    function render(){
      wrap.innerHTML=''; var id=list[i]; seen(id);
      if(opts.story){
        var bars=document.createElement('div'); bars.className='story-bars';
        for(var k=0;k<list.length;k++){ var b=document.createElement('i'); if(k<=i)b.className='on'; bars.appendChild(b); }
        wrap.appendChild(bars);
        var im=document.createElement('img'); im.src=G.imgFull(id); im.alt=''; wrap.appendChild(im);
      } else {
        var fr=document.createElement('div'); fr.className='photo-frame'+(opts.round?' round-f':'');
        var im2=document.createElement('img'); im2.src=G.imgFull(id); im2.alt=''; fr.appendChild(im2);
        var cap=caps&&caps[i]; if(cap){ var cd=document.createElement('div'); cd.className='photo-cap'; cd.textContent=cap; fr.appendChild(cd); }
        wrap.appendChild(fr);
      }
      if(list.length>1){ var c=document.createElement('div'); c.className='counter'; c.textContent=G.ar(i+1)+' / '+G.ar(list.length); wrap.appendChild(c); }
    }
    render();
    if(list.length>1){
      var p=document.createElement('button'); p.className='round nav prev'; p.textContent='›'; var n=document.createElement('button'); n.className='round nav next'; n.textContent='‹';
      function go(d){ i=(i+d+list.length)%list.length; G.Audio.click(); render(); }
      p.onclick=function(){go(-1);}; n.onclick=function(){go(1);};
      st.appendChild(p); st.appendChild(n);
      var sx=null; st.ontouchstart=function(e){sx=e.touches[0].clientX;}; st.ontouchend=function(e){ if(sx===null)return; var dx=e.changedTouches[0].clientX-sx; if(Math.abs(dx)>50){go(dx<0?1:-1);} sx=null; };
      var kh=function(e){ if(e.code==='ArrowLeft')go(1); else if(e.code==='ArrowRight')go(-1); };
      window.addEventListener('keydown',kh); var prev=curCleanup; curCleanup=function(){window.removeEventListener('keydown',kh); st.ontouchstart=null; st.ontouchend=null; if(prev)prev();};
    }
  };
  UI.openSet=function(setName,idx){
    open(); G.Audio.chime(false);
    var list=G.SETS[setName];
    if(setName==='birthday') UI.showImageList(list,idx,'عيد الميلاد',null,{story:true});
    else UI.showImageList(list,idx,'معرض الصور',null,{});
  };
  UI.openAudio=function(a){
    open(); seen(a.id); G.Audio.chime(true); title(a.title);
    var c=document.createElement('div'); c.className='card glass'; c.innerHTML='<div class="player"><canvas width="600" height="168"></canvas><button class="playbtn" aria-label="تشغيل">▶</button><div class="time">0:00</div></div>';
    $('vStage').appendChild(c);
    var btn=c.querySelector('.playbtn'),cv=c.querySelector('canvas'),tm=c.querySelector('.time'),cx=cv.getContext('2d'),raf=0,dead=false;
    var h=G.Audio.playVoice(a.src,function(s){ btn.textContent=(s==='playing')?'❚❚':'▶'; });
    btn.onclick=function(){ h.toggle(); };
    var data=new Uint8Array(128);
    function draw(){
      if(dead) return; raf=requestAnimationFrame(draw);
      var w=cv.width,hh=cv.height; cx.clearRect(0,0,w,hh);
      var playing=!h.el.paused; if(h.analyser) h.analyser.getByteFrequencyData(data);
      var n=40,bw=w/n; var t=performance.now()/1000;
      for(var i=0;i<n;i++){
        var v=h.analyser&&playing? data[Math.floor(i*1.6)]/255 : (playing?0.3+0.25*Math.sin(t*6+i):0.08+0.05*Math.sin(t*2+i*0.7));
        var bh=Math.max(6,v*hh*0.95); cx.fillStyle='rgba(255,'+Math.round(170+60*v)+','+Math.round(190-40*v)+',0.9)';
        cx.fillRect(i*bw+bw*0.2,(hh-bh)/2,bw*0.6,bh);
      }
      var cur=h.el.currentTime||0,dur=h.el.duration||0; var f=function(s){s=Math.floor(s);return Math.floor(s/60)+':'+('0'+(s%60)).slice(-2);}; tm.textContent=f(cur)+(dur&&isFinite(dur)?' / '+f(dur):'');
    }
    draw(); var prev=curCleanup; curCleanup=function(){dead=true;cancelAnimationFrame(raf);if(prev)prev();};
  };
  function renderWords(m){
    var c=document.createElement('div'); c.className='card glass'; var h='<div class="wordcards">';
    m.words.forEach(function(w,i){ h+='<div class="wc" style="--r:'+((i%2?1:-1)*(1+i))+'deg;animation-delay:'+(i*0.25)+'s">'+esc(w)+'</div>'; });
    h+='</div><div class="sub" style="margin-top:18px;font-size:17px">'+esc(m.note)+'</div>'; c.innerHTML=h; $('vStage').appendChild(c);
  }
  function renderChat(){
    var c=document.createElement('div'); c.className='card glass'; var T=G.TEXT;
    var h='<div class="narr">'+esc(T.confNarration)+'</div><div class="chat">';
    T.confession.forEach(function(l){ var who=l.indexOf('بانا:')===0?'her':'me'; var body=l.replace(/^(بانا|أوس|أنا):\s*/,''); h+='<div class="bubble '+who+'"><small>'+(who==='her'?G.NAMES.player:G.NAMES.companion)+'</small>'+esc(body)+'</div>'; });
    h+='</div><div class="skip" style="margin-top:14px">اضغطي لإظهار الكل</div>'; c.innerHTML=h; $('vStage').appendChild(c);
    var nar=c.querySelector('.narr'),bs=c.querySelectorAll('.bubble'); later(function(){nar.classList.add('show');},250);
    bs.forEach(function(b,i){ later(function(){b.classList.add('show');G.Audio.chime(i%2===0);},2600+i*1700); });
    c.onclick=function(){ nar.classList.add('show'); bs.forEach(function(b){b.classList.add('show');}); };
  }
  function renderFinale(){
    var st=$('vStage'); var box=document.createElement('div'); box.className='finale-box'; st.appendChild(box);
    var sk=document.createElement('div'); sk.className='skip'; sk.textContent='اضغطي على الرسالة لإظهارها كاملة'; box.appendChild(sk);
    var L=document.createElement('div'); L.className='letter'; L.setAttribute('dir','rtl'); box.appendChild(L);
    var parts=G.TEXT.finale.split(/(\s+)/),spans=[];
    parts.forEach(function(p){ if(!p) return; if(/^\s+$/.test(p)){ L.appendChild(document.createTextNode(p)); } else { var s=document.createElement('span'); s.textContent=p; L.appendChild(s); spans.push({el:s,br:false}); } });
    // علّم الكلمات التي بعدها سطر جديد
    var idx=0; parts.forEach(function(p){ if(!p)return; if(/^\s+$/.test(p)){ if(idx>0&&p.indexOf('\n')>=0) spans[idx-1].br=true; } else idx++; });
    var end=document.createElement('div'); end.className='finale-end';
    end.innerHTML='<div class="t">365 — بين قلبين</div><div class="s">ليست هذه نهاية حكايتنا</div>';
    var rb=document.createElement('button'); rb.className='ghost'; rb.textContent='إعادة الرحلة'; rb.onclick=function(){UI.confirmRestart();}; end.appendChild(rb); box.appendChild(end);
    var i=0,done=false;
    function finish(){ if(done)return; done=true; clearTimers(); spans.forEach(function(s){s.el.classList.add('on');}); G.fx.finale=1; end.classList.add('show'); sk.style.visibility='hidden'; G.Save.data.finished=true; G.Save.save(); }
    function step(){
      if(i>=spans.length){ later(function(){finish();},900); return; }
      var s=spans[i]; s.el.classList.add('on'); G.fx.finale=(i+1)/spans.length;
      var r=s.el.getBoundingClientRect(),b=box.getBoundingClientRect(); if(r.bottom>b.bottom-50) box.scrollBy({top:r.bottom-b.bottom+110,behavior:'smooth'});
      var d=250+Math.min(260,s.el.textContent.length*22)+(s.br?750:0); i++; later(step,d);
    }
    later(step,900);
    L.onclick=function(){ finish(); };
    box.addEventListener('wheel',function(e){e.stopPropagation();},{passive:true});
  }
})();
