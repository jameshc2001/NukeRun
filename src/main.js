import * as THREE from '../Common/build/three.module.js';
import {Player} from '../src/player.js';
//import * as CANNON from '../Common/build/cannon.js';

let scene, renderer, canvas
let loaded = false;

let player;
let clock = new THREE.Clock();
let deltaTime = 0;

let world;

let box;
let boxBody;
let floor;
let floorBody;

let physicsMaterial;

//load models and set up test scene
function init() {
    canvas = document.getElementById( "gl-canvas" );

    //set up cannon
    world = new CANNON.World();
    world.gravity.set(0,-9.81,0);
    world.quatNormalizeSkip = 0;
    world.quatNormalizeFast = false;
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;
    world.defaultContactMaterial.contactEquationStiffness = 1e9;
    world.defaultContactMaterial.contactEquationRelaxation = 4;

    physicsMaterial = new CANNON.Material("slipperyMaterial");
    var physicsContactMaterial = new CANNON.ContactMaterial(physicsMaterial,
                                                            physicsMaterial,
                                                            0.0, // friction coefficient
                                                            0.3  // restitution
                                                            );
    world.defaultContactMaterial.friction = 0;

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
    const floorGeometry = new THREE.BoxGeometry( 10, 10, 2 );
    const floorMaterial = new THREE.MeshPhongMaterial( {color: 0x202020} );
    floor = new THREE.Mesh( floorGeometry, floorMaterial );
    floor.rotateX( - Math.PI / 2);
    floor.position.y = -1;
    floor.receiveShadow = true;
    scene.add( floor );
    //now create floor but for cannon
    const floorShape = new CANNON.Box(new CANNON.Vec3(10/2, 10/2, 2/2));
    floorBody = new CANNON.Body({mass:0});
    floorBody.addShape(floorShape);
    floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
    floorBody.position.copy(floor.position);
    world.addBody(floorBody);


    //cube with physics
    const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const boxMaterial = new THREE.MeshPhongMaterial( {color: 0x220000} );
    box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.position.set(0,10,0);
    box.castShadow = true;
    box.receiveShadow = true;
    scene.add(box);
    const boxShape = new CANNON.Box(new CANNON.Vec3(0.5/2, 0.5/2, 0.5/2));
    boxBody = new CANNON.Body({mass:1});
    boxBody.addShape(boxShape);
    boxBody.position.copy(box.position);
    world.addBody(boxBody);

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
    player = new Player(new THREE.Vector3(0,0,0), scene, world);

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

        loaded = player.loaded;        
    }
    else {
        requestAnimationFrame( update );

        //alexMixer.update(0.01);
        deltaTime = clock.getDelta();
        world.step(1/60);
        box.position.copy(boxBody.position);
        box.quaternion.copy(boxBody.quaternion);

        //console.log(boxBody.position);


        player.update(deltaTime);

        //console.log(box.position);

        //controls.update();
        renderer.render( scene, player.camera );
    }
}


init();

//add wait here?


update();