// Assets & Loaders --------------------------------------------------------

var loadingManager = new THREE.LoadingManager();
loadingManager.onLoad = function () {

	document.getElementById( 'loading' ).style.display = 'none'; // hide loading animation when finished
	console.log( 'Done.' );

	main();

};


loadingManager.onProgress = function ( item, loaded, total ) {

	console.log( loaded + '/' + total, item );

};


var shaderLoader = new THREE.FileLoader( loadingManager );
shaderLoader.setResponseType( 'text' );

shaderLoader.loadMultiple = function ( SHADER_CONTAINER, urlObj ) {

	_.each( urlObj, function ( value, key ) {

		shaderLoader.load( value, function ( shader ) {

			SHADER_CONTAINER[ key ] = shader;

		} );

	} );

};

var SHADER_CONTAINER = {};
shaderLoader.loadMultiple( SHADER_CONTAINER, {

	neuronVert: 'shaders/neuron.vert',
	neuronFrag: 'shaders/neuron.frag',

	axonVert: 'shaders/axon.vert',
	axonFrag: 'shaders/axon.frag'

} );




/*
var OBJ_MODELS = {};
var OBJloader = new THREE.OBJLoader( loadingManager );
OBJloader.load( 'models/expanded_retina.obj', function ( model ) {

    console.log(model)
	OBJ_MODELS.brain = model.children[ 0 ];

} );
*/
// Modification stuff
//var my_url = 'models/mouse_retina.json';



//console.log(mygraph);
//console.log(mygraph.nodes[1]['x']);
//console.log(mygraph.links[0]['target']);

//var myjson = require(['models/mouse_retina.json']);
/*
var myjson;
$.getJSON(my_url, function(json) {
    myjson = json;
});
*/

// -------end of modification ---------
var TEXTURES = {};
var textureLoader = new THREE.TextureLoader( loadingManager );
textureLoader.load( 'sprites/electric.png', function ( tex ) {

	TEXTURES.electric = tex;

} );

// Scene --------------------------------------------------------
/* exported updateHelpers */

if ( !Detector.webgl ) {
	Detector.addGetWebGLMessage();
}

var container, stats;
var scene, light, camera, cameraCtrl, renderer;
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var pixelRatio = window.devicePixelRatio || 1;
var screenRatio = WIDTH / HEIGHT;
var clock = new THREE.Clock();
var FRAME_COUNT = 0;

// ---- Settings
var sceneSettings = {

	pause: false,
	bgColor: 0x111113,
	enableGridHelper: false,
	enableAxisHelper: false

};
// ---- Scene
container = document.getElementById( 'canvas-container' );
scene = new THREE.Scene();

// ---- Camera
camera = new THREE.PerspectiveCamera( 90, screenRatio, 0, 9999 );
// camera orbit control
cameraCtrl = new THREE.OrbitControls( camera, container );
cameraCtrl.object.position.y = 150;
cameraCtrl.update();
//
// ---- Renderer
renderer = new THREE.WebGLRenderer( {
	antialias: true,
	alpha: true
} );
renderer.setSize( WIDTH, HEIGHT );
renderer.setPixelRatio( pixelRatio );
renderer.setClearColor( sceneSettings.bgColor, 1 );
renderer.autoClear = false;
container.appendChild( renderer.domElement );

