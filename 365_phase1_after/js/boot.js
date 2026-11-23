// تحميل المكتبة ثم ملفات اللعبة بالترتيب
(function(){
  window.G = window.G || {};
  var FILES = ['js/gl3.js','data/text.js','data/memories.js','js/util.js','js/save.js','js/audio.js','js/ui.js','js/controls.js',
               'js/characters.js','js/layout.js','js/world3d.js','js/props.js','js/regions.js','js/activities.js','js/game.js'];
  function fail(msg){
    var e=document.getElementById('error'); if(!e) return;
    document.getElementById('errText').textContent=msg; e.classList.remove('hidden');
    var s=document.getElementById('start'); if(s) s.classList.add('hidden');
  }
  window.G.fail = fail;
  function loadScript(src){
    return new Promise(function(res,rej){
      var s=document.createElement('script'); s.src=src; s.async=false;
      s.onload=function(){res();}; s.onerror=function(){rej(new Error('load '+src));};
      document.head.appendChild(s);
    });
  }
  window.addEventListener('error',function(ev){
    try{ console.error('[365]',ev.message,ev.filename,ev.lineno); }catch(e){}
  });
  Promise.resolve().then(function(){
    var chain=Promise.resolve();
    FILES.forEach(function(f){ chain=chain.then(function(){return loadScript(f);}); });
    return chain;
  }).then(function(){
    if(G.start) G.start();
  }).catch(function(err){
    var m = 'تعذّر تحميل ملفات اللعبة: '+(err&&err.message);
    fail(m);
  });
})();
