// منطق العالم الخالص (بلا رسوم): الأسطح القابلة للمشي، العوائق، المسار الرئيسي، نقاط التفاعل
(function(){
  var L=G.Layout={shapes:[],obstacles:[],spine:[],regionStarts:[],regionNames:[],interact:[],ponds:[],falls:[],total:0};
  function R(th,seed){return 1+0.05*Math.sin(3*th+seed)+0.035*Math.sin(5*th+seed*1.7)+0.02*Math.sin(9*th+seed*2.3);}
  L.radial=R;
  L.addDisc=function(x,y,z,r,seed){
    var s={t:'d',x:x,y:y,z:z,r:r,seed:seed||0,minx:x-r*1.12,maxx:x+r*1.12,minz:z-r*1.12,maxz:z+r*1.12};
    L.shapes.push(s);return s;
  };
  L.addSeg=function(x1,y1,z1,x2,y2,z2,w){
    var hw=w/2,s={t:'s',x1:x1,y1:y1,z1:z1,x2:x2,y2:y2,z2:z2,w:w,
      minx:Math.min(x1,x2)-hw,maxx:Math.max(x1,x2)+hw,minz:Math.min(z1,z2)-hw,maxz:Math.max(z1,z2)+hw};
    s.dx=x2-x1;s.dz=z2-z1;s.len2=s.dx*s.dx+s.dz*s.dz;L.shapes.push(s);return s;
  };
  L.addObstacle=function(x,y,z,r,h,o){var ob={x:x,y:y,z:z,r:r,h:h||3,noCam:!!(o&&o.noCam),noBlock:!!(o&&o.noBlock)};L.obstacles.push(ob);return ob;};
  L.addWall=function(x1,y,z1,x2,z2,h,thick){
    var len=Math.hypot(x2-x1,z2-z1),n=Math.max(1,Math.ceil(len/((thick||0.8)*1.1)));
    for(var i=0;i<=n;i++){var t=i/n;L.addObstacle(x1+(x2-x1)*t,y,z1+(z2-z1)*t,(thick||0.8),h||3);}
  };
  // ارتفاع السطح عند نقطة. refY: ارتفاع اللاعب الحالي (لاختيار الطبقة الصحيحة)
  L.groundAt=function(x,z,refY,margin){
    var best=null,bd=1e9,m=margin||0,sh=L.shapes;
    for(var i=0;i<sh.length;i++){
      var s=sh[i]; if(x<s.minx||x>s.maxx||z<s.minz||z>s.maxz) continue;
      var y=null;
      if(s.t==='d'){
        var dx=x-s.x,dz=z-s.z,d=Math.sqrt(dx*dx+dz*dz),th=Math.atan2(dz,dx);
        if(d<s.r*R(th,s.seed)-m) y=s.y;
      } else {
        var t=s.len2>0?((x-s.x1)*s.dx+(z-s.z1)*s.dz)/s.len2:0; t=t<0?0:(t>1?1:t);
        var px=s.x1+s.dx*t,pz=s.z1+s.dz*t,d2=Math.hypot(x-px,z-pz);
        if(d2<=s.w/2-m) y=s.y1+(s.y2-s.y1)*t;
      }
      if(y===null) continue;
      if(refY===undefined||refY===null){ if(best===null||y>best) best=y; }
      else { var dd=Math.abs(y-refY); if(dd<=1.4&&dd<bd){bd=dd;best=y;} }
    }
    return best;
  };
  // دفع الجسم خارج العوائق (دوائر)
  L.resolve=function(p,rad,y){
    for(var it=0;it<2;it++){
      for(var i=0;i<L.obstacles.length;i++){
        var o=L.obstacles[i]; if(o.noBlock) continue;
        if(Math.abs(o.y-y)>2.5) continue;
        var dx=p.x-o.x,dz=p.z-o.z,rr=o.r+rad; if(dx>rr||dx<-rr||dz>rr||dz<-rr) continue;
        var d=Math.sqrt(dx*dx+dz*dz); if(d<rr){ if(d<1e-5){dx=1;dz=0;d=1;} var k=(rr-d)/d; p.x+=dx*k; p.z+=dz*k; }
      }
    }
  };
  L.camBlocked=function(x,y,z,pad){
    for(var i=0;i<L.obstacles.length;i++){
      var o=L.obstacles[i]; if(o.noCam) continue; if(y<o.y-1||y>o.y+o.h) continue;
      var dx=x-o.x,dz=z-o.z,rr=o.r+(pad||0.5); if(dx*dx+dz*dz<rr*rr) return true;
    }
    return false;
  };
  // ===== المسار الرئيسي =====
  L.spinePush=function(x,y,z){
    var sp=L.spine,n=sp.length;
    if(n){var l=sp[n-1]; if(Math.abs(l.x-x)<1e-4&&Math.abs(l.z-z)<1e-4) return; var s=l.s+Math.hypot(x-l.x,z-l.z);sp.push({x:x,y:y,z:z,s:s});}
    else sp.push({x:x,y:y,z:z,s:0});
    L.total=sp[sp.length-1].s;
  };
  L.markRegion=function(name){L.regionStarts.push(L.spine.length?L.spine[L.spine.length-1].s:0);L.regionNames.push(name);};
  // أقرب نقطة على المسار الرئيسي: يعيد المسافة التراكمية s
  L.project=function(x,z,hint){
    var sp=L.spine,best=1e18,bs=0,bi=0;
    for(var i=0;i<sp.length-1;i++){
      var a=sp[i],b=sp[i+1],dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz,t=l2>0?((x-a.x)*dx+(z-a.z)*dz)/l2:0;t=t<0?0:(t>1?1:t);
      var px=a.x+dx*t,pz=a.z+dz*t,d=(x-px)*(x-px)+(z-pz)*(z-pz);
      if(hint!==undefined){ var ss=a.s+(b.s-a.s)*t; d+=Math.abs(ss-hint)*0.02; }
      if(d<best){best=d;bs=a.s+(b.s-a.s)*t;bi=i;}
    }
    return {s:bs,i:bi,d:Math.sqrt(best)};
  };
  L.pointAt=function(s){
    var sp=L.spine; if(s<=0) return sp[0]; if(s>=L.total) return sp[sp.length-1];
    var lo=0,hi=sp.length-1; while(hi-lo>1){var m=(lo+hi)>>1; if(sp[m].s<=s) lo=m; else hi=m;}
    var a=sp[lo],b=sp[hi],t=(s-a.s)/Math.max(1e-6,b.s-a.s);
    return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t,s:s};
  };
  L.nearSpine=function(x,z,margin){
    var sp=L.spine;
    for(var i=0;i<sp.length-1;i++){
      var a=sp[i],b=sp[i+1],dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz,t=l2>0?((x-a.x)*dx+(z-a.z)*dz)/l2:0;t=t<0?0:(t>1?1:t);
      var px=a.x+dx*t,pz=a.z+dz*t; if((x-px)*(x-px)+(z-pz)*(z-pz)<margin*margin) return true;
    }
    return false;
  };
  L.regionAt=function(s){
    var r=0; for(var i=0;i<L.regionStarts.length;i++){ if(s>=L.regionStarts[i]-12) r=i; } return r;
  };
  // ===== التفاعل =====
  L.addInteract=function(o){ o.r=o.r||3.4; L.interact.push(o); return o; };
  L.nearestInteract=function(x,y,z){
    var best=null,bd=1e9;
    for(var i=0;i<L.interact.length;i++){
      var o=L.interact[i]; if(Math.abs(o.y-y)>4.5) continue;
      var d=Math.hypot(x-o.x,z-o.z); if(d<o.r&&d<bd){bd=d;best=o;}
    }
    return best;
  };
})();
