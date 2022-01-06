//A modified version of the THREE js PointerLockControls
//see the original version, included in the examples, to
//see what changes were made.
//It's mainly just getting the camera to work well in third person
//and be able to switch to first person on demand.

//WARNING: this modified version assumes that the camera is a child
//of the object it is targeting!

import {
	Euler,
	EventDispatcher,
	Vector3,
    Spherical
} from '../Extra Libraries/three.module.js';

const _euler = new Euler( 0, 0, 0, 'YXZ' );
const _vector = new Vector3();

const _changeEvent = { type: 'change' };
const _lockEvent = { type: 'lock' };
const _unlockEvent = { type: 'unlock' };

const _PI_2 = Math.PI / 2;

class CameraControls extends EventDispatcher {

	constructor( camera, thirdPersonOffset, firstPersonOffset, target, targetOffset, domElement ) {

		super();

		if ( domElement === undefined ) {

			console.warn( 'CameraControls: The second parameter "domElement" is now mandatory.' );
			domElement = document.body;

		}

        this.enabled = true;

		this.domElement = domElement;
		this.isLocked = false;

        this.range = 200;

        this.firstPerson = false; //start in third person mode
        this.firstPersonOffset = firstPersonOffset
        this.thirdPersonOffset = thirdPersonOffset;
        this.target = target;
        this.targetOffset = targetOffset;
        this.camera = camera;

		// Set to constrain the pitch of the camera
		// Range is 0 to Math.PI radians
		this.minPolarAngle = 0; // radians
		this.maxPolarAngle = Math.PI; // radians

        //set initial properties
        const initialPosition = new Vector3();
        initialPosition.copy(this.thirdPersonOffset);
        initialPosition.add(this.target.position);
        camera.position.copy(initialPosition);
        const initialLookAt = new Vector3(0,0,0);
        initialLookAt.add(this.target.position).add(this.targetOffset);
        camera.lookAt(initialLookAt);

		const scope = this;

        //this function is my own creation
        this.changePerspective = function() {
            if (this.firstPerson) { //switch to third person

                //complicate, but mainly because of the way the third person camera works
                //the third person camera orbits the target + the target offset, this
                //needs to be taken into account when resetting its position to keep it
                //facing the same direction as it was in first person.

                //get direction of first person camera
                const camDir = new Vector3(0,0,-1);
                camDir.applyQuaternion(camera.quaternion);
                //check for extreme inclines
                if (camDir.y < -0.98 || camDir.y > 0.55) camDir.y = 0;
                camDir.normalize();

                //get distance camera orbits from with respect to orbit cente.
                const temp = new Vector3();
                temp.copy(this.thirdPersonOffset);
                temp.sub(this.targetOffset);
                const dist = temp.length();

                //put camera at orbit centre, then move backwards in the opposite direction
                //to where the first person camera was waiting, do this by the distance just calcluated
                const thirdInitialPos = new Vector3();
                thirdInitialPos.copy(this.target.position);
                thirdInitialPos.add(this.targetOffset);
                thirdInitialPos.add(camDir.multiplyScalar(-dist)); //scale by dist
                camera.position.copy(thirdInitialPos);

                //finally, get the camera to look at the orbit centre.
                const thirdInitialLookAt = new Vector3();
                thirdInitialLookAt.add(this.target.position).add(this.targetOffset);
                camera.lookAt(thirdInitialLookAt);
            }
            else { //switch to first person
                const firstInitialPos = new Vector3();
                firstInitialPos.copy(this.firstPersonOffset);
                firstInitialPos.add(this.target.position);
                camera.position.copy(firstInitialPos);
            }

            this.firstPerson = !this.firstPerson;
            console.log('perspective change');
        }

        //this function contains the main edit, I want the camera to rotate
        //around the camera's target, not in place.
		function onMouseMove( event ) {

			if ( scope.isLocked === false || !scope.enabled) return;

            //get input
			const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
			const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

            //prevent jerky movement
            if (movementX > scope.range || movementX < -scope.range) return;
            if (movementY > scope.range || movementY < -scope.range) return;

            if (scope.firstPerson) {
                _euler.setFromQuaternion( camera.quaternion );

                _euler.y -= movementX * 0.002;
                _euler.x -= movementY * 0.002;

                _euler.x = Math.max( _PI_2 - scope.maxPolarAngle, Math.min( _PI_2 - scope.minPolarAngle, _euler.x ) );

                camera.quaternion.setFromEuler( _euler );
            }
            else { //third person
                const polar = new Spherical(); //working in polar coordinates

                //apply rotation
                //console.log(scope.target);
                camera.position.sub(scope.target.position).sub(scope.targetOffset); //move to origin be about origin
                polar.setFromVector3(camera.position);
                polar.phi -= movementY * 0.002;
                polar.theta -= movementX * 0.002;

                if (polar.phi < 0.1 || polar.phi > 2.2) polar.phi += movementY * 0.002; //limit movement
                
                //apply and add offset
                camera.position.setFromSpherical(polar);
                const targetWorldPos = new Vector3(0,0,0);
                targetWorldPos.add(scope.target.position).add(scope.targetOffset);
                camera.position.add(targetWorldPos);

                //make camera look at proper world position
                camera.lookAt(targetWorldPos);
            }

			scope.dispatchEvent( _changeEvent );

		}

		function onPointerlockChange() {

			if ( scope.domElement.ownerDocument.pointerLockElement === scope.domElement ) {

				scope.dispatchEvent( _lockEvent );

				scope.isLocked = true;

			} else {

				scope.dispatchEvent( _unlockEvent );

				scope.isLocked = false;

			}

		}

		function onPointerlockError() {

			console.error( 'THREE.CameraControls: Unable to use Pointer Lock API' );

		}

		this.connect = function () {

			scope.domElement.ownerDocument.addEventListener( 'mousemove', onMouseMove );
			scope.domElement.ownerDocument.addEventListener( 'pointerlockchange', onPointerlockChange );
			scope.domElement.ownerDocument.addEventListener( 'pointerlockerror', onPointerlockError );

		};

		this.disconnect = function () {

			scope.domElement.ownerDocument.removeEventListener( 'mousemove', onMouseMove );
			scope.domElement.ownerDocument.removeEventListener( 'pointerlockchange', onPointerlockChange );
			scope.domElement.ownerDocument.removeEventListener( 'pointerlockerror', onPointerlockError );

		};

		this.dispose = function () {

			this.disconnect();

		};

		this.getObject = function () { // retaining this method for backward compatibility

			return camera;

		};

		this.getDirection = function () {

			const direction = new Vector3( 0, 0, - 1 );

			return function ( v ) {

				return v.copy( direction ).applyQuaternion( camera.quaternion );

			};

		}();

		this.moveForward = function ( distance ) {

			// move forward parallel to the xz-plane
			// assumes camera.up is y-up

			_vector.setFromMatrixColumn( camera.matrix, 0 );

			_vector.crossVectors( camera.up, _vector );

			camera.position.addScaledVector( _vector, distance );

		};

		this.moveRight = function ( distance ) {

			_vector.setFromMatrixColumn( camera.matrix, 0 );

			camera.position.addScaledVector( _vector, distance );

		};

		this.lock = function () {

			if (this.enabled) this.domElement.requestPointerLock();

		};

		this.unlock = function () {

			scope.domElement.ownerDocument.exitPointerLock();

		};

		this.connect();

	}

}

export { CameraControls };
