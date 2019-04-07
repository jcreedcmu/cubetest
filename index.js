const K = 1.5; // bigger K = face-centered vertices get farther from face
const ALPHA = 0.2; // bigger ALPHA = vertices on edges get farther from true vertices
// this is number of vertices across one edge of the square
const MESH_SIZE = 10;
let LOOP = false;

const canvas = document.getElementById("main");
const engine = new BABYLON.Engine(canvas);
const scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color3(0.6,0.6,0.6);

scene.registerBeforeRender(() =>
   engine.setHardwareScalingLevel(1.0/window.devicePixelRatio)
)

//const light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), scene);
const light2 = new BABYLON.PointLight("light2", new BABYLON.Vector3(0, 5, -5), scene);

const root = new BABYLON.TransformNode("root");

root.rotation.z = -0.05;
root.rotation.x = 0.15;

function renderLoop(){
  root.rotation.y += 0.01;
  scene.render();
}

const camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0,0.2,-5),scene);

function mkLine(a, b, c) {
  const x = BABYLON.MeshBuilder.CreateLines("lines", {points: [
    new BABYLON.Vector3(...a),
    new BABYLON.Vector3(...b)
  ]}, scene);
  x.parent = root;
  if (c != undefined) {
    x.material = new BABYLON.StandardMaterial("material",scene);
    x.color = new BABYLON.Color3(...c);
  }
}

function mkAxes() {
  mkLine([0,0,0], [10,0,0], [1,0,0]);
  mkLine([0,0,0], [0,10,0], [0,1,0]);
  mkLine([0,0,0], [0,0,10], [0,0,1]);
}

function mkSphere(pos) {
  const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 0.03}, scene);
  sphere.material = new BABYLON.StandardMaterial("material",scene);
  sphere.material.diffuseColor = new BABYLON.Color3(0.1, 0.2, 0.3);
  sphere.position = new BABYLON.Vector3(...pos);
  sphere.parent = root;
}

function without(ar, x) {
  return ar.filter(y => y != x);
}

function forEdge(f) {
  [0,1,2].forEach(d1 => {
    without([0,1,2], d1).forEach(d2 => {
      [0,1,2].filter(y => y > d2 && y != d1).forEach(d3 => {
        [-1,1].forEach(i2 => {
          [-1,1].forEach(i3 => {
            const src = [0,0,0];
            const dst = [0,0,0];
            src[d1] = -1;
            dst[d1] = 1;
            src[d2] = i2;
            src[d3] = i3;
            dst[d2] = i2;
            dst[d3] = i3;
            f(src, dst);
          });
        });
      });
    });
  });
}

function forFlag(f) {
  [0,1,2].forEach(d1 => { //  choice of face direction
    [-1,1].forEach(i1 => { // choice of face side
      without([0,1,2], d1).forEach(d2 => { // choice of edge direction
        [-1,1].forEach(i2 => { // choice of edge side
          without(without([0,1,2], d1), d2).forEach(d3 => { // vertex remaining direction
            [-1,1].forEach(i3 => { // choice of vertex side
              f(d1, i1, d2, i2, d3, i3);
            });
          });
        });
      });
    });
  });
}

function mkCube() {
  forEdge((src, dst) => mkLine(src, dst, [0,0,0]));
}



function getFrame1() {
  const rv = [];
  [0,1,2].forEach(d1 => {
    [1,-1].forEach(i1 => {
      const p = [0,0,0];
      p[d1] = i1 * (1 - K * ALPHA);
      rv.push(p);
    });
  });
  return rv;
}

function lerp1(a, b, t) {
  return a * (1-t) + b * t;
}
function lerp(a, b, t) {
  return a.map((x, i) => lerp1(a[i], b[i], t));
}

function getFrame2() {
  const rv = [];
  forEdge((src, dst) => {
    rv.push(lerp(src, dst, ALPHA));
    rv.push(lerp(src, dst, 1-ALPHA));
  });
  return rv;
}

function getFrame3() {
  const rv = [];
  forFlag((d1, i1, d2, i2, d3, i3) => {
    const src = [0,0,0];
    src[d1] = i1 * (1 - K * ALPHA);
    const dst = [0,0,0];
    dst[d1] = i1;
    dst[d2] = i2;
    dst[d3] = lerp1(-1, 1, i3 == -1 ? ALPHA : 1 - ALPHA);
    rv.push([src, dst]);
  });
  return rv;
}

// getFrame1().forEach(mkSphere);
// getFrame2().forEach(mkSphere);
getFrame3().forEach(([src, dst]) => mkLine(src, dst));
// mkAxes();
mkCube();

window.onkeydown = (e) => {
  if (e.keyCode == 65) {
    LOOP = !LOOP;
    if (LOOP)
      engine.runRenderLoop(renderLoop);
    else
      engine.stopRenderLoop();
  }
}


const pts =
      [
        [-1, -1, -1 + 2 * ALPHA],
        [0, -1 + K * ALPHA, 0],
        [-1 + K * ALPHA, 0, 0],
        [-1, -1, 1 - 2 * ALPHA],
      ];


// set up raw mesh vertex data

const positions = [];
const indices = [];

const meshMat = new BABYLON.StandardMaterial("material",scene);
meshMat.diffuseColor = new BABYLON.Color3(0.1, 0.2, 0.3);
meshMat.backFaceCulling = false;


for (let i = 0; i < MESH_SIZE; i++) {
  for (let j = 0; j < MESH_SIZE; j++) {
    const ix = 3 * ((j * MESH_SIZE) + i);
    const vert = lerp22(pts, i / (MESH_SIZE - 1), j / (MESH_SIZE - 1));
    positions[ix] = vert[0];
    positions[ix + 1] = vert[1];
    positions[ix + 2] = vert[2];
  }
}

function vertexAt(u, v) {
  return v * MESH_SIZE + u;
}

for (let i = 0; i < MESH_SIZE-1; i++) {
  for (let j = 0; j < MESH_SIZE-1; j++) {
    const ix = 6 * (j * (MESH_SIZE - 1) + i);
    // (i,j)---(i+1,j)
    //     \      |
    //       \    |
    //         \  |
    //         (i+1,j+1)
    indices[ix] = vertexAt(i, j);
    indices[ix + 1] = vertexAt(i + 1, j);
    indices[ix + 2] = vertexAt(i + 1, j + 1);
    // (i,j)
    //  |  \
    //  |    \
    //  |      \
    //(i,j+1)--(i+1,j+1)
    indices[ix + 3] = vertexAt(i,j);
    indices[ix + 4] = vertexAt(i+1,j+1);
    indices[ix + 5] = vertexAt(i,j+1);
  }
}

//console.log(positions);
//console.log(indices);
const customMesh = new BABYLON.Mesh("custom", scene);
customMesh.parent = root;
customMesh.material = meshMat;

//Empty array to contain calculated values or normals added
const normals = [];

//Calculations of normals added
BABYLON.VertexData.ComputeNormals(positions, indices, normals);


const vertexData = new BABYLON.VertexData();

vertexData.positions = positions;
vertexData.indices = indices;
vertexData.normals = normals; //Assignment of normal to vertexData added


vertexData.applyToMesh(customMesh);


function lerp22(pts, i, j) {
  return [0,1,2].map(d =>  {
    return pts[0][d] * i * j + pts[1][d] * (1-i) * j +
      pts[2][d] * i * (1-j) + pts[3][d] * (1-i) * (1-j);
  });
}
scene.render();
