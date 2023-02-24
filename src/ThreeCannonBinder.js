import * as THREE from 'three'
import * as CANNON from 'cannon-es'

class ThreeCannonBinder {

    constructor(cellSize, initConfig) {
        this.__cellSize = cellSize;
    }

    __binding = {}
    __cellSize = 0.1

    bindThreeCannon = function(three, cannon, name) {
        this.__binding[name] = {three: three, cannon:cannon};
    }

    getCannon = function (singleObject, x, y, z, rx, ry, rz, sx, sy, sz, mass) {
        var boundingBox = new THREE.Box3().setFromObject( singleObject );
        var cannonVecDim = new CANNON.Vec3(
            (boundingBox.max.x - boundingBox.min.x)/2,
            (boundingBox.max.y - boundingBox.min.y)/2,
            (boundingBox.max.z - boundingBox.min.z)/2,
        )
        let cannonShape = new CANNON.Box(cannonVecDim);
                
        let initialPosition = new CANNON.Vec3(
            cannonVecDim.x + x * this.__cellSize, 
            cannonVecDim.y + y * this.__cellSize, 
            cannonVecDim.z + z * this.__cellSize
        )
        
        let cannonBody = new CANNON.Body({
            position: initialPosition,
            mass: mass,
            shape: cannonShape
        });
        cannonBody.quaternion.setFromEuler(rx, ry * Math.PI / 180, rz);
        return cannonBody;
    }

    syncPhysicsObjects() {
        Object.keys(this.__binding).forEach((key) => {
            var po = this.__binding[key];
            var threeObject = po.three;
            var cannonObject = po.cannon;

            if(key == 'player') {
                threeObject.position.copy(cannonObject.position);
                threeObject.position.y -= 1.5;
                threeObject.quaternion.copy(cannonObject.quaternion);                    
            } else {
                threeObject.position.copy(cannonObject.position);
                threeObject.quaternion.copy(cannonObject.quaternion);    
            }

        });
    }
    
}

export default ThreeCannonBinder