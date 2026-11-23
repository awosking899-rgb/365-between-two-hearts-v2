window.G = window.G || {};
(function(){
  G.clamp=function(v,a,b){return v<a?a:(v>b?b:v);};
  G.lerp=function(a,b,t){return a+(b-a)*t;};
  G.smooth=function(a,b,x){var t=G.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
  G.damp=function(a,b,k,dt){return a+(b-a)*(1-Math.exp(-k*dt));};
  G.angDiff=function(a,b){var d=(b-a)%(Math.PI*2);if(d>Math.PI)d-=Math.PI*2;if(d<-Math.PI)d+=Math.PI*2;return d;};
  G.dampAngle=function(a,b,k,dt){return a+G.angDiff(a,b)*(1-Math.exp(-k*dt));};
  G.rng=function(seed){var s=seed>>>0;return function(){s=(s+0x6D2B79F5)>>>0;var t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};};
  G.$=function(id){return document.getElementById(id);};
  G.isTouch=('ontouchstart' in window)||(navigator.maxTouchPoints>0);
  G.isMobile=G.isTouch && Math.min(screen.width,screen.height)<900;
  document.body.classList.add(G.isTouch?'touch':'desktop');
  if(!G.isTouch) document.body.classList.add('desktop');
  G.timeUniform={value:0}; G.fx={finale:0};
  // أسماء الشخصيتين (اللاعبة بانا، والمرافق أوس)
  G.NAMES={player:'بانا',companion:'أوس'};
  // أرقام عربية-هندية
  G.ar=function(n){return String(n).replace(/\d/g,function(d){return '٠١٢٣٤٥٦٧٨٩'[d];});};
})();
