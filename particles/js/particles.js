
if (!Detector.webgl) 
    Detector.addGetWebGLMessage();

var SceneSettings = function()
{
    this.scale = 10.0;
    this.positionx = 0.0;
}

var settings, gui;

function initGUI()
{
    settings = new SceneSettings();
    //gui = new dat.GUI();
    //gui.add(settings, "scale").min(1.0).max(100.0).step(1.0)
    //gui.add(settings, "positionx").min(-10.0).max(10.0).step(1.0)
}


var container;
var camera, scene, renderer, particles, geometry, material, i, h, color, sprite, size;
var mouseX = 0, mouseY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

// Some experiments.
function buildGeometry()
{
    var billboardGeometry = new THREE.Geometry();

    // Setting up vertices.
    billboardGeometry.vertices.push(new THREE.Vector3(-1.0, -1.0, 0.0));
    billboardGeometry.vertices.push(new THREE.Vector3(-1.0, 1.0, 0.0));
    billboardGeometry.vertices.push(new THREE.Vector3(1.0, 1.0, 0.0));
    billboardGeometry.vertices.push(new THREE.Vector3(1.0, -1.0, 0.0));

    // Setting up face(s).
    billboardGeometry.faces.push(new THREE.Face3(0, 1, 2));
    billboardGeometry.faces.push(new THREE.Face3(1, 2, 3));
}

var billboard;
var cloud;

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

function buildScene()
{
    camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 2, 2000 );
    camera.position.z = 500;

    controls = new THREE.OrbitControls( camera );
    controls.addEventListener( 'change', render );

    scene = new THREE.Scene();
    //scene.fog = new THREE.FogExp2( 0x000000, 0.001 );

    var textures = 
    [
        THREE.ImageUtils.loadTexture("textures/001_ml.png"),
        THREE.ImageUtils.loadTexture("textures/02_bPh.png"),
        THREE.ImageUtils.loadTexture("textures/03_bPh.png"),
        THREE.ImageUtils.loadTexture("textures/04_bPh.png"),
        THREE.ImageUtils.loadTexture("textures/05_bPh.png")
    ];

    cloud = new THREE.Object3D()
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
    }

    scene.add(cloud);
}

var gui2;// = new dat.GUI();

function initGUI2()
{
    if (gui2 != null)
        gui2.destroy();
    gui2 = new dat.GUI();
    gui2.add(settings, "scale").min(1.0).max(100.0).step(1.0)
    if (selectedCloud != null)
    {
        // Scale.
        var scaleFolder = gui2.addFolder("Particle Scale");
        scaleFolder.add(selectedCloud.scale, "x").min(0.1).max(7.0).step(0.1)
        scaleFolder.add(selectedCloud.scale, "y").min(0.1).max(7.0).step(0.1)
        scaleFolder.add(selectedCloud.scale, "z").min(0.1).max(7.0).step(0.1)

        // Position.
        var positionFolder = gui2.addFolder("Particle Offset");
        positionFolder.add(selectedCloud.position, "x").min(-3.0).max(3.0).step(0.1)
        positionFolder.add(selectedCloud.position, "y").min(-3.0).max(3.0).step(0.1)
        positionFolder.add(selectedCloud.position, "z").min(-3.0).max(3.0).step(0.1)
    }
}

init();
initGUI();
initGUI2();
animate();

var projector;

function init() 
{
    container = document.createElement( 'div' );
    document.body.appendChild( container );

    buildScene();

    projector = new THREE.Projector();

    renderer = new THREE.WebGLRenderer( { clearAlpha: 1 } );
    renderer.setClearColor(0x000000, 1);
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('touchstart', onDocumentTouchStart, false);
    document.addEventListener('touchmove', onDocumentTouchMove, false);
    document.addEventListener('click', onDocumentClick, false);

    window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize() 
{
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function onDocumentClick(event) 
{
    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;
    performSelection(event.clientX, event.clientY);
}

var testProjector = new THREE.Projector();
var pickMouseVector = new THREE.Vector3();

function onDocumentMouseMove(event) 
{
    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;
}

function onDocumentTouchStart(event) 
{
    if (event.touches.length == 1) 
    {
        event.preventDefault();
        mouseX = event.touches[ 0 ].pageX - windowHalfX;
        mouseY = event.touches[ 0 ].pageY - windowHalfY;
    }
}

function onDocumentTouchMove(event) 
{
    if (event.touches.length == 1) 
    {
        event.preventDefault();
        mouseX = event.touches[ 0 ].pageX - windowHalfX;
        mouseY = event.touches[ 0 ].pageY - windowHalfY;
    }
}

//Selection support.

var selectedCloud;

function performSelection(x, y)
{
    pickMouseVector.x = 2 * (x / window.innerWidth) - 1;
    pickMouseVector.y = 1 - 2 * (y / window.innerHeight );
    
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
    //render();
}

function render() 
{
    var time = Date.now() * 0.00005;
    cloud.scale.set(settings.scale, settings.scale, settings.scale);
    cloud.children.forEach(function(entry){ entry.rotation.setFromRotationMatrix( camera.matrix );});
    renderer.render( scene, camera );
}

