import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
const $=id=>document.getElementById(id);
const scene=new THREE.Scene();scene.background=new THREE.Color(0xfff2f8);
const camera=new THREE.OrthographicCamera(-9,9,9,-9,.1,200);camera.position.set(13,14,17);camera.lookAt(0,3,0);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;$('scene').appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff,0xcbb5df,2.4));
const sun=new THREE.DirectionalLight(0xffffff,2.2);sun.position.set(-6,18,10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-20;sun.shadow.camera.right=20;sun.shadow.camera.top=25;sun.shadow.camera.bottom=-20;scene.add(sun);
const colors=[0xf2acc6,0xc5b4f0,0xaadfda,0xffd59b,0xe8bce8,0xaecbf4];
const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.55,metalness:0});
const shape=(w,h,d,color)=>{let m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));m.castShadow=true;m.receiveShadow=true;scene.add(m);return m};
const ground=shape(100,.35,100,0xf6e9f7);ground.position.y=-.7;ground.receiveShadow=true;ground.castShadow=false;
const base=shape(3.7,.55,3.7,0xb999d7);base.position.y=-.28;
const pieces=[];let active=null,crumbs=[],state='menu',level=0,best=0,axis='x',direction=1,speed=2.5,last=0,raf=0,targetY=0,camY=0,celebrate=0;
try{best=Number(localStorage.getItem('strawberry-tower-best'))||0}catch{}$('best').textContent=best;
const show=name=>{['menu','hud','pauseMenu','over'].forEach(id=>$(id).classList.toggle('hidden',id!==name))};
function clearPieces(){for(const p of [...pieces,...crumbs]){scene.remove(p);p.geometry.dispose();p.material.dispose()}pieces.length=0;crumbs=[];if(active){scene.remove(active);active.geometry.dispose();active.material.dispose();active=null}}
function top(){return pieces.length?pieces[pieces.length-1]:base}
function makeActive(){const prev=top(),dim=new THREE.Vector3();new THREE.Box3().setFromObject(prev).getSize(dim);axis=level%2?'z':'x';direction=level%4<2?1:-1;speed=Math.min(2.4+level*.17,8.4);let size=axis==='x'?dim.x:dim.z;if(size<.16){finish();return}active=shape(dim.x,.54,dim.z,colors[level%colors.length]);active.position.set(prev.position.x,prev.position.y+.55,prev.position.z);active.position[axis]+=-direction*6.2;targetY=active.position.y;}
function reset(){clearPieces();level=0;camY=0;camera.position.set(13,14,17);camera.lookAt(0,3,0);makeActive();$('level').textContent='1';$('tip').textContent='Поймай идеальный момент ✨';state='playing';show('hud')}
function saveBest(){if(level>best){best=level;$('best').textContent=best;try{localStorage.setItem('strawberry-tower-best',String(best))}catch{}}}
function finish(){saveBest();state='over';$('score').textContent=level;$('record').textContent=best;show('over')}
function place(){if(state!=='playing'||!active)return;const prev=top(),dimA=axis==='x'?active.geometry.parameters.width:active.geometry.parameters.depth,dimP=axis==='x'?prev.geometry.parameters.width:prev.geometry.parameters.depth,delta=active.position[axis]-prev.position[axis];let overlap=(dimA+dimP)/2-Math.abs(delta);
if(overlap<=0){const missed=active;active=null;crumbs.push(missed);finish();return}
const accurate=Math.abs(delta)<.12;
if(accurate){active.position[axis]=prev.position[axis];$('tip').textContent='Идеально! +1 ✨'}
else{$('tip').textContent='Отлично! Продолжай ♡';const oldSize=dimA,cut=dimA-overlap;const offset=Math.sign(delta)*cut/2;const nextSize=Math.max(.01,overlap);const geometry=new THREE.BoxGeometry(axis==='x'?nextSize:active.geometry.parameters.width,.54,axis==='z'?nextSize:active.geometry.parameters.depth);active.geometry.dispose();active.geometry=geometry;active.position[axis]=prev.position[axis]+offset;
const fall=shape(axis==='x'?cut:active.geometry.parameters.width,.54,axis==='z'?cut:active.geometry.parameters.depth,colors[level%colors.length]);fall.position.copy(active.position);fall.position[axis]+=Math.sign(delta)*(nextSize+cut)/2;crumbs.push(fall);fall.userData.falling=true;fall.userData.velocity=0;}
pieces.push(active);active=null;level++;saveBest();$('level').textContent=String(level+1);celebrate=.25;makeActive()}
function resize(){let w=$('scene').clientWidth,h=$('scene').clientHeight;camera.left=-9*w/h;camera.right=9*w/h;camera.top=9;camera.bottom=-9;camera.updateProjectionMatrix();renderer.setSize(w,h)}window.addEventListener('resize',resize);resize();
function tick(t){raf=requestAnimationFrame(tick);const dt=Math.min((t-last)/1000||0,.05);last=t;
if(state==='playing'&&active){active.position[axis]+=direction*speed*dt;if(active.position[axis]>6.2){active.position[axis]=6.2;direction=-1}if(active.position[axis]<-6.2){active.position[axis]=-6.2;direction=1}}
for(const c of crumbs){if(c.userData.falling){c.userData.velocity+=14*dt;c.position.y-=c.userData.velocity*dt;c.rotation.z+=dt*1.4;c.rotation.x+=dt*.8}}
for(let i=crumbs.length-1;i>=0;i--)if(crumbs[i].position.y<-20){let c=crumbs.splice(i,1)[0];scene.remove(c);c.geometry.dispose();c.material.dispose()}
const focus=Math.max(3,level*.55+1.5);camY+=(focus-camY)*Math.min(1,dt*2.6);camera.position.y=14+camY;camera.lookAt(0,3+camY,0);renderer.render(scene,camera)}
raf=requestAnimationFrame(tick);
$('start').onclick=reset;$('retry').onclick=reset;$('restartPause').onclick=reset;
$('how').onclick=()=>{$('instructions').hidden=!$('instructions').hidden};
$('pause').onclick=()=>{if(state==='playing'){state='paused';show('pauseMenu')}};
$('resume').onclick=()=>{state='playing';show('hud');last=performance.now()};
$('menuPause').onclick=$('menuOver').onclick=()=>{state='menu';show('menu')};$('place').onclick=place;
window.addEventListener('keydown',e=>{if(['Space','ArrowUp','Enter'].includes(e.code)){if(state==='playing'){e.preventDefault();if(!e.repeat)place()}else if(e.code==='Enter'&&state==='menu')reset()}if(e.code==='Escape'){if(state==='playing')$('pause').click();else if(state==='paused')$('resume').click()}});
renderer.domElement.addEventListener('pointerdown',()=>{if(state==='playing')place()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing'){$('pause').click()}});show('menu');