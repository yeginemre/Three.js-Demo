import * as CANNON from 'cannon-es';

const metal = new CANNON.Material("metal");
const sand = new CANNON.Material("sand");
const tennisBall = new CANNON.Material("tennisBall");
const woodMat = new CANNON.Material("woodMat"); 
const rubberMat = new CANNON.Material("rubberMat"); 
const cubeMat = new CANNON.Material("cubeMat"); 
const groundMat = new CANNON.Material("groundMat"); 
const balloonMat = new CANNON.Material("balloonMat"); 
let contactMaterials = [];

const metalWoodContact = new CANNON.ContactMaterial(metal, woodMat, {
    restitution: 0.6, 
    friction: 0.4,    
});

const metalSandContact = new CANNON.ContactMaterial(metal, sand, {
    restitution: 0.3, 
    friction: 0.7,   
});

const balloonWoodContact = new CANNON.ContactMaterial(balloonMat, woodMat, {
    restitution: 0.95, 
    friction: 0.4,    
});

const balloonSandContact = new CANNON.ContactMaterial(balloonMat, sand, {
    restitution: 0.75, 
    friction: 0.7,   
});



const tennisWoodContact = new CANNON.ContactMaterial(tennisBall, woodMat, {
    restitution: 0.8, 
    friction: 0.5,    
});

const tennisSandContact = new CANNON.ContactMaterial(tennisBall, sand, {
    restitution: 0.5, 
    friction: 0.8,    
});



const rubberWoodContact = new CANNON.ContactMaterial(rubberMat, woodMat, {
    restitution: 0.9, 
    friction: 0.2,    
});

const rubberSandContact = new CANNON.ContactMaterial(rubberMat, sand, {
    restitution: 0.6, 
    friction: 0.2,    
});




const rubberGroundContact = new CANNON.ContactMaterial(rubberMat, groundMat, {
    restitution: 0.9, 
    friction: 0.2,    
});

const tennisGroundContact = new CANNON.ContactMaterial(tennisBall, groundMat, {
    restitution: 0.8,
    friction: 0.2,    
});

const balloonGroundContact = new CANNON.ContactMaterial(balloonMat, groundMat, {
    restitution: 0.7,
    friction: 0.1,    
});

const metalGroundContact = new CANNON.ContactMaterial(metal, groundMat, {
    restitution: 0.6, 
    friction: 0.7,   
});



export function addContactMaterials(world) {
  contactMaterials.push(metalWoodContact);
  contactMaterials.push(metalSandContact);
  contactMaterials.push(metalGroundContact);

  contactMaterials.push(tennisWoodContact);
  contactMaterials.push(tennisSandContact);
  contactMaterials.push(tennisGroundContact);

  contactMaterials.push(rubberWoodContact);
  contactMaterials.push(rubberSandContact);
  contactMaterials.push(rubberGroundContact);

  contactMaterials.push(balloonWoodContact);
  contactMaterials.push(balloonSandContact);
  contactMaterials.push(balloonGroundContact);

  contactMaterials.forEach(contactMaterial => {
      world.addContactMaterial(contactMaterial);
  });
}

export { metal, sand, tennisBall, woodMat, rubberMat, cubeMat, groundMat, balloonMat};