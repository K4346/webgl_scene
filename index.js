class Parser {
    constructor(url) {
      this.url = url;
      this.normArray = [];
      this.texArray = [];
      this.posArray = [];
      this.pos_indArray = [];
      this.tex_indArray = [];
      this.norm_indArray = [];
      if(url==""){
        this.parseFloorModel();
      } else{
        this.parseModel();
      }
    }

    parseFloorModel(){
        this.normArray = [0, 1, 0,
             0, 1, 0,
              0, 1, 0,
               0, 1, 0];
      this.texArray = [
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
    ];
      this.posArray =[
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
        1.0,  1.0,  1.0,
        1.0,  1.0, -1.0,
    ];      
    this.pos_indArray = [0,1,2, 0,2,3];
    this.tex_indArray = [0,1,2, 0,2,3];
    this.norm_indArray = [0,1,2, 0,2,3];            
    }

    parseVertexNormals(splitLine) {
        this.normArray.push(
          parseFloat(splitLine[1]),
          parseFloat(splitLine[2]),
          parseFloat(splitLine[3])
        );
      }

      parseTextureCoordinates(splitLine) {
        this.texArray.push(
          parseFloat(splitLine[1]),
          parseFloat(splitLine[2])
        );
      }
    
      parsePositions(splitLine) {
        this.posArray.push(
          parseFloat(splitLine[1]),
          parseFloat(splitLine[2]),
          parseFloat(splitLine[3])
        );
      }

      parseFaces(splitLine) {
        this.pos_indArray.push(
            parseFloat(splitLine[1].split("/")[0]) - 1, parseFloat(splitLine[2].split("/")[0]) - 1, parseFloat(splitLine[3].split("/")[0]) - 1,
            parseFloat(splitLine[1].split("/")[0]) - 1, parseFloat(splitLine[3].split("/")[0]) - 1, parseFloat(splitLine[4].split("/")[0]) - 1
           );
          this.tex_indArray.push(
            parseFloat(splitLine[1].split("/")[1]) - 1, parseFloat(splitLine[2].split("/")[1]) - 1, parseFloat(splitLine[3].split("/")[1]) - 1, 
            parseFloat(splitLine[1].split("/")[1]) - 1, parseFloat(splitLine[3].split("/")[1]) - 1, parseFloat(splitLine[4].split("/")[1]) - 1
           );
          this.norm_indArray.push(
            parseFloat(splitLine[1].split("/")[2]) - 1, parseFloat(splitLine[2].split("/")[2]) - 1, parseFloat(splitLine[3].split("/")[2]) - 1,
          parseFloat(splitLine[1].split("/")[2]) - 1, parseFloat(splitLine[3].split("/")[2]) - 1, parseFloat(splitLine[4].split("/")[2]) - 1
          );
      }
    

    parseModel() {
        fetch(this.url)
          .then(response => response.text())
          .then(data => {
            const lines = data.split('\n').join('\r').split('\r');
            let splitLine = [];
            lines.forEach((line) => {
              splitLine = line.split(' ');
              switch (splitLine[0]) {
                case 'vn':
                    this.parseVertexNormals(splitLine);
                  break;
                case 'vt':
                    this.parseTextureCoordinates(splitLine);
                  break;
                case 'v':
                    this.parsePositions(splitLine);
                  break;
                case 'f':
                this.parseFaces(splitLine);
                  break;
                default:
                  break;
              }
            });
          })
      }
  }

class Model {
    constructor(type, gl, scale, center, parser) {
            this.type=type;
            this.gl = gl;
            this.pos = parser.posArray.map((point) => point * scale);
            this.tex=parser.texArray;
            this.norm=parser.normArray;
            this.pos_ind = parser.pos_indArray;
            this.tex_ind = parser.tex_indArray;
            this.norm_ind = parser.norm_indArray;
            this.center = center;
            this.full = [];
    
            for(let i=0; i < this.pos_ind.length; i++)
            {
                this.full.push(this.pos[this.pos_ind[i]*3]);
                this.full.push(this.pos[this.pos_ind[i]*3+1]);
                this.full.push(this.pos[this.pos_ind[i]*3+2]);
            }
        
            for(let i=0; i < this.tex_ind.length; i++)
            {
                this.full.push(this.tex[this.tex_ind[i]*2]);
                this.full.push(this.tex[this.tex_ind[i]*2+1]);
            }
            for(let i=0; i < this.norm_ind.length; i++)
            {
                this.full.push(this.norm[this.norm_ind[i]*3]);
                this.full.push(this.norm[this.norm_ind[i]*3+1]);
                this.full.push(this.norm[this.norm_ind[i]*3+2]);
            }
            this.fullBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.fullBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.full), gl.STATIC_DRAW);
            
            this.full_vertex_count = this.pos_ind.length;
            this.full_texture_count = this.tex_ind.length;
    }
  
    getBuffers() {
        return {
            full: this.fullBuffer,
            full_vertex_count: this.full_vertex_count,
        };
    }

    setVertexes(programInfo) {
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.fullBuffer);
        
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        
        gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
        gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, 2, gl.FLOAT, false, 0, this.full_vertex_count*3 * Float32Array.BYTES_PER_ELEMENT);
        
        gl.enableVertexAttribArray(programInfo.attribLocations.normal);
        gl.vertexAttribPointer(programInfo.attribLocations.normal, 3, gl.FLOAT, false, 0, (this.full_vertex_count*3+this.full_texture_count*2) * Float32Array.BYTES_PER_ELEMENT);
    }

    toPosition(Matrix) {
        this.translate(Matrix, this.center);
    }

    translate(Matrix, translation) {
        return mat4.translate(Matrix, Matrix, translation);
    }

    rotate(Matrix, rad, axis) {
        return mat4.rotate(Matrix, Matrix, rad, axis);
    }

}


