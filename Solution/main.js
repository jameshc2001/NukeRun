//this is the main entry point for the program

import * as THREE from "../Extra Libraries/three.module.js";
import { Level } from './level.js';
import { Resources } from './resources.js';

let scene, renderer, canvas, camera;
let plane1, plane2, nuke;

let level;
let resources;
let clock;
let deltaTime;

//load models and set up test scene
function init() {
    canvas = document.getElementById( "gl-canvas" );

    //set up timing for consistent gameplay across different hardware
    clock = new THREE.Clock();
    deltaTime = 0;

    // renderer
    renderer = new THREE.WebGLRenderer( {canvas} );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    //load resources and setup level
    resources = new Resources();
    level = new Level(renderer, resources);

    //now prepare the main menu scene

    //camera
    const fov = 75;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 100;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = -3;
    camera.position.x = 1.4;
    camera.position.y = 1.2;
    camera.lookAt(0,0,0);

    //scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xcccccc );

    const geometryPlane1 = new THREE.PlaneGeometry( 100, 100 );
    const materialPlane1 = new THREE.MeshPhongMaterial( {color: 0x7a7a7a, side: THREE.DoubleSide} );
    plane1 = new THREE.Mesh( geometryPlane1, materialPlane1 );
    plane1.receiveShadow = true;
    scene.add( plane1 );

    const materialPlane2 = new THREE.MeshPhongMaterial( {color: 0x424242, side: THREE.DoubleSide} );
    plane2 = new THREE.Mesh(geometryPlane1, materialPlane2);
    plane2.rotateX( - Math.PI / 2);
    plane2.position.y = -1;
    plane2.receiveShadow = true;
    scene.add(plane2);

    // lights
    const dirLight = new THREE.DirectionalLight( 0xffffff, 1.0 );
    dirLight.position.set( -10, 10, -10 );
    dirLight.castShadow = true;
    //Set up shadow properties for the light
    dirLight.shadow.mapSize.width = 1024; // default
    dirLight.shadow.mapSize.height = 1024; // default
    dirLight.shadow.camera.near = 0.5; // default
    dirLight.shadow.camera.far = 500; // default
    dirLight.shadow.bias = 0;
    //add light
    scene.add( dirLight );
    // const helper = new THREE.CameraHelper( dirLight.shadow.camera ); //uncomment for dev
    // scene.add( helper );

    //ambient light to make everything more visible
    const ambLight = new THREE.AmbientLight(0xffffff, 0.5 );
    scene.add(ambLight);

    //handle resizes
    window.addEventListener( 'resize', onWindowResize );

    //set up buttons for html menus
    document.getElementById('level1Button').onclick = function() {
        console.log('loading level 1');
        document.getElementById('mainMenu').style.display = "none";
        level.load(0);
    }
    document.getElementById('level2Button').onclick = function() {
        console.log('loading level 2');
        document.getElementById('mainMenu').style.display = "none";
        level.load(1);
    }
    document.getElementById('howToPlayButton').onclick = function() {
        console.log('showing how to play');
        document.getElementById('mainMenu').style.display = "none";
        document.getElementById('howTo').style.display = "block";
    }
    document.getElementById('backButton').onclick = function() {
        console.log('going back to main menu');
        document.getElementById('howTo').style.display = "none";
        document.getElementById('mainMenu').style.display = "block";
    }
    document.getElementById('returnButton').onclick = function() {
        console.log('going back to main menu after disarming nuke');
        document.getElementById('win').style.display = "none";
        document.getElementById('mainMenu').style.display = "block";
        level.player.waterAmbientSound.stop();
        level.loaded = false;
        onWindowResize();
    }
}


function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;

    if (level.loaded) {
        level.handleResize(aspect);
    }
    else {
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
    }

    renderer.setSize( window.innerWidth, window.innerHeight );
}

//this function is called every frame
function update() {
    requestAnimationFrame( update );
    deltaTime = clock.getDelta();

    if (level.loaded) {
        level.update(deltaTime);
        level.render();
    }
    else {
        if (nuke == null && resources.loaded()) { //all resources have been loaded
            level.turnOffElement('loading');
            level.turnOnElement('mainMenu');
            nuke = resources.nukeModel.clone();
            nuke.position.set(-0.2,0.7,-1.7);
            scene.add(nuke);
        }
        if (nuke != null) { //rotate the nuke to make it look cool
            nuke.rotation.y += deltaTime;
            nuke.position.y = 0.7 + Math.cos(clock.getElapsedTime()) * 0.25;
        }

        renderer.render( scene, camera );
    }
}


init();
update();