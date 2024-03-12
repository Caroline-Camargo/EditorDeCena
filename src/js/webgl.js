const maxLights = 5;

const vertexShaderSource = `#version 300 es
  in vec4 a_position;
  in vec3 a_normal;
  in vec2 a_texcoord;
  in vec4 a_color;

  uniform mat4 u_projection;
  uniform mat4 u_view;
  uniform mat4 u_world;
  uniform vec3 u_viewWorldPosition;
  uniform vec3 u_lightPosition[${maxLights}];
  uniform highp int u_contLight;

  out vec3 v_normal;
  out vec3 v_surfaceToView;
  out vec2 v_texcoord;
  out vec4 v_color;
  out vec3 v_lightPosition[${maxLights}];

  void main() {
    vec4 worldPosition = u_world * a_position;
    gl_Position = u_projection * u_view * worldPosition;
    v_surfaceToView = u_viewWorldPosition - worldPosition.xyz;
    v_normal = mat3(u_world) * a_normal;
    v_texcoord = a_texcoord;
    v_color = a_color;

    for (int i = 0; i < u_contLight; i++) {
      if (i < u_contLight) {
        v_lightPosition[i] = normalize(u_lightPosition[i] - worldPosition.xyz);
      } else {
        v_lightPosition[i] = vec3(0.0);
      }
    }
  }
`;

const fragmentShaderSource = `#version 300 es
  precision highp float;

  in vec3 v_normal;
  in vec3 v_surfaceToView;
  in vec2 v_texcoord;
  in vec4 v_color;
  in vec3 v_lightPosition[${maxLights}];

  uniform vec3 diffuse;
  uniform sampler2D diffuseMap;
  uniform vec3 ambient;
  uniform vec3 emissive;
  uniform vec3 specular;
  uniform float shininess;
  uniform float opacity;
  uniform vec3 u_lightDirection;
  uniform vec3 u_ambientLight;
  uniform highp int u_contLight;
  uniform int u_effect;
  uniform float u_intensity[${maxLights}];
  uniform vec3 u_color[${maxLights}];

  out vec4 outColor;
  
  void main() {
    vec3 normal = normalize(v_normal);
    vec3 surfaceToViewDirection = normalize(v_surfaceToView);


    float step = 1.0;
    if (u_effect == 1) { //Tom Shader
      float df = 0.0; 
      for (int i = 0; i < u_contLight; i++) { 
        vec3 lightDirection = normalize(v_lightPosition[i]);
        df += max(dot(normal, lightDirection), 0.0);
      }

      float nSteps = 8.0;
      step = sqrt(df) * nSteps;
      step = (floor(step) + smoothstep(0.48, 0.52, fract(step))) / nSteps;
    }
    
    vec3 finalColor = vec3(0.0);
    vec3 specularTotal = vec3(0.0);

    for (int i = 0; i < u_contLight; i++) {
      vec3 lightDirection = normalize(v_lightPosition[i]);
      float fakeLight = dot(lightDirection, normal) * u_intensity[i] * step;
      finalColor +=  fakeLight * u_color[i];

      vec3 halfVector = normalize(lightDirection + surfaceToViewDirection);
      float specularLight = clamp(dot(normal, halfVector), 0.0, 1.0);

      vec3 specularColor = specular * pow(specularLight, shininess);
      specularTotal += specularColor * u_color[i];
    }

    vec4 diffuseMapColor = texture(diffuseMap, v_texcoord);
    vec3 effectiveDiffuse = diffuse * diffuseMapColor.rgb * v_color.rgb;
    float effectiveOpacity = opacity * diffuseMapColor.a * v_color.a;

    finalColor = finalColor / float(u_contLight);

    outColor = vec4(
      finalColor +
      emissive +
      ambient * u_ambientLight +
      effectiveDiffuse +
      specularTotal,
      effectiveOpacity
    );
  }
`;

const initializeWorld = (name) => {
  const canvas = document.querySelector(name);
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  twgl.setAttributePrefix("a_");
  const meshProgramInfo = twgl.createProgramInfo(gl, [vertexShaderSource, fragmentShaderSource,]);

  return {
    gl,
    meshProgramInfo,
  };
};
