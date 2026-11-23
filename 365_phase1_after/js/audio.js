// الصوت: موسيقى مُولَّدة أصلية (بلا حقوق نشر) + مؤثرات + تشغيل الفويسات الأصلية
(function(){
  var A=G.Audio={ctx:null,ready:false,voice:null,env:{night:0,water:0,wind:0.3,lant:0}};
  var ctx,master,comp,musicBus,sfxBus,voiceBus,ambBus,reverb,revSend,duck,musicGain;
  var noiseBuf,windG,windF,waterG,cricketG,timers=[],mood=null,chordIdx=0,lastChord=0,nextPluck=0,nextBird=0,started=false;
  var vol={music:0.6,voice:1,sfx:0.7,musicOn:true,sfxOn:true};
  function mtof(m){return 440*Math.pow(2,(m-69)/12);}
  A.setVolumes=function(s){
    vol.music=s.music;vol.voice=s.voice;vol.sfx=s.sfx;vol.musicOn=s.musicOn;vol.sfxOn=s.sfxOn;
    if(!ctx)return; var t=ctx.currentTime;
    musicBus.gain.setTargetAtTime(vol.musicOn?vol.music:0,t,0.1);
    sfxBus.gain.setTargetAtTime(vol.sfxOn?vol.sfx:0,t,0.1);
    ambBus.gain.setTargetAtTime(vol.sfxOn?vol.sfx:0,t,0.1);
    voiceBus.gain.setTargetAtTime(vol.voice,t,0.1);
  };
  function makeNoise(){
    var len=ctx.sampleRate*3,b=ctx.createBuffer(1,len,ctx.sampleRate),d=b.getChannelData(0),l=0;
    for(var i=0;i<len;i++){var w=Math.random()*2-1;l=(l+0.02*w)/1.02;d[i]=l*3.5;}
    return b;
  }
  function makeIR(sec,decay){
    var len=Math.floor(ctx.sampleRate*sec),b=ctx.createBuffer(2,len,ctx.sampleRate);
    for(var c=0;c<2;c++){var d=b.getChannelData(c);for(var i=0;i<len;i++){d[i]=(Math.random()*2-1)*Math.pow(1-i/len,decay);}}
    return b;
  }
  A.init=function(){
    if(ctx){ if(ctx.state==='suspended') ctx.resume(); return; }
    var AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
    try{
      ctx=A.ctx=new AC();
      master=ctx.createGain();master.gain.value=0.9;
      comp=ctx.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=3;
      master.connect(comp);comp.connect(ctx.destination);
      musicBus=ctx.createGain();sfxBus=ctx.createGain();voiceBus=ctx.createGain();ambBus=ctx.createGain();duck=ctx.createGain();
      musicBus.connect(duck);duck.connect(master);sfxBus.connect(master);voiceBus.connect(master);ambBus.connect(master);
      reverb=ctx.createConvolver();reverb.buffer=makeIR(3.2,2.4);
      revSend=ctx.createGain();revSend.gain.value=0.55;revSend.connect(reverb);reverb.connect(musicBus);
      noiseBuf=makeNoise();
      // رياح
      var n1=ctx.createBufferSource();n1.buffer=noiseBuf;n1.loop=true;
      windF=ctx.createBiquadFilter();windF.type='bandpass';windF.frequency.value=380;windF.Q.value=0.5;
      windG=ctx.createGain();windG.gain.value=0.0;n1.connect(windF);windF.connect(windG);windG.connect(ambBus);n1.start();
      // مياه
      var n2=ctx.createBufferSource();n2.buffer=noiseBuf;n2.loop=true;n2.playbackRate.value=1.3;
      var wf=ctx.createBiquadFilter();wf.type='bandpass';wf.frequency.value=1500;wf.Q.value=0.7;
      waterG=ctx.createGain();waterG.gain.value=0;n2.connect(wf);wf.connect(waterG);waterG.connect(ambBus);n2.start();
      // صرصور الليل
      var co=ctx.createOscillator();co.frequency.value=4300;
      var cm=ctx.createGain();cm.gain.value=0;
      var lfo=ctx.createOscillator();lfo.type='square';lfo.frequency.value=22;
      var lfg=ctx.createGain();lfg.gain.value=0.5;
      var amp=ctx.createGain();amp.gain.value=0.5;
      lfo.connect(lfg);lfg.connect(cm.gain);co.connect(cm);
      var slow=ctx.createOscillator();slow.frequency.value=0.7;var sg=ctx.createGain();sg.gain.value=0.5;slow.connect(sg);
      cricketG=ctx.createGain();cricketG.gain.value=0;cm.connect(cricketG);cricketG.connect(ambBus);
      co.start();lfo.start();slow.start();
      A.setVolumes(Object.assign({},vol,G.Save.data.settings));
      A.ready=true;
    }catch(e){console.warn('audio init failed',e);A.ready=false;}
  };
  // ===== موسيقى =====
  var MOODS=[ // root(midi), scale, prog(semitone offsets), cutoff, pluckEvery, octave, bright
    {r:57,s:[0,2,4,7,9],p:[0,5,7,0],c:1400,e:2.6,o:5},   // 0 بداية الرسائل
    {r:60,s:[0,2,4,7,9],p:[0,9,5,7],c:1600,e:2.2,o:5},   // 1 الاعتراف
    {r:55,s:[0,2,4,7,9],p:[0,7,9,5],c:1800,e:1.8,o:5},   // 2 حديقة الاسم
    {r:62,s:[0,2,4,7,9],p:[0,5,0,7],c:1300,e:2.8,o:5},   // 3 المكالمات
    {r:57,s:[0,2,4,7,9],p:[0,7,5,0],c:2000,e:1.5,o:5},   // 4 الغناء
    {r:64,s:[0,2,4,7,9],p:[0,5,9,7],c:2600,e:1.2,o:5},   // 5 الألعاب
    {r:60,s:[0,2,4,7,9],p:[0,5,7,9],c:2600,e:1.1,o:6},   // 6 عيد الميلاد
    {r:57,s:[0,3,5,7,10],p:[0,8,5,7],c:1500,e:2.2,o:5},  // 7 المعرض
    {r:62,s:[0,2,4,7,9],p:[0,5,7,5],c:2800,e:1.0,o:5},   // 8 النكد
    {r:59,s:[0,2,4,7,9],p:[0,9,7,5],c:1900,e:1.7,o:6},   // 9 الأفتارات
    {r:55,s:[0,2,4,7,9],p:[0,5,0,7],c:1200,e:3.0,o:5},   // 10 السينما
    {r:58,s:[0,2,4,7,9],p:[0,7,5,0],c:1500,e:2.6,o:5},   // 11 التفاهم
    {r:64,s:[0,2,4,7,9],p:[0,5,9,7],c:2400,e:1.3,o:5},   // 12 اللهجة
    {r:60,s:[0,2,4,7,9],p:[0,7,9,4],c:1700,e:2.0,o:6},   // 13 طريق السماء
    {r:60,s:[0,2,4,7,9],p:[0,9,5,7],c:1500,e:2.4,o:6}    // 14 النهاية
  ];
  A.setRegion=function(i,night){ mood=MOODS[G.clamp(i|0,0,MOODS.length-1)]; A.env.night=night||0; };
  function pad(root,when,len){
    var notes=[root,root+4,root+7,root+12];
    // لو كان الجذر مع خطوة صغيرة نستخدم ثلاثي
    notes.forEach(function(m,k){
      var o=ctx.createOscillator();o.type=k%2?'sine':'triangle';o.frequency.value=mtof(m-12+(k===3?12:0));o.detune.value=(k-1.5)*5;
      var g=ctx.createGain();g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(0.05,when+len*0.38);g.gain.linearRampToValueAtTime(0,when+len*1.3);
      var f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=mood.c;
      o.connect(f);f.connect(g);g.connect(musicBus);g.connect(revSend);o.start(when);o.stop(when+len*1.35);
    });
  }
  function pluck(midi,when,vel){
    var o=ctx.createOscillator();o.type='sine';o.frequency.value=mtof(midi);
    var o2=ctx.createOscillator();o2.type='triangle';o2.frequency.value=mtof(midi+12);
    var g=ctx.createGain();g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(vel,when+0.012);g.gain.exponentialRampToValueAtTime(0.0008,when+2.4);
    var g2=ctx.createGain();g2.gain.value=0.18;
    o.connect(g);o2.connect(g2);g2.connect(g);g.connect(musicBus);g.connect(revSend);
    o.start(when);o2.start(when);o.stop(when+2.6);o2.stop(when+2.6);
  }
  function musicTick(){
    if(!ctx||!mood||ctx.state!=='running') return;
    var now=ctx.currentTime;
    if(now>=lastChord-1.2){
      var base=lastChord>now?lastChord:now+0.05;
      pad(mood.r+mood.p[chordIdx%mood.p.length],base,5.2);
      chordIdx++; lastChord=base+5.2;
    }
    if(now>=nextPluck){
      var sc=mood.s,deg=sc[Math.floor(Math.random()*sc.length)],oct=Math.random()<0.25?12:0;
      var chordRoot=mood.p[(chordIdx+mood.p.length-1)%mood.p.length];
      pluck(mood.r+chordRoot+deg+oct+(mood.o-5)*12,now+0.05,0.06+Math.random()*0.04);
      nextPluck=now+mood.e*(0.6+Math.random()*1.1);
    }
  }
  // ===== مؤثرات =====
  function noiseBurst(dur,freq,q,gain,type){
    if(!ctx||!vol.sfxOn)return;
    var s=ctx.createBufferSource();s.buffer=noiseBuf;
    var f=ctx.createBiquadFilter();f.type=type||'lowpass';f.frequency.value=freq;f.Q.value=q||0.7;
    var g=ctx.createGain();var t=ctx.currentTime;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(0.0005,t+dur);
    s.connect(f);f.connect(g);g.connect(sfxBus);s.start(t,Math.random()*2);s.stop(t+dur+0.02);
  }
  A.step=function(run,surface){ noiseBurst(run?0.07:0.09,run?900:650,0.6,run?0.22:0.15,'lowpass'); };
  A.chime=function(hi){
    if(!ctx||!vol.sfxOn)return; var t=ctx.currentTime,base=hi?84:79;
    [0,4,7].forEach(function(d,i){
      var o=ctx.createOscillator();o.type='sine';o.frequency.value=mtof(base+d);
      var g=ctx.createGain();g.gain.setValueAtTime(0,t+i*0.07);g.gain.linearRampToValueAtTime(0.09,t+i*0.07+0.01);g.gain.exponentialRampToValueAtTime(0.0005,t+i*0.07+1.4);
      o.connect(g);g.connect(sfxBus);g.connect(revSend);o.start(t+i*0.07);o.stop(t+i*0.07+1.5);
    });
  };
  A.click=function(){ if(!ctx||!vol.sfxOn)return; var t=ctx.currentTime;var o=ctx.createOscillator();o.type='sine';o.frequency.setValueAtTime(880,t);o.frequency.exponentialRampToValueAtTime(1320,t+0.08);var g=ctx.createGain();g.gain.setValueAtTime(0.07,t);g.gain.exponentialRampToValueAtTime(0.0005,t+0.14);o.connect(g);g.connect(sfxBus);o.start(t);o.stop(t+0.16); };
  A.whoosh=function(){ noiseBurst(0.9,700,0.8,0.05,'bandpass'); };
  function bird(){
    if(!ctx||!vol.sfxOn)return; var t=ctx.currentTime,f0=2400+Math.random()*1500;
    var n=2+Math.floor(Math.random()*3);
    for(var i=0;i<n;i++){
      var o=ctx.createOscillator();o.type='sine';var s=t+i*0.13;
      o.frequency.setValueAtTime(f0,s);o.frequency.exponentialRampToValueAtTime(f0*(1.2+Math.random()*0.5),s+0.08);
      var g=ctx.createGain();g.gain.setValueAtTime(0,s);g.gain.linearRampToValueAtTime(0.018,s+0.01);g.gain.exponentialRampToValueAtTime(0.0005,s+0.1);
      o.connect(g);g.connect(ambBus);g.connect(revSend);o.start(s);o.stop(s+0.12);
    }
  }
  A.update=function(dt,e){
    if(!ctx) return;
    var t=ctx.currentTime;
    A.env.night=e.night;A.env.water=e.water;A.env.wind=e.wind;
    windG.gain.setTargetAtTime(0.045+0.05*e.wind+0.015*Math.sin(t*0.3),t,0.8);
    windF.frequency.setTargetAtTime(300+260*e.wind+120*Math.sin(t*0.21),t,0.6);
    waterG.gain.setTargetAtTime(0.11*e.water,t,0.5);
    cricketG.gain.setTargetAtTime(0.012*G.smooth(0.45,0.8,e.night)*(0.5+0.5*Math.sin(t*0.7)>0.2?1:0.3),t,0.6);
    if(!A.voice||A.voice.paused){ musicBus.gain.setTargetAtTime(vol.musicOn?vol.music:0,t,0.1); }
    musicTick();
    if(e.night<0.5 && t>nextBird && vol.sfxOn){ bird(); nextBird=t+2.5+Math.random()*7; }
  };
  A.duck=function(on){ if(!ctx)return; duck.gain.setTargetAtTime(on?0.08:1,ctx.currentTime,on?0.5:1.6); };
  // ===== الفويسات الأصلية =====
  var voiceEls={};
  A.playVoice=function(src,cb){
    A.init();
    var el=voiceEls[src];
    if(!el){ el=new Audio(); el.src=src; el.preload='auto'; el.crossOrigin='anonymous'; voiceEls[src]=el;
      if(ctx){ try{ var ms=ctx.createMediaElementSource(el); var an=ctx.createAnalyser(); an.fftSize=256; ms.connect(an); an.connect(voiceBus); el._an=an; }catch(e){} } }
    var h={el:el,get paused(){return el.paused;},
      toggle:function(){ if(el.paused){ if(el.ended) el.currentTime=0; var p=el.play(); if(p&&p.catch)p.catch(function(){}); A.duck(true);} else { el.pause(); A.duck(false);} },
      stop:function(){ try{el.pause();el.currentTime=0;}catch(e){} A.duck(false); },
      analyser:el._an||null};
    el.onended=function(){ A.duck(false); if(cb)cb('ended'); };
    el.onpause=function(){ if(cb)cb('paused'); };
    el.onplay=function(){ if(cb)cb('playing'); };
    A.voice=el;
    return h;
  };
  A.stopVoice=function(){ if(A.voice){ try{A.voice.pause();}catch(e){} A.voice=null; } A.duck(false); };
  A.suspend=function(){ if(ctx&&ctx.state==='running') ctx.suspend(); };
  A.resume=function(){ if(ctx&&ctx.state==='suspended') ctx.resume(); };
})();
