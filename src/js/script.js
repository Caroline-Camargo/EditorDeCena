let partsArray = [];
let objArray = [];
let historyStack = [];
let textures;

async function main() {
  const { gl, meshProgramInfo } = initializeWorld("#canvas");
  loadGUI();

  const href = 'http://localhost:8080/KayKit_City_Builder_Bits_1.0_FREE/Assets/obj/';
  const assets = [
    'building_A', 'building_B', 'building_C', 'building_D', 'building_E', 
    'base', 'bench', 'box_A', 'box_B', 'bush', 'dumpster', 'firehydrant', 
    'road_corner_curved', 'road_junction', 'road_straight', 'road_straight_crossing', 
    'road_tsplit', 'streetlight', 'trafficlight_A', 'trafficlight_B', 
    'trafficlight_C', 'trash_A', 'trash_B', 'watertower',
  ];
  
  const objsHref = [];
  for (let i = 0; i < assets.length; i++) {
    objsHref.push(href + '' + assets[i] + '.obj');
    await processObj(objsHref[i], gl, meshProgramInfo);
  }
  
  const extents = getGeometriesExtents(objArray[0].geometries);
  const range = m4.subtractVectors(extents.max, extents.min);
  const cameraTarget = [0, 0, 0];
  const radius = m4.length(range) * 1.2;
  const cameraPosition = m4.addVectors(cameraTarget, [
    0,
    0,
    radius,
  ]);
  
  const zNear = radius / 100;
  const zFar = radius * 3;


  async function processObj(objHref, gl, meshProgramInfo) {
    const response = await fetch(objHref);
    const text = await response.text();
    objArray.push(parseOBJ(text));

    const baseHref = new URL(objHref, window.location.href);
    const matTexts = await Promise.all(objArray[objArray.length - 1].materialLibs.map(async (filename) => {
      const matHref = new URL(filename, baseHref).href;
      const response = await fetch(matHref);
      return await response.text();
    }));
    const materials = parseMTL(matTexts.join('\n'));

    textures = {
      defaultWhite: twgl.createTexture(gl, { src: [255, 255, 255, 255] }),
    };

    for (const material of Object.values(materials)) {
      Object.entries(material)
        .filter(([key]) => key.endsWith('Map'))
        .forEach(([key, filename]) => {
          let texture = textures[filename];
          if (!texture) {
            const textureHref = new URL(filename, baseHref).href;
            texture = twgl.createTexture(gl, { src: textureHref, flipY: true });
            textures[filename] = texture;
          }
          material[key] = texture;
        });
    }

    const defaultMaterial = {
      diffuse: [1, 1, 1],
      diffuseMap: textures.defaultWhite,
      ambient: [0, 0, 0],
      specular: [1, 1, 1],
      shininess: 400,
      opacity: 1,
    };

    const part = objArray[objArray.length - 1].geometries.map(({ material, data }) => {
      if (data.color) {
        if (data.position.length === data.color.length) {
          data.color = { numComponents: 3, data: data.color };
        }
      } else {
        data.color = { value: [1, 1, 1, 1] };
      }

      const bufferInfo = twgl.createBufferInfoFromArrays(gl, data);
      const vao = twgl.createVAOFromBufferInfo(gl, meshProgramInfo, bufferInfo);
      
      const contentElem = document.querySelector('#leftContent');
      let element = createElem('div', contentElem, 'view');
      const labelElem = createElem('button', element, 'label');
      labelElem.textContent = `Add item ${objArray.length}`;
      labelElem.id = `button${objArray.length}`;

      return {
        material: {
          ...defaultMaterial,
          ...materials[material],
        },
        bufferInfo,
        vao,
        element,
      };
    });

    partsArray.push(...part);
  }

  
  function drawScene(worldMatrix, bufferInfo, vao, material) {
    gl.bindVertexArray(vao);
    twgl.setUniforms(meshProgramInfo, {
      u_world: worldMatrix,
    }, material);
    twgl.drawBufferInfo(gl, bufferInfo);
  }

  function render() {
    twgl.resizeCanvasToDisplaySize(gl.canvas);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.SCISSOR_TEST);

    gl.canvas.style.transform = `translateY(${window.scrollY}px)`;
  
    const fieldOfViewRadians = degToRad(60);

    let aspect = 1
    //if (element.parentElement.id === 'rightContent') {
      let leftContent = document.getElementById('rightContent');
      aspect = leftContent.clientWidth / leftContent.clientHeight;
    //} 
    
    const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);
    const up = [0, 1, 0];
    const camera = m4.lookAt(cameraPosition, cameraTarget, up);
    const view = m4.inverse(camera);

    const sharedUniforms = {
      u_lightDirection: m4.normalize([-1, 3, 5]),
      u_view: view,
      u_projection: projection,
      u_viewWorldPosition: cameraPosition,
    };

    gl.useProgram(meshProgramInfo.program);
    twgl.setUniforms(meshProgramInfo, sharedUniforms);
  
    let i = 0;
    for (const { bufferInfo, vao, material, element, config } of partsArray) {
      const rect = element.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top  > gl.canvas.clientHeight ||
          rect.right  < 0 || rect.left > gl.canvas.clientWidth) {
        continue;  
      }

      const width  = rect.right - rect.left;
      const height = rect.bottom - rect.top;
      const left   = rect.left;
      const bottom = gl.canvas.clientHeight - rect.bottom - 1;

      gl.viewport(left, bottom, width, height);
      gl.scissor(left, bottom, width, height);

      let u_world;
      if (config !== undefined) {
        u_world = computeMatrix(
          m4.identity(),
          config.translationX,
          config.translationY,
          config.translationZ,
          config.rotateX,
          config.rotateY,
          config.rotateZ,
          config.scaleX + config.uniformScale,
          config.scaleY + config.uniformScale,
          config.scaleZ + config.uniformScale
        );

        material.diffuse = normalizeColors(config.diffuse);
        material.ambient = normalizeColors(config.ambient);
        material.specular = normalizeColors(config.specular);
        material.shininess = config.shininess;
        material.opacity = config.opacity;

        if (config.diffuseMap == 'defaultWhite') {
          material.diffuseMap = textures['defaultWhite'];
        } else {
          material.diffuseMap = textures['citybits_texture.png'];
        }


      } else {
        u_world = m4.translate(m4.identity(), 0.0, -1.5, 0.0);
      }
      
      drawScene(u_world, bufferInfo, vao, material);
      i = i + 1;
    }
    requestAnimationFrame(render); 
  }
  requestAnimationFrame(render);

  addButtonClick(objsHref.length);
}
main(); 
  
 