var cubeVertexShader = `
attribute vec4 aVertexPosition;
attribute vec2 aTextureCoord;
attribute vec3 aNormal;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
varying highp vec2 vTextureCoord;
varying highp vec3 vNormal;
varying vec4 vPosition;
void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vTextureCoord = aTextureCoord;
    vNormal = aNormal;
    vPosition = aVertexPosition;
}`

var cubeFragmentShader = `
precision highp float;
uniform sampler2D uSampler;
varying highp vec2 vTextureCoord;
varying highp vec3 vNormal;
varying vec4 vPosition;

uniform mat4 uModelViewMatrix;
uniform vec3 uLightDirection;

uniform vec3 uHeadlights;

uniform bool uAmbientLightToggle;
uniform bool uSpotLights1Toggle;
uniform bool uSpotLights2Toggle;
uniform bool uHeadlightsToggle;

float lambert(vec3 normal, vec3 lightPosition, float power) {
    return max(dot(normal, normalize(lightPosition)), 0.0) * power;
}
float positive_dot(vec3 left, vec3 right) {
    return max(dot(left, right), 0.0);
}
float phong(vec3 normal, vec3 lightDir, vec3 viewPosition, float power, float shininess) {
    float diffuseLightDot = positive_dot(normal, lightDir);
    vec3 reflectionVector = normalize(reflect(-lightDir, normal));
    float specularLightDot = positive_dot(reflectionVector, -normalize(viewPosition));
    float specularLightParam = pow(specularLightDot, shininess);
    return (  diffuseLightDot  +specularLightParam) * power;
}    
float falloff(float distance, float radius) {
    float intensity = 1.0 - distance / radius;
    return clamp(intensity, 0.0, 1.0);
}
void main(void) {
    gl_FragColor = texture2D(uSampler, vTextureCoord);

    float light=0.0;
    vec3 positionEye3 = vec3(uModelViewMatrix * vPosition);

    if (uAmbientLightToggle){
        vec3 lightDirection = normalize(uLightDirection - positionEye3);
        light += phong(vNormal, lightDirection,positionEye3, 1.0,16.0);
    }
   
    if (uSpotLights2Toggle){
        vec3 pointPos=vec3(7.0, 0.0, -18.0);
        vec3 pointLightDirection = normalize(pointPos - positionEye3);
        float pointLightDistance = length(pointPos - positionEye3);
        float pointLightIntensity = falloff(pointLightDistance, 5.0);
        float pointLightPower = 5.0 * pointLightIntensity;
        float pointLight = phong(vNormal, pointLightDirection,positionEye3, pointLightPower,32.0);
    
        light += pointLight;
    }


    if (uSpotLights1Toggle){
    vec3 pointPos2=vec3(-5.0, 0.0, -18.0);
    vec3 pointLightDirection2 = normalize(pointPos2 - positionEye3);
    float pointLightDistance2 = length(pointPos2 - positionEye3);
    float pointLightIntensity2 = falloff(pointLightDistance2, 5.0);
    float pointLightPower2 = 5.0 * pointLightIntensity2;
    float pointLight2 = phong(vNormal, pointLightDirection2,positionEye3, pointLightPower2,32.0);

    light += pointLight2;
    }


    if (uHeadlightsToggle){
    vec3 pointPos3 = vec3(7, -3.95, -14);
    vec3 pointLightDirection3 = normalize(uHeadlights - pointPos3);
    float pointLightDistance3 = length(uHeadlights - positionEye3);
    float pointLightIntensity3 = falloff(pointLightDistance3, 5.0);

    // Измените направление света для создания эффекта света из фар
    vec3 lightDirection3 = vec3(-1.0, -1.0, 1.0);

    // Измените интенсивность света, чтобы управлять яркостью фар
    float lightIntensity3 = pointLightIntensity3 * 5.0;

    light += phong(vNormal, lightDirection3, positionEye3, lightIntensity3, 32.0);
    }

    gl_FragColor.rgb *= light;
}`

