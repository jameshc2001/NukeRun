import * as THREE from '../Common/build/three.module.js';
import {FBXLoader} from '../Common/examples/jsm/loaders/FBXLoader.js';
import { CameraControls } from './cameraControls.js';

export class Player {
    loaded = false;

    position;
    model;
    mixer;
    input;
    actions = {};
    speed;

    world; //physics world
    body; //rigid body
    bodyHelper;
    velocity;

    camera
    controls;
    direction;
    up;
    sideways;
    modelForwards;

    constructor(position, scene, world) {
        this.position = position;
        this.input = new PlayerInput();
        this.world = world;
        this.up = new THREE.Vector3(0,1,0);
        this.sideways = new THREE.Vector3(0,0,0);
        this.direction = new THREE.Vector3(0,0,0);
        this.velocity = new THREE.Vector3(0,0,0);
        this.speed = 4;
        this.modelForwards = new THREE.Vector3(0,0,1);

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
                    this.actions['idle'] = this.mixer.clipAction(idle.animations[0]);
                    this.actions['idle'].play();
                });
                animation.load('Running.fbx', (run) => {
                    this.actions['run'] = this.mixer.clipAction(run.animations[0]);
                    //this.actions[1].play();
                });
                animation.load('Falling Idle.fbx', (fall) => {
                    this.actions['fall'] = this.mixer.clipAction(fall.animations[0]);
                    //this.actions[1].play();
                    //this.actions['fall'].play();
                });

                //add player to scene
                this.model = alex;
                this.model.add(this.camera); //add camera to player
                this.model.position.copy(this.position);
                scene.add(this.model);

                //setup controls
                const firstPersonOffset = new THREE.Vector3(0,0,0);
                const thirdPersonOffset = new THREE.Vector3(0, 200, -200);
                const target = new THREE.Vector3(0,1.4,0);
                this.controls = new CameraControls(this.camera, firstPersonOffset, thirdPersonOffset, target, this.model, document.body);

                //we just finished loading
                this.loaded = true;

                setupPhysics(this);
            }
        );

        function setupPhysics(scope) {
            const geometry = new THREE.BoxGeometry( 0.25, 1.6, 0.25 );
            //const material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
            const wireframe = new THREE.WireframeGeometry(geometry);
            //const cylinder = new THREE.Mesh( geometry, material );
            scope.bodyHelper = new THREE.LineSegments(wireframe);
            scope.bodyHelper.material.depthTest = false;
            scope.bodyHelper.material.opacity = 0.25;
            scope.bodyHelper.material.transparent = true;
            scope.bodyHelper.position.copy(position);
            scope.bodyHelper.position.y += 0.8;

            scene.add( scope.bodyHelper );
            // cylinder.position.y = 0.8;
            // scene.add( cylinder );

            const shape = new CANNON.Box(new CANNON.Vec3(0.25/2, 1.6/2, 0.25/2));
            //const shape = CANNON.BO
            scope.body = new CANNON.Body({mass:1});
            //scope.body.angularFactor.y = 0;
            scope.body.addShape(shape);
            scope.body.position.copy(scope.bodyHelper.position);
            scope.body.fixedRotation = true;
            scope.body.updateMassProperties(); //very important line of code
            world.addBody(scope.body);
        }

        //add listener for getting camera lock
        document.addEventListener('click', function() {this.controls.lock();}.bind(this));
    }

    update(deltaTime) {
        this.mixer.update(deltaTime);
        //this.position.add(new THREE.Vector3(1,0,0).multiplyScalar(deltaTime));

        //use velocity to figure out what animation to play

        this.bodyHelper.position.copy(this.body.position);
        this.bodyHelper.quaternion.copy(this.body.quaternion);


        //update direction
        this.direction.copy(this.body.position);
        this.direction.sub(this.camera.position);
        this.direction.y = 0;
        this.direction.normalize();
        this.sideways.crossVectors(this.direction, this.up);

        //console.log(this.direction);

        //rotate model
        // if (this.input.wKey || this.input.sKey || this.input.aKey || this.input.dKey) {
        //     const angle = this.modelForwards.angleTo(this.direction);
        //     this.modelForwards.copy(this.direction);
        //     this.model.rotation.y -= angle;
        // }
        //console.log(this.camera.position);


        if (this.input.escKey) this.controls.unlock(); //unlock and lock too quickly gives error

        // if (this.input.wKey) this.position.add(new THREE.Vector3(0,0,1).multiplyScalar(deltaTime));
        // if (this.input.sKey) this.position.add(new THREE.Vector3(0,0,-1).multiplyScalar(deltaTime));

        // if (this.input.aKey) this.position.add(new THREE.Vector3(1,0,0).multiplyScalar(deltaTime));
        // if (this.input.dKey) this.position.add(new THREE.Vector3(-1,0,0).multiplyScalar(deltaTime));

        if (this.input.wKey) {
            this.velocity.copy(this.direction);
            this.velocity.multiplyScalar(this.speed);
        }
        if (this.input.sKey) {
            this.velocity.copy(this.direction);
            this.velocity.multiplyScalar(-this.speed);
        }

        if (this.input.aKey) {
            this.velocity.copy(this.sideways);
            this.velocity.multiplyScalar(-this.speed);
        }
        if (this.input.dKey)  {
            this.velocity.copy(this.sideways);
            this.velocity.multiplyScalar(this.speed);
        }

        if (this.input.wKey && this.input.aKey) {
            this.velocity.copy(this.sideways);
            this.velocity.multiplyScalar(-1);
            this.velocity.add(this.direction);
            this.velocity.multiplyScalar(this.speed/Math.SQRT2);
        }
        if (this.input.wKey && this.input.dKey) {
            this.velocity.copy(this.sideways);
            //this.velocity.multiplyScalar(-1);
            this.velocity.add(this.direction);
            this.velocity.multiplyScalar(this.speed/Math.SQRT2);
        }
        if (this.input.sKey && this.input.aKey) {
            this.velocity.copy(this.sideways);
            this.velocity.add(this.direction);
            this.velocity.multiplyScalar(-this.speed/Math.SQRT2);
        }
        if (this.input.sKey && this.input.dKey) {
            this.velocity.copy(this.direction);
            this.velocity.multiplyScalar(-1);
            this.velocity.add(this.sideways);
            this.velocity.multiplyScalar(this.speed/Math.SQRT2);
        }

        if (!this.input.wKey && !this.input.sKey && !this.input.aKey && !this.input.dKey) this.velocity.set(0,0,0);

        this.body.velocity.x = this.velocity.x;
        this.body.velocity.z = this.velocity.z;

        //console.log(this.body.velocity.length());

        const prevPos = new THREE.Vector3();
        prevPos.copy(this.model.position);

        const newPos = new THREE.Vector3(0,0,0);
        newPos.copy(this.body.position);
        newPos.sub(new THREE.Vector3(0,0.8,0));
        this.model.position.copy(newPos);

        const diff = new THREE.Vector3()
        diff.copy(newPos);
        diff.sub(prevPos);
        //console.log(diff.length());
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