// ---- VR related
var VR_flag = true;
if(VR_flag) {
	WEBVR.checkAvailability().catch( function( message ) {

		document.body.appendChild( WEBVR.getMessageContainer( message ) );

	} );


	renderer.vr.enabled = true; //VR
	renderer.vr.standing = true;

	WEBVR.getVRDisplay( function ( display ) {

		renderer.vr.setDevice( display );

		document.body.appendChild( WEBVR.getButton( display, renderer.domElement ) );

	} );
	// VR Controller

	var controller1, controller2;
	var raycaster, intersected = [];
	var tempMatrix = new THREE.Matrix4();
	controller1 = new THREE.ViveController( 0 );
	controller1.standingMatrix = renderer.vr.getStandingMatrix();
	controller1.addEventListener( 'triggerdown', onTriggerDown );
	controller1.addEventListener( 'triggerup', onTriggerUp );
	controller1.addEventListener( 'thumbpaddown', onThumbpadDown );
	controller1.addEventListener( 'thumbpadup', onThumbpadUp );
	controller1.addEventListener( 'axischanged', onAxisChanged );
	scene.add( controller1 );
	console.log("got controller 0")

	controller2 = new THREE.ViveController( 1 );
	controller2.standingMatrix = renderer.vr.getStandingMatrix();
	controller2.addEventListener( 'triggerdown', onTriggerDown );
	controller2.addEventListener( 'triggerup', onTriggerUp );
	controller2.addEventListener( 'thumbpaddown', onThumbpadDown );
	controller2.addEventListener( 'thumbpadup', onThumbpadUp );
	controller2.addEventListener( 'axischanged', onAxisChanged );
	scene.add( controller2 );
	console.log("got controller 1")
	var loader = new THREE.OBJLoader();
	loader.setPath( 'models/obj/vive-controller/' );
	loader.load( 'vr_controller_vive_1_5.obj', function ( object ) {

		var loader = new THREE.TextureLoader();
		loader.setPath( 'models/obj/vive-controller/' );

		var controller = object.children[ 0 ];
		controller.material.map = loader.load( 'onepointfive_texture.png' );
		controller.material.specularMap = loader.load( 'onepointfive_spec.png' );

		controller1.add( object.clone() );
		controller2.add( object.clone() );

	} );

	var line_geometry_1 = new THREE.Geometry({color : new THREE.Color(0x00ffff)});
	var line_geometry_2 = new THREE.Geometry({color : new THREE.Color(0xffff00)});
	line_geometry_1.vertices.push( new THREE.Vector3( 0, 0, 0 ) );
	line_geometry_1.vertices.push( new THREE.Vector3( 0, 0, - 1 ) );
	line_geometry_2.vertices.push( new THREE.Vector3( 0, 0, 0 ) );
	line_geometry_2.vertices.push( new THREE.Vector3( 0, 0, - 1 ) );
	line_material_1 = new THREE.LineBasicMaterial( { color: new THREE.Color(0x00ffff) } );
	line_material_2 = new THREE.LineBasicMaterial( { color: new THREE.Color(0xffff00) } );
	var line_1 = new THREE.Line( line_geometry_1, line_material_1);
	var line_2 = new THREE.Line( line_geometry_2, line_material_2);
	line_1.name = 'line_1';
	line_1.scale.z = 15;
	line_2.name = 'line_2';
	line_2.scale.z = 15;
	controller1.add( line_1.clone() );
	controller2.add( line_2.clone() );
	console.log(line_1, line_2);
	raycaster = new THREE.Raycaster();

	function onTriggerDown( event ) {
		var controller = event.target;
		var intersections = getIntersections( controller );
		if (intersections.length > 0) {
			var intersection = intersections[0];
			console.log(intersection, "selected")
		}
		console.log(controller, "TriggerDown")
	};
	function onTriggerUp( event ) {
		var controller = event.target;
		console.log(controller, "TriggerUp")
	};
	function onThumbpadDown( event ) {
		var controller = event.target;
		tempMatrix.identity().extractRotation( controller.matrixWorld );
		raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
		raycaster.ray.direction.set( 0, 0, -1 ).applyMatrix4( tempMatrix );

		console.log(controller, "ThumbpadDown", raycaster.ray.direction);
		//camera.position.x = camera.position.x + 10*raycaster.ray.direction.x;
		//camera.position.y = camera.position.y + 10*raycaster.ray.direction.y;
		//camera.position.z = camera.position.z + 10*raycaster.ray.direction.z;
		camera.translateZ(-10)
		console.log(camera.position)
		camera.position.needsUpdate = true
		camera.lookAt(camera.position)
	};
	function onThumbpadUp( event ) {
		var controller = event.target;
		console.log(controller, "ThumbpadUp")
	};
	function onAxisChanged( event ) {
		var controller = event.target;
		//console.log(controller, "AxisChanged", event)
	};

	function getIntersections( controller ) {
		tempMatrix.identity().extractRotation( controller.matrixWorld );
		raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
		raycaster.ray.direction.set( 0, 0, -1 ).applyMatrix4( tempMatrix );
		return raycaster.intersectObjects( group.children );
	}
	function intersectObjects( controller ) {
		// Do not highlight when already selected
		if ( controller.userData.selected !== undefined ) return;
		var line = controller.getObjectByName( 'line' );
		var intersections = getIntersections( controller );
		if ( intersections.length > 0 ) {
			var intersection = intersections[ 0 ];
			var object = intersection.object;
			object.material.emissive.r = 1;
			intersected.push( object );
			line.scale.z = intersection.distance;
		} else {
			line.scale.z = 5;
		}
	}
	function cleanIntersected() {
		while ( intersected.length ) {
			var object = intersected.pop();
			object.material.emissive.r = 0;
		}
	}
}




