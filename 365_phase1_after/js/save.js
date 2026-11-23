(function(){
  var KEY='365-between-two-hearts-v1';
  var defaults=function(){return {v:1,started:false,finished:false,pos:null,yaw:0,region:0,maxRegion:0,seen:{},act:{},
    settings:{music:0.6,voice:1,sfx:0.7,musicOn:true,sfxOn:true,lock:true,quality:'auto'}};};
  var S=G.Save={data:defaults(),available:true,_t:0};
  function store(){try{var s=window.localStorage;var k='__t';s.setItem(k,'1');s.removeItem(k);return s;}catch(e){return null;}}
  var ls=store(); if(!ls) S.available=false;
  S.load=function(){
    if(!ls) return false;
    try{var raw=ls.getItem(KEY); if(!raw) return false; var d=JSON.parse(raw);
      var base=defaults(); for(var k in base){ if(d[k]===undefined) d[k]=base[k]; }
      for(var k2 in base.settings){ if(d.settings[k2]===undefined) d.settings[k2]=base.settings[k2]; }
      S.data=d; return true;}catch(e){return false;}
  };
  S.save=function(){ if(!ls) return false; try{ls.setItem(KEY,JSON.stringify(S.data)); return true;}catch(e){return false;} };
  S.hasJourney=function(){return !!(S.data.started && S.data.pos);};
  S.markSeen=function(id){ if(!S.data.seen[id]){S.data.seen[id]=1;S.save();return true;} return false; };
  S.resetJourney=function(){ var st=S.data.settings; S.data=defaults(); S.data.settings=st; S.save(); };
})();
