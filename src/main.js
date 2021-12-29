import * as THREE from '../Common/build/three.module.js';
import {Player} from '../src/player.js';
import { AmmoPhysics } from '../Common/examples/jsm/physics/AmmoPhysics.js';

let scene, renderer, canvas
let loaded = true;

let player;
let clock = new THREE.Clock();
let deltaTime = 0;

let physics;

let box;
let plane;

//load models and set up test scene
async function init() {
    canvas = document.getElementById( "gl-canvas" );

    physics = await AmmoPhysics();

    // renderer
    renderer = new THREE.WebGLRenderer( {canvas} );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    // world
    scene = new THREE.Scene();
    //scene.background = new THREE.Color( 0xcccccc );

    //skybox
    const skyLoader = new THREE.CubeTextureLoader();
    skyLoader.setPath( 'Resources/skybox/' );
    const skybox = skyLoader.load(['1.bmp', '2.bmp', '3.bmp',
        '4.bmp', '5.bmp', '6.bmp']);
    scene.background = skybox;

    //make a floor, has to be box for collisions
    const planeGeometry = new THREE.BoxGeometry( 10, 10, 2 );
    const planeMaterial = new THREE.MeshPhongMaterial( {color: 0x202020} );
    plane = new THREE.Mesh( planeGeometry, planeMaterial );
    plane.rotateX( - Math.PI / 2);
    plane.position.y = -1;
    plane.receiveShadow = true;
    scene.add( plane );
    physics.addMesh(plane);

    //cube with physics
    const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const boxMaterial = new THREE.MeshPhongMaterial( {color: 0x220000} );
    box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.position.set(0,40,0);
    box.castShadow = true;
    box.receiveShadow = true;
    scene.add(box);
    physics.addMesh(box, 1);

    // lights
    const dirLight = new THREE.DirectionalLight( 0xffffff, 1.0 );
    dirLight.position.set( -10, 10, -10 );
    dirLight.castShadow = true;
    //Set up shadow properties for the light
    dirLight.shadow.mapSize.width = 512; // default
    dirLight.shadow.mapSize.height = 512; // default
    dirLight.shadow.camera.near = 0.5; // default
    dirLight.shadow.camera.far = 500; // default
    dirLight.shadow.bias = 0;
    //add light and helper
    scene.add( dirLight );
    const helper = new THREE.CameraHelper( dirLight.shadow.camera );
    scene.add( helper );

    const ambLight = new THREE.AmbientLight(0xffffff, 4.0 );
    scene.add(ambLight);

    //load alex (character) and animations
    player = new Player(new THREE.Vector3(0,0,0), scene, physics);

    window.addEventListener( 'resize', onWindowResize );
}


function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;

    player.camera.aspect = aspect;
    player.camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

function update() {
    if (!loaded) {
        requestAnimationFrame( update );

        
    }
    else {
        requestAnimationFrame( update );

        //alexMixer.update(0.01);
        deltaTime = clock.getDelta();
        player.update(deltaTime);

        //console.log(box.position);

        //controls.update();
        renderer.render( scene, player.camera );
    }
}


init();

//add wait here?


update();