import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';

import SceneInit from './sceneInit';

import { threeToCannon, ShapeType } from 'three-to-cannon';
import World from './world';
import Car from './car';


const world = new SceneInit('myThreeJsCanvas');
world.initialize();
world.animate();

const cannonWorld = new World(world);
cannonWorld.initialize();
const physicsWorld = cannonWorld.physicsWorld;


const cannonDebugger = new CannonDebugger(world.scene, physicsWorld);


const car = new Car(world, physicsWorld);
car.initialize()


const animate = () => {
    physicsWorld.fixedStep();
    cannonDebugger.update();
    car.animate();
    cannonWorld.animateSunLight(car.carBody.position);

    
    window.requestAnimationFrame(animate);
};
animate();
