// محرك عرض WebGL2 مصغّر مدمج في المشروع (بديل لمكتبة Three.js بنفس أسماء الواجهة المستخدمة في اللعبة فقط)
// لا يعتمد على أي ملف أو خدمة خارجية.
(function(){
'use strict';
var T=window.THREE={};
T.sRGBEncoding=3001;T.LinearEncoding=3000;T.FrontSide=0;T.BackSide=1;T.DoubleSide=2;T.NormalBlending=1;T.AdditiveBlending=2;
T.RepeatWrapping=1000;T.ClampToEdgeWrapping=1001;T.LinearFilter=1006;T.LinearMipmapLinearFilter=1008;T.ACESFilmicToneMapping=4;T.PCFSoftShadowMap=2;
var _id=1,PI=Math.PI,sin=Math.sin,cos=Math.cos,sqrt=Math.sqrt;

// ===== رياضيات =====
function Color(r,g,b){this.r=1;this.g=1;this.b=1;if(r!==undefined)this.set(r,g,b);}
Color.prototype={
  set:function(v,g,b){if(v instanceof Color)return this.copy(v);if(g!==undefined){this.r=v;this.g=g;this.b=b;return this;}v=v|0;this.r=(v>>16&255)/255;this.g=(v>>8&255)/255;this.b=(v&255)/255;return this;},
  copy:function(c){this.r=c.r;this.g=c.g;this.b=c.b;return this;},clone:function(){return new Color(this.r,this.g,this.b);},
  lerp:function(c,t){this.r+=(c.r-this.r)*t;this.g+=(c.g-this.g)*t;this.b+=(c.b-this.b)*t;return this;},
  multiplyScalar:function(s){this.r*=s;this.g*=s;this.b*=s;return this;},
  getHex:function(){function q(v){return Math.max(0,Math.min(255,Math.round(v*255)));}return (q(this.r)<<16)|(q(this.g)<<8)|q(this.b);}
};
T.Color=Color;
function Vector3(x,y,z){this.x=x||0;this.y=y||0;this.z=z||0;}
Vector3.prototype={set:function(x,y,z){this.x=x;this.y=y;this.z=z;return this;},copy:function(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;},clone:function(){return new Vector3(this.x,this.y,this.z);},
  add:function(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this;},sub:function(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;},length:function(){return sqrt(this.x*this.x+this.y*this.y+this.z*this.z);}};
T.Vector3=Vector3;
function Euler(){this.x=0;this.y=0;this.z=0;this.order='XYZ';}
Euler.prototype.set=function(x,y,z,o){this.x=x;this.y=y;this.z=z;if(o)this.order=o;return this;};
function Matrix4(){this.elements=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);}
T.Matrix4=Matrix4;
function mmul(o,a,b){ // o=a*b (عمودي)
  var a00=a[0],a01=a[1],a02=a[2],a03=a[3],a10=a[4],a11=a[5],a12=a[6],a13=a[7],a20=a[8],a21=a[9],a22=a[10],a23=a[11],a30=a[12],a31=a[13],a32=a[14],a33=a[15];
  for(var i=0;i<4;i++){var b0=b[i*4],b1=b[i*4+1],b2=b[i*4+2],b3=b[i*4+3];
    o[i*4]=a00*b0+a10*b1+a20*b2+a30*b3;o[i*4+1]=a01*b0+a11*b1+a21*b2+a31*b3;o[i*4+2]=a02*b0+a12*b1+a22*b2+a32*b3;o[i*4+3]=a03*b0+a13*b1+a23*b2+a33*b3;}
  return o;
}
function rotMat(axis,a){var c=cos(a),s=sin(a),m=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
  if(axis==='X'){m[5]=c;m[6]=s;m[9]=-s;m[10]=c;}else if(axis==='Y'){m[0]=c;m[2]=-s;m[8]=s;m[10]=c;}else{m[0]=c;m[1]=s;m[4]=-s;m[5]=c;}return m;}
var _t1=new Float32Array(16),_t2=new Float32Array(16);
function compose(m,p,e,s){
  var o=e.order,R=rotMat(o[0],e[o[0].toLowerCase()]);
  mmul(_t1,R,rotMat(o[1],e[o[1].toLowerCase()]));mmul(_t2,_t1,rotMat(o[2],e[o[2].toLowerCase()]));
  for(var c=0;c<3;c++){var k=c===0?s.x:(c===1?s.y:s.z);m[c*4]=_t2[c*4]*k;m[c*4+1]=_t2[c*4+1]*k;m[c*4+2]=_t2[c*4+2]*k;m[c*4+3]=0;}
  m[12]=p.x;m[13]=p.y;m[14]=p.z;m[15]=1;
}
function perspective(o,fov,asp,n,f){var t=1/Math.tan(fov*PI/360),nf=1/(n-f);o.fill(0);o[0]=t/asp;o[5]=t;o[10]=(f+n)*nf;o[11]=-1;o[14]=2*f*n*nf;return o;}
function ortho(o,l,r,b,t,n,f){o.fill(0);o[0]=2/(r-l);o[5]=2/(t-b);o[10]=-2/(f-n);o[12]=-(r+l)/(r-l);o[13]=-(t+b)/(t-b);o[14]=-(f+n)/(f-n);o[15]=1;return o;}
function lookAtM(o,ex,ey,ez,tx,ty,tz,ux,uy,uz){
  var fx=tx-ex,fy=ty-ey,fz=tz-ez,l=sqrt(fx*fx+fy*fy+fz*fz)||1;fx/=l;fy/=l;fz/=l;
  var sx=fy*uz-fz*uy,sy=fz*ux-fx*uz,sz=fx*uy-fy*ux;l=sqrt(sx*sx+sy*sy+sz*sz)||1;sx/=l;sy/=l;sz/=l;
  var vx=sy*fz-sz*fy,vy=sz*fx-sx*fz,vz=sx*fy-sy*fx;
  o[0]=sx;o[1]=vx;o[2]=-fx;o[3]=0;o[4]=sy;o[5]=vy;o[6]=-fy;o[7]=0;o[8]=sz;o[9]=vz;o[10]=-fz;o[11]=0;
  o[12]=-(sx*ex+sy*ey+sz*ez);o[13]=-(vx*ex+vy*ey+vz*ez);o[14]=(fx*ex+fy*ey+fz*ez);o[15]=1;return o;
}

// ===== عقد المشهد =====
function Object3D(){this.id=_id++;this.position=new Vector3();this.rotation=new Euler();this.scale=new Vector3(1,1,1);this.matrix=new Matrix4();this.matrixWorld=new Matrix4();
  this.children=[];this.parent=null;this.visible=true;this.castShadow=false;this.receiveShadow=false;this.frustumCulled=true;this.renderOrder=0;this.userData={};}
Object3D.prototype.add=function(o){if(o.parent)o.parent.remove(o);o.parent=this;this.children.push(o);return this;};
Object3D.prototype.remove=function(o){var i=this.children.indexOf(o);if(i>=0){this.children.splice(i,1);o.parent=null;}return this;};
Object3D.prototype.updateMatrix=function(){compose(this.matrix.elements,this.position,this.rotation,this.scale);};
Object3D.prototype.updateMatrixWorld=function(pm){
  this.updateMatrix();var w=this.matrixWorld.elements;
  if(pm)mmul(w,pm,this.matrix.elements);else w.set(this.matrix.elements);
  for(var i=0;i<this.children.length;i++)this.children[i].updateMatrixWorld(w);
};
T.Object3D=Object3D;T.Group=function(){Object3D.call(this);this.type='Group';};T.Group.prototype=Object.create(Object3D.prototype);
T.Scene=function(){Object3D.call(this);this.type='Scene';this.fog=null;};T.Scene.prototype=Object.create(Object3D.prototype);
T.Fog=function(c,n,f){this.color=new Color(c);this.near=n;this.far=f;};
function inherit(C,P,type){C.prototype=Object.create(P.prototype);C.prototype.constructor=C;C.prototype.type=type;}
T.Mesh=function(g,m){Object3D.call(this);this.geometry=g;this.material=m;};inherit(T.Mesh,Object3D,'Mesh');
T.InstancedMesh=function(g,m,n){T.Mesh.call(this,g,m);this.count=n;this.instanceMatrix=new BufferAttribute(new Float32Array(n*16),16);this.instanceColor=null;this.frustumCulled=false;
  for(var i=0;i<n;i++){var e=this.instanceMatrix.array;e[i*16]=e[i*16+5]=e[i*16+10]=e[i*16+15]=1;}};
inherit(T.InstancedMesh,T.Mesh,'InstancedMesh');
T.InstancedMesh.prototype.setMatrixAt=function(i,m){this.instanceMatrix.array.set(m.elements,i*16);};
T.InstancedMesh.prototype.setColorAt=function(i,c){if(!this.instanceColor)this.instanceColor=new BufferAttribute(new Float32Array(this.count*3),3);var a=this.instanceColor.array;a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b;};
T.Points=function(g,m){Object3D.call(this);this.geometry=g;this.material=m;};inherit(T.Points,Object3D,'Points');
T.Line=function(g,m){Object3D.call(this);this.geometry=g;this.material=m;};inherit(T.Line,Object3D,'Line');
T.Sprite=function(m){Object3D.call(this);this.material=m;this.geometry=null;};inherit(T.Sprite,Object3D,'Sprite');
T.PerspectiveCamera=function(fov,asp,n,f){Object3D.call(this);this.fov=fov;this.aspect=asp;this.near=n;this.far=f;this._t=new Vector3(0,0,-1);this.proj=new Float32Array(16);this.view=new Float32Array(16);this.updateProjectionMatrix();};
inherit(T.PerspectiveCamera,Object3D,'Camera');
T.PerspectiveCamera.prototype.updateProjectionMatrix=function(){perspective(this.proj,this.fov,this.aspect,this.near,this.far);};
T.PerspectiveCamera.prototype.lookAt=function(x,y,z){if(typeof x==='object'){this._t.copy(x);}else this._t.set(x,y,z);};
// أضواء
T.HemisphereLight=function(s,g,i){Object3D.call(this);this.color=new Color(s);this.groundColor=new Color(g);this.intensity=i===undefined?1:i;this.type='Hemi';};inherit(T.HemisphereLight,Object3D,'Hemi');
T.DirectionalLight=function(c,i){Object3D.call(this);this.color=new Color(c);this.intensity=i===undefined?1:i;this.target=new Object3D();
  this.shadow={mapSize:{x:1024,y:1024,set:function(a,b){this.x=a;this.y=b;}},camera:{left:-5,right:5,top:5,bottom:-5,near:0.5,far:500},bias:0,normalBias:0};};inherit(T.DirectionalLight,Object3D,'Dir');
T.PointLight=function(c,i,d,decay){Object3D.call(this);this.color=new Color(c);this.intensity=i===undefined?1:i;this.distance=d||0;this.decay=decay===undefined?2:decay;};inherit(T.PointLight,Object3D,'Point');

// ===== هندسة =====
function BufferAttribute(a,n){this.array=a;this.itemSize=n;this.count=a.length/n;this.needsUpdate=false;this._buf=null;this._ep=-1;}
BufferAttribute.prototype={
  setXYZ:function(i,x,y,z){var a=this.array;a[i*3]=x;a[i*3+1]=y;a[i*3+2]=z;return this;},setX:function(i,x){this.array[i*this.itemSize]=x;return this;},
  getX:function(i){return this.array[i*this.itemSize];}
};
T.BufferAttribute=BufferAttribute;
T.Float32BufferAttribute=function(a,n){return new BufferAttribute(a instanceof Float32Array?a:new Float32Array(a),n);};
function BufferGeometry(){this.id=_id++;this.attributes={};this.index=null;this.bs=null;}
T.BufferGeometry=BufferGeometry;
BufferGeometry.prototype={
  setAttribute:function(n,a){this.attributes[n]=a;this.bs=null;return this;},
  setIndex:function(arr){var n=arr.length,big=false;for(var i=0;i<n;i++)if(arr[i]>65535){big=true;break;}
    this.index=new BufferAttribute(big?new Uint32Array(arr):new Uint16Array(arr),1);return this;},
  setFromPoints:function(pts){var a=new Float32Array(pts.length*3);pts.forEach(function(p,i){a[i*3]=p.x;a[i*3+1]=p.y;a[i*3+2]=p.z;});this.setAttribute('position',new BufferAttribute(a,3));return this;},
  translate:function(x,y,z){var p=this.attributes.position.array;for(var i=0;i<p.length;i+=3){p[i]+=x;p[i+1]+=y;p[i+2]+=z;}this.bs=null;return this;},
  rotateX:function(a){var c=cos(a),s=sin(a);['position','normal'].forEach(function(k){var at=this.attributes[k];if(!at)return;var p=at.array;for(var i=0;i<p.length;i+=3){var y=p[i+1],z=p[i+2];p[i+1]=y*c-z*s;p[i+2]=y*s+z*c;}},this);this.bs=null;return this;},
  computeVertexNormals:function(){
    var P=this.attributes.position.array,n=P.length/3,N=new Float32Array(P.length),I=this.index?this.index.array:null,cnt=I?I.length:n;
    for(var f=0;f<cnt;f+=3){var a=I?I[f]:f,b=I?I[f+1]:f+1,c=I?I[f+2]:f+2;
      var ax=P[a*3],ay=P[a*3+1],az=P[a*3+2],ux=P[b*3]-ax,uy=P[b*3+1]-ay,uz=P[b*3+2]-az,vx=P[c*3]-ax,vy=P[c*3+1]-ay,vz=P[c*3+2]-az;
      var nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
      [a,b,c].forEach(function(i){N[i*3]+=nx;N[i*3+1]+=ny;N[i*3+2]+=nz;});}
    for(var i=0;i<n;i++){var l=sqrt(N[i*3]*N[i*3]+N[i*3+1]*N[i*3+1]+N[i*3+2]*N[i*3+2])||1;N[i*3]/=l;N[i*3+1]/=l;N[i*3+2]/=l;}
    this.attributes.normal=new BufferAttribute(N,3);return this;},
  boundingSphere:function(){
    if(this.bs)return this.bs;var p=this.attributes.position.array,mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];
    for(var i=0;i<p.length;i+=3)for(var k=0;k<3;k++){if(p[i+k]<mn[k])mn[k]=p[i+k];if(p[i+k]>mx[k])mx[k]=p[i+k];}
    var cx=(mn[0]+mx[0])/2,cy=(mn[1]+mx[1])/2,cz=(mn[2]+mx[2])/2,r=0;
    for(var j=0;j<p.length;j+=3){var dx=p[j]-cx,dy=p[j+1]-cy,dz=p[j+2]-cz,d=dx*dx+dy*dy+dz*dz;if(d>r)r=d;}
    return this.bs={x:cx,y:cy,z:cz,r:sqrt(r)};}
};
function build(P,N,U,I){var g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array(P),3));if(N)g.setAttribute('normal',new BufferAttribute(new Float32Array(N),3));
  if(U)g.setAttribute('uv',new BufferAttribute(new Float32Array(U),2));if(I)g.setIndex(I);return g;}
