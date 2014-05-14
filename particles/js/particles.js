
if (!Detector.webgl) 
    Detector.addGetWebGLMessage();

process.on('uncaughtException', function(err) {
  console.log(err);
});

var SerializedParticle = function(particle)
{
    this.position = new THREE.Vector3(particle.position.x, particle.position.y, particle.position.z);
    this.scale = new THREE.Vector3(particle.scale.x, particle.scale.y, particle.scale.z);
    this.attenuation = particle._attenuation;
    this.textureIndex = particle._textureIndex;
    var path = require('path');
    this.textureFile = path.basename(textures[particle._textureIndex].sourceFile);
    this.orientation = particle.orientation;
    this.edgeHardness = particle.edgeHardness;
}

function ParticlesMatch(particle1, particle2)
{
    return ((particle1.position === particle2.position) &&
            (particle1.scale === particle2.scale) &&
            (particle1.attenuation === particle2.attenuation) &&
            (particle1.textureFile === particle2.textureFile) &&
            (particle1.orientation === particle2.orientation) &&
            (particle1.edgeHardness === particle2.edgeHardness));
}
    
function toLua(particle, minZ)
{
    var luaString = "";
    luaString += "{ position = { ";
    luaString += particle.position.x.toFixed(2) + ", ";
    luaString += particle.position.y.toFixed(2) + ", ";
    luaString += (particle.position.z - minZ).toFixed(2) + " }, ";

    luaString += "size = { ";
    luaString += particle.scale.x.toFixed(2) + " * m, ";
    luaString += particle.scale.y.toFixed(2) + " * m}, ";

    luaString += "texture = ";
    luaString += particle.textureIndex.toString();

    luaString += ", edgeHardness = ";
    luaString += (particle.edgeHardness * 255).toString();

    luaString += ", orientation = ";
    luaString += particle.orientation.toString();

    luaString += ", attenuation = ";
    luaString += (particle.attenuation * 255).toString();

    luaString += "}";
    return luaString;
}

function GetSaveFileName()
{
    return settings.folderName + settings.cloudType + '/' + 
            settings.rqtType + '/' +  
            settings.fileName + '.' + 
            settings.level.toString() + '.txt';
}

function GetExtractFileName(fileName)
{
    return settings.folderName + settings.cloudType + '/' + 
            settings.rqtType + '/' +  
            fileName + '.' + 
            settings.level.toString() + '.txt';
}

function getUserHome() {
  return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
}

var libraryStructure = 
[
    { type: "LowClouds", kinds : [
        "ScatteredFairWeatherCumulus",
        "BrokenSwellingCumulusCongestus",
        "ScatteredCumulonimbusAndScatteredToBrokenCumulusCongestus",
        "WidespreadCumulusCongestusAndCumulonimbus",
        "BrokenStratocumulus",
        "OvercastStratocumulus",
        "PatchyStratus",
        "Stratus",
        "Nimbostratus",
        "NimbostratusWithEmbeddedCumulonimbus"
    ]},
    { type: "MiddleClouds", kinds : [
        "ScatteredAltocumulus",
        "BrokenAltocumulus",
        "PatchyAltostratus",
        "Altostratus",
        "Nimbostratus",
        "Cumulonimbus"
    ]},
    { type: "HighClouds", kinds : [
        "ScatteredCirrus",
        "ScatteredCirrocumulus",
        "BrokenCirrocumulus",
        "PatchyCirrostratus",
        "Cirrostratus",
        "Cumulonimbus",
        "AnvilFromCumulonimbus"
    ]}
];

function createDir(dirName)
{
    var fs = require('fs');
    fs.stat(dirName, function(err, stat)
    {
        if (err || !stat.isDirectory())
        {
            fs.mkdir(dirName, function(err) {
                if (err) alert(err);
            });
        }
    });
}

function findIndexByCloudType(cloudType)
{
    for (index = 0; index < libraryStructure.length; ++index)
    {
        if (libraryStructure[index].type == cloudType)
            return index;
    } 
    return 0;
}

