
import { TextureLoader, MeshLambertMaterial } from 'three';
import jeroenTable from './Pooltable.fbx';
import FBXLoader from './FBXLoader';
import jeroenTexture from './PoolTable_Textures.png';

export default function loadTable(scene) {
  const loader = new FBXLoader();
  const tableTexture = new TextureLoader().load(jeroenTexture);
  const tableMaterial = new MeshLambertMaterial({ map: tableTexture });
  loader.load(jeroenTable, (object) => {
    object.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        child.material = tableMaterial;
        child.material.needsUpdate = true;
      }
    });

    object.translateX(577);
    object.translateY(420);
    object.translateZ(-310);

    object.rotateX(Math.PI / 2);
    object.rotateY(Math.PI / 2);

    // object.rotation.set(new THREE.Vector3( 1, 1, 1));
    // object.rotateOnWorldAxis(new THREE.Vector3(1,0,0), Math.Pi / 2 );
    object.scale.set(4, 4, 4);

    scene.add(object);
  });
}
