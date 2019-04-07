const LOOP = true;
var canvas = document.getElementById("main");
var engine = new BABYLON.Engine(canvas);
var scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color3(0.6,0.6,0.6);

scene.registerBeforeRender(() =>
   engine.setHardwareScalingLevel(1.0/window.devicePixelRatio)
)


var light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), scene);
var light2 = new BABYLON.PointLight("light2", new BABYLON.Vector3(0, 5, -5), scene);

const root = new BABYLON.TransformNode("root");

var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 0.1}, scene);
sphere.material = new BABYLON.StandardMaterial("material",scene);
sphere.material.diffuseColor = new BABYLON.Color3(1, 0.58, 0.86);
sphere.position = new BABYLON.Vector3(1,1,1);
sphere.parent = root;



function renderLoop(){
// box.rotation.x += 0.01;
 root.rotation.y += 0.01;
 scene.render();
}
if (LOOP)
  engine.runRenderLoop(renderLoop);

var camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0.5,0.5,-5),scene);



// var box = new BABYLON.MeshBuilder.CreateBox("box",{},scene);
// box.parent = root;

// box.rotation.x = -0.2;
// box.rotation.y = -0.4;
// box.material = new BABYLON.StandardMaterial("material",scene);
// // box.material.emmisiveColor = new BABYLON.Color3(1, 0.58, 0.86);
// box.material.diffuseColor = new BABYLON.Color3(1, 0.58, 0.86);
// box.position.x = -3;



function mkLine(a, b, c) {
  const x = BABYLON.MeshBuilder.CreateLines("lines", {points: [
    new BABYLON.Vector3(...a),
    new BABYLON.Vector3(...b)
  ]}, scene);
  x.parent = root;
  if (c != undefined) {
    console.log('wut');
    x.material = new BABYLON.StandardMaterial("material",scene);
    x.color = new BABYLON.Color3(...c);
  }
}

// axes
mkLine([0,0,0], [10,0,0], [1,0,0]);
mkLine([0,0,0], [0,10,0], [0,1,0]);
mkLine([0,0,0], [0,0,10], [0,0,1]);

function cube() {

  for(let d1 = 0; d1 < 3; d1++) {
    for(let d2 = 0; d2 < 3; d2++) {
      if (d2 == d1) continue;
      for(let d3 = 0; d3 < 3; d3++) {
        if (d3 == d1) continue;
        if (d3 <= d2) continue;
        for (let i2 = -1; i2 <= 1; i2 += 2 ){
          for (let i3 = -1; i3 <= 1; i3 += 2 ){
            const src = [0,0,0];
            const dst = [0,0,0];
            src[d1] = -1;
            dst[d1] = 1;
            src[d2] = i2;
            src[d3] = i3;
            dst[d2] = i2;
            dst[d3] = i3;
            mkLine(src, dst);
          }
        }
      }
    }
  }
}
cube();
scene.render();
