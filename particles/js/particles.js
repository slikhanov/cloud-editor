
if (!Detector.webgl) 
    Detector.addGetWebGLMessage();

var SceneSettings = function()
{
    this.scale = 50.0;
    this.positionx = 0.0;
    this.add = function() 
    {
        var planeGeometry = new THREE.PlaneGeometry(1.0, 1.0);
        var planeMaterial = new THREE.MeshBasicMaterial( 
                { color: 0xdddddd, shading: THREE.FlatShading, map: textures[0], transparent: true });
        planeMaterial.depthWrite = false;

        var cell = new THREE.Mesh(planeGeometry, planeMaterial);
        cell.position.setX(0.0);
        cell.position.setY(0.0);
        cell.position.setZ(0.0);
        cell.scale.set(0.2, 0.2, 0.2);
        cell.grayness = Math.random();

        cloud.add(cell);
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

function buildScene()
{
    camera = new THREE.PerspectiveCamera( 55, viewportContainer.clientWidth / viewportContainer.clientHeight, 2, 2000 );
    camera.position.z = 500;

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
    gui2.add(settings, "scale").min(1.0).max(100.0).step(1.0)
    gui2.add(settings, "add");
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
    performSelection(event.clientX, event.clientY);
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

