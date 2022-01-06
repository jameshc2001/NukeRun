import * as THREE from '../Common/build/three.module.js';

export class Nuke {
    model;
    body;
    helper;
    disarmed;
    canDisarm;
    playSplash;

    constructor(position, scene, world, resources, physicsMaterial, rotation) {
        this.disarmed = false;
        this.canDisarm = true;
        this.playSplash = true;

        this.model = resources.nukeModel.clone();
        this.model.position.copy(position);
        this.model.rotation.y = rotation;
        scene.add(this.model);

        const x = 2.5;
        const y = 1;
        const z = 1;

        const shape = new CANNON.Box(new CANNON.Vec3(x/2, y/2, z/2));
        this.body = new CANNON.Body({mass:2,material:physicsMaterial, collisionFilterGroup: 1,collisionFilterMask: 1 | 2 | 4});
        this.body.addShape(shape, new CANNON.Vec3(0.25,0,0)); //small offset
        this.body.position.copy(position);
        this.body.quaternion.setFromEuler(0, rotation, 0);
        world.addBody(this.body);

        // const geometry = new THREE.BoxGeometry( x, y, z );
        // const wireframe = new THREE.WireframeGeometry(geometry);
        // this.helper = new THREE.LineSegments(wireframe);
        // this.helper.material.depthTest = false;
        // this.helper.material.opacity = 0.25;
        // this.helper.material.transparent = true;
        // this.helper.position.copy(position);
        // this.helper.rotation.y = rotation;
        // scene.add(this.helper); //helper doesnt have offset so cant be completely trusted
    }

    detonate() {
        this.body.collisionFilterGroup = 8; //disable collisions so bomb falls
        this.canDisarm = false; //too late, sorry
    }

    update() {
        if (this.canDisarm && !this.disarmed && this.body.position.y < -1) {
            this.disarmed = true;
        }

        this.model.position.copy(this.body.position);
        this.model.quaternion.copy(this.body.quaternion);

        if (this.helper != null) {
            this.helper.position.copy(this.body.position);
            this.helper.quaternion.copy(this.body.quaternion);
        }
    }
}