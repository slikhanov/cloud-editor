
if (!Detector.webgl) 
    Detector.addGetWebGLMessage();

var SceneSettings = function()
{
    this.rotationSpeed = 0.002;
}

var settings, gui;

function initGUI()
{
    settings = new SceneSettings();
    gui = new dat.GUI();
    gui.add(settings, "rotationSpeed");
}


var container;
var camera, scene, renderer, particles, geometry, material, i, h, color, sprite, size;
var mouseX = 0, mouseY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

initGUI();
init();
animate();

function init() 
{
    container = document.createElement( 'div' );
    document.body.appendChild( container );

    camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 2, 2000 );
    camera.position.z = 1000;

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2( 0x000000, 0.001 );

    geometry = new THREE.Geometry();

    sprite = THREE.ImageUtils.loadTexture( "textures/disc.png" );

    for ( i = -4; i < 4; i ++ ) 
        for (j = -4; j < 4; j ++)
            for (k = -4; k < 4; k ++)
    {
        var vertex = new THREE.Vector3();
        vertex.x = i * 50;
        vertex.y = j * 50;
        vertex.z = k * 50;
        geometry.vertices.push( vertex );
    }

    material = new THREE.ParticleBasicMaterial( { size: 35, sizeAttenuation: false, map: sprite, transparent: true } );
    material.color.setHSL( 1.0, 0.3, 0.7 );

    particles = new THREE.ParticleSystem( geometry, material );
    particles.sortParticles = true;
    scene.add( particles );

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
    requestAnimationFrame( animate );
    render();
}

function render() 
{
    var time = Date.now() * 0.00005;
    particles.rotation.y += settings.rotationSpeed;
    h = ( 360 * ( 1.0 + time ) % 360 ) / 360;
    renderer.render( scene, camera );
}

