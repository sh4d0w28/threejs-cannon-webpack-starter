import './style.css'
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Cannon World
const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0), // m/s²
});

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

function syncPhysicsObjects() {
    return null;
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

    // Render
    renderer.render(scene, camera)
}

animate()