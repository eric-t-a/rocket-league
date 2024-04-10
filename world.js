import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import dat from 'dat.gui'

import SceneInit from './sceneInit';

import { threeToCannon, ShapeType } from 'three-to-cannon';


function allCorners(cornerId, geometry, material, scene){
    const mesh = new THREE.Mesh( geometry, material );
    mesh.rotateY(cornerId ? 0 : Math.PI)
    mesh.rotateX(Math.PI)
    const x = cornerId == 0 ? - 150 : 150;
    const z = cornerId == 0 ? -175 : 175;
    mesh.position.y = 10;
    mesh.position.x = x;
    mesh.position.z = z;

    
    scene.add( mesh );
    const result = threeToCannon(mesh, {type: ShapeType.MESH})
    const {shape} = result;

    const roundedGround = new CANNON.Body({
        type: CANNON.Body.STATIC,
        // infinte geometric plane
        shape: shape,
    });
    roundedGround.quaternion.copy(mesh.quaternion);
    roundedGround.position.copy(mesh.position);

    return roundedGround
}

function roundedCorners(scene, physicsWorld){
    var shape2 = new THREE.Shape()
    shape2.arc(4, 0, 10, 0, Math.PI/ 2,  false)
    shape2.arc(4, 0, 30, Math.PI / 2, 2* Math.PI , true)

    var extrudeSettings = {
      curveSegments:100,
      depth: 350,
      bevelEnabled: false,
    }

    const geometry = new THREE.ExtrudeGeometry(shape2, extrudeSettings)
    const material = new THREE.MeshNormalMaterial();
    for(let i = 0; i < 2; i++){
        const roundedGround = allCorners(i, geometry, material, scene)

        physicsWorld.addBody(roundedGround)
    }

}


export const createWorld = (world) => {
    const physicsWorld = new CANNON.World({
        gravity: new CANNON.Vec3(0, -20, 0),
    });

    roundedCorners(world.scene, physicsWorld);

    
    const groundBody = new CANNON.Body({
        type: CANNON.Body.STATIC,
        // infinte geometric plane
        shape: new CANNON.Plane(),
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    physicsWorld.addBody(groundBody);



    return physicsWorld
}