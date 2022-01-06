import * as THREE from '../Common/build/three.module.js';
import {Player} from '../src/player.js';
import { Nuke } from './nuke.js';
//import * as CANNON from '../Common/build/cannon.js';
import {Water} from '../Common/examples/jsm/objects/Water2.js';

export class Level {

    levelID;
    timer;
    playExplosion;

    resources;

    scene;
    renderer;
    loaded;
    dirLight;

    player;
    nuke;
    water;

    world;

    box;
    boxBody;
    floor;
    floorBody;

    physicsMaterial;

    constructor(renderer, resources) {
        this.renderer = renderer;
        this.resources = resources;
        this.loaded = false;

        document.getElementById('retryButton').onclick = function() {
            console.log('player is retrying');
            document.getElementById('died').style.display = "none";
            this.retry();
        }.bind(this);
    }

    //load models and set up test scene
    load(levelID) {
        this.levelID = levelID;

        this.standardSetup();

        if (this.levelID == 0) {
            this.addCrate(new THREE.Vector3(-0.34, -0.4, -13), 0.1)
            this.addCrate(new THREE.Vector3(-1, -0.4, -8), 1.2)
            this.addLog(new THREE.Vector3(-2.4, -0.42, -3.6), -0.1);
            this.addLog(new THREE.Vector3(-1.9, -0.42, 1), 0.3);
            this.addLog(new THREE.Vector3(-0.1, -0.42, 5), 0.2);
            this.addCrate(new THREE.Vector3(2, -0.4, 9), 1.7)
        }
        else {
            this.addLog(new THREE.Vector3(3, -0.42, -12.5), 0.5);
            this.addLog(new THREE.Vector3(5, -0.42, -8.8), 0.7);
            this.addLog(new THREE.Vector3(8.1, -0.42, -4.5), 0.1);
            this.addLog(new THREE.Vector3(6, -0.42, 0.5), -0.9);
            this.addLog(new THREE.Vector3(2, -0.42, 2.1), -1.9);
            this.addLog(new THREE.Vector3(-2, -0.42, 0), -1.6);

            const stackStart = new THREE.Vector3(-6, -1.85, 2.8);
            for (let x = 0; x < 3; x++) {
                for (let y = 0; y < 4; y++) {
                    for (let z = 0; z < 3; z++) {
                        if (z == 1 && y >=3) continue;
                        if (z == 0 && y >= 2) continue;
                        const pos = new THREE.Vector3(x * 1.5, y * 1.5, z * 1.5);
                        pos.add(stackStart);
                        this.addCrate(pos, 0);
                    }
                }
            }

            this.addLog(new THREE.Vector3(0, -0.42, 10.5), 0.05);

            // this.addCrate(new THREE.Vector3(-6, -1.8, 2.8), 0)
            // this.addCrate(new THREE.Vector3(-7.5, -1.8, 2.8), 0)
            // this.addCrate(new THREE.Vector3(-9, -1.8, 2.8), 0)
            // this.addCrate(new THREE.Vector3(-6, -1.8, 4.3), 0)
            // this.addCrate(new THREE.Vector3(-7.5, -1.8, 4.3), 0)
            // this.addCrate(new THREE.Vector3(-9, -1.8, 4.3), 0)
            // this.addCrate(new THREE.Vector3(-6, -1.8, 4.3), 0)
            // this.addCrate(new THREE.Vector3(-7.5, -1.8, 4.3), 0)
            // this.addCrate(new THREE.Vector3(-9, -1.8, 4.3), 0)
        }

        this.loaded = true; //need to fix this later
    }

