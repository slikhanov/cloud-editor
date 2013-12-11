
if (!Detector.webgl) 
    Detector.addGetWebGLMessage();

var SerializedParticle = function(particle)
{
    this.position = particle.position;
    this.scale = particle.scale;
    this.attenuation = particle._attenuation;
    this.textureIndex = particle._textureIndex;
}

var SceneSettings = function()
{
    this.scale = 50.0;
    this.positionx = 0.0;
    this.add = function() 
    {
        buildParticle(new THREE.Vector3(0.0, 0.0, 0.0), new THREE.Vector3(0.2, 0.2, 0.2), 1.0, 0);
        //cloud.add(cell);
        //selectedCloud = cell;
        initGUI2();
    };

    this.to_lua = function()
    {
        var fs = require('fs');
        var fileName = "/Users/brutal/clouds.txt";
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

                stream.write("texture = 13, edgeHardness = 100, orientation = 0, attenuation = ");
                stream.write((entry.attenuation * 255).toString());

                stream.write("},\n");
            });
        stream.write("   { position = { 0.0, 0.0, 0.0 }, size = { 0.5, 0.5 }, texture = 13, edgeHardness = 100, orientation = 0, attenuation = ga },\n"); 
        stream.write("   { position = { 0.0, 0.0, 0.0 }, size = { 0.5, 0.5 }, texture = 13, edgeHardness = 100, orientation = 0, attenuation = ga },\n"); 
        stream.write("   { position = { 0.0, 0.0, 0.0 }, size = { 0.5, 0.5 }, texture = 13, edgeHardness = 100, orientation = 0, attenuation = ga }\n"); 
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
        var fileName = "/Users/brutal/cloudsSave.txt";
        var stream = fs.createWriteStream(fileName, {flags: 'w'});
        stream.write(JSON.stringify(serializedParticles));
    };

    this.load = function()
    {
        var fs = require('fs');
        var fileName = "/Users/brutal/cloudsSave.txt";
        fs.readFile(fileName, function(err, data)
        {
            if (err) return;
            var obj = JSON.parse(data);
            obj.forEach(function(entry)
            {
                buildParticle(entry.position, entry.scale, entry.attenuation, entry.textureIndex);
            });
        });

    };
}

var settings, gui;

function initGUI()
{
    settings = new SceneSettings();
}

var viewportContainer;
var guiContainer;

var camera, scene, renderer, projector, particles, geometry, material, i, h, color, sprite, size;

var billboard;
var cloud;

var textures = 
[
    THREE.ImageUtils.loadTexture("textures/001_ml.png"),
    THREE.ImageUtils.loadTexture("textures/02_bPh.png"),
    THREE.ImageUtils.loadTexture("textures/03_bPh.png"),
    THREE.ImageUtils.loadTexture("textures/04_bPh.png"),
    THREE.ImageUtils.loadTexture("textures/05_bPh.png")
];

var cloudArray = [
       [[0, 0, 3, 0],
        [1, 0, 0, 5],
        [1, 0, 0, 1],
        [1, 0, 3, 0],
        [0, 4, 1, 0]],

       [[0, 0, 1, 0],
        [1, 3, 0, 1],
        [2, 0, 0, 3],
        [1, 0, 0, 0],
        [0, 5, 2, 0]],

       [[0, 0, 3, 0],
        [2, 4, 2, 1],
        [4, 0, 0, 1],
        [0, 1, 2, 1],
        [0, 3, 0, 0]],

       [[0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]]
];

var controls;

function buildParticle(pos, scale, attenuation, textureIndex)
{
    var col = new THREE.Color();
    col.setRGB(attenuation, attenuation, attenuation);
    var planeGeometry = new THREE.PlaneGeometry(1.0, 1.0);
    var planeMaterial = new THREE.MeshBasicMaterial( 
            { color: col, shading: THREE.FlatShading, map: textures[textureIndex], transparent: true, vertexColors: true });
    planeMaterial.depthWrite = false;

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
        this._attenuation = val; this.material.color.setRGB( val, val, val);
    });

    cell._textureIndex = textureIndex;
    cell.__defineGetter__("textureIndex", function() 
            { 
                return this._textureIndex; 
            });
    cell.__defineSetter__("textureIndex", function(val) { 
        this._textureIndex = val; this.material.map = textures[val];
    });

    cloud.add(cell);
}

