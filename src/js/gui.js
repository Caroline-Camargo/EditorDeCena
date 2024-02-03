let gui = null;
let contFolders = 0;


const loadGUI = (num) => {
  if (gui == null) {
    gui = new dat.GUI();
  }
};


const addConfig = () => {
  contFolders++;

  var config = { 
    rotateX: degToRad(0),
    rotateY: degToRad(0),
    rotateZ: degToRad(0),
    translationX: 0.0,
    translationY: -1.5,
    translationZ: -3.0,
    scaleX: 1.0,
    scaleY: 1.0,
    scaleZ: 1.0,
    uniformScale: 0.0,
    diffuse: [255, 255, 255],
    ambient: [0, 0, 0],
    specular: [255, 255, 255],
    shininess: 400,
    opacity: 1, 
    diffuseMap: 'citybits_texture',
  };

  const obj = gui.addFolder("obj" + contFolders);
  addObjGUI(obj, config);  
  return config
};


const addObjGUI = (obj, config) => {
  const rotate = obj.addFolder("rotate");
  rotate.add(config, "rotateX", 0, 20, 0.5);
  rotate.add(config, "rotateY", 0, 20, 0.5);
  rotate.add(config, "rotateZ", 0, 20, 0.5);

  const translation = obj.addFolder("translation");
  translation.add(config, "translationX", -6, 6, 0.01);
  translation.add(config, "translationY", -6, 6, 0.01);
  translation.add(config, "translationZ", -10, 5, 0.01);

  const scale = obj.addFolder("scale");
  scale.add(config, "scaleX", 0, 10, 0.01);
  scale.add(config, "scaleY", 0, 5, 0.01);
  scale.add(config, "scaleZ", 0, 20, 0.01);
  scale.add(config, "uniformScale", -5, 10, 0.001);

  const texture = obj.addFolder("texture");;
  texture.addColor(config, "diffuse");
  texture.addColor(config, "ambient");
  texture.addColor(config, "specular");
  texture.add(config, "shininess", 0, 1000);
  texture.add(config, "opacity", 0, 1);
  texture.add(config, "diffuseMap", ['defaultWhite', 'citybits_texture']);
};
