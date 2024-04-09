import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';

import SceneInit from './sceneInit';

import { threeToCannon, ShapeType } from 'three-to-cannon';
import { createWorld } from './world';

// ============
// part 0
// set up Three.js scene with axis helper
// ============
const test = new SceneInit('myThreeJsCanvas');
test.initialize();
test.animate();
const axesHelper = new THREE.AxesHelper(8);
test.scene.add(axesHelper);

// ============
// part 1
// set up world physics with gravity
// ============


// create a ground body with a static plane

const physicsWorld = createWorld(test)


// add a green wireframe to each object and visualize the physics world
const cannonDebugger = new CannonDebugger(test.scene, physicsWorld);


// ============
// part 2
// add base vehicle body
// reference: https://github.com/pmndrs/cannon-es/blob/master/examples/rigid_vehicle.html
// ============
const carBody = new CANNON.Body({
    mass: 150,
    position: new CANNON.Vec3(0, 3, 0),
    shape: new CANNON.Box(new CANNON.Vec3(4, 0.5, 2)),
});

const vehicle = new CANNON.RigidVehicle({
    chassisBody: carBody,
});


// ============
// part 2
// add wheels to the vehicle
// ============
const mass = 10;
const axisWidth = 5;
const wheelShape = new CANNON.Sphere(1);
const wheelMaterial = new CANNON.Material('wheel');
const down = new CANNON.Vec3(0, -1, 0);

const wheels = [];

const wheelBody1 = new CANNON.Body({ mass, material: wheelMaterial });
wheelBody1.addShape(wheelShape);
wheelBody1.angularDamping = 0.4;
wheels.push(wheelBody1);

vehicle.addWheel({
    body: wheelBody1,
    position: new CANNON.Vec3(-2.5, 0, axisWidth / 2),
    axis: new CANNON.Vec3(0, 0, 1),
    direction: down,
});

const wheelBody2 = new CANNON.Body({ mass, material: wheelMaterial });
wheelBody2.addShape(wheelShape);
wheelBody2.angularDamping = 0.4;
wheels.push(wheelBody2);
vehicle.addWheel({
    body: wheelBody2,
    position: new CANNON.Vec3(-2.5, 0, -axisWidth / 2),
    axis: new CANNON.Vec3(0, 0, 1),
    direction: down,
});

const wheelBody3 = new CANNON.Body({ mass, material: wheelMaterial });
wheelBody3.addShape(wheelShape);
wheelBody3.angularDamping = 0.4;
wheels.push(wheelBody3);
vehicle.addWheel({
    body: wheelBody3,
    position: new CANNON.Vec3(2.5, 0, axisWidth / 2),
    axis: new CANNON.Vec3(0, 0, 1),
    direction: down,
});

const wheelBody4 = new CANNON.Body({ mass, material: wheelMaterial });
wheelBody4.addShape(wheelShape);
wheelBody4.angularDamping = 0.4;
wheels.push(wheelBody4);
vehicle.addWheel({
    body: wheelBody4,
    position: new CANNON.Vec3(2.5, 0, -axisWidth / 2),
    axis: new CANNON.Vec3(0, 0, 1),
    direction: down,
});

vehicle.addToWorld(physicsWorld);


document.addEventListener('keydown', (event) => {
    const maxSteerVal = Math.PI / 8;
    const maxForce = 1000;

    switch (event.key) {
    case 'w':
    case 'ArrowUp':
        vehicle.setWheelForce(maxForce, 2);
        vehicle.setWheelForce(maxForce, 3);
        break;

    case 's':
    case 'ArrowDown':
        vehicle.setWheelForce(-maxForce, 2);
        vehicle.setWheelForce(-maxForce, 3);
        break;

    case 'a':
    case 'ArrowLeft':
        vehicle.setSteeringValue(maxSteerVal, 0);
        vehicle.setSteeringValue(maxSteerVal, 1);
        break;

    case 'd':
    case 'ArrowRight':
        vehicle.setSteeringValue(-maxSteerVal, 0);
        vehicle.setSteeringValue(-maxSteerVal, 1);
        break;

    case ' ':
        if(isOnTheGround()){
            const impulse = new CANNON.Vec3(0, 500, 0);
            carBody.applyImpulse(impulse);
        }
        break;
    }

    
});

