import './style.css'
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import CannonDebugger from 'cannon-es-debugger'
import {MTLLoader} from 'three/examples/jsm/loaders/MTLLoader.js'
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader.js'
import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import ThreeCannonBinder from './ThreeCannonBinder';
import world_1 from './wold_1';
require('./KeyboardState')

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Keyboard controller
let keyboard = new KeyboardState();

// Cannon World
const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0), // m/s²
});

const cannonDebugger = new CannonDebugger(scene, world, {color: "#00F900"});

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
const camera = new THREE.PerspectiveCamera(90, sizes.width / sizes.height, 0.1, 1000)
camera.position.x = 5
camera.position.y = 5
camera.position.z = 5
camera.lookAt(new THREE.Vector3(0,0,0))
scene.add(camera)

const light = new THREE.AmbientLight('#ffffff', 1);
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

const slippery = new CANNON.Material({
    friction: 0.01
});

const groundBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane(),
    material: slippery
});
groundBody.quaternion.setFromEuler(-Math.PI/2, 0, 0)
world.addBody(groundBody)


const fbxLoader = new FBXLoader();
fbxLoader.setPath('models/');

let mixer = new THREE.AnimationMixer()
let modelReady = false
const animationActions = [];
var playerBody;

fbxLoader.load('lionvox.fbx', function(object) {
    object.scale.set(0.01,0.01,0.01)
    
    var boundingBox = new THREE.Box3().setFromObject( object );
    console.log(boundingBox);
    var cannonVecDim = new CANNON.Vec3(
        (boundingBox.max.x - boundingBox.min.x)/2,
        (boundingBox.max.y - boundingBox.min.y)/2,
        (boundingBox.max.z - boundingBox.min.z)/2,
    )
    let cannonShape = new CANNON.Box(cannonVecDim);
    let initialPosition = new CANNON.Vec3(
        cannonVecDim.x+20, 
        cannonVecDim.y, 
        cannonVecDim.z+20
    )
    
    playerBody = new CANNON.Body({
        position: initialPosition,
        mass: 1,
        fixedRotation: true,
        material: slippery,
        shape: cannonShape
    });



    mixer = new THREE.AnimationMixer(object)
    object.animations.forEach((a) => {
        animationActions[a.name] = mixer.clipAction(a);
        console.log('found ' + a.name);
    });
    

    scene.add( object );
    world.addBody(playerBody);
    threeCannonBinder.bindThreeCannon(object, playerBody, 'player');

    modelReady = true;
    animationActions['PetalAnimation'].play()
    animationActions['Walking Animation'].play()

}, undefined, function ( error ) {
    console.error( error );
});

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

                if(spec.y == null) {
                    spec.y = 0;
                }
                if(spec.m == null) {
                    spec.m = 0;
                } 
                if(spec.r == null) {
                    spec.r = 0;
                }
                if(spec.sz == null) {
                    spec.sz = 1;
                }
                if(spec.sy == null) {
                    spec.sy = 1;
                }
                if(spec.sx == null) {
                    spec.sx = 1;
                }

                const singleObject = object.clone()

                singleObject.traverse(function(child) { 
                    if ( child instanceof THREE.Mesh ) {
                        child.rotateY(spec.r / 180 * Math.PI)
                        child.scale.set(spec.sx, spec.sy, spec.sz);
                    }
                })

                const cannonBody = threeCannonBinder.getCannon(singleObject, spec.x, spec.y, spec.z, 0, 0, 0, spec.sx,spec.sy,spec.sz, spec.m);
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

    if (modelReady) mixer.update(clock.getDelta())

    if (modelReady) {
         camera.position.x = playerBody.position.x - 9;
         camera.position.z = playerBody.position.z + 2;
         camera.lookAt(playerBody.position.x, playerBody.position.y, playerBody.position.z);
    }

    if ( keyboard.pressed("W") )  {
        playerBody.force = new CANNON.Vec3(9,0,0);
        playerBody.quaternion.setFromEuler(0, Math.PI/2 ,0)
        playerBody.material.friction = 0;
    }
    if ( keyboard.pressed("S") )  {
        playerBody.force = new CANNON.Vec3(-9,0,0);
        playerBody.quaternion.setFromEuler(0, -Math.PI/2 ,0)
        playerBody.material.friction = 0;
    }
    if ( keyboard.pressed("A") ) {
        playerBody.force = new CANNON.Vec3(0,0,-9);
        playerBody.quaternion.setFromEuler(0, Math.PI ,0)
        playerBody.material.friction = 0;
    }
    if ( keyboard.pressed("D") ) {
        playerBody.force = new CANNON.Vec3(0,0,9);
        playerBody.quaternion.setFromEuler(0, 0 ,0)
        playerBody.material.friction = 0;
    }
    if (keyboard.up("W") || keyboard.up("A") || keyboard.up("S") || keyboard.up("D")) {
        playerBody.force = new CANNON.Vec3(0,0,0);
        playerBody.material.friction = 0.1;
    }
    keyboard.update()

    cannonDebugger.update();

    // Render
    renderer.render(scene, camera)
}

animate()