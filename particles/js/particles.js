
if (!Detector.webgl) 
    Detector.addGetWebGLMessage();

var SerializedParticle = function(particle)
{
    this.position = new THREE.Vector3(particle.position.x, particle.position.y, particle.position.z);
    this.scale = new THREE.Vector3(particle.scale.x, particle.scale.y, particle.scale.z);
    this.attenuation = particle._attenuation;
    this.textureIndex = particle._textureIndex;
    var path = require('path');
    this.textureFile = path.basename(textures[particle._textureIndex].sourceFile);
    this.orientation = particle.orientation;
}

function GetSaveFileName()
{
    return settings.folderName + settings.cloudType + '/' + settings.rqtType + '/' +  settings.fileName + '.txt';
}

function GetExportFileName()
{
    return settings.folderName + settings.cloudType + '/' + settings.rqtType + '/' + settings.fileName + '.Export.txt';
}

function getUserHome() {
  return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
}

var libraryStructure = 
[
    { type: "LowClouds", kinds : [
        "FairWeatherCumulus",
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
    createDir(settings.textureExportFolderName);
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
    this.textureExportFolderName = this.folderName + '/textures_export/';

    var cloudTypes = [];
    libraryStructure.forEach(function(entry) {cloudTypes.push(entry.type);});
    this.cloudType = cloudTypes[0];
    this.rqtType = libraryStructure[findIndexByCloudType(this.cloudType)].kinds[0];

    this.fileName = "00";
    this.scale = 50.0;

    this.add_particle = function() 
    {
        unmarkSelected();
        selectedCloud = null
        buildParticle(new THREE.Vector3(0.0, 0.0, 0.0), new THREE.Vector3(0.2, 0.2, 0.2), 1.0, 0, 0);
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
                    serialized.textureIndex,
                    serialized.orientation);

            selectedCloud = cloud.children[cloud.children.length - 1];
            markSelected();

            initGUI2();
        }    
    }

    this.build_ground = function()
    {
        for (x = -1.0; x <= 1.0; x += 0.5)
            for (y = -1.0; y <= 1.0; y += 0.5)
                buildParticle(new THREE.Vector3(x, y, 0.0), new THREE.Vector3(0.7, 0.7, 0.7), 1.0, 2, 0);
    }

    this.export_all = function()
    {
        var fs = require('fs');
        var fileName = GetExportFileName();
        var stream = fs.createWriteStream(fileName, {flags: 'w'});
        // Header information.        
        stream.write("m = 0.25\n");
        stream.write("ga = 140\n");
        stream.write("eh = 100\n");

        libraryStructure.forEach(function(entry) {
            stream.write(entry.type + " =\n");
            stream.write("{\n");
            entry.kinds.forEach(function(kind) {
                stream.write(kind + " =\n");
                stream.write("{\n");

                // Get file list for further processing.
                fs.readdir(settings.textureFolderName, function(err, files)
                {
                    if (!err)
                    {
                        stream.write("templateCount = " + files.length.toString());
                        stream.write(", templates = {\n");
                        files.forEach(function(file)
                        {
                            var fileName = settings.folderName + entry.type + '/' + kind + '/' + file;
                            fs.readFile(fileName, function(err, data)
                                {
                                    if (err) return;
                                    var obj = JSON.parse(data);

                                    obj.forEach(function(entry)
            {
                buildParticle(entry.position, entry.scale, entry.attenuation, entry.textureIndex, entry.orientation);
            });
        });
                        });
                        stream.write("}\n");
                    }
                });

                stream.write("}\n");
            });
            stream.write("}\n");
        });        
    }

    this.optimize_textures = function()
    {
        var fs = require('fs');
        libraryStructure.forEach(function(entry) {
            entry.kinds.forEach(function(kind) {
                // Get file list for further processing.
                fs.readdir(settings.folderName + entry.type + '/' + kind + '/', function(err, files)
                {
                    if (!err)
                    {
                        files.forEach(function(file)
                        {
                            var fileName = settings.folderName + entry.type + '/' + kind + '/' + file;
                            fs.readFile(fileName, function(err, data)
                                {
                                    if (err) return;
                                    var obj = JSON.parse(data);

                                    obj.forEach(function(entry)
                                        {
                                            resolveTextureFields(entry);
                                            var src = settings.textureFolderName + entry.textureFile;
                                            var dst = settings.textureExportFolderName + entry.textureFile;
                                            fs.createReadStream(src).pipe(fs.createWriteStream(dst, {flags: 'w'}));
                                        });
                                });
                        });
                    }
                });
            });
        });        
    }

    this.to_lua = function()
    {
        var fs = require('fs');
        var fileName = GetExportFileName();
        var stream = fs.createWriteStream(fileName, {flags: 'w'});
        var cnt = cloud.children.length;
        stream.write("levels = {{0, ");
        stream.write(cnt.toString());
        stream.write("}, {");
        stream.write(cnt.toString());
        stream.write(", 1}, {");
        stream.write((cnt + 1).toString());
        stream.write(", 1}, {");
        stream.write((cnt + 2).toString());
        stream.write(", 1}},\n"); 
        stream.write("particleCount = ");
        stream.write((cnt + 3).toString());
        stream.write(",\n");
        stream.write("particles = {\n");
        cloud.children.forEach(function(entry)
            {
                stream.write("   { position = { ");
                stream.write(entry.position.x.toFixed(2) + ", ");
                stream.write(entry.position.y.toFixed(2) + ", ");
                stream.write(entry.position.z.toFixed(2) + " }, ");

                stream.write("size = { ");
                stream.write(entry.scale.x.toFixed(2) + " * m, ");
                stream.write(entry.scale.y.toFixed(2) + " * m}, ");

                stream.write("texture = ");
                stream.write(entry.textureIndex.toString());

                stream.write(", edgeHardness = 100, ");

                stream.write("orientation = ");
                stream.write(entry.orientation.toString());

                stream.write(", attenuation = ");
                stream.write((entry.attenuation * 255).toString());

                stream.write("},\n");
            });
        stream.write("   { position = { 0.0, 0.0, 0.0 }, size = { 0.5, 0.5 }, texture = 1, edgeHardness = 100, orientation = 0, attenuation = ga },\n"); 
        stream.write("   { position = { 0.0, 0.0, 0.0 }, size = { 0.5, 0.5 }, texture = 1, edgeHardness = 100, orientation = 0, attenuation = ga },\n"); 
        stream.write("   { position = { 0.0, 0.0, 0.0 }, size = { 0.5, 0.5 }, texture = 1, edgeHardness = 100, orientation = 0, attenuation = ga }\n"); 
        stream.write("}\n");
    };

    this.save = function()
    {
        var serializedParticles = [];
        cloud.children.forEach(function(entry)
        {
            serializedParticles.push(new SerializedParticle(entry));
        });

        var fs = require('fs');
        var fileName = GetSaveFileName();//"/Users/brutal/cloudsSave.txt";
        var stream = fs.createWriteStream(fileName, {flags: 'w'});
        stream.write(JSON.stringify(serializedParticles));
    };

    this.load = function()
    {
        var fs = require('fs');
        var fileName = GetSaveFileName();//"/Users/brutal/cloudsSave.txt";
        fs.readFile(fileName, function(err, data)
        {
            if (err) return;
            var obj = JSON.parse(data);
            obj.forEach(function(entry)
            {
                if (!entry.hasOwnProperty('orientation'))
                    entry.orientation = 0;
                resolveTextureFields(entry);
                buildParticle(entry.position, entry.scale, entry.attenuation, entry.textureIndex, entry.orientation);
            });
        });
    };
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

function resolveTextureFields(entry)
{
    if (!entry.hasOwnProperty('textureFile'))
    {
        var path = require('path');
        entry.textureFile = path.basename(textures[entry.textureIndex].sourceFile);
    }

    entry.textureIndex = findTextureIndex(entry.textureFile);
}

function findTextureIndex(textureFile)
{
    var path = require('path');
    for (idx = 0; idx < textures.length; ++idx)
    {
        if (path.basename(textures[idx].sourceFile) == textureFile)
            return idx;
    }
    return 0;
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
    var lineMaterial = new THREE.LineBasicMaterial( { color: '#ccc' });
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

function buildParticle(pos, scale, attenuation, textureIndex, orientation)
{
    var col = new THREE.Color();
    col.setRGB(attenuation, attenuation, attenuation);
    var planeGeometry = new THREE.PlaneGeometry(1.0, 1.0);
    /*var planeMaterial = new THREE.MeshBasicMaterial( 
            { color: col, shading: THREE.FlatShading, map: textures[textureIndex], transparent: true, vertexColors: true });
            */
    var planeMaterial = new THREE.ShaderMaterial(
            {vertexShader: vertexShader, fragmentShader:fragmentShader, side: THREE.DoubleSide});
    planeMaterial.transparent = true;
    planeMaterial.depthWrite = false;
    planeMaterial.uniforms.textureMap = {type: "t", value: textures[textureIndex] };
    planeMaterial.uniforms.attenuation = {type: "f", value: attenuation };

    var cell = new THREE.Mesh(planeGeometry, planeMaterial);
    cell.position = pos;
    cell.scale = scale;
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

    cloud.add(cell);
}

function buildControls()
{
    controls = new THREE.OrbitControls(camera, renderer.domElement );
    controls.addEventListener( 'change', render );
}

function buildScene()
{
    camera = new THREE.PerspectiveCamera( 55, viewportContainer.clientWidth / viewportContainer.clientHeight, 2, 2000 );
    camera.position.z = 200;

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
    gui2.add(settings, "scale").min(20.0).max(200.0).step(5.0);
    gui2.add(settings, "add_particle");
    gui2.add(settings, "clone_particle");
    gui2.add(settings, "remove_particle");
    gui2.add(settings, "remove_all");
    gui2.add(settings, "build_ground");
    gui2.add(settings, "to_lua");
    gui2.add(settings, "optimize_textures");
    gui2.add(settings, "save");
    gui2.add(settings, "load");
    if (selectedCloud != null)
    {
        // Scale.
        var scaleFolder = gui2.addFolder("Particle Scale");
        scaleFolder.add(selectedCloud.scale, "x").min(0.05).max(2.0).step(0.05)
        scaleFolder.add(selectedCloud.scale, "y").min(0.05).max(2.0).step(0.05)
        scaleFolder.add(selectedCloud.scale, "z").min(0.05).max(2.0).step(0.05)
        scaleFolder.open();

        // Position.
        var positionFolder = gui2.addFolder("Particle Offset");
        positionFolder.add(selectedCloud.position, "x").min(-1.0).max(1.0).step(0.05)
        positionFolder.add(selectedCloud.position, "y").min(-1.0).max(1.0).step(0.05)
        positionFolder.add(selectedCloud.position, "z").min(-1.0).max(1.0).step(0.05)
        positionFolder.open();

        gui2.add(selectedCloud, "attenuation").min(0.1).max(1.0).step(0.05);
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
        if (selectedCloud)
            unmarkSelected();

        selectedCloud = intersects[0].object;
        markSelected();
        initGUI2();
    }
}

function markSelected()
{
    selectedCloud.add( new THREE.Mesh(
            new THREE.CubeGeometry(0.05, 0.05, 0.05),
            new THREE.MeshBasicMaterial({color: '#f00'})));
}

function unmarkSelected()
{
    if (selectedCloud != null && selectedCloud.children.length > 0)
        selectedCloud.remove(selectedCloud.children[0]);
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

