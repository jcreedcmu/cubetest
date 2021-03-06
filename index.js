const K = 1; // bigger K = face-centered vertices get farther from face
const ALPHA = 0.25; // bigger ALPHA = vertices on edges get farther from true vertices
// this is number of vertices across one edge of the square
const MESH_SIZE = 16;

let LOOP = true;
let SPIN = true;

const canvas = document.getElementById("main");
const engine = new BABYLON.Engine(canvas);
const scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color3(219/255, 211/255, 179/255);

scene.registerBeforeRender(() =>
   engine.setHardwareScalingLevel(1.0/window.devicePixelRatio)
)

const light = new BABYLON.PointLight("light2", new BABYLON.Vector3(0, 1, -10), scene);
light.diffuse = new BABYLON.Color3(0.5,0.5,0.1);
const light2 = new BABYLON.PointLight("light2", new BABYLON.Vector3(4, 10, -3), scene);
light.diffuse = new BABYLON.Color3(0.1,0.1,0.5);

const root = new BABYLON.TransformNode("root");

root.rotation.z = -0.05;
root.rotation.x = 0.15;
const v = {x:0, y:0, z:0, theta:0};
function renderLoop(){
  camera.rotation.y += v.theta;
  camera.position.x += v.x;
  camera.position.y += v.y;
  camera.position.z += v.z;

  if (SPIN)
    root.rotation.y += 0.01 ;
//  root.rotation.z += 0.013 / 5;
  scene.render();
}

const camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0,0,-5),scene);
camera.minZ = 0.01;
camera.fov = 1.2;

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
  sphere.material.diffuseColor = new BABYLON.Color3(1, 0.2, 0.3);
  sphere.position = new BABYLON.Vector3(...pos);
  sphere.parent = root;
}

function without(ar, x) {
  return ar.filter(y => y != x);
}


function forFaceVertexPair(f) {
  [0,1,2].forEach(d1 => { //  choice of face direction
    [-1,1].forEach(i1 => { // choice of face side
      without([0,1,2], d1).forEach(d2 => { // vertex dimension 1
        [0,1,2].filter(y => y > d2 && y != d1).forEach(d3 => { // vertex dimension 2
          [-1,1].forEach(i2 => {
            [-1,1].forEach(i3 => {
              f(d1, i1, d2, i2, d3, i3);
            });
          });
        });
      });
    });
  });

}

function _forEdge(f) {
  [0,1,2].forEach(d1 => {
    without([0,1,2], d1).forEach(d2 => {
      [0,1,2].filter(y => y > d2 && y != d1).forEach(d3 => {
        [-1,1].forEach(i2 => {
          [-1,1].forEach(i3 => {
            f(d1, d2, d3, i2, i3);
          });
        });
      });
    });
  });
}

