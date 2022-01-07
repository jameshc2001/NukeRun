//this handles the player and input

import * as THREE from '../Extra Libraries/three.module.js';
import { CameraControls } from './cameraControls.js';
import * as SkeletonUtils from '../Extra Libraries/SkeletonUtils.js';

export class Player {
    loaded = false;

    model; //game object
    mixer; //animation mixer
    input; //a class that keeps track of pressed keys
    actions = {}; //animations
    currentAction; //current animation

    firstPersonMat; //material for model in first person mode (invisible)
    thirdPersonMat; //usual material, for third person mode

    world; //physics world
    body; //rigid body
    bodyHelper; //for showing wireframe of player collider for dev purposes
    velocity; //calculated from input
    canJump; //true if player on ground
    jumpForce; //how much force to jump with
    speed; //determines player's speed

    camera
    controls; //class that handles movement of camera from mouse input
    direction; //forwards direction, depends on camera
    up; //always (0, 1, 0)
    sideways; //cross product of direction and up
    modelForwards; //the starting forwards direction of model, rotations happen with respect to this

    listener; //where audio is picked up from, attached to camera
    waterAmbientSound;
    waterSplashSound;
    jumpSound;
    landSound;
    explosionSound;

    dead;
    hasMoved; //used by level for starting nuke timer

    constructor(position, scene, world, resources) {
        this.dead = false;
        this.hasMoved = false;
        this.input = new PlayerInput();
        this.world = world;
        this.up = new THREE.Vector3(0,1,0);
        this.sideways = new THREE.Vector3(0,0,0);
        this.direction = new THREE.Vector3(0,0,0);
        this.velocity = new THREE.Vector3(0,0,0);
        this.speed = 4;
        this.modelForwards = new THREE.Vector3(0,0,1);
        this.currentAction = 'idle';
        this.canJump = true;
        this.jumpForce = 6;

        //load model and animations
        this.model = SkeletonUtils.clone(resources.playerModel);
        this.mixer = new THREE.AnimationMixer(this.model);
        this.actions['idle'] = this.mixer.clipAction(resources.playerAnimations['idle']);
        this.actions['run'] = this.mixer.clipAction(resources.playerAnimations['run']);
        this.actions['fall'] = this.mixer.clipAction(resources.playerAnimations['fall']);
        this.actions['left'] = this.mixer.clipAction(resources.playerAnimations['left']);
        this.actions['right'] = this.mixer.clipAction(resources.playerAnimations['right']);
        this.actions['backwards'] = this.mixer.clipAction(resources.playerAnimations['backwards']);
        this.model.position.copy(position);
        scene.add(this.model);

        //set materials for each perspective
        this.thirdPersonMat = this.model.children[0].material;
        this.firstPersonMat = new THREE.MeshBasicMaterial({ //make player invisible but still cast shadow in first person
            color: 0x000000,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            opacity: 0
        });
        
        //create camera and controls
        const fov = 75;
        const aspect = window.innerWidth / window.innerHeight;
        const near = 0.1;
        const far = 10000;
        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        const thirdPersonOffset = new THREE.Vector3(0, 2, -2);
        const firstPersonOffset = new THREE.Vector3(0, 1.6, 0);
        const targetOffset = new THREE.Vector3(0,1.4,0);
        this.controls = new CameraControls(this.camera, thirdPersonOffset, firstPersonOffset, this.model, targetOffset, document.body);

        //setup sounds
        this.listener = new THREE.AudioListener();
        this.camera.add(this.listener);

        this.waterAmbientSound = new THREE.Audio(this.listener);
        this.waterAmbientSound.setBuffer(resources.waterAmbient);
        this.waterAmbientSound.setLoop(true);
        this.waterAmbientSound.setVolume(0.5);
        this.waterAmbientSound.play();

        this.waterSplashSound = new THREE.Audio(this.listener);
        this.waterSplashSound.setBuffer(resources.waterSplash);

        this.jumpSound = new THREE.Audio(this.listener);
        this.jumpSound.setBuffer(resources.jump);

        this.landSound = new THREE.Audio(this.listener);
        this.landSound.setBuffer(resources.land);
        this.landSound.setVolume(0.5);

        this.explosionSound = new THREE.Audio(this.listener);
        this.explosionSound.setBuffer(resources.explosion);

        //physics
        setupPhysics(this);

        function setupPhysics(scope) {
            const pos = new THREE.Vector3();
            pos.copy(position);
            pos.y += 0.8;

            //uncomment for dev
            // const geometry = new THREE.BoxGeometry( 0.25, 1.6, 0.25 );
            // const wireframe = new THREE.WireframeGeometry(geometry);
            // scope.bodyHelper = new THREE.LineSegments(wireframe);
            // scope.bodyHelper.material.depthTest = false;
            // scope.bodyHelper.material.opacity = 0.25;
            // scope.bodyHelper.material.transparent = true;
            // scope.bodyHelper.position.copy(pos);
            // scene.add( scope.bodyHelper );

            const shape = new CANNON.Box(new CANNON.Vec3(0.25/2, 1.6/2, 0.25/2));
            scope.body = new CANNON.Body({mass:1, collisionFilterGroup: 4, collisionFilterMask: 1});
            scope.body.addShape(shape);
            scope.body.position.copy(pos);
            scope.body.fixedRotation = true;
            scope.body.updateMassProperties(); //very important line of code
            world.addBody(scope.body);
        }

        //add listener for getting camera lock
        document.addEventListener('click', function() {this.controls.lock();}.bind(this));

        this.loaded = true;
    }