T.BoxGeometry=function(w,h,d){
  var P=[],N=[],U=[],I=[],F=[[1,0,0,0,0,-1,0,1,0],[-1,0,0,0,0,1,0,1,0],[0,1,0,1,0,0,0,0,-1],[0,-1,0,1,0,0,0,0,1],[0,0,1,1,0,0,0,1,0],[0,0,-1,-1,0,0,0,1,0]],hs=[w/2,h/2,d/2];
  F.forEach(function(f,k){var n=f.slice(0,3),u=f.slice(3,6),v=f.slice(6,9),b=P.length/3;
    [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(function(q){var p=[];for(var a=0;a<3;a++)p.push(n[a]*hs[a]+u[a]*q[0]*hs[a]+v[a]*q[1]*hs[a]);
      // الأبعاد المستخدمة هي نصف الطول على كل محور
      P.push(p[0],p[1],p[2]);N.push(n[0],n[1],n[2]);U.push((q[0]+1)/2,(q[1]+1)/2);});
    I.push(b,b+1,b+2,b,b+2,b+3);});
  return build(P,N,U,I);};
T.PlaneGeometry=function(w,h){var x=w/2,y=h/2;return build([-x,-y,0,x,-y,0,x,y,0,-x,y,0],[0,0,1,0,0,1,0,0,1,0,0,1],[0,0,1,0,1,1,0,1],[0,1,2,0,2,3]);};
T.CircleGeometry=function(r,seg){var P=[0,0,0],N=[0,0,1],U=[0.5,0.5],I=[];for(var i=0;i<=seg;i++){var a=i/seg*PI*2;P.push(r*cos(a),r*sin(a),0);N.push(0,0,1);U.push(cos(a)/2+0.5,sin(a)/2+0.5);if(i>0)I.push(0,i,i+1);}return build(P,N,U,I);};
T.RingGeometry=function(ri,ro,seg){var P=[],N=[],U=[],I=[];for(var i=0;i<=seg;i++){var a=i/seg*PI*2,c=cos(a),s=sin(a);P.push(ri*c,ri*s,0,ro*c,ro*s,0);N.push(0,0,1,0,0,1);U.push(c/2+.5,s/2+.5,c/2+.5,s/2+.5);if(i<seg){var b=i*2;I.push(b,b+1,b+3,b,b+3,b+2);}}return build(P,N,U,I);};
T.CylinderGeometry=function(rt,rb,h,rad,hs){
  rad=rad||8;var P=[],N=[],U=[],I=[],sl=(rb-rt)/h;
  for(var i=0;i<=rad;i++){var th=i/rad*PI*2,s=sin(th),c=cos(th),nl=sqrt(1+sl*sl);
    P.push(rt*s,h/2,rt*c,rb*s,-h/2,rb*c);N.push(s/nl,sl/nl,c/nl,s/nl,sl/nl,c/nl);U.push(i/rad,1,i/rad,0);
    if(i<rad){var b=i*2;I.push(b,b+1,b+2,b+1,b+3,b+2);}}
  function cap(r,y,up){if(r<=0)return;var b=P.length/3;P.push(0,y,0);N.push(0,up,0);U.push(.5,.5);
    for(var i=0;i<=rad;i++){var th=i/rad*PI*2;P.push(r*sin(th),y,r*cos(th));N.push(0,up,0);U.push(sin(th)/2+.5,cos(th)/2+.5);if(i<rad){if(up>0)I.push(b,b+1+i,b+2+i);else I.push(b,b+2+i,b+1+i);}}}
  cap(rt,h/2,1);cap(rb,-h/2,-1);return build(P,N,U,I);};
T.ConeGeometry=function(r,h,rad){return new T.CylinderGeometry(0,r,h,rad);};
T.SphereGeometry=function(r,ws,hs,ps,pl,ts,tl){
  ws=Math.max(3,ws|0||8);hs=Math.max(2,hs|0||6);ps=ps||0;pl=pl===undefined?PI*2:pl;ts=ts||0;tl=tl===undefined?PI:tl;
  var P=[],N=[],U=[],I=[],grid=[],k=0,te=ts+tl;
  for(var iy=0;iy<=hs;iy++){var row=[],v=iy/hs;for(var ix=0;ix<=ws;ix++){var u=ix/ws,x=-r*cos(ps+u*pl)*sin(ts+v*tl),y=r*cos(ts+v*tl),z=r*sin(ps+u*pl)*sin(ts+v*tl);
    P.push(x,y,z);var l=sqrt(x*x+y*y+z*z)||1;N.push(x/l,y/l,z/l);U.push(u,1-v);row.push(k++);}grid.push(row);}
  for(var iy2=0;iy2<hs;iy2++)for(var ix2=0;ix2<ws;ix2++){var a=grid[iy2][ix2+1],b=grid[iy2][ix2],c=grid[iy2+1][ix2],d=grid[iy2+1][ix2+1];
    if(iy2!==0||ts>0)I.push(a,b,d);if(iy2!==hs-1||te<PI)I.push(b,c,d);}
  return build(P,N,U,I);};
T.TorusGeometry=function(R,tube,rs,ts,arc){arc=arc===undefined?PI*2:arc;var P=[],N=[],U=[],I=[];
  for(var j=0;j<=rs;j++)for(var i=0;i<=ts;i++){var u=i/ts*arc,v=j/rs*PI*2,x=(R+tube*cos(v))*cos(u),y=(R+tube*cos(v))*sin(u),z=tube*sin(v);
    P.push(x,y,z);var nx=x-R*cos(u),ny=y-R*sin(u),l=sqrt(nx*nx+ny*ny+z*z)||1;N.push(nx/l,ny/l,z/l);U.push(i/ts,j/rs);}
  for(var j2=1;j2<=rs;j2++)for(var i2=1;i2<=ts;i2++){var a=(ts+1)*j2+i2-1,b=(ts+1)*(j2-1)+i2-1,c=(ts+1)*(j2-1)+i2,d=(ts+1)*j2+i2;I.push(a,b,d,b,c,d);}
  return build(P,N,U,I);};
function poly(V,F,r,detail,sphereProj){
  var P=[],N=[];
  function push(a,b,c){ // اتجاه للخارج + عمودي مسطح
    var ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2],nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
    var cx=a[0]+b[0]+c[0],cy=a[1]+b[1]+c[1],cz=a[2]+b[2]+c[2];if(nx*cx+ny*cy+nz*cz<0){var t=b;b=c;c=t;nx=-nx;ny=-ny;nz=-nz;}
    var l=sqrt(nx*nx+ny*ny+nz*nz)||1;[a,b,c].forEach(function(p){P.push(p[0]*r,p[1]*r,p[2]*r);N.push(nx/l,ny/l,nz/l);});}
  function nrm(p){var l=sqrt(p[0]*p[0]+p[1]*p[1]+p[2]*p[2])||1;return [p[0]/l,p[1]/l,p[2]/l];}
  V=V.map(nrm);
  for(var f=0;f<F.length;f+=3){var A=V[F[f]],B=V[F[f+1]],C=V[F[f+2]],n=(detail|0)+1;
    function pt(i,j){var w=1-i/n-j/n;return nrm([A[0]*w+B[0]*i/n+C[0]*j/n,A[1]*w+B[1]*i/n+C[1]*j/n,A[2]*w+B[2]*i/n+C[2]*j/n]);}
    for(var i=0;i<n;i++)for(var j=0;j<n-i;j++){push(pt(i,j),pt(i+1,j),pt(i,j+1));if(i+j<n-1)push(pt(i+1,j),pt(i+1,j+1),pt(i,j+1));}}
  var g=build(P,N,null,null);var u=new Float32Array(P.length/3*2);g.setAttribute('uv',new BufferAttribute(u,2));return g;}
