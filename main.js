import './style.scss';

import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';

function addLighting(scene) {
  let color = 0x839FF9;
  let intensity = 10;
  let light = new THREE.DirectionalLight(color, intensity);
  light.position.set(0, 10, 5);
  light.target.position.set(-5, -2, -5);
  scene.add(light);
  scene.add(light.target);
}

function addSphere(scene) {
  let geometry = new THREE.SphereGeometry( 5, 32, 32 );
  let material = new THREE.MeshStandardMaterial({color: 0x0000ff, roughness: 0});
  let sphere = new THREE.Mesh( geometry, material );
  sphere.position.set(0, 5, 0);
  sphere.name = 'my-sphere';
  scene.add( sphere );
}

function addFloor(scene) {
  let geometry = new THREE.BoxGeometry(500, 1, 500);
  let material = new THREE.MeshStandardMaterial({color: 0xDDDDDD, roughness: 0});
  const floor = new THREE.Mesh( geometry, material );
  floor.position.set(0, -10, 0);
  floor.name = 'my-floor';
  scene.add(floor);
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x6e3b9d); // Set to any hex color you like
const canvas = document.querySelector("#canvas");
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set(0, 20, 50);
camera.lookAt(0, 0, 0);
const controls = new OrbitControls(camera, canvas);

// Set up the renderer
const renderer = new THREE.WebGLRenderer({canvas});
renderer.setSize( window.innerWidth, window.innerHeight );

// Add lighting to the scene
addLighting(scene);

// Add Floor to the scene
addFloor(scene);

// Add a Sphere to the scene
addSphere(scene);

// setting initial values for required parameters 
let acceleration = 100;
let bounce_distance = 20;
let bottom_position_y = -4;
let time_step = 0.02;
// time_counter is calculated to be the time the ball just reached the top position
// this is simply calculated with the s = (1/2)gt*t formula, which is the case when ball is dropped from the top position
let time_counter = Math.sqrt(bounce_distance * 2 / acceleration);
let initial_speed = acceleration * time_counter;
let sphere = scene.getObjectByName("my-sphere");

// Store all spheres and their bounce states, now with velocity
let spheres = [{
  mesh: scene.getObjectByName("my-sphere"),
  time_counter: Math.sqrt(bounce_distance * 2 / acceleration),
  initial_speed: acceleration * Math.sqrt(bounce_distance * 2 / acceleration),
  velocity: new THREE.Vector3(0, 0, 0)
}];

// Listen for space bar to add a new sphere at a random position
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    for(let x = 0; x < 100; x++){
    let geometry = new THREE.SphereGeometry(5, 32, 32);
    let material = new THREE.MeshStandardMaterial({color: Math.random() * 0xffffff, roughness: 0});
    let sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(
      (Math.random() - 0.5) * 40,
      100,
      (Math.random() - 0.5) * 40
    );
    scene.add(sphere);
    spheres.push({
      mesh: sphere,
      time_counter: Math.sqrt(bounce_distance * 2 / acceleration),
      initial_speed: acceleration * Math.sqrt(bounce_distance * 2 / acceleration),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 200
      ),
      bounces: 0 // <--- add this
    });
  }
}
});

// Animate the scene
const animate = () => {
  requestAnimationFrame( animate );

  // Simple gravity and bounce
  for (let i = spheres.length - 1; i >= 0; i--) {
    let s = spheres[i];
    s.velocity.y -= acceleration * time_step;
    s.mesh.position.addScaledVector(s.velocity, time_step);

    // Bounce on floor
    if (s.mesh.position.y < bottom_position_y) {
      s.mesh.position.y = bottom_position_y;
      s.velocity.y = Math.abs(s.velocity.y) * 0.8; // lose some energy
      s.bounces = (s.bounces || 0) + 1; // increment bounces

      // Remove sphere after 3 bounces (except the original one)
      if (s.bounces >= 3 && s.mesh.name !== 'my-sphere') {
        scene.remove(s.mesh);
        spheres.splice(i, 1);
        continue;
      }
    }
  }

  // Simple sphere-sphere collision
  for (let i = 0; i < spheres.length; i++) {
    for (let j = i + 1; j < spheres.length; j++) {
      const a = spheres[i];
      const b = spheres[j];
      const posA = a.mesh.position;
      const posB = b.mesh.position;
      const dist = posA.distanceTo(posB);
      const radiusA = a.mesh.geometry.parameters.radius || 1;
      const radiusB = b.mesh.geometry.parameters.radius || 1;
      const minDist = radiusA + radiusB;

      if (dist < minDist) {
        // Calculate collision normal
        const normal = new THREE.Vector3().subVectors(posB, posA).normalize();
        // Separate spheres
        const overlap = minDist - dist;
        posA.addScaledVector(normal, -overlap / 2);
        posB.addScaledVector(normal, overlap / 2);

        // Simple elastic collision response (swap velocities along normal)
        const vA = a.velocity.clone();
        const vB = b.velocity.clone();
        const vA_proj = normal.clone().multiplyScalar(vA.dot(normal));
        const vB_proj = normal.clone().multiplyScalar(vB.dot(normal));
        a.velocity.add(vB_proj).sub(vA_proj);
        b.velocity.add(vA_proj).sub(vB_proj);
      }
    }
  }

  // Rave flashing background
  const t = performance.now() * 0.002;
  const r = Math.floor(128 + 128 * Math.sin(t));
  const g = Math.floor(128 + 128 * Math.sin(t + 2));
  const b = Math.floor(128 + 128 * Math.sin(t + 4));
  scene.background = new THREE.Color(`rgb(${r},${g},${b})`);

  renderer.render( scene, camera );
};
animate();