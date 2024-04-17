import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';


import { threeToCannon, ShapeType } from 'three-to-cannon';

export default class Car {
    constructor(world, physicsWorld) {

        this.world = world;
        this.physicsWorld = physicsWorld;
        this.vehicle = null;
        this.carBody = null;
        this.boxMesh = null;
        this.temp = new THREE.Vector3;
        this.goal = new THREE.Object3D;
        this.wheels = [];
        this.physicsWheels = [];
        this.pressedKeys = {};
        this.axisWidth = 5;

    }

    initialize() {
        this.carBody = new CANNON.Body({
            mass: 150,
            position: new CANNON.Vec3(0, 3, 0),
            shape: new CANNON.Box(new CANNON.Vec3(this.axisWidth, 0.5, 1.5)),
        });
        
        this.vehicle = new CANNON.RigidVehicle({
            chassisBody: this.carBody,
        });

        console.log(this.vehicle)
        console.log(this.carBody)

        this.wheelHeight = 0.2;

        this.addWheel(
            new CANNON.Vec3(-2.5, this.wheelHeight, this.axisWidth / 2.5),
            new CANNON.Vec3(-1, -0.5, -1)
        );
        this.addWheel(
            new CANNON.Vec3(-2.5, this.wheelHeight, -this.axisWidth / 2.5),
            new CANNON.Vec3(1, -0.5, -1)
        );
        this.addWheel(
            new CANNON.Vec3(2.5, this.wheelHeight, this.axisWidth / 2.5),
            new CANNON.Vec3(-1, -0.5, 1)
        );
        this.addWheel(
            new CANNON.Vec3(2.5, this.wheelHeight, -this.axisWidth / 2.5),
            new CANNON.Vec3(1, -0.5, 1)
        );

        
        this.vehicle.addToWorld(this.physicsWorld);

        const boxGeometry = new THREE.BoxGeometry(8, 1, 4);
        const boxMaterial = new THREE.MeshNormalMaterial();
        this.boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
        this.boxMesh.castShadow = true;
        this.boxMesh.receiveShadow = true;
        this.world.scene.add(this.boxMesh);


        this.world.camera.position.x = this.carBody.position.x + 20;
        this.world.camera.position.y = this.carBody.position.y + 20;
        this.world.camera.position.z = this.carBody.position.z + 0;


        this.boxMesh.add(this.goal);
        this.goal.position.set(20, 3, 0);

        document.addEventListener('keyup', (event) => {
            this.onKeyUp(event);
        });
        document.addEventListener('keydown', (event) => {
            this.onKeyDown(event);
        });
    }

    animate() {
        this.boxMesh.position.copy(this.carBody.position);
        this.boxMesh.quaternion.copy(this.carBody.quaternion);
        
    
        this.temp.setFromMatrixPosition(this.goal.matrixWorld)
        this.world.camera.position.lerp(this.temp, 0.2);
        this.world.camera.lookAt( this.boxMesh.position );
        
        this.animateWheels();
    }

    render() {

    }

    updateCarForces(){
        const maxSteerVal = Math.PI / 8;
        let maxForce = 1000;

        if('shift' in this.pressedKeys){
            maxForce = 2000;
        }

        if('w' in this.pressedKeys){
            this.vehicle.setWheelForce(maxForce, 2);
            this.vehicle.setWheelForce(maxForce, 3);
        }
        else if('s' in this.pressedKeys){
            this.vehicle.setWheelForce(-maxForce, 2);
            this.vehicle.setWheelForce(-maxForce, 3);
        }
        else{
            this.vehicle.setWheelForce(0, 2);
            this.vehicle.setWheelForce(0, 3);
        }

        if('a' in this.pressedKeys){
            this.vehicle.setSteeringValue(maxSteerVal, 0);
            this.vehicle.setSteeringValue(maxSteerVal, 1);
        }
        else if('d' in this.pressedKeys){
            this.vehicle.setSteeringValue(-maxSteerVal, 0);
            this.vehicle.setSteeringValue(-maxSteerVal, 1);
        }
        else{
            this.vehicle.setSteeringValue(0, 0);
            this.vehicle.setSteeringValue(0, 1);
        }

        if('d' in this.pressedKeys && 'a' in this.pressedKeys){
            this.vehicle.setSteeringValue(0, 0);
            this.vehicle.setSteeringValue(0, 1);
        }

        if('w' in this.pressedKeys && 's' in this.pressedKeys){
            this.vehicle.setWheelForce(0, 2);
            this.vehicle.setWheelForce(0, 3);
        }
    }

    onKeyDown(event) {
        if(!(event.key in this.pressedKeys)){
            this.pressedKeys[event.key.toLowerCase()] = true;
        }

        if(event.key == ' '){
            if(this.isOnTheGround()){
                const impulse = new CANNON.Vec3(0, 3500, 0);
                this.carBody.applyImpulse(impulse);
            }
        }

        this.updateCarForces();
    }

    onKeyUp(event) {
        delete this.pressedKeys[event.key.toLowerCase()];
        
        this.updateCarForces();
    }

    isOnTheGround(){
        let wheelsOnGround = 0;
        this.physicsWorld.contacts.forEach((contact) => {
            this.wheels.forEach((object) => {
                let upVector = new CANNON.Vec3(0, 1, 0);
                let contactNormal = new CANNON.Vec3(0, 0, 0);
                let isOnGround = false;
    
                if(contact.bi.id == object.id || contact.bj.id == object.id) {
                    if(contact.bi.id == object.id) {
                        contact.ni.negate(contactNormal);
                    } else {
                        contact.ni.copy(contactNormal);
                    }
        
                    isOnGround = contactNormal.dot(upVector) > 0.5;
                    if(isOnGround) wheelsOnGround += 1;
                }
            })
        })
    
        return wheelsOnGround > 2;
    }

    addWheel(position, pivot){
        const mass = 10;
        
        const wheelShape = new CANNON.Sphere(1);
        const wheelMaterial = new CANNON.Material('wheel');
        const down = new CANNON.Vec3(0, -1, 0);
        
        
        const wheelBody = new CANNON.Body({ mass, material: wheelMaterial });
        wheelBody.addShape(wheelShape);
        wheelBody.angularDamping = 0.4;
        this.wheels.push(wheelBody);
        
        this.vehicle.addWheel({
            body: wheelBody,
            position: position,
            axis: new CANNON.Vec3(0, 0, 1),
            direction: down,
        });

        const cylinderGeo = new THREE.CylinderGeometry(1, 1);
        cylinderGeo.rotateZ(Math.PI / 2)
        cylinderGeo.rotateY(Math.PI / 2)
        const sphereMaterial1 = new THREE.MeshNormalMaterial();
        const sphereMesh1 = new THREE.Mesh(cylinderGeo, sphereMaterial1);
        sphereMesh1.castShadow = true;
        sphereMesh1.receiveShadow = true;

        this.physicsWheels.push(sphereMesh1)

        this.world.scene.add(sphereMesh1);

        const constraint = new CANNON.HingeConstraint(this.carBody, wheelBody, {
            pivotA: pivot,
            axisA: new CANNON.Vec3(1, 0, 0),
            maxForce: 0.99,
        })
        this.physicsWorld.addConstraint(constraint)
    }

    animateWheels(){
        for(let index in this.physicsWheels){
            let physicalWheel = this.physicsWheels[index];
            let wheelBody = this.wheels[index];
            physicalWheel.position.copy(wheelBody.position);
            physicalWheel.quaternion.copy(wheelBody.quaternion);
        }
        
    }
}