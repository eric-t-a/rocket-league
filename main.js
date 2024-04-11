import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';

import SceneInit from './sceneInit';

import { threeToCannon, ShapeType } from 'three-to-cannon';
import { createWorld } from './world';
import Car from './car';

// ============
// part 0
// set up Three.js scene with axis helper
// ============
const world = new SceneInit('myThreeJsCanvas');
world.initialize();
world.animate();
// const axesHelper = new THREE.AxesHelper(8);
// world.scene.add(axesHelper);

// ============
// part 1
// set up world physics with gravity
// ============


// create a ground body with a static plane

const {physicsWorld, light} = createWorld(world)


// add a green wireframe to each object and visualize the physics world
const cannonDebugger = new CannonDebugger(world.scene, physicsWorld);


// ============
// part 2
// add base vehicle body
// reference: https://github.com/pmndrs/cannon-es/blob/master/examples/rigid_vehicle.html
// ============



const car = new Car(world, physicsWorld);
car.initialize()



const animate = () => {
    physicsWorld.fixedStep();
    cannonDebugger.update();
    car.animate();
    light.target.position.copy(car.chassisBody.position);

    
    window.requestAnimationFrame(animate);
};
animate();