function buildLibrary()
{   
    createDir(settings.folderName);
    createDir(settings.textureFolderName);
    createDir(settings.exportFolderName);
    createDir(settings.exportTextureFolderName);
    createDir(settings.exportNormalsFolderName);

    libraryStructure.forEach(function(entry)
    {
        createDir(settings.folderName + entry.type);
        entry.kinds.forEach(function(kind)
        {
            createDir(settings.folderName + entry.type + '/' + kind);
        });
    });
}

var SceneSettings = function()
{
    this.folderName = getUserHome() + '/Desktop/CloudLibrary/';
    this.textureFolderName = this.folderName + '/textures/';
    this.exportFolderName = this.folderName + '/export/';
    this.exportTextureFolderName = this.exportFolderName + '/textures/';
    this.exportNormalsFolderName = this.exportFolderName + '/normals/';

    var cloudTypes = [];
    libraryStructure.forEach(function(entry) {cloudTypes.push(entry.type);});
    this.cloudType = cloudTypes[0];
    this.rqtType = libraryStructure[findIndexByCloudType(this.cloudType)].kinds[0];

    this.fileName = "00";
    this.level = 0;
    this.scale = 50.0;

    this.add_particle = function() 
    {
        unmarkSelected();
        selectedCloud = null
        buildParticle(new THREE.Vector3(0.0, 0.0, 0.0), new THREE.Vector3(0.2, 0.2, 0.2), 1.0, 1.0, 0, 0);
        selectedCloud = cloud.children[cloud.children.length - 1];
        markSelected();
        initGUI2();
    };

    this.remove_particle = function()
    {
        if (selectedCloud != null)
        {    
            cloud.remove(selectedCloud);
            selectedCloud = null;
            initGUI2();
        }    
    }

    this.remove_all = function()
    {
        while (cloud.children.length > 0)
            cloud.remove(cloud.children[0]);
        selectedCloud = null;
        initGUI2();
    }

    this.clone_particle = function()
    {
        if (selectedCloud != null)
        { 
            var serialized = new SerializedParticle(selectedCloud);
            unmarkSelected();
            selectedCloud = null

            buildParticle(
                    serialized.position, 
                    serialized.scale, 
                    serialized.attenuation,
                    serialized.edgeHardness,
                    serialized.textureIndex,
                    serialized.orientation);

            selectedCloud = cloud.children[cloud.children.length - 1];
            markSelected();

            initGUI2();
        }    
    }

    this.next_particle = function()
    {
        selectNextObject();
    }

    this.prev_particle = function()
    {
        selectPreviousObject();
    }

    this.export_all = function()
    {
        var errorCount = 0;
        var texCount = this.optimize_textures();

        var fs = require('fs');
        var fileName = settings.exportFolderName + 'CloudTemplates.lua';
        var stream = fs.createWriteStream(fileName, {flags: 'w'});
        // Header information.        
        stream.write("m = 0.25\n");
        stream.write("ga = 140\n");
        stream.write("eh = 100\n");

        stream.write("Global = {\n");
        stream.write("AtlasTextureCount = " + texCount.toString() + ";\n");
        stream.write("}\n");

        var textureList = buildTextureList(settings.exportTextureFolderName);

        libraryStructure.forEach(function(entry) {
            stream.write(entry.type + " =\n");
            stream.write("{\n");

            var kindStrings = [];

            entry.kinds.forEach(function(kind) {
                var kindString = "";
                kindString += kind + " =\n";
                kindString += "{\n";

                // Get file list for further processing.
                var folderName = settings.folderName + entry.type + '/' + kind + '/';
                var files = fs.readdirSync(folderName);
                var template_files = [];
                var template_levels = [];
                files.forEach(function(file)
                    {
                        var fileNameMatch = file.match(/(.*)\.\d\.txt/);
                        if (fileNameMatch != null)
                        {
                            var fileIdx = -1;
                            for (idx = 0; idx < template_files.length; ++idx)
                            {
                                if (template_files[idx] == fileNameMatch[1])
                                {
                                    fileIdx = idx;
                                }
                            }
                            if (fileIdx < 0)
                            { 
                                template_files.push(fileNameMatch[1]);
                                template_levels.push(new Array());
                                fileIdx = template_levels.length - 1;
                            }

                            var fileName = settings.folderName + entry.type + '/' + kind + '/' + file;
                            var fileData = fs.readFileSync(fileName);
                            template_levels[fileIdx].push(JSON.parse(fileData));
                        }
                    });
                kindString += "templateCount = " + template_files.length.toString() + ",\n";
                kindString += "templates = {\n"; // Begin Templates.
                
                var templateStrings = [];
                for (templateIdx = 0; templateIdx < template_files.length; ++templateIdx)
                {
                    var templateString = "{\n";
                    var levelStrings = [];
                    var particles = [];
                    var offset = 0;
                    if (template_levels[templateIdx].length < 4)
                    {
                        alert("Detail Level Count is incorrect: " + entry.type + ", " + kind + ", " + templateIdx.toString());
                        errorCount++;
                    }
                    template_levels[templateIdx].forEach(function(template)
                            {
                                levelStrings.push("{" + offset.toString() + ", " + template.length.toString() + "}");

                                var minZ = 1000.0;
                                template.forEach(function(particle)
                                    {
                                        if (particle.position.z < minZ)
                                        {
                                            minZ = particle.position.z;
                                        }
                                    });

                                template.forEach(function(particle)
                                    {
                                        if (!particle.hasOwnProperty('orientation'))
                                            particle.orientation = 0;

                                        if (!particle.hasOwnProperty('edgeHardness'))
                                            particle.edgeHardness = 100.0 / 255.0;
                                        
                                        resolveTextureFields(particle, textures);
                                        resolveTextureFields(particle, textureList);
                                        particles.push(toLua(particle, minZ));
                                    });
                                offset += template.length;
                            });

                    if (offset > 64)
                    {
                        alert("Particle Count is incorrect: " + entry.type + ", " + kind + ", " + templateIdx.toString());
                        errorCount++;
                    }

                    templateString += "levels = {" + levelStrings.join(',') + "},\n";
                    templateString += "particleCount = " + offset.toString() + ",\n";
                    templateString += "particles = {\n" + particles.join(",\n") + "}\n";
                    templateString += "}\n";

                    templateStrings.push(templateString);
                }
                kindString += templateStrings.join(",\n");

                kindString += "}\n"; // End Templates.
                kindString += "}\n"; // End Kind.
                kindStrings.push(kindString);
            });
            stream.write(kindStrings.join(",\n"));
            stream.write("}\n");
        });        
        if (errorCount == 0)
        {
            alert("Exported all data correctly!");
        }
        else
        {
            alert("Exported data with errors. Total: " + errorCount.toString());
        }
    }

    this.simplify = function()
    {
        var selectedParticle;
        cloud.children.forEach(function(entry)
        {
            if (selectedParticle == null)
            {
                selectedParticle = entry;
            }
            else
            {
                if (selectedParticle.scale.x * selectedParticle.scale.y < entry.scale.x * entry.scale.y)
                {
                    selectedParticle = entry;
                }
            }
        });

        while (cloud.children.length > 0)
            cloud.remove(cloud.children[0]);
        selectedCloud = null;
        unmarkSelected();
        if (selectedParticle != null)
        {
            var serialized = new SerializedParticle(selectedParticle);

            buildParticle(
                    serialized.position, 
                    serialized.scale, 
                    serialized.attenuation,
                    serialized.edgeHardness,
                    serialized.textureIndex,
                    serialized.orientation);
        }
        initGUI2();
    }

    this.optimize_textures = function()
    {
        var fs = require('fs');
        
        libraryStructure.forEach(function(entry) {
            entry.kinds.forEach(function(kind) {
                // Get file list for further processing.
                var files = fs.readdirSync(settings.folderName + entry.type + '/' + kind + '/');
                files.forEach(function(file)
                    {
                        if (file.match(/^\.+/))
                            return;

                        var fileName = settings.folderName + entry.type + '/' + kind + '/' + file;
                        var data = fs.readFileSync(fileName);
                        var obj = JSON.parse(data);

                        obj.forEach(function(entry)
                            {
                                resolveTextureFields(entry, textures);
                                var src = settings.textureFolderName + entry.textureFile;
                                var dst = settings.exportTextureFolderName + entry.textureFile;
                                copyFileSync(src, dst);
                                //fs.createReadStream(src).pipe(fs.createWriteStream(dst, {flags: 'w'}));
                            });
                        //var data = fs.readFileSync(fileName);
                    });
            });
        }); 

        var atlasTextureCount = 0;
        var exportFiles = fs.readdirSync(settings.exportTextureFolderName);
        exportFiles.forEach(function(exportFile)
                {
                    if (exportFile.match(/^\.+/))
                        return;
                    atlasTextureCount++;
                });
        return atlasTextureCount;       
    }

    this.save = function()
    {
        var serializedParticles = [];
        cloud.children.forEach(function(entry)
        {
            serializedParticles.push(new SerializedParticle(entry));
        });

        var fs = require('fs');
        var fileName = GetSaveFileName();
        var stream = fs.createWriteStream(fileName, {flags: 'w'});
        stream.write(JSON.stringify(serializedParticles));
    };

    this.load = function()
    {
        var fs = require('fs');
        var fileName = GetSaveFileName();
        fs.readFile(fileName, function(err, data)
        {
            if (err) return;
            var obj = JSON.parse(data);
            obj.forEach(function(entry)
            {
                if (!entry.hasOwnProperty('orientation'))
                    entry.orientation = 0;
                if (!entry.hasOwnProperty('edgeHardness'))
                    entry.edgeHardness = 100.0 / 255.0;
                resolveTextureFields(entry, textures);
                buildParticle(entry.position, entry.scale, entry.attenuation, entry.edgeHardness, entry.textureIndex, entry.orientation);
            });
        });
    };

    this.extractFrom = "";
    this.extractWhat = "";

    this.extract = function()
    {
        var extractFromObj = LoadObject(GetExtractFileName(settings.extractFrom));
        var extractObj = LoadObject(GetExtractFileName(settings.extractWhat));

        var newObject = [];
        extractFromObj.forEach(function(entry)
        {
            var found = false;
            extractObj.forEach(function(srcEntry)
            {
                found = found || ParticlesMatch(entry, srcEntry);
            });

            if (!found)
                newObject.push(entry);
        });
    }
}