    standardSetup() {
        this.playExplosion = true;
        this.timer = 30;
        this.turnOnElement('timer');
        document.getElementById('timerText').innerHTML = String(this.timer);

        //set up cannon for physics
        this.world = new CANNON.World();
        this.world.gravity.set(0,-9.81,0);
        this.world.quatNormalizeSkip = 0;
        this.world.quatNormalizeFast = false;
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;
        this.world.defaultContactMaterial.contactEquationStiffness = 1e9;
        this.world.defaultContactMaterial.contactEquationRelaxation = 4;
        this.world.defaultContactMaterial.friction = 0;
        this.world.defaultContactMaterial.restitution = 0;

        this.physicsMaterial = new CANNON.Material("frictionMaterial");
        this.world.addMaterial(this.physicsMaterial);
        var contactMat = new CANNON.ContactMaterial(this.physicsMaterial,
            this.physicsMaterial, {friction:0.8, restitution:0.3});
        this.world.addContactMaterial(contactMat);

        // scene
        this.scene = new THREE.Scene();

        //skybox
        this.scene.background = this.resources.skybox;

        // lights
        this.dirLight = new THREE.DirectionalLight( 0xffffff, 2.0 );
        this.dirLight.position.set( -100, 100, -100 );
        this.dirLight.castShadow = true;
        //Set up shadow properties for the light
        this.dirLight.shadow.mapSize.width = 1024; //low res map for softer shadows
        this.dirLight.shadow.mapSize.height = 1024; //i know it looks a bit pixely but i prefer the 'look and feel'
        this.dirLight.shadow.camera.near = 0.5;
        this.dirLight.shadow.camera.far = 500;
        this.dirLight.shadow.camera.right = 20;
        this.dirLight.shadow.camera.left = -20;
        this.dirLight.shadow.camera.top = 20;
        this.dirLight.shadow.camera.bottom = -20;
        this.dirLight.shadow.bias = 0;
        //add light and helper
        this.scene.add( this.dirLight );
        // const helper = new THREE.CameraHelper( this.dirLight.shadow.camera );
        // this.scene.add( helper );
        //ambient light because everything was too dark
        const ambLight = new THREE.AmbientLight(0xffffff, 2 );
        this.scene.add(ambLight);

        //add player and nuke
        this.player = new Player(new THREE.Vector3(-0.5,0.5,-19), this.scene, this.world, this.resources);
        this.nuke = new Nuke(new THREE.Vector3(-2,2,17), this.scene, this.world, this.resources, this.physicsMaterial, -Math.PI/4);

        //setup skybox
        this.scene.add(this.resources.terrainModel);

        //add water
        const waterGeometry = new THREE.PlaneGeometry(45,45);
        this.water = new Water(waterGeometry, {
            color: 0xf7f0d4,
            scale: 4,
            flowDirection: new THREE.Vector2( 1, 1 ),
            textureWidth: 1024,
            textureHeight: 1024,
            normalMap0: this.resources.waterNormal1,
            normalMap1: this.resources.waterNormal2,
        });
        this.water.receiveShadow = true;
        this.water.castShadow = true;
        this.water.position.y = -0.05;
        this.water.rotation.x = Math.PI * - 0.5;
        this.scene.add(this.water);

        //add colliders for terrain
        this.addCollider(15,5,7, 0,-2.4,-20, 0); //start floor
        this.addCollider(1,10,8, 6,0,-20, 0); //start left
        this.addCollider(1,10,8, -7,0,-20, 0); //start right
        this.addCollider(15,10,1, 0,0,-24, 0); //start back
        this.addCollider(35,1,35, 0,-5,0, 0); //river floor
        this.addCollider(1.6,3,1.6, 16.7,-1.325,2.5, 0); //tree island left
        this.addCollider(2,3,2, -17.2,-1.325,8.8, 0); //tree island right
        this.addCollider(10,5,3.5, 0.2,-2.4,16.25, 0); //final island floor 1
        this.addCollider(8,5,1.5, 0.2,-2.4,13.75, 0); //final island floor 2
        this.addCollider(6.5,5,1.5, 0.7,-2.4,18.75, 0); //final island floor 3
        this.addCollider(2.5,5,1, 1.4,-2.4,20, 0); //final island floor 4

        //add trees for decoration
        this.addTree('dual', new THREE.Vector3(16.7,0,2.5), 0.6);
        this.addTree('single', new THREE.Vector3(-17.2,0,8.8), 1.2);
        this.addTree('trio', new THREE.Vector3(2.5, 0, 17.8), 0.2);
        this.addTree('single', new THREE.Vector3(3,0,-21.8), 2.7);
    }

    addCollider(sx, sy, sz, px, py, pz, rotation) {
        // const colliderGeometry = new THREE.BoxGeometry(sx, sy, sz);
        // const wire = new THREE.WireframeGeometry(colliderGeometry);
        // const colliderHelper = new THREE.LineSegments(wire);
        // colliderHelper.rotation.y = rotation;
        // colliderHelper.position.set(px, py, pz);
        // colliderHelper.material.depthTest = false;
        // colliderHelper.material.opacity = 0.25;
        // colliderHelper.material.transparent = true;
        // this.scene.add(colliderHelper)

        const colliderShape = new CANNON.Box(new CANNON.Vec3(sx/2, sy/2, sz/2));
        const collider = new CANNON.Body({mass:0, material:this.physicsMaterial, collisionFilterGroup: 1,collisionFilterMask: 1 | 2 | 4});
        collider.addShape(colliderShape);
        collider.quaternion.setFromEuler(0, rotation, 0);
        collider.position.set(px,py,pz);
        this.world.addBody(collider);
    }

    addLog(position, rotation) {
        const log = this.resources.logModel.clone();
        log.position.copy(position);
        log.rotation.y = rotation;
        this.scene.add(log);
        
        // const logGeometry = new THREE.BoxGeometry(0.6, 0.5, 2.5);
        // const wire = new THREE.WireframeGeometry(logGeometry);
        // const logHelper = new THREE.LineSegments(wire);
        // logHelper.rotation.y = rotation;
        // logHelper.material.depthTest = false;
        // logHelper.material.opacity = 0.25;
        // logHelper.material.transparent = true;
        // logHelper.position.copy(position);
        // logHelper.position.y += 0.3;
        // this.scene.add(logHelper);

        const logShape = new CANNON.Box(new CANNON.Vec3(0.6/2, 0.5/2, 2.5/2));
        const logBody = new CANNON.Body({mass:0,collisionFilterGroup: 1,collisionFilterMask: 1 | 2 | 4});
        logBody.addShape(logShape);
        logBody.position.copy(position);
        logBody.position.y += 0.3;
        logBody.quaternion.setFromEuler(0, rotation, 0);
        this.world.addBody(logBody);
    }