function buildScene()
{
    camera = new THREE.PerspectiveCamera( 55, viewportContainer.clientWidth / viewportContainer.clientHeight, 2, 2000 );
    camera.position.z = 200;

    controls = new THREE.OrbitControls( camera );
    controls.addEventListener( 'change', render );

    scene = new THREE.Scene();
    //scene.fog = new THREE.FogExp2( 0x000000, 0.001 );


    cloud = new THREE.Object3D()
/*
    for (layer = 0; layer < cloudArray.length; layer++)
    for (line = 0; line < cloudArray[layer].length; line++)
    {
        for (pos = 0; pos < cloudArray[layer][line].length; pos++)
        {
            if (cloudArray[layer][line][pos] == 0)
                continue;

            var planeGeometry = new THREE.PlaneGeometry(1.0, 1.0);
            var planeMaterial = new THREE.MeshBasicMaterial( 
            { color: 0xdddddd, shading: THREE.FlatShading, map: textures[cloudArray[layer][line][pos] - 1], transparent: true });
            planeMaterial.depthWrite = false;

            var cell = new THREE.Mesh(planeGeometry, planeMaterial);
            cell.position.setX(line - cloudArray[layer].length * 0.5);
            cell.position.setY(pos - cloudArray[layer][line].length * 0.5);
            cell.position.setZ(layer);
            cell.scale.set(1.5, 1.5, 1.5);
            cell.grayness = Math.random();
                

            cloud.add(cell);
        }
    }*/

    scene.add(cloud);
}

var gui2;// = new dat.GUI();

function initGUI2()
{
    if (gui2 != null)
        gui2.destroy();
    gui2 = new dat.GUI({autoPlace: false});
    gui2.add(settings, "scale").min(20.0).max(200.0).step(5.0)
    gui2.add(settings, "add");
    gui2.add(settings, "to_lua");
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
        gui2.add(selectedCloud, "textureIndex").min(0).max(5).step(1);
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
    renderer.setClearColor(0x000000, 1);
    renderer.setSize(viewportContainer.clientWidth, viewportContainer.clientHeight );
    viewportContainer.appendChild( renderer.domElement );

    //document.addEventListener('mousemove', onDocumentMouseMove, false);
    //document.addEventListener('touchstart', onDocumentTouchStart, false);
    //document.addEventListener('touchmove', onDocumentTouchMove, false);
    document.addEventListener('click', onDocumentClick, false);

    window.addEventListener( 'resize', onWindowResize, false );
    projector = new THREE.Projector();
}

function onWindowResize() 
{
    //windowHalfX = viewportContainer.clientWidth / 2;
    //windowHalfY = viewportContainer.clientHeight / 2;

    camera.aspect =  viewportContainer.clientWidth / viewportContainer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewportContainer.clientWidth, viewportContainer.clientHeight );
}

function onDocumentClick(event) 
{
    //mouseX = event.clientX - viewportContainer.clientWidth;
    //mouseY = event.clientY - viewportContainer.clientHeight;
    performSelection(event.clientX - 250, event.clientY);
}

var testProjector = new THREE.Projector();
var pickMouseVector = new THREE.Vector3();

function onDocumentMouseMove(event) 
{
    //mouseX = event.clientX - viewportContainer.clientWidth;
    //mouseY = event.clientY - viewportContainer.clientHeight;
}

function onDocumentTouchStart(event) 
{
/*
    if (event.touches.length == 1) 
    {
        event.preventDefault();
        mouseX = event.touches[ 0 ].pageX - viewportContainer.clientWidth;
        mouseY = event.touches[ 0 ].pageY - viewportContainer.clientHeight;
    }
*/
}

function onDocumentTouchMove(event) 
{
/*
    if (event.touches.length == 1) 
    {
        event.preventDefault();
        mouseX = event.touches[ 0 ].pageX - viewportContainer.clientWidth;
        mouseY = event.touches[ 0 ].pageY - viewportContainer.clientHeight;
    }
*/
}

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
        selectedCloud = intersects[0].object;
        initGUI2();
    }
}

//

function animate() 
{
    requestAnimationFrame(animate);
    controls.update();
    render();
}

function render() 
{
    var time = Date.now() * 0.00005;
    cloud.scale.set(settings.scale, settings.scale, settings.scale);
    cloud.children.forEach(function(entry){ entry.rotation.setFromRotationMatrix( camera.matrix );});
    renderer.render( scene, camera );
}

