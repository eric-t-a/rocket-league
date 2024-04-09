import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';

import SceneInit from './sceneInit';

import { threeToCannon, ShapeType } from 'three-to-cannon';


function planeCurve(g, z){
	
    let p = g.parameters;
    let hw = p.width * 0.5;
    
    let a = new THREE.Vector2(-hw, 0);
    let b = new THREE.Vector2(0, z);
    let c = new THREE.Vector2(hw, 0);
    
    let ab = new THREE.Vector2().subVectors(a, b);
    let bc = new THREE.Vector2().subVectors(b, c);
    let ac = new THREE.Vector2().subVectors(a, c);

    let r = (ab.length() * bc.length() * ac.length()) / (2 * Math.abs(ab.cross(ac)));
    
    let center = new THREE.Vector2(0, z - r);
    let baseV = new THREE.Vector2().subVectors(a, center);
    let baseAngle = baseV.angle() - (Math.PI * 0.5);
    let arc = baseAngle * 2;
    
    let uv = g.attributes.uv;
    let pos = g.attributes.position;
    let mainV = new THREE.Vector2();
    for (let i = 0; i < uv.count; i++){
        let uvRatio = 1 - uv.getX(i);
        let y = pos.getY(i);
        if(arc * uvRatio > Math.PI / 2){
            mainV.copy(c).rotateAround(center, Math.PI / 2);
        }
        else{
            mainV.copy(c).rotateAround(center, (arc * uvRatio));

        }
        pos.setXYZ(i, mainV.x - hw, y, -mainV.y);
    }
    
    pos.needsUpdate = true;
    
}


export const createWorld = (test) => {
    const physicsWorld = new CANNON.World({
        gravity: new CANNON.Vec3(0, -30, 0),
    });


    const length = 20;
    let geom = new THREE.PlaneGeometry(length, 100, 200, 100);
    planeCurve(geom, 5.773)
    
    geom.rotateX(- Math.PI / 2)
    geom.rotateZ(- Math.PI / 3)
    
    let mat = new THREE.MeshBasicMaterial({
        wireframe: true,
    });
    let o = new THREE.Mesh(geom, mat);
    
    test.scene.add(o);
    const result = threeToCannon(o, {type: ShapeType.MESH});
    const {shape, offset, orientation} = result;
    
    const roundedGround = new CANNON.Body({
        type: CANNON.Body.STATIC,
        // infinte geometric plane
        shape: shape,
    });
    physicsWorld.addBody(roundedGround);
    
    const groundBody = new CANNON.Body({
        type: CANNON.Body.STATIC,
        // infinte geometric plane
        shape: new CANNON.Plane(),
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    physicsWorld.addBody(groundBody);



    return physicsWorld
}