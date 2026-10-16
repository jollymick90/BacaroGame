// Extracted/adapted from gift-secret-santa/src/games/starship-run/ui-utils.ts.
// Original runner credits Wan Fung Chui for inspiration.
import * as THREE from 'three';
export function sinusoid(frequency: number, minimum: number, maximum: number, phase: number, time: number) {
    const amplitude = 0.5 * (maximum - minimum);
    const angularFrequency = 2 * Math.PI * frequency;
    const phaseRadians = phase * Math.PI / 180;
    const offset = amplitude * Math.sin(
        angularFrequency * time + phaseRadians);
    const average = (minimum + maximum) / 2;
    return average + offset;
}

export function createGroup(x=0,y=0,z=0){const group=new THREE.Group();group.position.set(x,y,z);return group;}
export function createBox(dx:number,dy:number,dz:number,color:number,x=0,y=0,z=0){
 const box=new THREE.Mesh(new THREE.BoxGeometry(dx,dy,dz),new THREE.MeshPhongMaterial({color,flatShading:true}));box.position.set(x,y,z);box.castShadow=true;box.receiveShadow=true;return box;
}
// Same top-pivot limb construction as Character.createLimb, rescaled to metres.
export function createLimb(dx:number,dy:number,dz:number,color:number,x:number,y:number,z:number){const limb=createGroup(x,y,z);limb.add(createBox(dx,dy,dz,color,0,-(Math.max(dx,dz)/2+dy/2),0));return limb;}
