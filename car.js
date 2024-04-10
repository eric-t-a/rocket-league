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

    }

    initialize() {
        this.carBody = new CANNON.Body({
            mass: 150,
            position: new CANNON.Vec3(0, 3, 0),
            shape: new CANNON.Box(new CANNON.Vec3(5, 0.5, 1.5)),
        });
        
        this.vehicle = new CANNON.RigidVehicle({
            chassisBody: this.carBody,
        });

        const axisWidth = 5;

        this.addWheel(new CANNON.Vec3(-2.5, 0, axisWidth / 2.5));
        this.addWheel(new CANNON.Vec3(-2.5, 0, -axisWidth / 2.5));
        this.addWheel(new CANNON.Vec3(2.5, 0, axisWidth / 2.5));
        this.addWheel(new CANNON.Vec3(2.5, 0, -axisWidth / 2.5));

        
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
        this.goal.position.set(20, 10, 0);

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

    onKeyDown(event) {
        const maxSteerVal = Math.PI / 8;
        const maxForce = 1000;

        switch (event.key) {
        case 'w':
        case 'ArrowUp':
            this.vehicle.setWheelForce(maxForce, 2);
            this.vehicle.setWheelForce(maxForce, 3);
            break;

        case 's':
        case 'ArrowDown':
            this.vehicle.setWheelForce(-maxForce, 2);
            this.vehicle.setWheelForce(-maxForce, 3);
            break;

        case 'a':
        case 'ArrowLeft':
            this.vehicle.setSteeringValue(maxSteerVal, 0);
            this.vehicle.setSteeringValue(maxSteerVal, 1);
            break;

        case 'd':
        case 'ArrowRight':
            this.vehicle.setSteeringValue(-maxSteerVal, 0);
            this.vehicle.setSteeringValue(-maxSteerVal, 1);
            break;

        case ' ':
            if(this.isOnTheGround()){
                const impulse = new CANNON.Vec3(0, 3500, 0);
                this.carBody.applyImpulse(impulse);
            }
            break;
        }
    }

    onKeyUp(event) {
        switch (event.key) {
            case 'w':
            case 'ArrowUp':
                this.vehicle.setWheelForce(0, 2);
                this.vehicle.setWheelForce(0, 3);
                break;
        
            case 's':
            case 'ArrowDown':
                this.vehicle.setWheelForce(0, 2);
                this.vehicle.setWheelForce(0, 3);
                break;
        
            case 'a':
            case 'ArrowLeft':
                this.vehicle.setSteeringValue(0, 0);
                this.vehicle.setSteeringValue(0, 1);
                break;
        
            case 'd':
            case 'ArrowRight':
                this.vehicle.setSteeringValue(0, 0);
                this.vehicle.setSteeringValue(0, 1);
                break;
        }
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

    addWheel(position){
        const mass = 10;
        
        const wheelShape = new CANNON.Sphere(1);
        const wheelMaterial = new CANNON.Material('wheel');
        const down = new CANNON.Vec3(0, -1, 0);
        
        
        const wheelBody1 = new CANNON.Body({ mass, material: wheelMaterial });
        wheelBody1.addShape(wheelShape);
        wheelBody1.angularDamping = 0.4;
        this.wheels.push(wheelBody1);
        
        this.vehicle.addWheel({
            body: wheelBody1,
            position: position,
            axis: new CANNON.Vec3(0, 0, 1),
            direction: down,
        });

        const sphereGeometry1 = new THREE.CylinderGeometry(1, 1);
        const sphereMaterial1 = new THREE.MeshNormalMaterial();
        const sphereMesh1 = new THREE.Mesh(sphereGeometry1, sphereMaterial1);
        sphereMesh1.castShadow = true;
        sphereMesh1.receiveShadow = true;

        sphereMesh1.geometry.rotateX(Math.PI/2);
        this.physicsWheels.push(sphereMesh1)

        this.world.scene.add(sphereMesh1);
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