    //controls is true if we are only stopping the players controls
    kill(controls) { //if controls false then also take out the collider and stop landing sound
        this.dead = true;
        this.controls.enabled = false;
        this.controls.unlock(); //give back mouse
        if(this.canJump) this.updateAnimations('idle');
        if (!controls) {
            this.landSound.setVolume(0.0);
            this.body.collisionFilterGroup = 8; //disable collisions so player falls
        }
    }

    update(deltaTime) {
        const prevAction = this.currentAction;
        const prevCanJump = this.canJump;

        //check for death by drowning
        if (!this.dead && this.body.position.y < -1) {
            this.waterSplashSound.play();
            this.kill();
        }

        //if helper was created (for dev purposes), update it's position
        if (this.bodyHelper != null) {
            this.bodyHelper.position.copy(this.body.position);
            this.bodyHelper.quaternion.copy(this.body.quaternion);
        }

        //update direction and sideways vectors
        if (this.controls.firstPerson) {
            this.direction = new THREE.Vector3(0,0,-1);
            this.direction.applyQuaternion(this.camera.quaternion);
        }
        else {
            this.direction.copy(this.body.position);
            this.direction.sub(this.camera.position);
        }
        this.direction.y = 0;
        this.direction.normalize();
        this.sideways.crossVectors(this.direction, this.up);

        //rotate model if in first person or any keyboard input detected (allows camera to orbit model when no keyboard input)
        if (!this.dead) {
            if (this.controls.firstPerson || this.input.wKey || this.input.sKey || this.input.aKey || this.input.dKey) {
                var angle = this.modelForwards.angleTo(this.direction);
                if (this.direction.x < 0) angle *= -1; //change direction of rotation if necessary
                this.model.rotation.y = angle;
            }
        }

        //if player requests it, give back mouse control
        if (this.input.escKey) this.controls.unlock();

        //main input logic for movement, self explanatory
        if (!this.dead) {
            if (this.input.fKey) { //switch perspectives
                if (this.controls.firstPerson) this.model.children[0].material = this.thirdPersonMat;
                else this.model.children[0].material = this.firstPersonMat;
                this.controls.changePerspective();
                this.input.fKey = false; //prevents switching back and forth quickly from holding down key too long
            }

            if (this.input.wKey) { //forwards
                this.currentAction = 'run';
                this.velocity.copy(this.direction);
                this.velocity.multiplyScalar(this.speed);
            }
            if (this.input.sKey) { //backwards
                this.currentAction = 'backwards';
                this.velocity.copy(this.direction);
                this.velocity.multiplyScalar(-this.speed);
            }

            if (this.input.aKey) { //left
                this.currentAction = 'left';
                this.velocity.copy(this.sideways);
                this.velocity.multiplyScalar(-this.speed);
            }
            if (this.input.dKey)  { //right
                this.currentAction = 'right';
                this.velocity.copy(this.sideways);
                this.velocity.multiplyScalar(this.speed);
            }

            if (this.input.wKey && this.input.aKey) { //forwards left
                this.currentAction = 'leftrun';
                this.velocity.copy(this.sideways);
                this.velocity.multiplyScalar(-1);
                this.velocity.add(this.direction);
                this.velocity.multiplyScalar(this.speed/Math.SQRT2);
            }
            if (this.input.wKey && this.input.dKey) { //forwards right
                this.currentAction = 'rightrun';
                this.velocity.copy(this.sideways);
                this.velocity.add(this.direction);
                this.velocity.multiplyScalar(this.speed/Math.SQRT2);
            }
            if (this.input.sKey && this.input.aKey) { //backwards left
                this.currentAction = 'leftbackwards';
                this.velocity.copy(this.sideways);
                this.velocity.add(this.direction);
                this.velocity.multiplyScalar(-this.speed/Math.SQRT2);
            }
            if (this.input.sKey && this.input.dKey) { //backwards right
                this.currentAction = 'rightbackwards';
                this.velocity.copy(this.direction);
                this.velocity.multiplyScalar(-1);
                this.velocity.add(this.sideways);
                this.velocity.multiplyScalar(this.speed/Math.SQRT2);
            }

            //for snapping controls, stop all x, z movement when no input
            if (!this.input.wKey && !this.input.sKey && !this.input.aKey && !this.input.dKey) {
                this.velocity.set(0,0,0); //need to change this for adding jumping
                this.velocity.x = 0;
                this.velocity.z = 0;
                if (this.canJump) this.currentAction = 'idle';
            }

            if(this.input.spaceKey && this.canJump) { //jump
                this.body.velocity.y = this.jumpForce;
                if(!this.jumpSound.isPlaying) this.jumpSound.play();
            }
        }
        else { //player is dead
            this.velocity.x = 0;
            this.velocity.z = 0;
        }

        if (!this.hasMoved) { //for knowing when to start the countdown
            if (this.velocity.x != 0 || this.velocity.z != 0) {
                this.hasMoved = true;
            }
        }

        //updated physics body based on inputted velocity
        this.body.velocity.x = this.velocity.x;
        this.body.velocity.z = this.velocity.z;

        //save previous position for later calculations
        const prevPos = new THREE.Vector3();
        prevPos.copy(this.model.position);

        //calculate new position from body and move model to it
        const newPos = new THREE.Vector3(0,0,0);
        newPos.copy(this.body.position);
        newPos.sub(new THREE.Vector3(0,0.8,0));
        this.model.position.copy(newPos);

        if (!this.dead) { //move camera if player still alive
            const diff = new THREE.Vector3()
            diff.copy(newPos);
            diff.sub(prevPos);
            this.camera.position.add(diff); //update camera position
        }

        //check if we are on the ground using ray casting
        var from = new CANNON.Vec3();
        var to = new CANNON.Vec3();
        from.copy(this.body.position);
        to.copy(this.body.position);
        from.y -= 0.7;
        to.y -= 1;
        const ray = new CANNON.Ray(from, to);
        this.canJump = ray.intersectWorld(this.world, {collisionFilterGroup: 2, collisionFilterMask: 1});
        if (!this.canJump) this.currentAction = 'fall';

        //play landing sound if we just landed
        if (!prevCanJump && this.canJump && !this.landSound.isPlaying) this.landSound.play();

        //update animations
        if (prevAction != this.currentAction) this.updateAnimations(this.currentAction);
        this.mixer.update(deltaTime);
    }