function LoadObject(fileName)
{
    var fs = require('fs');
    var data = fs.readFileSync(fileName);
    var obj = JSON.parse(data);
    obj.forEach(function(entry)
    {
        if (!entry.hasOwnProperty('orientation'))
            entry.orientation = 0;
        if (!entry.hasOwnProperty('edgeHardness'))
            entry.edgeHardness = 100.0 / 255.0;
        resolveTextureFields(entry, textures);
    });

    return obj;
}

var settings, gui;

function initGUI()
{
    settings = new SceneSettings();
    buildLibrary();
    loadTextures();
}

var viewportContainer;
var guiContainer;

var camera, scene, renderer, projector, particles, geometry, material, i, h, color, sprite, size;

var cloud;
var grid;

var textures = [];

function loadTextures() 
{
    var fs = require('fs');
    fs.readdir(settings.textureFolderName, function(err, files)
        {
            if (err) return;
            files.forEach(function(entry)
                {
                    textures.push(THREE.ImageUtils.loadTexture(settings.textureFolderName + entry));
                });
        });
}

var TextureEntry = function(fileName)
{
    this.sourceFile = fileName;
}

function buildTextureList(folderName)
{
    var textureList = [];
    var fs = require('fs');
    var files = fs.readdirSync(folderName);
    files.forEach(function(entry)
            {
                textureList.push(new TextureEntry(folderName + entry));
            });
    return textureList;
}