var tt=(1+sqrt(5))/2,rr=1/tt;
T.IcosahedronGeometry=function(r,d){return poly([[-1,tt,0],[1,tt,0],[-1,-tt,0],[1,-tt,0],[0,-1,tt],[0,1,tt],[0,-1,-tt],[0,1,-tt],[tt,0,-1],[tt,0,1],[-tt,0,-1],[-tt,0,1]],
  [0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1],r||1,d||0);};
T.DodecahedronGeometry=function(r){return poly([[-1,-1,-1],[-1,-1,1],[-1,1,-1],[-1,1,1],[1,-1,-1],[1,-1,1],[1,1,-1],[1,1,1],[0,-rr,-tt],[0,-rr,tt],[0,rr,-tt],[0,rr,tt],[-rr,-tt,0],[-rr,tt,0],[rr,-tt,0],[rr,tt,0],[-tt,0,-rr],[tt,0,-rr],[-tt,0,rr],[tt,0,rr]],
  [3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9],r||1,0);};
T.Shape=function(){this.pts=[];};T.Shape.prototype={moveTo:function(x,y){this.pts.push([x,y]);return this;},lineTo:function(x,y){this.pts.push([x,y]);return this;},closePath:function(){return this;}};
T.ShapeGeometry=function(s){var P=[0,0,0],N=[0,0,1],U=[.5,.5],I=[],n=s.pts.length;s.pts.forEach(function(p,i){P.push(p[0],p[1],0);N.push(0,0,1);U.push(p[0]/2+.5,p[1]/2+.5);I.push(0,1+i,1+(i+1)%n);});return build(P,N,U,I);};