function forEdge(f) {
  _forEdge((d1, d2, d3, i2, i3) => {
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

function mkDoubleMesh(positions, indices, normals, parent, material) {
  const mesh = new BABYLON.Mesh("custom", scene);
  mesh.parent = parent;
  mesh.material = material;
  const vertexData = new BABYLON.VertexData();
  vertexData.positions = positions;
  vertexData.indices = indices;
  vertexData.normals = normals;
  vertexData.applyToMesh(mesh);

  const mesh2 = new BABYLON.Mesh("custom", scene);
  mesh2.parent = parent;
  mesh2.material = material;
  const vertexData2 = new BABYLON.VertexData();
  vertexData2.positions = positions;
  vertexData2.indices = indices.map((x, i) => {
    if (i % 3 == 1) return indices[i+1];
    if (i % 3 == 2) return indices[i-1];
    return indices[i];
  });
  vertexData2.normals = normals.map(n => -n);
  vertexData2.applyToMesh(mesh2);
}

function mkHyperb(pts, material, parent) {
  const positions = [];
  const indices = [];
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
      // (i,j)---(i+1,j)
      //     \      |
      //       \    |
      //         \  |
      //         (i+1,j+1)
      indices.push(vertexAt(i, j));
      indices.push(vertexAt(i + 1, j));
      indices.push(vertexAt(i + 1, j + 1));

      // (i,j)
      //  |  \
      //  |    \
      //  |      \
      //(i,j+1)--(i+1,j+1)
      indices.push(vertexAt(i,j));
      indices.push(vertexAt(i+1,j+1));
      indices.push(vertexAt(i,j+1));
    }
  }

  const normals = [];
  BABYLON.VertexData.ComputeNormals(positions, indices, normals);

  mkDoubleMesh(positions, indices, normals, parent, material);
}

function lerp22(pts, i, j) {
  return [0,1,2].map(d =>  {
    return pts[0][d] * i * j + pts[1][d] * (1-i) * j +
      pts[2][d] * i * (1-j) + pts[3][d] * (1-i) * (1-j);
  });
}

function mkWideFaces(parent) {
  _forEdge((d1, d2, d3, i2, i3) => {
    const pts = [[0,0,0],[0,0,0],[0,0,0],[0,0,0]];
    // [[-1, -1, -1 + 2 * ALPHA],
    // [0, -1 + K * ALPHA, 0],
    // [-1 + K * ALPHA, 0, 0],
    // [-1, -1, 1 - 2 * ALPHA]]
    // in this case d1 = 2
    pts[0][d1] = -(1 - 2 * ALPHA);
    pts[0][d2] = i2;
    pts[0][d3] = i3;

    pts[1][d2] = i2 * (1 - K * ALPHA);

    pts[2][d3] = i3 * (1 - K * ALPHA);

    pts[3][d1] = 1 - 2 * ALPHA;
    pts[3][d2] = i2;
    pts[3][d3] = i3;

    mkHyperb(pts, meshMat, parent);
  });
}

function mkNarrowFaces(parent) {
  forFaceVertexPair((d1, i1, d2, i2, d3, i3) => {
    if (i1 == -1) return;
    const pts = [[0,0,0],[0,0,0],[0,0,0],[0,0,0]];

    pts[0][d1] = i1;
    pts[0][d2] = i2;
    pts[0][d3] = i3 * (1 - 2 * ALPHA);

    pts[1][d1] = i1 * (1 - K * ALPHA);

    pts[2][d1] = i1 * (1 + K * ALPHA);

    pts[3][d1] = i1;
    pts[3][d2] = i2 * (1 - 2 * ALPHA);
    pts[3][d3] = i3;

    // [
    // [-1, -1, -(1 - 2 * ALPHA)],
    // [0, -1 + K * ALPHA, 0],
    // [0, -1 - K * ALPHA, 0],
    // [-(1 - 2 * ALPHA), -1, -1],
    // ]
    mkHyperb(pts, meshMat, parent);
  });
}

function setupScene() {
//  getFrame1().forEach(mkSphere);
//  getFrame2().forEach(mkSphere);
//  getFrame3().forEach(([src, dst]) => mkLine(src, dst, [0.5,0.5,0]));

  //mkAxes();
//  mkCube();

  [0,1].forEach(i => {
    [0,1].forEach(j => {
      [0,1].forEach(k => {
        const off = new BABYLON.TransformNode("off");
        off.parent = root;
        off.position = new BABYLON.Vector3(i * 2 - 1, j * 2 - 1, k * 2 - 1);

        mkWideFaces(off);
        mkNarrowFaces(off);

      });
    });
  });



  scene.render();
}

//////////////////////////////////

const meshMat = new BABYLON.StandardMaterial("material",scene);
meshMat.diffuseColor = new BABYLON.Color3(0.8, 0.9, 1.0);
meshMat.specularColor = new BABYLON.Color3(0.1,0.1,0.1);
//meshMat.backFaceCulling = false;
// meshMat.alpha = TRANSP;

window.onkeydown = (e) => {
  if (e.keyCode == 27) {
    LOOP = !LOOP;
    if (LOOP)
      engine.runRenderLoop(renderLoop);
    else
      engine.stopRenderLoop();
  }
  if (e.keyCode == 32) {
    SPIN = !SPIN;
  }
  if (e.keyCode == 65) {
    if (e.shiftKey) { // strafe
      v.x = -Math.cos(camera.rotation.y) * 0.02;
      v.z = Math.sin(camera.rotation.y) * 0.02;
    }
    else {
      v.theta = -0.02;
    }
  }
  else if (e.keyCode == 68) {
    if (e.shiftKey) { // strafe
      v.x = Math.cos(camera.rotation.y) * 0.02;
      v.z = -Math.sin(camera.rotation.y) * 0.02;
    }
    else {
      v.theta = 0.02;
    }
  }
  else if (e.keyCode == 87) {
    v.x = Math.sin(camera.rotation.y) * 0.02;
    v.z = Math.cos(camera.rotation.y) * 0.02;
  }
  else if (e.keyCode == 83) {
    v.x = -Math.sin(camera.rotation.y) * 0.02;
    v.z = -Math.cos(camera.rotation.y) * 0.02;
  }
  else if (e.keyCode == 219) {
    v.y = -0.02;
  }
  else if (e.keyCode == 221) {
    v.y = 0.02;
  }
  else {
    console.log(e.keyCode);
  }
}

window.onkeyup = (e) => {
  v.x = 0;
  v.y = 0;
  v.z = 0;
  v.theta = 0;
}

setupScene();
engine.runRenderLoop(renderLoop);
