import * as THREE from '../Common/build/three.module.js';

export class Nuke {
    model;
    body;
    helper;

    constructor(position, scene, world, resources, physicsMaterial) {
        this.model = resources.nukeModel.clone();
        this.model.position.copy(position);
        scene.add(this.model);

        const x = 2.5;
        const y = 1;
        const z = 1;

        const geometry = new THREE.BoxGeometry( x, y, z );
        const wireframe = new THREE.WireframeGeometry(geometry);
        this.helper = new THREE.LineSegments(wireframe);
        this.helper.material.depthTest = false;
        this.helper.material.opacity = 0.25;
        this.helper.material.transparent = true;
        this.helper.position.copy(position);
        scene.add(this.helper);

        const shape = new CANNON.Box(new CANNON.Vec3(x/2, y/2, z/2));
        this.body = new CANNON.Body({mass:2,material:physicsMaterial, collisionFilterGroup: 1,collisionFilterMask: 1 | 2 | 4});
        this.body.addShape(shape);
        this.body.position.copy(position);
        world.addBody(this.body);
    }

    update() {
        this.model.position.copy(this.body.position);
        this.model.quaternion.copy(this.body.quaternion);
        this.helper.position.copy(this.body.position);
        this.helper.quaternion.copy(this.body.quaternion);
    }
}