function resolveTextureFields(entry, textureList)
{
    if (!entry.hasOwnProperty('textureFile'))
    {
        var path = require('path');
        entry.textureFile = path.basename(textureList[entry.textureIndex].sourceFile);
    }

    entry.textureIndex = findTextureIndex(entry.textureFile, textureList);
}

function findTextureIndex(textureFile, textureList)
{
    var path = require('path');
    for (idx = 0; idx < textureList.length; ++idx)
    {
        if (path.basename(textureList[idx].sourceFile) == textureFile)
            return idx;
    }
    return 0;
}

function copyFileSync(srcFile, destFile) 
{
    var fs = require('fs');
    var BUF_LENGTH, buff, bytesRead, fdr, fdw, pos;
    BUF_LENGTH = 64 * 1024;
    buff = new Buffer(BUF_LENGTH);
    fdr = fs.openSync(srcFile, "r");
    fdw = fs.openSync(destFile, "w");
    bytesRead = 1;
    pos = 0;
    while (bytesRead > 0) 
    {
        bytesRead = fs.readSync(fdr, buff, 0, BUF_LENGTH, pos);
        fs.writeSync(fdw, buff, 0, bytesRead);
        pos += bytesRead;
    }
    fs.closeSync(fdr);
    return fs.closeSync(fdw);
}