// ---- Stats
stats = new Stats();
container.appendChild( stats.domElement );

// ---- grid & axis helper
var gridHelper = new THREE.GridHelper( 600, 50, 0x00bbff, 0xffffff );
//gridHelper.setColors( 0x00bbff, 0xffffff );
gridHelper.material.opacity = 0.1;
gridHelper.material.transparent = true;
gridHelper.position.y = -300;
scene.add( gridHelper );

var axisHelper = new THREE.AxisHelper( 50 );
scene.add( axisHelper );

function updateHelpers() {
	axisHelper.visible = sceneSettings.enableAxisHelper;
	gridHelper.visible = sceneSettings.enableGridHelper;
}

/*
// ---- Lights
// back light
light = new THREE.DirectionalLight( 0xffffff, 0.8 );
light.position.set( 100, 230, -100 );
scene.add( light );

// hemi
light = new THREE.HemisphereLight( 0x00ffff, 0x29295e, 1 );
light.position.set( 370, 200, 20 );
scene.add( light );

// ambient
light = new THREE.AmbientLight( 0x111111 );
scene.add( light );
*/

// Main --------------------------------------------------------
/* exported main, updateGuiInfo */

var gui, gui_info, gui_settings;

function main() {
	var neuralNet = window.neuralNet = new NeuralNetwork();
	scene.add( neuralNet.meshComponents );

	initGui();

	run();

}

// GUI --------------------------------------------------------
/* exported iniGui, updateGuiInfo */

function initGui() {

	gui = new dat.GUI();
	gui.width = 270;

	gui_info = gui.addFolder( 'Info' );
	gui_info.add( neuralNet, 'numActiveExcitatoryNeurons' ).name( 'E_Neurons' );
	gui_info.add( neuralNet, 'numActiveInhibitoryNeurons' ).name( 'I_Neurons' );
	gui_info.add( neuralNet, 'numActiveExcitatoryAxons' ).name( 'E_Axons' );
	gui_info.add( neuralNet, 'numActiveInhibitoryAxons' ).name( 'I_Axons' );
	//gui_info.add( neuralNet, 'numSignals', 0, neuralNet.settings.limitSignals ).name( 'Signals' );
	gui_info.autoListen = false;

	gui_settings = gui.addFolder( 'Settings' );
	//gui_settings.add( neuralNet.settings, 'currentMaxSignals', 0, neuralNet.settings.limitSignals ).name( 'Max Signals' );
	//gui_settings.add( neuralNet.particlePool, 'pSize', 0.2, 2 ).name( 'Signal Size' );
	//gui_settings.add( neuralNet.settings, 'signalMinSpeed', 0.0, 8.0, 0.01 ).name( 'Signal Min Speed' );
	//gui_settings.add( neuralNet.settings, 'signalMaxSpeed', 0.0, 8.0, 0.01 ).name( 'Signal Max Speed' );
	gui_settings.add( neuralNet, 'neuronSizeMultiplier', 0, 6 ).name( 'Neuron Size Mult' );
	gui_settings.add( neuralNet, 'neuronOpacity', 0, 1.0 ).name( 'Neuron Opacity' );
	gui_settings.add( neuralNet, 'axonOpacityMultiplier', 0.0, 15.0 ).name( 'Axon Opacity Mult' );
	//gui_settings.addColor( neuralNet.particlePool, 'pColor' ).name( 'Signal Color' );
	gui_settings.addColor( neuralNet, 'neuronColor' ).name( 'Neuron Color' );
    // new stuff
	gui_settings.addColor( neuralNet, 'inhibitoryNeuronColor' ).name( 'Inhibitory Neuron Color' );
	gui_settings.addColor( neuralNet, 'axonColor' ).name( 'Axon Color' );
	gui_settings.addColor( neuralNet, 'inhibitoryAxonColor' ).name( 'Inhibitory Axon Color' );
	gui_settings.addColor( sceneSettings, 'bgColor' ).name( 'Background' );

    gui_controls = gui.addFolder( 'Controls' );
    gui_controls.add( neuralNet, 'spawn_E' ).name('Spawn Excitatory');
    gui_controls.add( neuralNet, 'spawn_I' ).name('Spawn Inhibitory');
    gui_controls.add( neuralNet, 'spawn_random' ).name('Spawn Random');
    gui_controls.add( neuralNet, 'spawn_replica' ).name('Spawn Replica');
    gui_controls.add( neuralNet, 'injectCurrent' ).name('Inject Current');
    gui_controls.add( neuralNet, 'postData' ).name('Post Data');
    gui_controls.add( neuralNet, 'openMonitor' ).name('Open Data Monitor');
    gui_controls.add( neuralNet, 'download' ).name('Download');
    gui_controls.add( neuralNet, 'clear_cache' ).name('Clear Cache');


	//gui_info.open();
	//gui_settings.open();
    //gui_controls.open();

    

	for ( var i = 0; i < gui_settings.__controllers.length; i++ ) {
		gui_settings.__controllers[ i ].onChange( updateNeuralNetworkSettings );
	}

}

