// شخصيتان ثلاثيتا الأبعاد (مبنيتان بالكود) مع حركة مشي/جري/وقوف/جلوس
(function(){
  var T=THREE;
  function M(color,o){return new T.MeshStandardMaterial(Object.assign({color:color,roughness:0.82,metalness:0},o||{}));}
  function mk(geo,mat,x,y,z,cast){var m=new T.Mesh(geo,mat);m.position.set(x||0,y||0,z||0);m.castShadow=cast!==false;return m;}
  function limb(rTop,rBot,len,mat){var g=new T.CylinderGeometry(rTop,rBot,len,10);g.translate(0,-len/2,0);return mk(g,mat,0,0,0);}
  function starShape(){var s=new T.Shape(),n=5,R=1,r=0.45;for(var i=0;i<n*2;i++){var a=Math.PI/2+i*Math.PI/n,rad=i%2?r:R;var x=Math.cos(a)*rad,y=Math.sin(a)*rad;if(i===0)s.moveTo(x,y);else s.lineTo(x,y);}s.closePath();return s;}

  G.makeHuman=function(kind){
    var me=kind==='me';
    var skin=M(me?0xb98458:0xf1cfb2,{roughness:0.7});
    var dark=M(0x120d10,{roughness:0.9});
    var white=M(0xf3efe8);
    var root=new T.Group(),body=new T.Group();root.add(body);
    var hipY=0.86;
    // ---- ملابس ----
    var topMat=M(me?0x16161a:0xc4202f), sleeveMat=M(me?0x16161a:0xf1ece2), pants=M(me?0x23252b:0x2c3a5f), shoe=M(0xf4f4f2);
    // ---- الجذع ----
    var torso=new T.Group();torso.position.y=hipY;body.add(torso);
    var tg=new T.CylinderGeometry(0.19,0.17,0.56,14);var tm=mk(tg,topMat,0,0.28,0);tm.scale.z=0.72;torso.add(tm);
    var pelvis=mk(new T.CylinderGeometry(0.17,0.17,0.14,14),pants,0,0.0,0);pelvis.scale.z=0.74;body.add(pelvis);pelvis.position.y=hipY;
    var neck=mk(new T.CylinderGeometry(0.055,0.065,0.1,8),skin,0,0.6,0);torso.add(neck);
    // ---- الرأس ----
    var head=new T.Group();head.position.set(0,0.82,0);torso.add(head);
    var hs=me?[1,1.06,0.96]:[1.02,1.0,0.98];
    var hm=mk(new T.SphereGeometry(0.22,22,16),skin,0,0.0,0);hm.scale.set(hs[0],hs[1],hs[2]);head.add(hm);
    [-1,1].forEach(function(s){
      var e=mk(new T.SphereGeometry(0.028,10,8),dark,s*0.078,0.02,0.19,false);e.scale.z=0.55;head.add(e);
      var h=mk(new T.SphereGeometry(0.009,6,6),white,s*0.078+0.01,0.03,0.213,false);head.add(h);
      var br=mk(new T.BoxGeometry(me?0.085:0.07,me?0.028:0.016,0.02),dark,s*0.078,me?0.085:0.088,0.198,false);br.rotation.z=-s*(me?0.1:0.16);br.rotation.y=-s*0.25;head.add(br);
      var ear=mk(new T.SphereGeometry(0.04,8,6),skin,s*0.215,-0.005,0,false);head.add(ear);
      if(!me){var ch=mk(new T.SphereGeometry(0.035,8,6),M(0xf2a8a4,{transparent:true,opacity:0.35}),s*0.115,-0.045,0.185,false);ch.scale.z=0.4;head.add(ch);}
    });
    head.add(mk(new T.SphereGeometry(0.026,8,6),M(me?0xa8744c:0xe5b999),0,-0.012,0.212,false));
    var mouth=mk(new T.TorusGeometry(0.036,0.0075,6,12,Math.PI),M(me?0x4a2018:0xb8505a),0,-0.065+(me?-0.005:0),0.205,false);mouth.rotation.z=Math.PI;head.add(mouth);
    // ---- شعر ----
    var hairMat=M(0x0d0a0d,{roughness:0.6});
    if(me){
      var b=mk(new T.SphereGeometry(0.236,18,12,0,Math.PI*2,0,Math.PI*0.30),hairMat,0,0.012,-0.005);b.scale.set(1,1.06,0.98);head.add(b);
      var back=mk(new T.SphereGeometry(0.238,18,12,Math.PI*0.78,Math.PI*1.44,0,Math.PI*0.66),hairMat,0,0.012,-0.005);back.scale.set(1,1.06,0.98);head.add(back);
      // تجعيدات
      var n=46,ic=new T.InstancedMesh(new T.IcosahedronGeometry(0.07,0),hairMat,n),dm=new T.Object3D(),rr=G.rng(11);
      for(var i=0;i<n;i++){
        var th=rr()*Math.PI*0.62,ph=rr()*Math.PI*2;
        if(th<Math.PI*0.36&&Math.abs(Math.sin(ph-Math.PI/2))<0.75&&Math.cos(ph-Math.PI/2)>0&&false){th=0.9;}
        var front=(Math.sin(ph)>0.55); if(front&&th>Math.PI*0.31) th=rr()*Math.PI*0.3;
        var rad=0.235;dm.position.set(-rad*Math.cos(ph)*Math.sin(th),rad*Math.cos(th)*1.06+0.012,rad*Math.sin(ph)*Math.sin(th)*0.98);
        var sc=0.8+rr()*0.7;dm.scale.set(sc,sc,sc);dm.rotation.set(rr()*3,rr()*3,rr()*3);dm.updateMatrix();ic.setMatrixAt(i,dm.matrix);
      }
      ic.castShadow=true;head.add(ic);
      // شارب ولحية خفيفة
      var must=mk(new T.BoxGeometry(0.1,0.022,0.03),dark,0,-0.043,0.207,false);head.add(must);
      var beardMat=M(0x1b1412,{roughness:0.95});
      var bd=mk(new T.SphereGeometry(0.228,16,10,Math.PI*0.14,Math.PI*0.72,Math.PI*0.6,Math.PI*0.33),beardMat,0,0,0,false);bd.scale.set(1,1.06,0.96);head.add(bd);
    } else {
      var fr=mk(new T.SphereGeometry(0.236,18,12,0,Math.PI*2,0,Math.PI*0.34),hairMat,0,0.012,-0.004);fr.scale.set(1.02,1.0,1.0);head.add(fr);
      var bk=mk(new T.SphereGeometry(0.238,18,12,Math.PI*0.7,Math.PI*1.6,0,Math.PI*0.72),hairMat,0,0.012,-0.006);bk.scale.set(1.03,1.0,1.0);head.add(bk);
      // خصلات أمامية
      [-1,1].forEach(function(s){var l=limb(0.032,0.024,0.42,hairMat);l.position.set(s*0.2,-0.12,0.1);l.rotation.z=s*0.04;head.add(l);});
    }
    // ---- شعر طويل متحرك لبانا ----
    var hairChain=[];
    if(!me){
      var hp=new T.Group();hp.position.set(0,-0.04,-0.15);head.add(hp);var parent=hp;
      var segs=[[0.2,0.185,0.3],[0.185,0.165,0.3],[0.165,0.12,0.3]];
      segs.forEach(function(sg,i){
        var g=new T.CylinderGeometry(sg[0],sg[1],sg[2],12);g.translate(0,-sg[2]/2,0);var m=mk(g,hairMat,0,0,0);m.scale.z=0.55;
        var grp=new T.Group();grp.add(m);grp.position.y=i===0?0:-0.3;parent.add(grp);hairChain.push(grp);parent=grp;
      });
    }
    // ---- هودي / جاكيت ----
    if(me){
      var hood=mk(new T.SphereGeometry(0.15,12,8),topMat,0,0.575,-0.1);hood.scale.set(1.35,0.7,0.8);torso.add(hood);
      var pocket=mk(new T.BoxGeometry(0.3,0.1,0.03),M(0x202026),0,0.1,0.135,false);torso.add(pocket);
      [-1,1].forEach(function(s){
        var st=limb(0.009,0.009,0.2,white);st.position.set(s*0.04,0.53,0.135);st.rotation.x=0.05;torso.add(st);
        var tip=mk(new T.SphereGeometry(0.015,6,6),white,s*0.04,0.33,0.14,false);torso.add(tip);
      });
    } else {
      var hem=mk(new T.CylinderGeometry(0.17,0.17,0.06,14),white,0,0.03,0);hem.scale.z=0.74;torso.add(hem);
      var col=mk(new T.TorusGeometry(0.085,0.032,8,16),white,0,0.57,0);col.rotation.x=Math.PI/2;col.scale.y=1;torso.add(col);
      var starG=new T.ShapeGeometry(starShape());var st=mk(starG,M(0xfff1c2,{side:T.DoubleSide,emissive:0x332200}),0.075,0.42,0.141,false);st.scale.set(0.045,0.045,0.045);torso.add(st);
      var patch=mk(new T.CircleGeometry(0.062,16),M(0xa81623),0.075,0.42,0.139,false);torso.add(patch);
    }
    // ---- أذرع ----
    function arm(s){
      var sh=new T.Group();sh.position.set(s*0.235,0.55,0);torso.add(sh);
      var up=limb(0.062,0.055,0.3,sleeveMat);sh.add(up);
      var el=new T.Group();el.position.y=-0.3;sh.add(el);
      var fa=limb(0.054,0.046,0.27,sleeveMat);el.add(fa);
      if(!me){var cuff=mk(new T.CylinderGeometry(0.052,0.052,0.045,10),M(0xc4202f),0,-0.245,0);el.add(cuff);}
      var hd=mk(new T.SphereGeometry(0.055,10,8),skin,0,-0.31,0);el.add(hd);
      var sj=mk(new T.SphereGeometry(0.068,10,8),me?topMat:topMat,0,0,0);sh.add(sj);
      return {sh:sh,el:el};
    }
    var armL=arm(1),armR=arm(-1); // وجهها +z: اليسار على +x
    // ---- أرجل ----
    function leg(s){
      var hp=new T.Group();hp.position.set(s*0.095,hipY,0);body.add(hp);
      hp.add(limb(0.088,0.07,0.43,pants));
      var kn=new T.Group();kn.position.y=-0.43;hp.add(kn);
      kn.add(limb(0.07,0.058,0.41,pants));
      var ft=mk(new T.BoxGeometry(0.115,0.085,0.27),shoe,0,-0.41,0.05);kn.add(ft);
      var sole=mk(new T.BoxGeometry(0.12,0.025,0.275),M(0xb9b6b0),0,-0.455,0.05,false);kn.add(sole);
      return {hp:hp,kn:kn};
    }
    var legL=leg(1),legR=leg(-1);

    // ===== حالة الحركة =====
    var st={phase:0,walk:0,run:0,sit:0,t:Math.random()*10,lastStep:0,onStep:null,look:0,emote:null,em:0,emName:null,lean:0};
    function update(dt,speed,running,sitTarget){
      st.t+=dt;
      var spN=G.clamp(speed/3,0,1.6);
      var walkT=G.clamp(speed/2.6,0,1);
      st.walk=G.damp(st.walk,walkT,10,dt);
      st.run=G.damp(st.run,running&&speed>3.5?1:0,7,dt);
      st.sit=G.damp(st.sit,sitTarget?1:0,5,dt);
      var f=Math.max(0.0,speed)*0.36; st.phase+=Math.PI*2*f*dt;
      var A=(0.55+0.45*st.run)*st.walk,ph=st.phase,s=Math.sin(ph),c=Math.cos(ph),k=1-st.sit;
      var sit=st.sit;
      legL.hp.rotation.x=(-s*A)*k+(-1.5)*sit; legR.hp.rotation.x=(s*A)*k+(-1.5)*sit;
      legL.kn.rotation.x=(Math.max(0,c)*(0.8+0.5*st.run)*st.walk)*k+1.5*sit;
      legR.kn.rotation.x=(Math.max(0,-c)*(0.8+0.5*st.run)*st.walk)*k+1.5*sit;
      var armA=(0.5+0.45*st.run)*st.walk*k;
      armL.sh.rotation.x=(s*armA)+(-0.35)*sit; armR.sh.rotation.x=(-s*armA)+(-0.35)*sit;
      armL.sh.rotation.z=-0.07-0.02*Math.sin(st.t*1.3); armR.sh.rotation.z=0.07+0.02*Math.sin(st.t*1.3+1);
      var eb=(0.25+0.9*st.run)*st.walk*k+(0.9)*sit;
      armL.el.rotation.x=-0.15*k-eb*0.9+(sit?0:0); armR.el.rotation.x=-0.15*k-eb*0.9;
      var bob=Math.abs(c)*0.055*st.walk*(1+st.run*0.8)-0.02*st.walk;
      body.position.y=bob*k-0.43*sit;
      torso.rotation.x=(0.04+0.16*st.run)*st.walk*k-0.1*sit;
      torso.rotation.y=Math.sin(ph)*0.14*st.walk*k;
      torso.scale.y=1+Math.sin(st.t*1.8)*0.012;
      head.rotation.y=-torso.rotation.y*0.8+Math.sin(st.t*0.45)*0.12*(1-st.walk)+st.look;
      head.rotation.x=-torso.rotation.x*0.6+Math.sin(st.t*0.7)*0.03;
      // ---- إيماءات (تُستخدم في الأنشطة؛ لا تؤثر عند غيابها) ----
      torso.rotation.z=0;
      st.em=G.damp(st.em,st.emote?1:0,9,dt); if(st.emote)st.emName=st.emote;
      if(st.em>0.002&&st.emName){
        var w=st.em,tt=st.t,n=st.emName;
        var mx=function(o,p,v){o.rotation[p]+=(v-o.rotation[p])*w;};
        if(n==='cheer'){var u=Math.sin(tt*9)*0.22;mx(armL.sh,'x',-2.6+u);mx(armR.sh,'x',-2.6-u);mx(armL.sh,'z',0.35);mx(armR.sh,'z',-0.35);mx(armL.el,'x',-0.25);mx(armR.el,'x',-0.25);mx(head,'x',-0.2);body.position.y+=Math.abs(Math.sin(tt*9))*0.03*w;}
        else if(n==='clap'){var cl=Math.abs(Math.sin(tt*9));mx(armL.sh,'x',-1.15);mx(armR.sh,'x',-1.15);mx(armL.sh,'z',-0.5+cl*0.4);mx(armR.sh,'z',0.5-cl*0.4);mx(armL.el,'x',-1.25);mx(armR.el,'x',-1.25);}
        else if(n==='wave'){mx(armR.sh,'x',-2.5);mx(armR.sh,'z',-0.55);mx(armR.el,'x',-0.5+Math.sin(tt*8)*0.5);}
        else if(n==='laugh'){mx(torso,'x',-0.12+Math.sin(tt*15)*0.06);mx(armL.sh,'x',-0.7);mx(armR.sh,'x',-0.7);mx(armL.el,'x',-1.3);mx(armR.el,'x',-1.3);mx(head,'x',-0.3);}
        else if(n==='catch'){mx(armL.sh,'x',-1.35);mx(armR.sh,'x',-1.35);mx(armL.sh,'z',-0.18);mx(armR.sh,'z',0.18);mx(armL.el,'x',-0.5);mx(armR.el,'x',-0.5);}
        else if(n==='hold'){mx(armL.sh,'x',-1.0);mx(armR.sh,'x',-1.0);mx(armL.sh,'z',0.08);mx(armR.sh,'z',-0.08);mx(armL.el,'x',-0.9);mx(armR.el,'x',-0.9);}
        else if(n==='push'){var pp=0.5+0.5*Math.sin(tt*14);mx(armL.sh,'x',-1.5-pp*0.15);mx(armR.sh,'x',-1.5-pp*0.15);mx(armL.sh,'z',0.1);mx(armR.sh,'z',-0.1);mx(armL.el,'x',-0.15);mx(armR.el,'x',-0.15);mx(torso,'x',0.2);}
        else if(n==='balance'){var bw=Math.sin(tt*6)*0.2;mx(armL.sh,'z',1.35+bw);mx(armR.sh,'z',-1.35+bw);mx(armL.sh,'x',0);mx(armR.sh,'x',0);mx(torso,'z',st.lean*0.4);}
        else if(n==='wobble'){var wb=Math.sin(tt*11);mx(armL.sh,'z',1.5+wb*0.3);mx(armR.sh,'z',-1.5+wb*0.3);mx(armL.sh,'x',-0.4);mx(armR.sh,'x',-0.4);mx(torso,'z',wb*0.18);mx(head,'x',-0.15);}
        else if(n==='sad'){mx(head,'x',0.55);mx(torso,'x',0.18);mx(armL.sh,'z',0.05);mx(armR.sh,'z',-0.05);}
        else if(n==='freeze'){mx(armL.sh,'x',-0.2);mx(armR.sh,'x',-0.2);mx(armL.el,'x',-0.2);mx(armR.el,'x',-0.2);mx(head,'x',0.1);}
      }
      // شعر
      var sw=st.walk;
      for(var i=0;i<hairChain.length;i++){
        hairChain[i].rotation.x=-0.04-sw*(0.12+0.08*st.run)+Math.sin(st.t*2.1+i*0.9)*(0.035+0.05*sw);
        hairChain[i].rotation.z=Math.sin(st.t*1.5+i*0.8)*(0.03+0.05*sw);
      }
      // خطوات
      var stepIdx=Math.floor((ph+Math.PI/2)/Math.PI);
      if(stepIdx!==st.lastStep){ st.lastStep=stepIdx; if(st.walk>0.55&&st.sit<0.2&&st.onStep) st.onStep(st.run>0.5); }
    }
    return {root:root,update:update,state:st,head:head,hairChain:hairChain,setEmote:function(n){st.emote=n||null;}};
  };
})();
