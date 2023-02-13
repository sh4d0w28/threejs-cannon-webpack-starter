import './style.css'
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import CannonDebugger from 'cannon-es-debugger'
import {MTLLoader} from 'three/examples/jsm/loaders/MTLLoader.js'
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import ThreeCannonBinder from './ThreeCannonBinder';
import world_1 from './wold_1';

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Cannon World
const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0), // m/s²
});

const cannonDebugger = new CannonDebugger(scene, world, {});

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(90, sizes.width / sizes.height, 0.1, 300)
camera.position.x = 5
camera.position.y = 5
camera.position.z = 5
camera.lookAt(new THREE.Vector3(0,0,0))
scene.add(camera)

const light = new THREE.AmbientLight();
scene.add(light);   

const axesHelper = new THREE.AxesHelper(5);
// BLUE = Z
// RED = X
// GREEN = Y
scene.add(axesHelper);

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
});
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 4))

/**
 * Animate
 */
let clock = new THREE.Clock();

const groundBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane()
});
groundBody.quaternion.setFromEuler(-Math.PI/2, 0, 0)
world.addBody(groundBody)

function loadWorld(worldSpec) {
    Object.keys(worldSpec).forEach((key) => {
        console.log(key);
        loadPhysicsObject(worldSpec, key);
    })
}

loadWorld(world_1);

const threeCannonBinder = new ThreeCannonBinder(0.1);

function loadPhysicsObject(level, key) {
    const mtlLoader = new MTLLoader();
    const objLoader = new OBJLoader();

    mtlLoader.setPath( 'models/' );
    mtlLoader.load( key + '.mtl', function( materials ) {
        materials.preload();    
        objLoader.setMaterials( materials );
        objLoader.setPath( 'models/' );
        objLoader.load( key + '.obj', function ( object ) {
          
            // move center of geomerty to center of scene
            object.traverse( function ( child ) {
                if ( child instanceof THREE.Mesh ) {
                   child.geometry.center();
                }
            } ); 
            level[key].forEach((spec,i) => {
                const singleObject = object.clone()
                const cannonBody = threeCannonBinder.getCannon(singleObject, spec.x, spec.y, spec.z, 0, spec.r, 0, spec.m);
                scene.add( singleObject );
                world.addBody(cannonBody);
                threeCannonBinder.bindThreeCannon(singleObject, cannonBody, key + "_" + i);
            })
        });
    });
}


const animate = () =>
{
    requestAnimationFrame(animate)

    // Run the simulation independently of framerate every 1 / 60 ms
    world.fixedStep()

    // Update objects
    threeCannonBinder.syncPhysicsObjects();

    // Update Orbital Controls
    controls.update()

    cannonDebugger.update();

    // Render
    renderer.render(scene, camera)
}

animate()