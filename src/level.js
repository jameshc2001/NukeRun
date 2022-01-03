import * as THREE from '../Common/build/three.module.js';
import {Player} from '../src/player.js';
import { Nuke } from './nuke.js';
//import * as CANNON from '../Common/build/cannon.js';

export class Level {

    levelID;

    resources;

    scene;
    renderer;
    loaded;

    player;
    nuke;

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
    }

    //load models and set up test scene
    load(levelID) {
        this.levelID = levelID;

        //set up cannon
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


        // world
        this.scene = new THREE.Scene();

        //skybox
        this.scene.background = this.resources.skybox;

        //make a floor, has to be box for collisions
        const floorGeometry = new THREE.BoxGeometry( 10, 10, 2 );
        const floorMaterial = new THREE.MeshPhongMaterial( {color: 0x202020} );
        this.floor = new THREE.Mesh( floorGeometry, floorMaterial );
        this.floor.rotateX( - Math.PI / 2);
        this.floor.position.y = -1;
        this.floor.receiveShadow = true;
        this.scene.add( this.floor );
        //now create floor but for cannon
        const floorShape = new CANNON.Box(new CANNON.Vec3(10/2, 10/2, 2/2));
        this.floorBody = new CANNON.Body({mass:0, material:this.physicsMaterial, collisionFilterGroup: 1,collisionFilterMask: 1 | 2 | 4});
        this.floorBody.addShape(floorShape);
        this.floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
        this.floorBody.position.copy(this.floor.position);
        this.world.addBody(this.floorBody);


        //cube with physics
        const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const boxMaterial = new THREE.MeshPhongMaterial( {color: 0x220000} );
        this.box = new THREE.Mesh(boxGeometry, boxMaterial);
        this.box.position.set(0,10,0);
        this.box.castShadow = true;
        this.box.receiveShadow = true;
        this.scene.add(this.box);
        const boxShape = new CANNON.Box(new CANNON.Vec3(0.5/2, 0.5/2, 0.5/2));
        this.boxBody = new CANNON.Body({mass:1, material:this.physicsMaterial, collisionFilterGroup: 1,collisionFilterMask: 1 | 2 | 4});
        this.boxBody.addShape(boxShape);
        this.boxBody.position.copy(this.box.position);
        this.world.addBody(this.boxBody);

        //this.scene.add(this.resources.trioModel);
        this.addTree('trio', new THREE.Vector3(2,0,2), 1.6);

        // lights
        const dirLight = new THREE.DirectionalLight( 0xffffff, 2.0 );
        dirLight.position.set( -10, 10, -10 );
        dirLight.castShadow = true;
        //Set up shadow properties for the light
        dirLight.shadow.mapSize.width = 512; // default
        dirLight.shadow.mapSize.height = 512; // default
        dirLight.shadow.camera.near = 0.5; // default
        dirLight.shadow.camera.far = 500; // default
        dirLight.shadow.bias = 0;
        //add light and helper
        this.scene.add( dirLight );
        const helper = new THREE.CameraHelper( dirLight.shadow.camera );
        this.scene.add( helper );

        const ambLight = new THREE.AmbientLight(0xffffff, 1.8 );
        this.scene.add(ambLight);

        //load alex (character) and animations
        this.player = new Player(new THREE.Vector3(0,0,0), this.scene, this.world, this.resources);
        this.nuke = new Nuke(new THREE.Vector3(-2,3,-2), this.scene, this.world, this.resources, this.physicsMaterial);


        this.addCrate(new THREE.Vector3(-5,0,-5), Math.PI / 4);
        this.addCrate(new THREE.Vector3(-7,1,-5), Math.PI / 4);

        this.addLog(new THREE.Vector3(-8, 0, -8), Math.PI/4);

        //this.scene.add(this.resources.nukeModel);
        // const nuke = this.resources.nukeModel;
        // this.scene.add(nuke);
        // console.log(nuke);

        this.loaded = true; //need to fix this later
    }

    addLog(position, rotation) {
        const log = this.resources.logModel.clone();
        log.position.copy(position);
        log.rotation.y = rotation;
        this.scene.add(log);
        const logShape = new CANNON.Box(new CANNON.Vec3(0.6/2, 0.5/2, 2.5/2));
        const logGeometry = new THREE.BoxGeometry(0.6, 0.5, 2.5);
        const wire = new THREE.WireframeGeometry(logGeometry);
        const logHelper = new THREE.LineSegments(wire);
        logHelper.rotation.y = rotation;
        logHelper.material.depthTest = false;
        logHelper.material.opacity = 0.25;
        logHelper.material.transparent = true;
        logHelper.position.copy(position);
        logHelper.position.y += 0.3;
        this.scene.add(logHelper);
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

    update(deltaTime) {
        //this.deltaTime = this.clock.getDelta();
        this.world.step(1/60, deltaTime);
        this.box.position.copy(this.boxBody.position);
        this.box.quaternion.copy(this.boxBody.quaternion);

        this.player.update(deltaTime);
        this.nuke.update();
    }

    render() {
        this.renderer.render(this.scene, this.player.camera);
    }
}