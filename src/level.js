import * as THREE from '../Common/build/three.module.js';
import {Player} from '../src/player.js';
//import * as CANNON from '../Common/build/cannon.js';

export class Level {

    levelID;

    scene;
    renderer;
    loaded;

    player;
    clock;
    deltaTime = 0;

    world;

    box;
    boxBody;
    floor;
    floorBody;

    constructor(renderer) {
        this.renderer = renderer;
        this.loaded = false;
        this.clock = new THREE.Clock();
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

        // world
        this.scene = new THREE.Scene();

        //skybox
        const skyLoader = new THREE.CubeTextureLoader();
        skyLoader.setPath( 'Resources/skybox/' );
        const skybox = skyLoader.load(['1.bmp', '2.bmp', '3.bmp',
            '4.bmp', '5.bmp', '6.bmp']);
        this.scene.background = skybox;

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
        this.floorBody = new CANNON.Body({mass:0,collisionFilterGroup: 1,collisionFilterMask: 1 | 2 | 4});
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
        this.boxBody = new CANNON.Body({mass:1,collisionFilterGroup: 1,collisionFilterMask: 1 | 2 | 4});
        this.boxBody.addShape(boxShape);
        this.boxBody.position.copy(this.box.position);
        this.world.addBody(this.boxBody);

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
        this.scene.add( dirLight );
        const helper = new THREE.CameraHelper( dirLight.shadow.camera );
        this.scene.add( helper );

        const ambLight = new THREE.AmbientLight(0xffffff, 4.0 );
        this.scene.add(ambLight);

        //load alex (character) and animations
        this.player = new Player(new THREE.Vector3(0,0,0), this.scene, this.world);

        this.loaded = true; //need to fix this later
    }

    handleResize(aspect) {
        this.player.camera.aspect = aspect;
        this.player.camera.updateProjectionMatrix();
    }

    update() {
        this.deltaTime = this.clock.getDelta();
        this.world.step(1/60);
        this.box.position.copy(this.boxBody.position);
        this.box.quaternion.copy(this.boxBody.quaternion);

        this.player.update(this.deltaTime);
    }

    render() {
        this.renderer.render(this.scene, this.player.camera);
    }
}