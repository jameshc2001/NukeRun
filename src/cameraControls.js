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
} from '../Common/build/three.module.js';

const _euler = new Euler( 0, 0, 0, 'YXZ' );
const _vector = new Vector3();

const _changeEvent = { type: 'change' };
const _lockEvent = { type: 'lock' };
const _unlockEvent = { type: 'unlock' };

const _PI_2 = Math.PI / 2;

class CameraControls extends EventDispatcher {

	constructor( camera, firstPersonOffset, thirdPersonOffset, target, worldTarget, domElement ) {

		super();

		if ( domElement === undefined ) {

			console.warn( 'CameraControls: The second parameter "domElement" is now mandatory.' );
			domElement = document.body;

		}

		this.domElement = domElement;
		this.isLocked = false;

        this.range = 200;

		// Set to constrain the pitch of the camera
		// Range is 0 to Math.PI radians
		this.minPolarAngle = 0; // radians
		this.maxPolarAngle = Math.PI; // radians

        //set camera's position
        this.firstPersonOffset = firstPersonOffset;
        this.thirdPersonOffset = thirdPersonOffset;
        this.target = target;
        //this.worldTarget = worldTarget;
        camera.position.copy(this.target);
        camera.position.add(this.thirdPersonOffset);
        const worldPosition = new Vector3(0,0,0);
        worldPosition.copy(worldTarget.position);
        worldPosition.add(this.target);
        camera.lookAt(worldPosition);
        this.firstPerson = false; //start in third person mode

		const scope = this;

        //this function contains the main edit, I want the camera to rotate
        //around the camera's target, not in place.
		function onMouseMove( event ) {

			if ( scope.isLocked === false ) return;

            //get input
			const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
			const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

            //prevent jerky movement
            if (movementX > scope.range || movementX < -scope.range) return;
            if (movementY > scope.range || movementY < -scope.range) return;

            if (this.firstPerson) {
                // _euler.setFromQuaternion( camera.quaternion );

                // _euler.y -= movementX * 0.002;
                // _euler.x -= movementY * 0.002;

                // _euler.x = Math.max( _PI_2 - scope.maxPolarAngle, Math.min( _PI_2 - scope.minPolarAngle, _euler.x ) );

                // camera.quaternion.setFromEuler( _euler );
            }
            else { //third person
                const polar = new Spherical(); //working in polar coordinates

                //apply rotation
                //console.log(scope.target);
                camera.position.sub(scope.target); //move to origin
                polar.setFromVector3(camera.position);
                polar.phi -= movementY * 0.002;
                polar.theta -= movementX * 0.002;

                //apply and add offset
                camera.position.setFromSpherical(polar);
                camera.position.add(scope.target);

                //make camera look at proper world position
                const worldPosition = new Vector3(0,0,0);
                worldPosition.copy(worldTarget.position);
                worldPosition.add(scope.target);
                camera.lookAt(worldPosition);
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

			this.domElement.requestPointerLock();

		};

		this.unlock = function () {

			scope.domElement.ownerDocument.exitPointerLock();

		};

		this.connect();

	}

}

export { CameraControls };