    //plays requested animation, the diagonal movement ones require blending 2 animations
    updateAnimations(a) {
        this.mixer.stopAllAction();
        if (a == 'run' || a == 'left' || a == 'backwards' || a == 'right' || a == 'idle' || a == 'fall') this.actions[a].play();
        else {
            if (a == 'leftrun') {
                this.actions['left'].play();
                this.actions['run'].play().syncWith(this.actions['left']);
            }
            else if (a == 'rightrun') {
                this.actions['right'].play();
                this.actions['run'].play().syncWith(this.actions['right']);
            }
            else if (a == 'leftbackwards') {
                this.actions['right'].play();
                this.actions['backwards'].play().syncWith(this.actions['right']);
            }
            else if (a == 'rightbackwards') {
                this.actions['left'].play();
                this.actions['backwards'].play().syncWith(this.actions['left']);
            }
        }
    }
}

//class for holding basic input information, very simple code
class PlayerInput {
    constructor() {
        this.wKey = false;
        this.aKey = false;
        this.sKey = false;
        this.dKey = false;
        this.fKey = false;
        this.spaceKey = false;
        this.escKey = false;

        this.viewHalfX = 0;
        this.viewHalfY = 0;
        this.mouseX = 0;
        this.mouseY = 0;

        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    onKeyDown(e) {
        switch(e.keyCode) {
            case 87: this.wKey = true; break;
            case 65: this.aKey = true; break;
            case 83: this.sKey = true; break;
            case 68: this.dKey = true; break;
            case 70: this.fKey = true; break;
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
            case 70: this.fKey = false; break;
            case 32: this.spaceKey = false; break;
            case 27: this.escKey = false; break;
        }
    }
}