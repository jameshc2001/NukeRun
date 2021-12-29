import * as THREE from '../Common/build/three.module.js';
import {FBXLoader} from '../Common/examples/jsm/loaders/FBXLoader.js';
import { CameraControls } from './cameraControls.js';

export class Player {
    position;
    model;
    mixer;
    input;
    actions = [];

    camera

    controls;

    //plan: decouple camera from player. use pointer lock controls but modify for thirf
    //person i.e. use the same angle calculated but use it to rotate about a target (the player)
    //will need to update it before moving player in update loop

    constructor(position, scene) {
        this.position = position;
        this.input = new PlayerInput();

        //create cameras
        const fov = 75;
        const aspect = window.innerWidth / window.innerHeight;
        const near = 0.1;
        const far = 10000;

        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

        //load the model and animations
        const fbxLoader = new FBXLoader();
        fbxLoader.setPath('Resources/alex/');
        fbxLoader.load(
            'Alex.fbx',
            (alex) => {
                //need to find child mesh and set cast shadows to true
                alex.traverse(child => { 
                    child.castShadow = true;
                });
                alex.scale.setScalar(0.01);
                alex.castShadow = true;

                //get the animations
                this.mixer = new THREE.AnimationMixer(alex);
                const animation = new FBXLoader();
                animation.setPath('Resources/alex/');
                animation.load('Idle.fbx', (idle) => {
                    this.actions.push(this.mixer.clipAction(idle.animations[0]));
                    this.actions[0].play(); //WOOOOOOO CHANGE TO MAP, SOMETIME LOADS IN DIFFERENT ORDER
                });
                animation.load('Running.fbx', (run) => {
                    this.actions.push(this.mixer.clipAction(run.animations[0]));
                    //this.actions[1].play();
                });

                //add player to scene
                this.model = alex;
                this.model.add(this.camera);
                scene.add(this.model);

                //add camera to player
                //scale is at 0.01 for model so need to factor that in
                this.camera.position.y = 200;
                this.camera.position.z = -200;
                this.camera.lookAt(0,1,0);

                //setup controls
            },
            (xhr) => {
                //console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
            }
        );
    }

    update(deltaTime) {
        this.mixer.update(deltaTime);
        //this.position.add(new THREE.Vector3(1,0,0).multiplyScalar(deltaTime));

        //use velocity to figure out what animation to play

        //if any input... set player to be aligned with camera

        if (this.input.wKey) this.position.add(new THREE.Vector3(0,0,1).multiplyScalar(deltaTime));
        if (this.input.sKey) this.position.add(new THREE.Vector3(0,0,-1).multiplyScalar(deltaTime));

        if (this.input.aKey) this.position.add(new THREE.Vector3(1,0,0).multiplyScalar(deltaTime));
        if (this.input.dKey) this.position.add(new THREE.Vector3(-1,0,0).multiplyScalar(deltaTime));

        //console.log("x: " + this.input.mouseX.toString() + " y: " + this.input.mouseY.toString());

        this.model.position.copy(this.position);
    }
}

class PlayerInput {
    constructor() {
        this.wKey = false;
        this.aKey = false;
        this.sKey = false;
        this.dKey = false;
        this.spaceKey = false;

        this.viewHalfX = 0;
        this.viewHalfY = 0;
        this.mouseX = 0;
        this.mouseY = 0;

        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));

        // document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        // window.addEventListener( 'resize', this.onWindowResize);
    }

    onKeyDown(e) {
        switch(e.keyCode) {
            case 87: this.wKey = true; break;
            case 65: this.aKey = true; break;
            case 83: this.sKey = true; break;
            case 68: this.dKey = true; break;
            case 32: this.spaceKey = true; break;
        }
    }

    onKeyUp(e) {
        switch(e.keyCode) {
            case 87: this.wKey = false; break;
            case 65: this.aKey = false; break;
            case 83: this.sKey = false; break;
            case 68: this.dKey = false; break;
            case 32: this.spaceKey = false; break;
        }
    }
}