function isOnTheGround(){
    let wheelsOnGround = 0;
    physicsWorld.contacts.forEach((contact) => {
        wheels.forEach((object) => {
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

// reset car force to zero when key is released
document.addEventListener('keyup', (event) => {
    switch (event.key) {
    case 'w':
    case 'ArrowUp':
        vehicle.setWheelForce(0, 2);
        vehicle.setWheelForce(0, 3);
        break;

    case 's':
    case 'ArrowDown':
        vehicle.setWheelForce(0, 2);
        vehicle.setWheelForce(0, 3);
        break;

    case 'a':
    case 'ArrowLeft':
        vehicle.setSteeringValue(0, 0);
        vehicle.setSteeringValue(0, 1);
        break;

    case 'd':
    case 'ArrowRight':
        vehicle.setSteeringValue(0, 0);
        vehicle.setSteeringValue(0, 1);
        break;
    }
});


// ============
// part 5
// sync game world with physics world
// ============

const boxGeometry = new THREE.BoxGeometry(8, 1, 4);
const boxMaterial = new THREE.MeshNormalMaterial();
const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
test.scene.add(boxMesh);

const sphereGeometry1 = new THREE.CylinderGeometry(1, 1);
const sphereMaterial1 = new THREE.MeshNormalMaterial();
const sphereMesh1 = new THREE.Mesh(sphereGeometry1, sphereMaterial1);

test.scene.add(sphereMesh1);

const sphereGeometry2 = new THREE.CylinderGeometry(1);
const sphereMaterial2 = new THREE.MeshNormalMaterial();
const sphereMesh2 = new THREE.Mesh(sphereGeometry2, sphereMaterial2);
test.scene.add(sphereMesh2);

const sphereGeometry3 = new THREE.CylinderGeometry(1);
const sphereMaterial3 = new THREE.MeshNormalMaterial();
const sphereMesh3 = new THREE.Mesh(sphereGeometry3, sphereMaterial3);
test.scene.add(sphereMesh3);

const sphereGeometry4 = new THREE.CylinderGeometry(1);
const sphereMaterial4 = new THREE.MeshNormalMaterial();
const sphereMesh4 = new THREE.Mesh(sphereGeometry4, sphereMaterial4);
test.scene.add(sphereMesh4);

sphereMesh1.geometry.rotateX(Math.PI/2);
sphereMesh2.geometry.rotateX(Math.PI/2);
sphereMesh3.geometry.rotateX(Math.PI/2);
sphereMesh4.geometry.rotateX(Math.PI/2);

test.camera.position.x = carBody.position.x + 20;
test.camera.position.y = carBody.position.y + 20;
test.camera.position.z = carBody.position.z + 0;

var temp = new THREE.Vector3;

const goal = new THREE.Object3D;
boxMesh.add(goal);
goal.position.set(20, 10, 0);

const animate = () => {
    physicsWorld.fixedStep();
    cannonDebugger.update();

    boxMesh.position.copy(carBody.position);
    boxMesh.quaternion.copy(carBody.quaternion);

    temp.setFromMatrixPosition(goal.matrixWorld)
    test.camera.position.lerp(temp, 0.2);
    test.camera.lookAt( boxMesh.position );
    
    sphereMesh1.position.copy(wheelBody1.position);
    sphereMesh1.quaternion.copy(wheelBody1.quaternion);

    sphereMesh2.position.copy(wheelBody2.position);
    sphereMesh2.quaternion.copy(wheelBody2.quaternion);
    sphereMesh3.position.copy(wheelBody3.position);
    sphereMesh3.quaternion.copy(wheelBody3.quaternion);
    sphereMesh4.position.copy(wheelBody4.position);
    sphereMesh4.quaternion.copy(wheelBody4.quaternion);
    window.requestAnimationFrame(animate);
};
animate();
