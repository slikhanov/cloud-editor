
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
    gui = new dat.GUI();
    gui.add(settings, "scale").min(1.0).max(100.0).step(1.0)
    gui.add(settings, "positionx").min(-10.0).max(10.0).step(1.0)
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
        [0, 1, 0, 1],
        [1, 0, 0, 0],
        [1, 0, 0, 0],
        [1, 0, 0, 0],
        [1, 0, 0, 0]
];

var controls;

function buildScene()
{
    camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 2, 2000 );
    camera.position.z = 500;

    controls = new THREE.OrbitControls( camera );
    controls.addEventListener( 'change', render );

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2( 0x000000, 0.001 );

    cloud = new THREE.Object3D()
    for (line = 0; line < cloudArray.length; line++)
    {
        for (pos = 0; pos < cloudArray.length; pos++)
        {
            if (cloudArray[line][pos] == 0)
                continue;

            var planeGeometry = new THREE.PlaneGeometry(1.0, 1.0);
            var planeMaterial = new THREE.MeshPhongMaterial( 
            { ambient: 0x030303, color: 0xdddddd, specular: 0x009900, shininess: 30, shading: THREE.FlatShading });

            var cell = new THREE.Mesh(planeGeometry, planeMaterial);
            cell.position.setX(line);
            cell.position.setY(pos);
            cloud.add(cell);
        }
    }

    scene.add(cloud);
}

initGUI();
init();
animate();

function init() 
{
    container = document.createElement( 'div' );
    document.body.appendChild( container );

    buildScene();

    renderer = new THREE.WebGLRenderer( { clearAlpha: 1 } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('touchstart', onDocumentTouchStart, false);
    document.addEventListener('touchmove', onDocumentTouchMove, false);

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
    renderer.render( scene, camera );
}

