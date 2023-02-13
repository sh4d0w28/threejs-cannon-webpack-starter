import './style.css'
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import CannonDebugger from 'cannon-es-debugger'
import {MTLLoader} from 'three/examples/jsm/loaders/MTLLoader.js'
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GUI, GUIController } from 'dat.gui'

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




const CELL_SIZE = 0.1


const physicsObjects = {};
function syncPhysicsObjects() {
    Object.keys(physicsObjects).forEach((key) => {
        var po = physicsObjects[key];
        var threeObject = po.three;
        var cannonObject = po.cannon;
        threeObject.position.copy(cannonObject.position);
        threeObject.quaternion.copy(cannonObject.quaternion);
    });
}


const groundBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane()
});
groundBody.quaternion.setFromEuler(-Math.PI/2, 0, 0)
world.addBody(groundBody)


const level = {
    '10x5x15':[
        {x:0,y:0,z:0,r:0,m:1},
        {x:12,y:0,z:1,r:90,m:1}
    ]
}

loadPhysicsObject('10x5x15');

function loadPhysicsObject(key) {
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
            
                var boundingBox = new THREE.Box3().setFromObject( singleObject );
                var cannonVecDim = new CANNON.Vec3(
                    (boundingBox.max.x - boundingBox.min.x)/2,
                    (boundingBox.max.y - boundingBox.min.y)/2,
                    (boundingBox.max.z - boundingBox.min.z)/2,
                )
                let cannonShape = new CANNON.Box(cannonVecDim);
                        
                let initialPosition = new CANNON.Vec3(
                    cannonVecDim.x + spec.x * CELL_SIZE, 
                    cannonVecDim.y + spec.y * CELL_SIZE, 
                    cannonVecDim.z + spec.z * CELL_SIZE
                )
                
                let cannonBody = new CANNON.Body({
                    position: initialPosition,
                    mass: spec.m,
                    shape: cannonShape
                });
                cannonBody.quaternion.setFromEuler(0, spec.r * Math.PI / 180, 0);

                scene.add( singleObject );
                world.addBody(cannonBody);
                physicsObjects[key + '_' + i] = {three: singleObject, cannon:cannonBody};
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
    syncPhysicsObjects();

    // Update Orbital Controls
    controls.update()

    cannonDebugger.update();

    // Render
    renderer.render(scene, camera)
}

animate()