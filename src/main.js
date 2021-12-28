import * as THREE from '../Common/build/three.module.js';
import { TrackballControls } from '../Common/examples/jsm/controls/TrackballControls.js';
import {FBXLoader} from '../Common/examples/jsm/loaders/FBXLoader.js';
import {Player} from '../src/player.js';

let camera, controls, scene, renderer, canvas, flag;
let alexMixer;
let loaded = true;

let player;
let clock = new THREE.Clock();
let deltaTime = 0;

//load models and set up test scene
function init() {
    canvas = document.getElementById( "gl-canvas" );

    //define camera
    const fov = 75;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 100;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 10;
    camera.position.y = 5;

    // world
    scene = new THREE.Scene();
    //scene.background = new THREE.Color( 0xcccccc );

    //skybox
    const skyLoader = new THREE.CubeTextureLoader();
    skyLoader.setPath( 'Resources/skybox/' );
    const skybox = skyLoader.load(['1.bmp', '2.bmp', '3.bmp',
        '4.bmp', '5.bmp', '6.bmp']);
    scene.background = skybox;

    //make a plane
    const planeGeometry = new THREE.PlaneGeometry( 10, 10 );
    const planeMaterial = new THREE.MeshPhongMaterial( {color: 0x202020} );
    const plane = new THREE.Mesh( planeGeometry, planeMaterial );
    plane.rotateX( - Math.PI / 2);
    plane.position.y = 0;
    plane.receiveShadow = true;
    scene.add( plane );

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

    // const ambientLight = new THREE.AmbientLight( 0xF22222, 2.0 );
    // scene.add( ambientLight );

    //load alex (character) and animations
    player = new Player(new THREE.Vector3(0,0,0), scene);
    // scene.add(player.fbx);
    // console.log(player.fbx);
    // const fbxLoader = new FBXLoader();
    // fbxLoader.setPath('Resources/alex/');
    // fbxLoader.load(
    //     'Alex.fbx',
    //     (alex) => {
    //         //need to find child mesh and set cast shadows to true
    //         alex.traverse(child => { 
    //             child.castShadow = true;
    //         });
    //         alex.scale.setScalar(0.01);
    //         alex.castShadow = true;

    //         //get the animations
    //         const animation = new FBXLoader();
    //         animation.setPath('Resources/alex/');
    //         animation.load('Idle.fbx', (idle) => {
    //             alexMixer = new THREE.AnimationMixer(alex);
    //             const action = alexMixer.clipAction(idle.animations[0]);
    //             action.play();
    //         });

    //         scene.add(alex)
    //     },
    //     (xhr) => {
    //         //console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
    //     }
    // );

    // renderer
    renderer = new THREE.WebGLRenderer( {canvas} );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    window.addEventListener( 'resize', onWindowResize );

    createControls( camera );
    controls.update();
}

function createControls( camera ) {
    controls = new TrackballControls( camera, renderer.domElement );

    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 5;
    controls.panSpeed = 0.8;

    controls.keys = [ 'KeyA', 'KeyS', 'KeyD' ];
}

function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;

    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    controls.handleResize();
    controls.update();
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

        controls.update();
        renderer.render( scene, camera );
    }
}


init();

//add wait here?


update();