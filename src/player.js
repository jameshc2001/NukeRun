import * as THREE from '../Common/build/three.module.js';
import {FBXLoader} from '../Common/examples/jsm/loaders/FBXLoader.js';

export class Player {
    position;
    model;
    mixer;

    constructor(position, scene) {
        this.position = position;

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
                    this.mixer = new THREE.AnimationMixer(alex);
                    const action = this.mixer.clipAction(idle.animations[0]);
                    action.play();
                });

                this.model = alex;
                scene.add(this.model);
            },
            (xhr) => {
                //console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
            }
        );
    }

    update(deltaTime) {
        this.mixer.update(deltaTime);
        //this.position.add(new THREE.Vector3(1,0,0).multiplyScalar(deltaTime));




        this.model.position.copy(this.position);
    }
}