// ===== خامات ومواد =====
function Texture(img){this.image=img||null;this.encoding=T.LinearEncoding;this.wrapS=this.wrapT=1001;this.minFilter=1008;this.magFilter=1006;this.generateMipmaps=true;this.repeat={x:1,y:1,set:function(a,b){this.x=a;this.y=b;}};this.userData={};this.needsUpdate=false;}
Texture.prototype.clone=function(){var t=new Texture(this.image);t.encoding=this.encoding;t.wrapS=this.wrapS;t.wrapT=this.wrapT;t.minFilter=this.minFilter;t.magFilter=this.magFilter;t.generateMipmaps=this.generateMipmaps;return t;};
T.Texture=Texture;T.CanvasTexture=function(c){Texture.call(this,c);};T.CanvasTexture.prototype=Object.create(Texture.prototype);
T.TextureLoader=function(){};T.TextureLoader.prototype.load=function(url,ok,prog,err){var im=new Image(),t=new Texture(im);im.onload=function(){try{ok&&ok(t);}catch(e){console.error(e);}};im.onerror=function(){err&&err();};im.src=url;return t;};
function setup(m,p,defs){m.id=_id++;for(var k in defs)m[k]=defs[k];if(p)for(var q in p)m[q]=p[q];
  ['color','emissive'].forEach(function(k){if(m[k]!==undefined&&!(m[k] instanceof Color))m[k]=new Color(m[k]);});}
T.MeshStandardMaterial=function(p){this.type='std';setup(this,p,{color:new Color(1,1,1),emissive:new Color(0,0,0),roughness:1,metalness:0,map:null,vertexColors:false,flatShading:false,transparent:false,opacity:1,side:0,depthWrite:true,fog:true,blending:1,onBeforeCompile:null});};
T.MeshBasicMaterial=function(p){this.type='basic';setup(this,p,{color:new Color(1,1,1),map:null,transparent:false,opacity:1,side:0,depthWrite:true,fog:true,blending:1,vertexColors:false});};
T.LineBasicMaterial=function(p){this.type='line';setup(this,p,{color:new Color(1,1,1),transparent:false,opacity:1,side:0,depthWrite:true,fog:false,blending:1});};
T.SpriteMaterial=function(p){this.type='sprite';setup(this,p,{color:new Color(1,1,1),map:null,transparent:true,opacity:1,depthWrite:true,fog:true,blending:1,side:2});};
T.ShaderMaterial=function(p){this.type='shader';setup(this,p,{uniforms:{},vertexShader:'',fragmentShader:'',transparent:false,depthWrite:true,side:0,blending:1,fog:false});};

// ===== المُصيِّر =====
var VS_PRE='#version 300 es\nprecision highp float;precision highp int;\n#define attribute in\n#define varying out\nuniform mat4 modelMatrix;uniform mat4 viewMatrix;uniform mat4 projectionMatrix;uniform mat4 modelViewMatrix;\nin vec3 position;in vec3 normal;in vec2 uv;\n';
var FS_PRE='#version 300 es\nprecision highp float;precision highp int;\n#define varying in\n#define texture2D texture\nout highp vec4 pc_fragColor;\n#define gl_FragColor pc_fragColor\nuniform mat4 viewMatrix;uniform vec3 cameraPosition;\n';
var CH_BEGIN='vec3 transformed=vec3(position);\n';
var STD_VS=[
'#ifdef USE_COLOR\nin vec3 color;\n#endif',
'#ifdef USE_INSTANCING\nin mat4 instanceMatrix;\n#endif',
'#ifdef USE_INSTANCE_COLOR\nin vec3 instanceColor;\n#endif',
'uniform mat4 shadowMatrix;uniform vec2 uRepeat;uniform vec3 uShadowDir;uniform float uNormBias;',
'out vec3 vW;out vec3 vN;out vec2 vUv;out vec3 vCol;out float vDepth;out vec4 vSh;',
'void main(){',
'#include <begin_vertex>',
'#ifdef USE_INSTANCING\nmat4 M=modelMatrix*instanceMatrix;\n#else\nmat4 M=modelMatrix;\n#endif',
'vec4 wp=M*vec4(transformed,1.0);',
'vec3 s2=vec3(dot(M[0].xyz,M[0].xyz),dot(M[1].xyz,M[1].xyz),dot(M[2].xyz,M[2].xyz));',
'vN=mat3(M)*(normal/max(s2,vec3(1e-8)));vW=wp.xyz;vUv=uv*uRepeat;',
'vCol=vec3(1.0);\n#ifdef USE_COLOR\nvCol*=color;\n#endif\n#ifdef USE_INSTANCE_COLOR\nvCol*=instanceColor;\n#endif',
'vec4 mv=viewMatrix*wp;vDepth=-mv.z;',
'#ifdef SHADOW\nvec3 nn=normalize(vN);vSh=shadowMatrix*vec4(wp.xyz+nn*uNormBias,1.0);\n#else\nvSh=vec4(0.0);\n#endif',
'gl_Position=projectionMatrix*mv;}'].join('\n');
var STD_FS=[
'uniform vec3 uColor;uniform vec3 uEmissive;uniform float uOpacity;uniform float uRough;uniform float uExposure;uniform sampler2D map;',
'uniform vec3 uHemiSky;uniform vec3 uHemiGnd;uniform vec3 uSunDir;uniform vec3 uSunCol;',
'uniform vec3 uPPos0;uniform vec3 uPPos1;uniform vec3 uPCol0;uniform vec3 uPCol1;uniform vec4 uPAtt;',
'uniform vec3 uFogColor;uniform vec2 uFogRange;uniform float uFogOn;uniform float uShadowTexel;uniform float uShadowBias;',
'#ifdef SHADOW\nuniform mediump sampler2DShadow uShadowMap;\n#endif',
'in vec3 vW;in vec3 vN;in vec2 vUv;in vec3 vCol;in float vDepth;in vec4 vSh;',
'vec3 aces(vec3 x){return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0);}',
'vec3 oetf(vec3 c){c=clamp(c,0.0,1.0);return mix(c*12.92,1.055*pow(c,vec3(1.0/2.4))-0.055,step(0.0031308,c));}',
'vec3 pl(vec3 p,vec3 col,vec3 n,float dist,float dec){vec3 d=p-vW;float l=length(d);float a=pow(clamp(1.0-l/dist,0.0,1.0),dec);return col*a*max(dot(n,d/max(l,1e-4)),0.0);}',
'void main(){',
'vec4 base=vec4(pow(uColor*vCol,vec3(2.2)),uOpacity);',
'#ifdef USE_MAP\nbase*=texture(map,vUv);\n#endif',
'vec3 out_c;',
'#ifdef LIT',
' vec3 n;\n#ifdef FLAT\n n=normalize(cross(dFdx(vW),dFdy(vW)));\n#else\n n=normalize(vN);\n if(!gl_FrontFacing)n=-n;\n#endif',
' vec3 V=normalize(cameraPosition-vW);',
' float sh=1.0;',
' #ifdef SHADOW\n vec3 sc=vSh.xyz/vSh.w*0.5+0.5;\n if(sc.x>0.0&&sc.x<1.0&&sc.y>0.0&&sc.y<1.0&&sc.z<1.0){sh=0.0;float t=uShadowTexel;\n  for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++)sh+=texture(uShadowMap,vec3(sc.xy+vec2(float(i),float(j))*t,sc.z-uShadowBias));\n  sh/=9.0;\n  vec2 e=min(sc.xy,1.0-sc.xy);sh=mix(1.0,sh,smoothstep(0.0,0.06,min(e.x,e.y)));}\n #endif',
' float nl=max(dot(n,uSunDir),0.0);',
' vec3 light=mix(uHemiGnd,uHemiSky,0.5+0.5*n.y)+uSunCol*nl*sh;',
' light+=pl(uPPos0,uPCol0,n,uPAtt.x,uPAtt.y)+pl(uPPos1,uPCol1,n,uPAtt.z,uPAtt.w);',
' vec3 H=normalize(uSunDir+V);float spec=pow(max(dot(n,H),0.0),mix(8.0,90.0,1.0-uRough))*(1.0-uRough)*0.35*sh*step(0.0,nl);',
' out_c=base.rgb*light+uSunCol*spec+pow(uEmissive,vec3(2.2));',
'#else\n out_c=base.rgb;\n#endif',
'#ifdef TONEMAP\n out_c=aces(out_c*uExposure);\n#endif',
'out_c=oetf(out_c);',
'if(uFogOn>0.5){float f=smoothstep(uFogRange.x,uFogRange.y,vDepth);out_c=mix(out_c,uFogColor,f);}',
'gl_FragColor=vec4(out_c,base.a);}'].join('\n');
var SPR_VS='uniform vec2 uRepeat;out vec2 vUv;out float vDepth;void main(){vec3 c=(modelMatrix*vec4(0.0,0.0,0.0,1.0)).xyz;vec2 s=vec2(length(modelMatrix[0].xyz),length(modelMatrix[1].xyz));'+
 'vec3 r=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]),u=vec3(viewMatrix[0][1],viewMatrix[1][1],viewMatrix[2][1]);'+
 'vec3 wp=c+r*position.x*s.x+u*position.y*s.y;vUv=uv;vec4 mv=viewMatrix*vec4(wp,1.0);vDepth=-mv.z;gl_Position=projectionMatrix*mv;}';
