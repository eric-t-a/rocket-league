import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import dat from 'dat.gui'

import SceneInit from './sceneInit';

import { threeToCannon, ShapeType } from 'three-to-cannon';







export default class World {
    constructor(world) {
        this.world = world;
        this.physicsWorld = null;
        this.sunLight = null;
        this.ambientLight = null;
    }

    initialize() {
        this.createPhysicsWorld();
        this.createLight();
        this.createWalls();
    }

    createWalls(){
        this.createFloor();
        this.createCorners();
    }

    createCorners(){
        var shape = new THREE.Shape()
        shape.arc(4, 0, 10, 0, Math.PI/ 2,  false)
        shape.arc(4, 0, 30, Math.PI / 2, 2* Math.PI , true)
    
        var extrudeSettings = {
          curveSegments:100,
          depth: 350,
          bevelEnabled: false,
        }
    
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
        const material = new THREE.MeshNormalMaterial();
        for(let i = 0; i < 2; i++){
            const roundedGround = allCorners(i, geometry, material, this.world.scene)
    
            this.physicsWorld.addBody(roundedGround)
        }

        function allCorners(cornerId, geometry, material, scene){
            const mesh = new THREE.Mesh( geometry, material );
            mesh.castShadow = true;
            mesh.receiveShadow = true;
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
        
            const roundedGround = new CANNON.Body();
            roundedGround.addShape(shape)
            roundedGround.quaternion.copy(mesh.quaternion);
            roundedGround.position.copy(mesh.position);
        
            return roundedGround
        }
    }

    createFloor(){
        const floorMesh = new THREE.Mesh( 
            new THREE.PlaneGeometry( 350, 350 ), 
            new THREE.MeshToonMaterial( { color: 0x454545 } ) 
        );
        floorMesh.rotation.x = - Math.PI / 2;
        floorMesh.receiveShadow = true;

        this.world.scene.add( floorMesh );

        const groundBody = new CANNON.Body();
        groundBody.addShape(new CANNON.Plane());

        groundBody.quaternion.setFromAxisAngle(
            new CANNON.Vec3(-1, 0, 0),
            Math.PI * 0.5
        );
        this.physicsWorld.addBody(groundBody);
    }

    createPhysicsWorld(){
        this.physicsWorld = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.8, 0),
        });
    }

    createLight(){
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.world.scene.add(this.ambientLight);
        
        this.sunLight = new THREE.DirectionalLight(0xFFFFFF, 1);
        this.sunLight.castShadow = true;
        this.sunLight.position.set(0, 1000, 1000);
        this.sunLight.target.position.set(0, 0, 0);
        this.sunLight.shadow.camera.near = 0.001;
        this.sunLight.shadow.camera.far = 10000;
        this.sunLight.shadow.mapSize.set( 1024, 1024 );
        this.sunLight.shadow.camera.updateProjectionMatrix()
    
        this.world.scene.add(this.sunLight);
        this.world.scene.add(this.sunLight.target);
        this.world.scene.add( new THREE.CameraHelper( this.sunLight.shadow.camera ) );
    }

    animateSunLight(position){
        this.sunLight.target.position.copy(position);
    }
}
    