function updateNeuralNetworkSettings() {
	neuralNet.updateSettings();
	//if ( neuralNet.settings.signalMinSpeed > neuralNet.settings.signalMaxSpeed ) {
	//	neuralNet.settings.signalMaxSpeed = neuralNet.settings.signalMinSpeed;
	//	gui_settings.__controllers[ 3 ].updateDisplay();
	//}
}

function updateGuiInfo() {
	for ( var i = 0; i < gui_info.__controllers.length; i++ ) {
		gui_info.__controllers[ i ].updateDisplay();
	}
}

// Run --------------------------------------------------------

function update() {

	updateHelpers();

	if ( !sceneSettings.pause ) {

		var deltaTime = clock.getDelta();
		neuralNet.update( deltaTime );
		updateGuiInfo();

	}

}

// ----  draw loop
function run() {

	requestAnimationFrame( run );
	renderer.setClearColor( sceneSettings.bgColor, 1 );
	renderer.clear();
	update();
	if(VR_flag){
		controller1.update();
		controller2.update();
	}
	renderer.render( scene, camera );
	stats.update();
	FRAME_COUNT ++;

}

// Events --------------------------------------------------------

window.addEventListener( 'keypress', function ( event ) {

	var key = event.keyCode;

	switch ( key ) {

		case 32:/*space bar*/ sceneSettings.pause = !sceneSettings.pause;
			break;

		case 65:/*A*/
		case 97:/*a*/ sceneSettings.enableGridHelper = !sceneSettings.enableGridHelper;
			break;

		case 83 :/*S*/
		case 115:/*s*/ sceneSettings.enableAxisHelper = !sceneSettings.enableAxisHelper;
			break;

	}

} );


$( function () {
	var timerID;
	$( window ).resize( function () {
		clearTimeout( timerID );
		timerID = setTimeout( function () {
			onWindowResize();
		}, 250 );
	} );
} );


function onWindowResize() {

	WIDTH = window.innerWidth;
	HEIGHT = window.innerHeight;

	pixelRatio = window.devicePixelRatio || 1;
	screenRatio = WIDTH / HEIGHT;

	camera.aspect = screenRatio;
	camera.updateProjectionMatrix();

	renderer.setSize( WIDTH, HEIGHT );
	renderer.setPixelRatio( pixelRatio );

}


// VR related ----------------------------