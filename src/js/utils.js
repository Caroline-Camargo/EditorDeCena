const degToRad = (d) => (d * Math.PI) / 180;
const radToDeg = (r) => (r * 180) / Math.PI;

function getExtents(positions) {
    const min = positions.slice(0, 3);
    const max = positions.slice(0, 3);
    for (let i = 3; i < positions.length; i += 3) {
        for (let j = 0; j < 3; ++j) {
        const v = positions[i + j];
        min[j] = Math.min(v, min[j]);
        max[j] = Math.max(v, max[j]);
        }
    }
    return { min, max };
}

function getGeometriesExtents(geometries) {
    return geometries.reduce(({ min, max }, { data }) => {
        const minMax = getExtents(data.position);
        return {
        min: min.map((min, ndx) => Math.min(minMax.min[ndx], min)),
        max: max.map((max, ndx) => Math.max(minMax.max[ndx], max)),
        };
    }, {
        min: Array(3).fill(Number.POSITIVE_INFINITY),
        max: Array(3).fill(Number.NEGATIVE_INFINITY),
    });
}

function computeMatrix(viewProjectionMatrix, xTranslation, yTranslation, zTranslation, xRotation, yRotation, zRotation, xScale, yScale, zScale) {
    var matrix = m4.translate(viewProjectionMatrix, xTranslation, yTranslation, zTranslation);
    matrix = m4.xRotate(matrix, xRotation);
    matrix = m4.yRotate(matrix, yRotation);
    matrix = m4.zRotate(matrix, zRotation);
    matrix = m4.scale(matrix, xScale, yScale, zScale);
    return matrix;
}

function normalizeColors(color){
    let aux = [];
    aux.push(color[0]/255);
    aux.push(color[1]/255);
    aux.push(color[2]/255);
    return aux;
}

function createElem(type, parent, className) {
    const elem = document.createElement(type);
    parent.appendChild(elem);
    if (className) {
      elem.className = className;
    }
    return elem;
}

function addButtonClick(max) {
    for (let i = 1; i <= max; i++) {
        document.getElementById(`button${i}`).addEventListener("click", function(event) {
            buttonClick(i - 1);
        });
    }
}
   
function buttonClick(i) {
    let element = document.querySelector('#rightContent');
    const newConfig = addConfig();
    partsArray.push({
        material: {...partsArray[i].material},
        bufferInfo: partsArray[i].bufferInfo,
        vao: partsArray[i].vao,
        element: element, 
        config: newConfig,
        i: i,
    });

    historyStack = [];
}


function saveScene() {
    const saveParts = [];
    for (let i = objArray.length; i < partsArray.length; i++) {
        saveParts.push({config: partsArray[i].config, i: partsArray[i].i,});
    }

    const sceneJSON = JSON.stringify(saveParts);
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([sceneJSON], { type: 'application/json' }));
    link.download = 'scene.json';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function newConfig(config){
    let tempConfig = addConfig();
    tempConfig.translationX = config.translationX;
    tempConfig.translationY = config.translationY;
    tempConfig.translationZ = config.translationZ;
    tempConfig.rotateX = config.rotateX;
    tempConfig.rotateY = config.rotateY;
    tempConfig.rotateZ = config.rotateZ;
    tempConfig.scaleX = config.scaleX + config.uniformScale;
    tempConfig.scaleY = config.scaleY + config.uniformScale;
    tempConfig.scaleZ = config.scaleZ + config.uniformScale;
    tempConfig.diffuse = config.diffuse;
    tempConfig.ambient = config.ambient;
    tempConfig.specular = config.specular;
    tempConfig.shininess = config.shininess;
    tempConfig.opacity = config.opacity;
    tempConfig.diffuseMap = config.diffuseMap;
    return tempConfig
}
  
function loadScene() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        const data = JSON.parse(e.target.result);

        for (const jsonPartsArray of data) {
            const { i, config } = jsonPartsArray;
            let tempConfig = newConfig(config);
    
            partsArray.push({
                bufferInfo: partsArray[i].bufferInfo,
                vao: partsArray[i].vao,
                material: {...partsArray[i].material},
                element: document.querySelector('#rightContent'),
                config: tempConfig,
                i: i
            });
        }
    };
    reader.readAsText(file);
}

function backButtton() {
    if (partsArray.length <= objArray.length) {
        return;
    }

    const saveParts = [];

    gui.destroy();
    gui = null;
    contFolders = 0;
    loadGUI();

    for (let i = 0; i < partsArray.length - 1; i++) {
        saveParts.push(partsArray[i]);

        if (i >= objArray.length) {
            let tempConfig = newConfig(saveParts[i].config);
            saveParts[i].config = tempConfig;
        }
    }

    historyStack.push(partsArray[partsArray.length - 1]);
    console.log(historyStack);

    partsArray = saveParts;
}


function advanceButton() {
    if (historyStack.length <= 0) {
        return;
    }

    let tempObj = historyStack.pop();
    console.log(tempObj);

    let tempConfig = newConfig(tempObj.config);

    partsArray.push({
        bufferInfo: tempObj.bufferInfo,
        vao: tempObj.vao,
        material: {...tempObj.material},
        element: document.querySelector('#rightContent'),
        config: tempConfig,
        i: tempObj.i
    });
}