    addCrate(position, rotation) {
        const crate = this.resources.crateModel.clone();
        crate.position.copy(position);
        crate.rotation.y = rotation;
        this.scene.add(crate);
        const crateShape = new CANNON.Box(new CANNON.Vec3(1.5/2, 1.5/2, 1.5/2));
        const crateBody = new CANNON.Body({mass:0,collisionFilterGroup: 1,collisionFilterMask: 1 | 2 | 4});
        crateBody.addShape(crateShape);
        crateBody.position.copy(position);
        crateBody.quaternion.setFromEuler(0, rotation, 0);
        this.world.addBody(crateBody);
    }

    addTree(type, position, rotation) { //add rotation?
        switch(type) {
            case 'single':
                const single = this.resources.singleModel.clone();
                single.position.copy(position);
                single.rotation.y = rotation;
                this.scene.add(single);
                const singleShape = new CANNON.Box(new CANNON.Vec3(0.3/2, 3/2, 0.3/2));
                const singleTreeBody = new CANNON.Body({mass:0,collisionFilterGroup: 1,collisionFilterMask: 1 | 2 | 4});
                singleTreeBody.addShape(singleShape);
                singleTreeBody.position.copy(position);
                singleTreeBody.position.y += 1.5;
                singleTreeBody.quaternion.setFromEuler(0, rotation, 0);
                this.world.addBody(singleTreeBody);
            break;
            case 'dual':
                const dual = this.resources.dualModel.clone();
                dual.position.copy(position);
                dual.rotation.y = rotation;
                this.scene.add(dual);
                const dualShape = new CANNON.Box(new CANNON.Vec3(1.5/2, 3/2, 0.3/2));
                const dualTreeBody = new CANNON.Body({mass:0,collisionFilterGroup: 1,collisionFilterMask: 1 | 2 | 4});
                dualTreeBody.addShape(dualShape);
                dualTreeBody.position.copy(position);
                dualTreeBody.position.y += 1.5;
                dualTreeBody.quaternion.setFromEuler(0, rotation, 0);
                this.world.addBody(dualTreeBody);
            break;
            case 'trio':
                const trio = this.resources.trioModel.clone();
                trio.position.copy(position);
                trio.rotation.y = rotation;
                this.scene.add(trio);
                const trioShape = new CANNON.Box(new CANNON.Vec3(1.4/2, 3/2, 1.4/2));
                const trioTreeBody = new CANNON.Body({mass:0,collisionFilterGroup: 1,collisionFilterMask: 1 | 2 | 4});
                trioTreeBody.addShape(trioShape);
                trioTreeBody.position.copy(position);
                trioTreeBody.position.y += 1.5;
                trioTreeBody.quaternion.setFromEuler(0, rotation, 0);
                this.world.addBody(trioTreeBody);
            break;
        }
    }

    handleResize(aspect) {
        this.player.camera.aspect = aspect;
        this.player.camera.updateProjectionMatrix();
    }

    retry() {
        this.player.waterAmbientSound.stop();
        this.load(this.levelID); //incredibly lazy
    }

    update(deltaTime) {
        this.world.step(1/60, deltaTime); //physics update synced to framerate

        if (this.nuke.disarmed) {
            if (this.nuke.playSplash) {
                this.nuke.playSplash = false;
                this.player.waterSplashSound.play();
            }
            this.turnOnElement('win');
            this.turnOffElement('timer');
            this.player.kill(true);
        }

        if (this.player.hasMoved && !this.nuke.disarmed) {
            this.timer -= deltaTime;
            document.getElementById('timerText').innerHTML = String(Math.ceil(this.timer));
        }

        if (this.timer <= -1) { //bomb will now detonate, uh oh
            if (this.playExplosion) {
                this.playExplosion = false;
                this.player.explosionSound.play();
            }
            this.player.kill(false); //gives player 31 seconds, allowing for 0 to show for 1 second
            this.nuke.detonate();
            this.dirLight.intensity += deltaTime * 10;
        }

        this.player.update(deltaTime);
        if (this.player.dead && !this.nuke.disarmed) {
            this.turnOnElement('died');
            this.turnOffElement('timer');
        }

        this.nuke.update();
    }

    turnOnElement(element) {
        const style = getComputedStyle(document.getElementById(element));
        if (style.display == 'none') {
            document.getElementById(element).style.display = 'block';
        }
    }

    turnOffElement(element) {
        const style = getComputedStyle(document.getElementById(element));
        if (style.display == 'block') {
            document.getElementById(element).style.display = 'none';
        }
    }

    render() {
        this.renderer.render(this.scene, this.player.camera);
    }
}