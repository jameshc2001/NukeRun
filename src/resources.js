import * as THREE from '../Common/build/three.module.js';
import {FBXLoader} from '../Common/examples/jsm/loaders/FBXLoader.js';

//this class holds all the important resources
//loading is done upon construction
//after loaded is true, no more loaders will be needed
//the rest of the run time

export class Resources {
    loaded = false;

    playerModel; //3js object of the player model
    playerAnimations = {}; //animations for the player model

    skybox; //textures for skybox

    constructor() {
        //load player and their animations
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
                const animation = new FBXLoader();
                animation.setPath('Resources/alex/');
                animation.load('Idle.fbx', (idle) => {
                    this.playerAnimations['idle'] = idle.animations[0];
                });
                animation.load('Running.fbx', (run) => {
                    this.playerAnimations['run'] = run.animations[0];
                });
                animation.load('Falling Idle.fbx', (fall) => {
                    this.playerAnimations['fall'] = fall.animations[0];
                });
                animation.load('Left Strafe.fbx', (left) => {
                    this.playerAnimations['left'] = left.animations[0];
                });
                animation.load('Right Strafe.fbx', (right) => {
                    this.playerAnimations['right'] = right.animations[0];
                });
                animation.load('Running Backward.fbx', (backwards) => {
                    this.playerAnimations['backwards'] = backwards.animations[0];
                });

                //assing model for later cloning
                this.playerModel = alex;
            }
        );

        //load skybox
        const skyLoader = new THREE.CubeTextureLoader();
        skyLoader.setPath( 'Resources/skybox/' );
        this.skybox = skyLoader.load(['1.bmp', '2.bmp', '3.bmp', '4.bmp', '5.bmp', '6.bmp']);

        //we just finished loading
        this.loaded = true;
    }
}