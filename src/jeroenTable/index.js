
import { TextureLoader, MeshLambertMaterial } from 'three';
import jeroenTable from './Pooltable.fbx';
import FBXLoader from './FBXLoader';
import jeroenTexture from './PoolTable_Textures.png';

import Physijs from '../physics/physi';

export default function loadTable(scene) {
  const physics = new Physijs();

  const loader = new FBXLoader();
  const tableTexture = new TextureLoader().load(jeroenTexture);
  const tableMaterial = new MeshLambertMaterial({ map: tableTexture });
  loader.load(jeroenTable, (object) => {
    object.scale.set(4, 4, 4);

    object.traverse((child) => {

      if (child.isMesh) {

        child.castShadow = true;
        child.receiveShadow = true;

        child.material = tableMaterial;
        child.material.needsUpdate = true;
      }
    });

    object.translateX(590);
    object.translateY(-310);
    object.translateZ(425);

    //object.rotateX(Math.PI / 2);
    object.rotateY(Math.PI / 2);

    object.__dirtyRotation = true;
    object.__dirtyPosition = true;

    // object.rotation.set(new THREE.Vector3( 1, 1, 1));
    // object.rotateOnWorldAxis(new THREE.Vector3(1,0,0), Math.Pi / 2 );

    scene.add(object);
  });
}