let speed = 0;

window.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft')
    speed = -0.5;
    else if (event.key === 'ArrowRight') 
    speed = 0.5;          
});
window.addEventListener('keyup', event => {
    if (event.key === 'ArrowLeft')   
    speed = 0;
    else if (event.key === 'ArrowRight') 
    speed = 0;  
});

const headlightsToggle = document.getElementById('headlightsToggle');
const ambientLightToggle = document.getElementById('ambientLightToggle');
const spotlight1Toggle = document.getElementById('spotlight1Toggle');
const spotlight2Toggle = document.getElementById('spotlight2Toggle');

class Scene {
    constructor(webgl_context, vertex_shader, fragment_shader) {
        this.gl = webgl_context;
        const shaderProgram = this.initShadersProgram(vertex_shader, fragment_shader);
        this.programInfo = {
            program: shaderProgram,
            attribLocations: {
                vertexPosition: this.gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
                textureCoord: this.gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
                normal: this.gl.getAttribLocation(shaderProgram, 'aNormal'),
            },
            uniformLocations: {
                projectionMatrix: this.gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: this.gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
                sampler: this.gl.getUniformLocation(shaderProgram, 'uSampler'),
                lightDirection: this.gl.getUniformLocation(shaderProgram, 'uLightDirection'),
                
                headlights: this.gl.getUniformLocation(shaderProgram, 'uHeadlights'),

                ambientLightToggle: this.gl.getUniformLocation(shaderProgram, 'uAmbientLightToggle'),
                spotlight1Toggle: this.gl.getUniformLocation(shaderProgram, 'uSpotLights1Toggle'),
                spotlight2Toggle: this.gl.getUniformLocation(shaderProgram, 'uSpotLights2Toggle'),
                headlightsToggle: this.gl.getUniformLocation(shaderProgram, 'uHeadlightsToggle')
            }
        }
        this.objects = [];
        this.fieldOfView = 45 * Math.PI / 180;
        this.aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
        this.zNear = 0.1;
        this.zFar = 100.0;

        const textureTrain = loadTexture(this.gl, imageTrain.src);
        const textureRailway = loadTexture(this.gl, imageRailway.src);
        const textureBarrier = loadTexture(this.gl, imageBeton.src);
        const textureLamp = loadTexture(this.gl, imageLamp.src);
        const textureTrava = loadTexture(this.gl, imageTrava.src);
        
        const render = () => {
            this.drawScene([textureTrain, textureRailway,textureBarrier,textureLamp, textureLamp, textureTrava,textureTrava,textureTrava,textureTrava, textureTrava,textureTrava,textureTrava,textureTrava, textureTrava,textureTrava,textureTrava,textureTrava]);
            requestAnimationFrame(render);
        }
        requestAnimationFrame(render);
    }

    drawScene(textures) {
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, this.fieldOfView, this.aspect, this.zNear, this.zFar);
        const sqCentr  =[0, -7, -15];
        var i = 0;
        this.gl.clearColor(1.0, 1.0, 1.0, 1.0);

