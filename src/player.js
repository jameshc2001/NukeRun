import * as THREE from '../Common/build/three.module.js';
import {FBXLoader} from '../Common/examples/jsm/loaders/FBXLoader.js';
import { CameraControls } from './cameraControls.js';
import { AmmoPhysics } from '../Common/examples/jsm/physics/AmmoPhysics.js';

export class Player {
    position;
    model;
    mixer;
    input;
    actions = [];

    collider;

    camera
    controls;

    constructor(position, scene, physics) {
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
                let mesh;
                alex.traverse(child => { 
                    child.castShadow = true;
                    if (child.isMesh) mesh = child;
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
                this.model.add(this.camera); //add camera to player
                scene.add(this.model);
                physics.addMesh(mesh);

                let test = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshPhongMaterial({color:0x002200}));
                test.position.y = 20;
                scene.add(test);
                physics.addMesh(test,1);

                console.log(mesh);
                //create box with invisible material for collisions?

                //add camera to player
                //scale is at 0.01 for model so need to factor that in
                // this.camera.position.y = 200;
                // this.camera.position.z = -200;
                // this.camera.lookAt(0,1,0);

                //setup controls
                const firstPersonOffset = new THREE.Vector3(0,0,0);
                const thirdPersonOffset = new THREE.Vector3(0, 200, -200);
                const target = new THREE.Vector3(0,1.4,0);
                this.controls = new CameraControls(this.camera, firstPersonOffset, thirdPersonOffset, target, this.model, document.body);
            },
            (xhr) => {
                //console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
            }
        );

        //add listener for getting camera lock
        document.addEventListener('click', function() {this.controls.lock();}.bind(this));
    }

    update(deltaTime) {
        this.mixer.update(deltaTime);
        //this.position.add(new THREE.Vector3(1,0,0).multiplyScalar(deltaTime));

        //use velocity to figure out what animation to play

        //if any input... set player to be aligned with camera

        if (this.input.escKey) this.controls.unlock(); //unlock and lock too quickly gives error

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
        this.escKey = false;

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
            case 27: this.escKey = true; break;
        }
    }

    onKeyUp(e) {
        switch(e.keyCode) {
            case 87: this.wKey = false; break;
            case 65: this.aKey = false; break;
            case 83: this.sKey = false; break;
            case 68: this.dKey = false; break;
            case 32: this.spaceKey = false; break;
            case 27: this.escKey = false; break;
        }
    }
}