var SPR_FS='uniform vec3 uColor;uniform float uOpacity;uniform sampler2D map;uniform vec3 uFogColor;uniform vec2 uFogRange;uniform float uFogOn;in vec2 vUv;in float vDepth;'+
 'vec3 oetf(vec3 c){c=clamp(c,0.0,1.0);return mix(c*12.92,1.055*pow(c,vec3(1.0/2.4))-0.055,step(0.0031308,c));}'+
 'void main(){vec4 t=texture(map,vUv);vec3 c=oetf(t.rgb*uColor);if(uFogOn>0.5){c=mix(c,uFogColor,smoothstep(uFogRange.x,uFogRange.y,vDepth));}gl_FragColor=vec4(c,t.a*uOpacity);}';
var DEPTH_VS='in vec3 position;\n#ifdef USE_INSTANCING\nin mat4 instanceMatrix;\n#endif\nuniform mat4 modelMatrix;uniform mat4 lightVP;void main(){\n#ifdef USE_INSTANCING\ngl_Position=lightVP*modelMatrix*instanceMatrix*vec4(position,1.0);\n#else\ngl_Position=lightVP*modelMatrix*vec4(position,1.0);\n#endif\n}';
var DEPTH_FS='void main(){}';

function WebGLRenderer(o){
  var self=this,canvas=this.domElement=o.canvas;
  var gl=canvas.getContext('webgl2',{antialias:!!o.antialias,alpha:false,stencil:false,powerPreference:o.powerPreference||'default'});
  if(!gl)throw new Error('WebGL2 غير مدعوم');
  this.gl=gl;this.shadowMap={enabled:false,type:2};this.toneMappingExposure=1;this.toneMapping=0;this.outputEncoding=0;this.stats={calls:0,tris:0,items:0};
  var epoch=1,pr=1,W=1,H=1,programs={},frameNo=0,anis=gl.getExtension('EXT_texture_filter_anisotropic'),shadowRT=null,lost=false;
  canvas.addEventListener('webglcontextlost',function(e){e.preventDefault();lost=true;if(self.onLost)self.onLost();},false);
  canvas.addEventListener('webglcontextrestored',function(){epoch++;programs={};shadowRT=null;lost=false;if(self.onRestored)self.onRestored();},false);
  this.setPixelRatio=function(p){pr=p;};this.getPixelRatio=function(){return pr;};
  this.setSize=function(w,h){W=w;H=h;canvas.width=Math.max(1,Math.floor(w*pr));canvas.height=Math.max(1,Math.floor(h*pr));};

  function compile(type,src){var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){var log=gl.getShaderInfoLog(s);console.error('[gl] shader',log,'\n'+src.split('\n').map(function(l,i){return (i+1)+': '+l;}).join('\n'));throw new Error('shader: '+log);}return s;}
  function program(vs,fs){
    var key=vs+'\u0001'+fs,p=programs[key];if(p&&p.ep===epoch)return p;
    p={id:_id++,ep:epoch,prog:gl.createProgram(),u:{},frame:-1,attribs:[]};
    gl.attachShader(p.prog,compile(gl.VERTEX_SHADER,vs));gl.attachShader(p.prog,compile(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p.prog);
    if(!gl.getProgramParameter(p.prog,gl.LINK_STATUS))throw new Error('link: '+gl.getProgramInfoLog(p.prog));
    var n=gl.getProgramParameter(p.prog,gl.ACTIVE_ATTRIBUTES);
    for(var i=0;i<n;i++){var a=gl.getActiveAttrib(p.prog,i);p.attribs.push({name:a.name,loc:gl.getAttribLocation(p.prog,a.name),mat:a.type===gl.FLOAT_MAT4});}
    programs[key]=p;return p;}
  function U(p,name){var l=p.u[name];if(l===undefined)l=p.u[name]=gl.getUniformLocation(p.prog,name);return l;}
  function u1(p,n,v){var l=U(p,n);if(l)gl.uniform1f(l,v);}
  function u2(p,n,a,b){var l=U(p,n);if(l)gl.uniform2f(l,a,b);}
  function u3(p,n,a,b,c){var l=U(p,n);if(l)gl.uniform3f(l,a,b,c);}
  function u4(p,n,a,b,c,d){var l=U(p,n);if(l)gl.uniform4f(l,a,b,c,d);}
  function um(p,n,m){var l=U(p,n);if(l)gl.uniformMatrix4fv(l,false,m);}

  function upload(a,target){
    if(!a._buf||a._ep!==epoch){a._buf=gl.createBuffer();a._ep=epoch;gl.bindBuffer(target,a._buf);gl.bufferData(target,a.array,a.dynamicDraw?gl.DYNAMIC_DRAW:gl.STATIC_DRAW);a.needsUpdate=false;}
    else if(a.needsUpdate){gl.bindBuffer(target,a._buf);gl.bufferData(target,a.array,gl.DYNAMIC_DRAW);a.needsUpdate=false;}
    return a._buf;}
  function texOf(t){
    var img=t.image;if(!img)return null;var r=img.__gl;
    if(!r||r.ep!==epoch||t.needsUpdate){
      if(!r||r.ep!==epoch)r=img.__gl={tex:gl.createTexture(),ep:epoch};t.needsUpdate=false;
      gl.bindTexture(gl.TEXTURE_2D,r.tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
      var srgb=t.encoding===T.sRGBEncoding;
      gl.texImage2D(gl.TEXTURE_2D,0,srgb?gl.SRGB8_ALPHA8:gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
      var mip=t.generateMipmaps!==false&&t.minFilter!==T.LinearFilter;
      if(mip)gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,mip?gl.LINEAR_MIPMAP_LINEAR:gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      var rep=t.wrapS===T.RepeatWrapping?gl.REPEAT:gl.CLAMP_TO_EDGE,rep2=t.wrapT===T.RepeatWrapping?gl.REPEAT:gl.CLAMP_TO_EDGE;
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,rep);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,rep2);
      if(anis&&mip)gl.texParameterf(gl.TEXTURE_2D,anis.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(4,gl.getParameter(anis.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    }
    return r.tex;}

  // ----- مصفوفات الإطار -----
  var VP=new Float32Array(16),planes=new Float32Array(24),MV=new Float32Array(16),lightVP=new Float32Array(16),lightV=new Float32Array(16),lightP=new Float32Array(16),shadowM=new Float32Array(16),BIAS=new Float32Array([0.5,0,0,0,0,0.5,0,0,0,0,0.5,0,0.5,0.5,0.5,1]),tmpM=new Float32Array(16);
  function extractPlanes(m){
    var k=0;[[3,0,1],[3,0,-1],[3,1,1],[3,1,-1],[3,2,1],[3,2,-1]].forEach(function(s){
      for(var i=0;i<4;i++)planes[k+i]=m[i*4+s[0]]+s[2]*m[i*4+s[1]];var l=sqrt(planes[k]*planes[k]+planes[k+1]*planes[k+1]+planes[k+2]*planes[k+2])||1;for(var j=0;j<4;j++)planes[k+j]/=l;k+=4;});}
  function visible(o,g){
    if(!o.frustumCulled)return true;var bs=g.boundingSphere?g.boundingSphere():(o.type==='Sprite'?{x:0,y:0,z:0,r:0.75}:null);if(!bs)return true;
    var e=o.matrixWorld.elements,cx=e[0]*bs.x+e[4]*bs.y+e[8]*bs.z+e[12],cy=e[1]*bs.x+e[5]*bs.y+e[9]*bs.z+e[13],cz=e[2]*bs.x+e[6]*bs.y+e[10]*bs.z+e[14];
    var sx=sqrt(e[0]*e[0]+e[1]*e[1]+e[2]*e[2]),sy=sqrt(e[4]*e[4]+e[5]*e[5]+e[6]*e[6]),sz=sqrt(e[8]*e[8]+e[9]*e[9]+e[10]*e[10]),r=bs.r*Math.max(sx,sy,sz);
    for(var i=0;i<6;i++){if(planes[i*4]*cx+planes[i*4+1]*cy+planes[i*4+2]*cz+planes[i*4+3]<-r)return false;}return true;}

  // ----- اختيار البرنامج للمادة -----
  function defsFor(o,m,shadowOn){
    var d='';if(m.vertexColors)d+='#define USE_COLOR\n';if(o.type==='InstancedMesh'){d+='#define USE_INSTANCING\n';if(o.instanceColor)d+='#define USE_INSTANCE_COLOR\n';}
    if(m.map)d+='#define USE_MAP\n';if(m.type==='std'){d+='#define LIT\n';if(m.flatShading)d+='#define FLAT\n';if(shadowOn&&o.receiveShadow)d+='#define SHADOW\n';}
    if(!(m.type==='basic'||m.type==='line')||!m.map)d+='#define TONEMAP\n';
    if(m.type==='basic'&&m.map)d=d.replace('#define TONEMAP\n','');
    return d;}
  function progFor(o,m,shadowOn){
    var cache=m._pc||(m._pc={}),d=defsFor(o,m,shadowOn),key=d+(m.onBeforeCompile?'bc':''),e=cache[key];
    if(e&&e.ep===epoch)return e;
    var vs,fs,extra=null;
    if(m.type==='shader'){
      var inst=o.type==='InstancedMesh';vs=VS_PRE+m.vertexShader;fs=FS_PRE+m.fragmentShader;
      if(inst)vs=vs.replace('void main','in mat4 instanceMatrix;\nvoid main');
    } else if(m.type==='sprite'){vs=VS_PRE+SPR_VS;fs=FS_PRE+SPR_FS;}
    else{
      var sh={uniforms:{},vertexShader:STD_VS,fragmentShader:STD_FS};
      if(m.onBeforeCompile){try{m.onBeforeCompile(sh);}catch(er){console.error(er);}}
      extra=sh.uniforms;
      vs=VS_PRE+d+sh.vertexShader.replace('#include <begin_vertex>',CH_BEGIN);fs=FS_PRE+d+sh.fragmentShader;
    }
    var p=program(vs,fs);e=cache[key]={p:p,ep:epoch,extra:extra};return e;}

  var cur={prog:null,cull:-1,blend:-1,dw:-1,tex:null};
  function setState(m){
    var side=m.side||0,c=side===2?0:(side===1?1:2);
    if(cur.cull!==c){if(c===0)gl.disable(gl.CULL_FACE);else{gl.enable(gl.CULL_FACE);gl.cullFace(c===2?gl.BACK:gl.FRONT);}cur.cull=c;}
    var b=m.transparent?(m.blending===2?2:1):0;
    if(cur.blend!==b){if(b===0)gl.disable(gl.BLEND);else{gl.enable(gl.BLEND);if(b===2)gl.blendFunc(gl.SRC_ALPHA,gl.ONE);else gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);}cur.blend=b;}
    var dw=m.depthWrite===false?0:1;if(cur.dw!==dw){gl.depthMask(!!dw);cur.dw=dw;}
  }
  var UNIT_QUAD=null;
  function quad(){if(!UNIT_QUAD)UNIT_QUAD=build([-.5,-.5,0,.5,-.5,0,.5,.5,0,-.5,.5,0],[0,0,1,0,0,1,0,0,1,0,0,1],[0,0,1,0,1,1,0,1],[0,1,2,0,2,3]);return UNIT_QUAD;}

  function bindAttribs(p,g,o){
    var inst=o&&o.type==='InstancedMesh';
    for(var i=0;i<p.attribs.length;i++){var a=p.attribs[i],loc=a.loc;if(loc<0)continue;
      if(a.name==='instanceMatrix'){if(!inst)continue;var buf=upload(o.instanceMatrix,gl.ARRAY_BUFFER);gl.bindBuffer(gl.ARRAY_BUFFER,buf);
        for(var k=0;k<4;k++){gl.enableVertexAttribArray(loc+k);gl.vertexAttribPointer(loc+k,4,gl.FLOAT,false,64,k*16);gl.vertexAttribDivisor(loc+k,1);}continue;}
      if(a.name==='instanceColor'){if(!inst||!o.instanceColor)continue;gl.bindBuffer(gl.ARRAY_BUFFER,upload(o.instanceColor,gl.ARRAY_BUFFER));gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0);gl.vertexAttribDivisor(loc,1);continue;}
      var at=g.attributes[a.name];
      if(!at){gl.disableVertexAttribArray(loc);gl.vertexAttrib4f(loc,a.name==='color'?1:0,a.name==='color'?1:0,a.name==='color'?1:0,1);continue;}
      gl.bindBuffer(gl.ARRAY_BUFFER,upload(at,gl.ARRAY_BUFFER));gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,at.itemSize,gl.FLOAT,false,0,0);gl.vertexAttribDivisor(loc,0);}
  }
  function unbindAttribs(p,o){for(var i=0;i<p.attribs.length;i++){var a=p.attribs[i];if(a.loc<0)continue;var n=a.mat?4:1;for(var k=0;k<n;k++){gl.vertexAttribDivisor(a.loc+k,0);gl.disableVertexAttribArray(a.loc+k);}}}
  function draw(p,g,o,mode){
    var inst=o.type==='InstancedMesh';self.stats.calls++;
    if(mode===gl.POINTS||mode===gl.LINE_STRIP||!g.index){var cnt=g.attributes.position.count;if(inst)gl.drawArraysInstanced(mode,0,cnt,o.count);else gl.drawArrays(mode,0,cnt);self.stats.tris+=cnt/3*(inst?o.count:1);}
    else{var ix=g.index;gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,upload(ix,gl.ELEMENT_ARRAY_BUFFER));var tp=ix.array instanceof Uint32Array?gl.UNSIGNED_INT:gl.UNSIGNED_SHORT;
      if(inst)gl.drawElementsInstanced(gl.TRIANGLES,ix.count,tp,0,o.count);else gl.drawElements(gl.TRIANGLES,ix.count,tp,0);self.stats.tris+=ix.count/3*(inst?o.count:1);}
    unbindAttribs(p,o);
  }

  // ----- الرسم -----
  var opaque=[],trans=[],casters=[],lights={hemi:null,dir:null,pts:[]},camPos=[0,0,0];
  function collect(o,scene,camera){
    if(!o.visible)return;
    if(o.type==='Hemi')lights.hemi=o;else if(o.type==='Dir')lights.dir=o;else if(o.type==='Point')lights.pts.push(o);
    else if(o.material&&(o.type==='Mesh'||o.type==='InstancedMesh'||o.type==='Points'||o.type==='Line'||o.type==='Sprite')){
      var g=o.type==='Sprite'?quad():o.geometry;
      if(o.type==='Sprite'){if(visible(o,{boundingSphere:function(){return {x:0,y:0,z:0,r:0.75};}})){push(o,g);}}
      else if(visible(o,g))push(o,g);
      if(o.castShadow&&(o.type==='Mesh'||o.type==='InstancedMesh'))casters.push(o);
    }
    for(var i=0;i<o.children.length;i++)collect(o.children[i],scene,camera);
  }
  function push(o,g){
    var m=o.material,e=o.matrixWorld.elements,dx=e[12]-camPos[0],dy=e[13]-camPos[1],dz=e[14]-camPos[2],item={o:o,g:g,m:m,d:dx*dx+dy*dy+dz*dz,ro:o.renderOrder||0};
    (m.transparent?trans:opaque).push(item);}
  function sortOpaque(a,b){return a.ro-b.ro||(a.m.id-b.m.id)||(a.d-b.d);}
  function sortTrans(a,b){return a.ro-b.ro||(b.d-a.d);}

  function setFrameUniforms(p,sc,dir,sh,env){
    um(p,'viewMatrix',env.view);um(p,'projectionMatrix',env.proj);u3(p,'cameraPosition',camPos[0],camPos[1],camPos[2]);
    u1(p,'uExposure',self.toneMappingExposure);var h=lights.hemi;
    if(h){u3(p,'uHemiSky',h.color.r*h.intensity,h.color.g*h.intensity,h.color.b*h.intensity);u3(p,'uHemiGnd',h.groundColor.r*h.intensity,h.groundColor.g*h.intensity,h.groundColor.b*h.intensity);}else{u3(p,'uHemiSky',0.5,0.5,0.5);u3(p,'uHemiGnd',0.3,0.3,0.3);}
    if(dir){var d=dir.dd;u3(p,'uSunDir',d[0],d[1],d[2]);u3(p,'uSunCol',dir.color.r*dir.intensity,dir.color.g*dir.intensity,dir.color.b*dir.intensity);}else{u3(p,'uSunDir',0,1,0);u3(p,'uSunCol',0,0,0);}
    for(var i=0;i<2;i++){var pl=lights.pts[i];if(pl&&pl.intensity>0.001){u3(p,'uPPos'+i,pl.position.x,pl.position.y,pl.position.z);u3(p,'uPCol'+i,pl.color.r*pl.intensity,pl.color.g*pl.intensity,pl.color.b*pl.intensity);}else{u3(p,'uPPos'+i,0,-9999,0);u3(p,'uPCol'+i,0,0,0);}}
    var d0=lights.pts[0]?lights.pts[0].distance||20:20,c0=lights.pts[0]?lights.pts[0].decay:2,d1=lights.pts[1]?lights.pts[1].distance||20:20,c1=lights.pts[1]?lights.pts[1].decay:2;u4(p,'uPAtt',d0,c0,d1,c1);
    if(sc.fog){u3(p,'uFogColor',sc.fog.color.r,sc.fog.color.g,sc.fog.color.b);u2(p,'uFogRange',sc.fog.near,sc.fog.far);}
    if(sh){um(p,'shadowMatrix',shadowM);u1(p,'uShadowTexel',1/sh.size);u1(p,'uShadowBias',0.0006);u1(p,'uNormBias',sh.nb);var l=U(p,'uShadowMap');if(l){gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,shadowRT.tex);gl.uniform1i(l,1);gl.activeTexture(gl.TEXTURE0);}}
  }
  function ensureShadow(size){
    if(shadowRT&&shadowRT.size===size&&shadowRT.ep===epoch)return shadowRT;
    var tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,size,size,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_MODE,gl.COMPARE_REF_TO_TEXTURE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_FUNC,gl.LEQUAL);
    var fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,tex,0);gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);
    var ok=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    shadowRT={tex:tex,fb:fb,size:size,ep:epoch,ok:ok};return shadowRT;}

  this.render=function(scene,camera){
    if(lost)return;
    frameNo++;this.stats.calls=0;this.stats.tris=0;scene.updateMatrixWorld(null);
    camera.updateMatrix();var cm=camera.position;camPos[0]=cm.x;camPos[1]=cm.y;camPos[2]=cm.z;
    lookAtM(camera.view,cm.x,cm.y,cm.z,camera._t.x,camera._t.y,camera._t.z,0,1,0);mmul(VP,camera.proj,camera.view);extractPlanes(VP);
    opaque.length=0;trans.length=0;casters.length=0;lights.hemi=null;lights.dir=null;lights.pts.length=0;
    collect(scene,scene,camera);
    // ضوء الشمس + الظلال
    var dir=lights.dir,sh=null;
    if(dir){var tg=dir.target.position,dx=dir.position.x-tg.x,dy=dir.position.y-tg.y,dz=dir.position.z-tg.z,dl=sqrt(dx*dx+dy*dy+dz*dz)||1;dir.dd=[dx/dl,dy/dl,dz/dl];
      if(this.shadowMap.enabled&&dir.castShadow){
        var sc=dir.shadow.camera,size=dir.shadow.mapSize.x,rt=ensureShadow(size);
        if(rt.ok){
          var f=[-dx/dl,-dy/dl,-dz/dl],rx=f[1]*0-f[2]*1,ry=f[2]*0-f[0]*0,rz=f[0]*1-f[1]*0,rl=sqrt(rx*rx+ry*ry+rz*rz)||1;rx/=rl;ry/=rl;rz/=rl;
          var ux=ry*f[2]-rz*f[1],uy=rz*f[0]-rx*f[2],uz=rx*f[1]-ry*f[0],texel=(sc.right-sc.left)/size;
          var tx=tg.x,ty=tg.y,tz=tg.z,ddx=tx*rx+ty*ry+tz*rz,ddy=tx*ux+ty*uy+tz*uz,sx=Math.round(ddx/texel)*texel-ddx,sy=Math.round(ddy/texel)*texel-ddy;
          tx+=rx*sx+ux*sy;ty+=ry*sx+uy*sy;tz+=rz*sx+uz*sy;
          var lx=tx+dx,ly=ty+dy,lz=tz+dz;
          lookAtM(lightV,lx,ly,lz,tx,ty,tz,0,1,0);ortho(lightP,sc.left,sc.right,sc.bottom,sc.top,sc.near,sc.far);mmul(lightVP,lightP,lightV);
          mmul(tmpM,BIAS,lightVP);shadowM.set(tmpM);
          // مرور الظلال
          gl.bindFramebuffer(gl.FRAMEBUFFER,rt.fb);gl.viewport(0,0,size,size);gl.depthMask(true);gl.enable(gl.DEPTH_TEST);gl.clear(gl.DEPTH_BUFFER_BIT);
          gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(2.0,4.0);gl.disable(gl.BLEND);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.colorMask(false,false,false,false);
          var rad=(sc.right-sc.left)*0.75;
          for(var i=0;i<casters.length;i++){var o=casters[i],ee=o.matrixWorld.elements;
            if(o.type==='Mesh'){var bs=o.geometry.boundingSphere();var wx=ee[12]+ee[0]*bs.x,wz=ee[14]+ee[10]*bs.z;
              if(Math.abs(wx-tx)>rad+bs.r*3||Math.abs(wz-tz)>rad+bs.r*3)continue;}
            var inst=o.type==='InstancedMesh',key='D'+(inst?1:0),dp=programs[key];
            if(!dp||dp.ep!==epoch){dp=program(VS_PRE_D(inst)+DEPTH_VS,'#version 300 es\nprecision mediump float;\n'+DEPTH_FS);programs[key]=dp;}
            if(cur.prog!==dp){gl.useProgram(dp.prog);cur.prog=dp;um(dp,'lightVP',lightVP);}
            um(dp,'modelMatrix',o.matrixWorld.elements);bindAttribs(dp,o.geometry,o);draw(dp,o.geometry,o,gl.TRIANGLES);}
          gl.colorMask(true,true,true,true);gl.disable(gl.POLYGON_OFFSET_FILL);gl.bindFramebuffer(gl.FRAMEBUFFER,null);cur.prog=null;cur.cull=-1;
          sh={size:size,nb:0.05};}
      }}
    gl.viewport(0,0,canvas.width,canvas.height);gl.depthMask(true);cur.dw=1;gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    cur.blend=-1;cur.cull=-1;cur.prog=null;
    opaque.sort(sortOpaque);trans.sort(sortTrans);this.stats.items=opaque.length+trans.length;
    var env={view:camera.view,proj:camera.proj};
    var lists=[opaque,trans];
    for(var li=0;li<2;li++){var L=lists[li];
      for(var k=0;k<L.length;k++){var it=L[k],o2=it.o,m=it.m,g=it.g,mode=gl.TRIANGLES;
        if(o2.type==='Points')mode=gl.POINTS;else if(o2.type==='Line')mode=gl.LINE_STRIP;
        var pe;try{pe=progFor(o2,m,!!sh);}catch(er){if(!m._bad){m._bad=1;console.error('[gl] material failed',er);}continue;}
        var p=pe.p;if(cur.prog!==p){gl.useProgram(p.prog);cur.prog=p;}
        if(p.frame!==frameNo){p.frame=frameNo;if(m.type==='shader'){um(p,'viewMatrix',env.view);um(p,'projectionMatrix',env.proj);u3(p,'cameraPosition',camPos[0],camPos[1],camPos[2]);}
          else setFrameUniforms(p,scene,dir&&dir.dd?dir:null,sh&&o2.receiveShadow&&m.type==='std'?sh:null,env);}
        setState(m);
        var me=o2.matrixWorld.elements;um(p,'modelMatrix',me);
        if(U(p,'modelViewMatrix')){mmul(MV,env.view,me);um(p,'modelViewMatrix',MV);}
        if(m.type==='std'){
          u3(p,'uColor',m.color.r,m.color.g,m.color.b);u3(p,'uEmissive',m.emissive.r,m.emissive.g,m.emissive.b);u1(p,'uOpacity',m.opacity);u1(p,'uRough',m.roughness===undefined?1:m.roughness);
          u1(p,'uFogOn',m.fog!==false&&scene.fog?1:0);
          if(sh&&o2.receiveShadow){var l=U(p,'uShadowMap');if(l){gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,shadowRT.tex);gl.uniform1i(l,1);gl.activeTexture(gl.TEXTURE0);}u1(p,'uShadowTexel',1/sh.size);u1(p,'uShadowBias',0.0006);u1(p,'uNormBias',sh.nb);um(p,'shadowMatrix',shadowM);}
          var rp=m.map?m.map.repeat:null;u2(p,'uRepeat',rp?rp.x:1,rp?rp.y:1);
          if(m.map){var tx0=texOf(m.map);if(tx0){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tx0);var lm=U(p,'map');if(lm)gl.uniform1i(lm,0);}}
        } else if(m.type==='basic'||m.type==='sprite'||m.type==='line'){
          u3(p,'uColor',m.color.r,m.color.g,m.color.b);u1(p,'uOpacity',m.opacity);u1(p,'uExposure',self.toneMappingExposure);u1(p,'uFogOn',m.fog!==false&&scene.fog?1:0);
          if(scene.fog&&m.type!=='shader'){u3(p,'uFogColor',scene.fog.color.r,scene.fog.color.g,scene.fog.color.b);u2(p,'uFogRange',scene.fog.near,scene.fog.far);}
          var rp2=m.map&&m.map.repeat;u2(p,'uRepeat',rp2?rp2.x:1,rp2?rp2.y:1);
          if(m.map){var t1=texOf(m.map);if(t1){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,t1);var l2=U(p,'map');if(l2)gl.uniform1i(l2,0);}}
          else if(m.type==='basic'||m.type==='sprite'){ /* بلا خامة */ }
        }
        // مدخلات إضافية (onBeforeCompile / ShaderMaterial)
        var ex=m.type==='shader'?m.uniforms:pe.extra;
        if(ex)for(var name in ex){var val=ex[name].value,l3=U(p,name);if(!l3||val===undefined)continue;
          if(typeof val==='number')gl.uniform1f(l3,val);else if(val instanceof Color)gl.uniform3f(l3,val.r,val.g,val.b);else if(val instanceof Vector3)gl.uniform3f(l3,val.x,val.y,val.z);}
        bindAttribs(p,g,o2);draw(p,g,o2,mode);
      }}
    // أعد الحالة
    gl.depthMask(true);
  };
  function VS_PRE_D(inst){return '#version 300 es\nprecision highp float;\n'+(inst?'#define USE_INSTANCING\n':'');}
}
T.WebGLRenderer=WebGLRenderer;
})();
