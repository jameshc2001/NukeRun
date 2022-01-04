import * as THREE from '../Common/build/three.module.js';
import {FBXLoader} from '../Common/examples/jsm/loaders/FBXLoader.js';
import { TGALoader } from '../Common/examples/jsm/loaders/TGALoader.js';
import {OBJLoader} from '../Common/examples/jsm/loaders/OBJLoader.js';
import {GLTFLoader} from '../Common/examples/jsm/loaders/GLTFLoader.js';

//this class holds all the important resources
//loading is done upon construction
//after loaded is true, no more loaders will be needed
//the rest of the run time

export class Resources {
    totalLoaded;
    maxLoaded;

    playerModel; //3js object of the player model
    playerAnimations = {}; //animations for the player model

    skybox; //textures for skybox

    terrainModel;

    singleModel;
    dualModel;
    trioModel;

    crateModel;

    logModel;

    nukeModel;

    waterNormal1;
    waterNormal2;

    constructor() {
        var scope = this;
        this.totalLoaded = 0;
        this.maxLoaded = 15;

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
                    scope.totalLoaded += 1;
                    this.playerAnimations['idle'] = idle.animations[0];
                });
                animation.load('Running.fbx', (run) => {
                    scope.totalLoaded += 1;
                    this.playerAnimations['run'] = run.animations[0];
                });
                animation.load('Falling Idle.fbx', (fall) => {
                    scope.totalLoaded += 1;
                    this.playerAnimations['fall'] = fall.animations[0];
                });
                animation.load('Left Strafe.fbx', (left) => {
                    scope.totalLoaded += 1;
                    this.playerAnimations['left'] = left.animations[0];
                });
                animation.load('Right Strafe.fbx', (right) => {
                    scope.totalLoaded += 1;
                    this.playerAnimations['right'] = right.animations[0];
                });
                animation.load('Running Backward.fbx', (backwards) => {
                    scope.totalLoaded += 1;
                    this.playerAnimations['backwards'] = backwards.animations[0];
                });

                //assing model for later cloning
                this.playerModel = alex;
            }
        );

        //load the trees and their textures and env maps!
        const diffuseLoader = new TGALoader();
        diffuseLoader.load('Resources/trees/Palm trees diffuse.tga', function(diffuse) {
            diffuse.wrapS = THREE.RepeatWrapping;
            diffuse.wrapT = THREE.RepeatWrapping;
            diffuse.repeat.set(1,1);
            const normalLoader = new TGALoader();
            normalLoader.load('Resources/trees/Palm trees normal.tga', function(normal) {
                normal.wrapS = THREE.RepeatWrapping;
                normal.wrapT = THREE.RepeatWrapping;
                normal.repeat.set(1,1);
                const material = new THREE.MeshPhongMaterial({
                    map: diffuse,
                    color: 0x808080,
                    //alphaMap: diffuse,
                    normalMap: normal,
                    normalScale: new THREE.Vector2(2,2),
                    alphaTest: 0.286, //.286 .01
                    shininess: 0.1
                });

                const treeLoader = new FBXLoader();
                treeLoader.setPath('Resources/trees/');
                treeLoader.load('PalmTreeSingleStraight.FBX', (single) => {
                    scope.totalLoaded += 1;
                    single.children.splice(0, 1); //remove one sided leafs
                    single.traverse(child => {
                        child.castShadow = true;
                        child.material = material;
                    });
                    single.scale.setScalar(0.03);
                    scope.singleModel = single;
                });

                treeLoader.setPath('Resources/trees/');
                treeLoader.load('PalmTreeDualStraight.FBX', (dual) => {
                    scope.totalLoaded += 1;
                    dual.children.splice(1, 1); //remove one sided leafs
                    dual.traverse(child => {
                        child.castShadow = true;
                        child.material = material;
                    });
                    dual.scale.setScalar(0.03);
                    scope.dualModel = dual;
                });

                treeLoader.setPath('Resources/trees/');
                treeLoader.load('PalmTreeTrio.FBX', (trio) => {
                    scope.totalLoaded += 1;
                    trio.children.splice(1, 1); //remove one sided leafs
                    trio.traverse(child => {
                        child.castShadow = true;
                        child.material = material;
                    });
                    trio.scale.setScalar(0.03);
                    scope.trioModel = trio;
                });
            });
        });
        
        //load box textures and create the box object
        const crateTextureLoader = new THREE.TextureLoader();
        crateTextureLoader.load('Resources/crate/Wood_Crate_001_basecolor.jpg', (texture) => {
            const crateNormalLoader = new THREE.TextureLoader();
            crateNormalLoader.load('Resources/crate/Wood_Crate_001_normal.jpg', (normal) => {
                const crateAOLoader = new THREE.TextureLoader();
                crateAOLoader.load('Resources/crate/Wood_Crate_001_ambientOcclusion.jpg', (ao) => {
                    scope.totalLoaded += 1;
                    const crateMaterial = new THREE.MeshPhongMaterial({
                        shininess: 0.1,
                        color: 0x808080, 
                        map: texture,
                        normalMap: normal,
                        normalScale: new THREE.Vector2(2,2),
                        aoMap: ao,
                        aoMapIntensity: 0.5
                    });
                    const crateGeometry = new THREE.BoxGeometry(1.5,1.5,1.5, 16,16,16);
                    scope.crateModel = new THREE.Mesh(crateGeometry, crateMaterial);
                    scope.crateModel.position.y = 0.75;
                    scope.crateModel.castShadow = true;
                    scope.crateModel.receiveShadow = true;
                });
            });
        });

        //load log
        const logTextureLoader = new THREE.TextureLoader();
        logTextureLoader.load('Resources/log/log_diffuse.png', (texture) => {
            const logNormalLoader = new THREE.TextureLoader();
            logNormalLoader.load('Resources/log/log_normal.png', (normal) => {
                const logDispLoader = new THREE.TextureLoader();
                logDispLoader.load('Resources/log/log_disp.png', (disp) => {
                    const logMaterial = new THREE.MeshPhongMaterial({
                        shininess: 0,
                        color: 0x525252,
                        map: texture,
                        normalMap: normal,
                        normalScale: new THREE.Vector2(2,2),
                        displacementMap: disp
                    });
                    const logLoader = new OBJLoader();
                    logLoader.setPath('Resources/log/')
                    logLoader.load('low_poly_log.obj', (log) => {
                        scope.totalLoaded += 1;
                        log.traverse(child => {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            child.material = logMaterial;
                        });
                        log.scale.setScalar(0.01);
                        scope.logModel = log;
                    });
                });
            });
        });

        //load skybox and nuke
        const skyLoader = new THREE.CubeTextureLoader();
        skyLoader.setPath( 'Resources/skybox/' );
        skyLoader.load(['1.bmp', '2.bmp', '3.bmp', '4.bmp', '5.bmp', '6.bmp'], (theSkybox) => {
            this.skybox = theSkybox;

            const nukeLoader = new GLTFLoader();
            nukeLoader.load('Resources/nuke/nuke.gltf', (nuke) => {
                scope.totalLoaded += 1;
                nuke.scene.scale.setScalar(0.5);
                nuke.scene.traverse(child => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.material.roughness = 0.0;
                        child.material.metalness = 1.0;
                        child.material.color = new THREE.Color(0xffffff);
                        child.material.specular = new THREE.Color(0xffffff);
                        child.material.envMapIntensity = 1;
                        child.material.envMap = theSkybox;
                        child.material.reflectivity = 1;
                    }
                });
                this.nukeModel = nuke.scene;
            });
        });

        //load terrain
        const terrainTextureLoader = new THREE.TextureLoader();
        terrainTextureLoader.load('Resources/terrain/Sand_007_basecolor.jpg', (texture) => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(16,16);
            const terrainNormalLoader = new THREE.TextureLoader();
            terrainNormalLoader.load('Resources/terrain/Sand_007_normal.jpg', (normal) => {
                normal.wrapS = THREE.RepeatWrapping;
                normal.wrapT = THREE.RepeatWrapping;
                normal.repeat.set(16,16);
                const terrainaoLoader = new THREE.TextureLoader();
                terrainaoLoader.load('Resources/terrain/Sand_007_ambientOcclusion.jpg', (ao) => {
                    ao.wrapS = THREE.RepeatWrapping;
                    ao.wrapT = THREE.RepeatWrapping;
                    ao.repeat.set(16,16);
                    const terrainHeightLoader = new THREE.TextureLoader();
                    terrainHeightLoader.load('Resources/terrain/Sand_007_height.png', (height) => {
                        height.wrapS = THREE.RepeatWrapping;
                        height.wrapT = THREE.RepeatWrapping;
                        height.repeat.set(16,16);
                        const terrainLoader = new GLTFLoader();
                        terrainLoader.load('Resources/terrain/terrain.gltf', (terrain) => {
                            scope.totalLoaded += 1;
                            terrain.scene.traverse(child => {
                                if (child.isMesh) {
                                    child.receiveShadow = true;
                                    child.material.map = texture;
                                    child.material.normalMap = normal;
                                    child.material.normalScale = new THREE.Vector2(2,2);
                                    child.material.aoMap = ao;
                                    child.material.displacementMap = height;
                                    child.material.displacementScale = 0.005;
                                }
                            });
                            this.terrainModel = terrain.scene;
                        });
                    });
                });
            });
        });

        //load water normals
        const waterLoader = new THREE.TextureLoader();
        waterLoader.load('Resources/water/Water_1_M_Normal.jpg', (water1) => {scope.totalLoaded += 1; this.waterNormal1 = water1;});
        waterLoader.load('Resources/water/Water_2_M_Normal.jpg', (water2) => {scope.totalLoaded += 1; this.waterNormal2 = water2;});
    }

    loaded() {
        if (this.totalLoaded == this.maxLoaded) return true;
        else return false;
    }
}