        this.objects = [
                new Model("Train", this.gl, 1.6, trainCenter, trainParser),
                new Model("Railway", this.gl, 1.2, railwayCenter, railwayParser),
                new Model("Barrier", this.gl, 2, barrierCenter, barrierParser),
                new Model("StreetLight", this.gl, 0.8, lampCenter, streetLightParser),
                new Model("StreetLight", this.gl, 0.8, lampCenter2, streetLightParser),
                new Model("trava", this.gl, 3, [sqCentr[0]+3, sqCentr[1], sqCentr[2]+3],floorParser),
                new Model("trava", this.gl, 3, [sqCentr[0]-3, sqCentr[1], sqCentr[2]+3],floorParser),
                new Model("trava", this.gl, 3, [sqCentr[0]+3, sqCentr[1], sqCentr[2]-3],floorParser),
                new Model("trava", this.gl, 3, [sqCentr[0]-3, sqCentr[1], sqCentr[2]-3],floorParser),
                new Model("trava", this.gl, 3, [sqCentr[0]+9, sqCentr[1], sqCentr[2]+3],floorParser),
                new Model("trava", this.gl, 3, [sqCentr[0]-9, sqCentr[1], sqCentr[2]+3],floorParser),
                new Model("trava", this.gl, 3, [sqCentr[0]+9, sqCentr[1], sqCentr[2]-3],floorParser),
                new Model("trava", this.gl, 3, [sqCentr[0]-9, sqCentr[1], sqCentr[2]-3],floorParser),
                new Model("trava", this.gl, 3, [sqCentr[0]+15, sqCentr[1], sqCentr[2]+3],floorParser),
                new Model("trava", this.gl, 3, [sqCentr[0]-15, sqCentr[1], sqCentr[2]+3],floorParser),
                new Model("trava", this.gl, 3, [sqCentr[0]+15, sqCentr[1], sqCentr[2]-3],floorParser),
                new Model("trava", this.gl, 3, [sqCentr[0]-15, sqCentr[1], sqCentr[2]-3],floorParser),
            ];
            this.objects.forEach(obj => {
                var modelViewMatrix = mat4.create();


                obj.toPosition(modelViewMatrix);

                if(obj.type=="Railway"){
                    obj.rotate(modelViewMatrix, -90*3.14/180, [0, 1, 0])
                }
                if(obj.type=="Train"){
                    obj.rotate(modelViewMatrix, 90*3.14/180, [0, 1, 0])
                 const distance =barrierCenter[0]-trainCenter[0];
                    if(((distance < 5.5) && speed>0) || ((trainCenter[0] < -15.0) && speed<0)) speed = 0;
                    trainCenter[0]+=speed;
                    obj.position = trainCenter;
                }                
                obj.setVertexes(this.programInfo);
    
                this.gl.activeTexture(this.gl.TEXTURE0);
                this.gl.bindTexture(this.gl.TEXTURE_2D, textures[i]);
    
                const buffers = obj.getBuffers();
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffers.full);
                this.gl.useProgram(this.programInfo.program);

                this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
                this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
                this.gl.drawArrays(this.gl.TRIANGLES, 0, buffers.full_vertex_count);
                this.gl.uniform1i(this.programInfo.uniformLocations.sampler, 0);              
                
                this.gl.uniform3fv(this.programInfo.uniformLocations.lightDirection, lightDirection);

                this.gl.uniform3fv(this.programInfo.uniformLocations.headlights, [trainCenter[0]+9, trainCenter[1], trainCenter[2]]);
                
                this.gl.uniform1i(this.programInfo.uniformLocations.ambientLightToggle, ambientLightToggle.checked);
                this.gl.uniform1i(this.programInfo.uniformLocations.spotlight1Toggle, spotlight1Toggle.checked);
                this.gl.uniform1i(this.programInfo.uniformLocations.spotlight2Toggle, spotlight2Toggle.checked);
                this.gl.uniform1i(this.programInfo.uniformLocations.headlightsToggle, headlightsToggle.checked);

                i++;
            });
    }  

    initShadersProgram(vertexShaderCode, fragmentShaderCode) {
        const vertexShader = this.loadShader(this.gl, this.gl.VERTEX_SHADER, vertexShaderCode);
        const fragmentShader = this.loadShader(this.gl, this.gl.FRAGMENT_SHADER, fragmentShaderCode);
        const shaderProgram = this.gl.createProgram();
        this.gl.attachShader(shaderProgram, vertexShader);
        this.gl.attachShader(shaderProgram, fragmentShader);
        this.gl.linkProgram(shaderProgram);
        if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
            alert('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(shaderProgram));
            return null;
        }
        return shaderProgram;
    }

    loadShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }
}

lightDirection = [-30.0, 10.0, -30.0];
trainCenter = [-14.5, -4.25, -13.6];
railwayCenter = [-5, -4.25, -13.6];
barrierCenter = [7, -3.95, -14];
lampCenter = [5, -4.95, -20];
lampCenter2 = [-7, -4.95, -20];

function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}

function loadTexture(gl, url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);
    const image = new Image();
    image.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, texture);
//TODO возмжоно стоит убрать след строчку
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);

        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Размер соответствует степени 2
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // устанавливаем натяжение по краям
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }
    };
    image.crossOrigin = "anonymous"
    image.src = url;
    return texture;
}

const imageTrain = document.getElementById("texTrain");
const imageRailway = document.getElementById("texRailway");
const imageBeton = document.getElementById("texBeton");
const imageTrava = document.getElementById("texTrava");
const imageLamp = document.getElementById("texLamp");


let trainParser = new Parser("./models/Electric locomotive.obj");
let railwayParser = new Parser("./models/railway.obj");
let barrierParser = new Parser("./models/barrier.obj");
let floorParser = new Parser("");
let streetLightParser = new Parser("./models/Street Light.obj");

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
new Scene(gl, cubeVertexShader, cubeFragmentShader);