var vertexShader = 
[
    "varying vec2 vUv;",
    "void main() {",
        "vUv = uv;",
        "gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
    "}"
].join("\n");

var fragmentShader = 
[
    "uniform sampler2D textureMap;",
    "uniform float attenuation;",
    "varying vec2 vUv;",
    "void main() {",
        "vec4 color = texture2D(textureMap, vUv);",
        "color.rgb *= attenuation;",
        "gl_FragColor = color;",
    "}"
].join("\n");

var controls;

function buildGrid()
{
    grid = new THREE.Object3D();
    var lineMaterial = new THREE.LineBasicMaterial( { color: '#000' });
    for (i = -1.0; i <= 1.0; i+= 0.1)
    {
        var lineXGeometry = new THREE.Geometry();
        lineXGeometry.vertices.push(new THREE.Vector3(i, -1.0, 0.0));
        lineXGeometry.vertices.push(new THREE.Vector3(i, 1.0, 0.0));
        var lineX = new THREE.Line(lineXGeometry, lineMaterial);
        grid.add(lineX);    

        var lineYGeometry = new THREE.Geometry();
        lineYGeometry.vertices.push(new THREE.Vector3(-1.0, i, 0.0));
        lineYGeometry.vertices.push(new THREE.Vector3(1.0, i, 0.0));
        var lineY = new THREE.Line(lineYGeometry, lineMaterial);
        grid.add(lineY);    
    }
    scene.add(grid);
}

function buildParticle(pos, scale, attenuation, edgeHardness, textureIndex, orientation)
{
    var col = new THREE.Color();
    col.setRGB(attenuation, attenuation, attenuation);
    var planeGeometry = new THREE.PlaneGeometry(1.0, 1.0);
    var planeMaterial = new THREE.ShaderMaterial(
            {vertexShader: vertexShader, fragmentShader:fragmentShader, side: THREE.DoubleSide});
    planeMaterial.transparent = true;
    planeMaterial.depthWrite = false;
    planeMaterial.uniforms.textureMap = {type: "t", value: textures[textureIndex] };
    planeMaterial.uniforms.attenuation = {type: "f", value: attenuation };

    var cell = new THREE.Mesh(planeGeometry, planeMaterial);
    cell.position.copy(pos);
    cell.scale.copy(scale);
    cell.grayness = Math.random();

    cell._attenuation = attenuation;
    cell.__defineGetter__("attenuation", function() 
        { 
            return this._attenuation; 
        });
    cell.__defineSetter__("attenuation", function(val) { 
        this._attenuation = val; this.material.uniforms.attenuation.value = val;
    });

    cell._textureIndex = textureIndex;
    cell.__defineGetter__("textureIndex", function() 
            { 
                return this._textureIndex; 
            });
    cell.__defineSetter__("textureIndex", function(val) { 
        this._textureIndex = val; this.material.uniforms.textureMap.value = textures[val];
    });

    cell.orientation = orientation;
    cell.edgeHardness = edgeHardness;

    cloud.add(cell);
}

