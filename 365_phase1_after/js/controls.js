// التحكم: هاتف (عصا + جري + سحب للكاميرا) وكمبيوتر (WASD + ماوس + Shift)
(function(){
  var I=G.Input={mx:0,my:0,run:false,yawD:0,pitchD:0,zoomD:0,interact:false,locked:false,enabled:true};
  var keys={};
  function kmove(){
    var x=0,y=0;
    if(keys.KeyA||keys.ArrowLeft)x-=1; if(keys.KeyD||keys.ArrowRight)x+=1;
    if(keys.KeyW||keys.ArrowUp)y+=1; if(keys.KeyS||keys.ArrowDown)y-=1;
    return [x,y];
  }
  I.kbd=[0,0];
  window.addEventListener('keydown',function(e){
    if(['INPUT','SELECT','TEXTAREA'].indexOf((e.target.tagName||''))>=0) return;
    keys[e.code]=true;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].indexOf(e.code)>=0 && I.enabled) e.preventDefault();
    if(e.code==='ShiftLeft'||e.code==='ShiftRight') I.run=true;
    if((e.code==='KeyE'||e.code==='Enter'||e.code==='Space') && !e.repeat) I.interact=true;
    if(e.code==='Escape' && I.onEsc && !e.repeat) I.onEsc();
    I.kbd=kmove();
  });
  window.addEventListener('keyup',function(e){
    keys[e.code]=false;
    if(e.code==='ShiftLeft'||e.code==='ShiftRight') I.run=I.touchRun||false;
    I.kbd=kmove();
  });
  window.addEventListener('blur',function(){keys={};I.kbd=[0,0];I.run=false;});
  I.consumeInteract=function(){var v=I.interact;I.interact=false;return v;};

  I.init=function(canvas){
    var look=G.$('look');
    // ---- الكاميرا بالسحب (ماوس أو لمس) ----
    var drag=null;
    look.addEventListener('pointerdown',function(e){
      if(!I.enabled) return;
      if(e.pointerType==='mouse'){
        if(e.button!==0) return;
        if(G.Save.data.settings.lock && look.requestPointerLock && !document.pointerLockElement){ try{ look.requestPointerLock(); }catch(er){} }
      }
      if(drag) return; drag={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now()};
      try{look.setPointerCapture(e.pointerId);}catch(er){}
    });
    look.addEventListener('pointermove',function(e){
      if(document.pointerLockElement===look){ I.yawD+=e.movementX*0.0032; I.pitchD+=e.movementY*0.0032; return; }
      if(!drag||e.pointerId!==drag.id) return;
      var dx=e.clientX-drag.x,dy=e.clientY-drag.y; drag.x=e.clientX; drag.y=e.clientY;
      var k=e.pointerType==='mouse'?0.0045:0.0055; I.yawD+=dx*k; I.pitchD+=dy*k;
    });
    function end(e){ if(drag&&e.pointerId===drag.id) drag=null; }
    look.addEventListener('pointerup',end); look.addEventListener('pointercancel',end);
    look.addEventListener('wheel',function(e){ I.zoomD+=Math.sign(e.deltaY)*0.8; e.preventDefault(); },{passive:false});
    document.addEventListener('pointerlockchange',function(){
      I.locked=document.pointerLockElement===look;
      if(!I.locked && I.onUnlock) I.onUnlock();
    });
    // ---- العصا ----
    var joy=G.$('joy'),knob=G.$('joyKnob'),jid=null,cx=0,cy=0,R=44;
    function jmove(e){
      var dx=e.clientX-cx,dy=e.clientY-cy,d=Math.hypot(dx,dy); if(d>R){dx*=R/d;dy*=R/d;d=R;}
      knob.style.transform='translate('+dx+'px,'+dy+'px)';
      var m=d/R; var dead=0.12; m=m<dead?0:(m-dead)/(1-dead); var a=Math.atan2(dy,dx);
      I.mx=Math.cos(a)*m; I.my=-Math.sin(a)*m;
    }
    joy.addEventListener('pointerdown',function(e){ if(jid!==null) return; jid=e.pointerId; var r=joy.getBoundingClientRect(); cx=r.left+r.width/2; cy=r.top+r.height/2; try{joy.setPointerCapture(jid);}catch(er){} jmove(e); e.preventDefault(); });
    joy.addEventListener('pointermove',function(e){ if(e.pointerId===jid) jmove(e); });
    function jend(e){ if(e.pointerId!==jid) return; jid=null; I.mx=0;I.my=0; knob.style.transform='translate(0,0)'; }
    joy.addEventListener('pointerup',jend); joy.addEventListener('pointercancel',jend);
    // ---- زر الجري (تبديل) ----
    var rb=G.$('btnRun'); I.touchRun=false;
    rb.addEventListener('pointerdown',function(e){ I.touchRun=!I.touchRun; I.run=I.touchRun; rb.classList.toggle('on',I.touchRun); e.preventDefault(); });
    window.addEventListener('contextmenu',function(e){e.preventDefault();});
    document.addEventListener('gesturestart',function(e){e.preventDefault();});
  };
  I.reset=function(){ I.mx=I.my=0; I.kbd=[0,0]; keys={}; };
  I.axes=function(){
    var x=I.mx+I.kbd[0],y=I.my+I.kbd[1],m=Math.hypot(x,y); if(m>1){x/=m;y/=m;}
    return [x,y];
  };
})();