function buildControls()
{
    controls = new THREE.OrbitControls(camera, renderer.domElement );
    //controls = new THREE.TrackballControls(camera);
    //controls.staticMoving = true;
    controls.addEventListener('change', render);
}

function buildScene()
{
    camera = new THREE.PerspectiveCamera( 55, viewportContainer.clientWidth / viewportContainer.clientHeight, 2, 2000 );
    camera.position.z = 200;
    camera.up = new THREE.Vector3(0, 0, 1);

    scene = new THREE.Scene();
    //scene.fog = new THREE.FogExp2( 0x000000, 0.001 );

    buildGrid();

    cloud = new THREE.Object3D()
    scene.add(cloud);
}

var gui2;// = new dat.GUI();

function initGUI2()
{
    if (gui2 != null)
        gui2.destroy();
    gui2 = new dat.GUI({autoPlace: false});

    gui2.add(settings, "folderName");
    var cloudTypes = [];
    libraryStructure.forEach(function(entry) {cloudTypes.push(entry.type);});
    var cloudTypeController = gui2.add(settings, "cloudType", cloudTypes); 
    cloudTypeController.onChange(function(value) {
        initGUI2();
    });
     

    var rqtTypes = [];
    libraryStructure[findIndexByCloudType(settings.cloudType)].kinds.forEach(function(entry) {rqtTypes.push(entry); });
    gui2.add(settings, "rqtType", rqtTypes);

    gui2.add(settings, "fileName");
    gui2.add(settings, "level", [0, 1, 2, 3]);
    gui2.add(settings, "add_particle");
    gui2.add(settings, "clone_particle");
    gui2.add(settings, "next_particle");
    gui2.add(settings, "prev_particle");
    gui2.add(settings, "remove_particle");
    gui2.add(settings, "remove_all");
    gui2.add(settings, "simplify");
    gui2.add(settings, "export_all");
    gui2.add(settings, "save");
    gui2.add(settings, "load");
    gui2.add(settings, "extractFrom");
    gui2.add(settings, "extractWhat");
    gui2.add(settings, "extract");

    if (selectedCloud != null)
    {
        // Scale.
        var scaleFolder = gui2.addFolder("Particle Scale");
        scaleFolder.add(selectedCloud.scale, "x").min(0.05).max(6.0).step(0.05)
        scaleFolder.add(selectedCloud.scale, "y").min(0.05).max(6.0).step(0.05)
        scaleFolder.add(selectedCloud.scale, "z").min(0.05).max(6.0).step(0.05)
        scaleFolder.open();

        // Position.
        var positionFolder = gui2.addFolder("Particle Offset");
        positionFolder.add(selectedCloud.position, "x").min(-1.0).max(1.0).step(0.05)
        positionFolder.add(selectedCloud.position, "y").min(-1.0).max(1.0).step(0.05)
        positionFolder.add(selectedCloud.position, "z").min(-1.0).max(1.0).step(0.05)
        positionFolder.open();

        gui2.add(selectedCloud, "attenuation").min(0.0).max(1.0).step(0.05);
        gui2.add(selectedCloud, "edgeHardness").min(0.0).max(1.0).step(0.05);
        gui2.add(selectedCloud, "textureIndex").min(0).max(textures.length - 1).step(1);

        gui2.add(selectedCloud, "orientation").min(0).max(1).step(1);
    }
    guiContainer = document.getElementById('gui');
    guiContainer.innerHTML = '';
    guiContainer.appendChild(gui2.domElement);
}

init();
initGUI();
initGUI2();
animate();
render();

function init() 
{
    viewportContainer = document.getElementById('gl');

    buildScene();

    // Temporary solution, particle count monitoring tool.
    setInterval(function() 
                {
                    document.getElementById('particle_field').innerHTML =
                            cloud.children.length.toString(); 

                    document.getElementById('particle_id').innerHTML = '';
                    var selectedIdx = getSelectedIdx();
                    if (selectedIdx >= 0)
                        document.getElementById('particle_id').innerHTML = selectedIdx.toString();
                }, 1000);

    renderer = new THREE.WebGLRenderer( { clearAlpha: 1 } );
    renderer.setClearColor(0x87CEFA, 1);
    renderer.setSize(viewportContainer.clientWidth, viewportContainer.clientHeight );
    viewportContainer.appendChild( renderer.domElement );

    buildControls();

    document.addEventListener('click', onDocumentClick, false);
    document.addEventListener('keyup', onKeyUp, false);
    window.addEventListener( 'resize', onWindowResize, false );

    projector = new THREE.Projector();
}

function onWindowResize() 
{
    camera.aspect =  viewportContainer.clientWidth / viewportContainer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewportContainer.clientWidth, viewportContainer.clientHeight );
}

function onDocumentClick(event) 
{
    performSelection(event.clientX, event.clientY);
}

function onKeyUp(event)
{
    switch (event.keyCode) 
    {
        case 46: settings.remove_particle(); break;   
    }
}

var testProjector = new THREE.Projector();
var pickMouseVector = new THREE.Vector3();

//Selection support.
var selectedCloud;

function performSelection(x, y)
{
    pickMouseVector.x = 2 * (x / viewportContainer.clientWidth) - 1;
    pickMouseVector.y = 1 - 2 * (y / viewportContainer.clientHeight );
    
    var testRaycaster = projector.pickingRay( pickMouseVector.clone(), camera );
    var intersects = testRaycaster.intersectObjects( cloud.children );
    if (intersects.length > 0)
    {
        selectObject(intersects[0].object);
    }
}

function selectObject(obj)
{
    if (selectedCloud)
        unmarkSelected();

    selectedCloud = obj;
    markSelected();
    initGUI2();
}

function getNextObject(obj)
{
    if (cloud.children.length == 0)
        return null;
    var objectIdx = getObjectIdx(obj);
    return cloud.children[(objectIdx + 1) % cloud.children.length];
}

function getPreviousObject(obj)
{
    if (cloud.children.length == 0)
        return null;
    var objectIdx = getObjectIdx(obj);
    return cloud.children[(objectIdx - 1) % cloud.children.length];
}

function selectNextObject()
{
    var nextObject = getNextObject(selectedCloud);
    if (nextObject)
    {
        selectObject(nextObject);
    }
}

function selectPreviousObject()
{
    var prevObject = getPreviousObject(selectedCloud);
    if (prevObject)
    {
        selectObject(prevObject);
    }
}

function markSelected()
{
    selectedCloud.add( new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.05, 0.05),
            new THREE.MeshBasicMaterial({color: '#f00'})));
}

function unmarkSelected()
{
    if (selectedCloud != null && selectedCloud.children.length > 0)
        selectedCloud.remove(selectedCloud.children[0]);
}

function getObjectIdx(obj)
{
    var objectIdx = -1;
    var idx = 0;
    cloud.children.forEach(function(entry)
        {
            if (entry === obj)
                objectIdx = idx;
            ++idx;
        });
    return objectIdx;
}

function getSelectedIdx()
{
    return getObjectIdx(selectedCloud);
}

function animate() 
{
    requestAnimationFrame(animate);
    controls.update();
    render();
}

function render() 
{
    //var time = Date.now() * 0.00005;

    grid.scale.set(settings.scale, settings.scale, settings.scale);

    cloud.scale.set(settings.scale, settings.scale, settings.scale);
    cloud.children.forEach(function(entry)
            { 
                if (entry.orientation == 0) 
                    entry.rotation.setFromRotationMatrix( camera.matrix ); 
                else
                    entry.rotation.set(0.0, 0.0, 0.0);
            });
    renderer.render( scene, camera );
}

