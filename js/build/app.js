// Neuron ----------------------------------------------------------------

function Neuron( x, y, z ) {

	this.connection = [];
	this.receivedSignal = false;
	this.lastSignalRelease = 0;
	this.releaseDelay = 0;
	this.fired = false;
	this.firedCount = 0;
	this.prevReleaseAxon = null;
    this.excitatory = true;
    this.firingRate = 10.0;
	THREE.Vector3.call( this, x, y, z );

}

Neuron.prototype = Object.create( THREE.Vector3.prototype );

Neuron.prototype.toggleEI = function (EorI) {
    this.excitatory = EorI;
}
Neuron.prototype.connectNeuronTo = function ( neuronB ) {

	var neuronA = this;
	// create axon and establish connection
	var axon = new Axon( neuronA, neuronB );
	neuronA.connection.push( new Connection( axon, 'A', this.excitatory ) );
	neuronB.connection.push( new Connection( axon, 'B', this.excitatory ) );
	return axon;

};

Neuron.prototype.createSignal = function ( particlePool, minSpeed, maxSpeed ) {

	this.firedCount += 1;
	this.receivedSignal = false;

	var signals = [];
	// create signal to all connected axons
	for ( var i = 0; i < this.connection.length; i++ ) {
		if ( this.connection[ i ].axon !== this.prevReleaseAxon ) {
			var c = new Signal( particlePool, minSpeed, maxSpeed );
			c.setConnection( this.connection[ i ] );
			signals.push( c );
		}
	}
	return signals;

};

Neuron.prototype.reset = function () {

	this.receivedSignal = false;
	this.lastSignalRelease = 0;
	this.releaseDelay = 0;
	this.fired = false;
	this.firedCount = 0;

};

// Signal extends THREE.Vector3 ----------------------------------------------------------------

function Signal( particlePool, minSpeed, maxSpeed ) {

	this.minSpeed = minSpeed;
	this.maxSpeed = maxSpeed;
	this.speed = THREE.Math.randFloat( this.minSpeed, this.maxSpeed );
	this.alive = true;
	this.t = null;
	this.startingPoint = null;
	this.axon = null;
	this.particle = particlePool.getParticle();
	THREE.Vector3.call( this );

}

Signal.prototype = Object.create( THREE.Vector3.prototype );

Signal.prototype.setConnection = function ( Connection ) {

	this.startingPoint = Connection.startingPoint;
	this.axon = Connection.axon;
	if ( this.startingPoint === 'A' ) this.t = 0;
	else if ( this.startingPoint === 'B' ) this.t = 1;

};

Signal.prototype.travel = function ( deltaTime ) {

	var pos;
	if ( this.startingPoint === 'A' ) {
		this.t += this.speed * deltaTime;
		if ( this.t >= 1 ) {
			this.t = 1;
			this.alive = false;
			this.axon.neuronB.receivedSignal = true;
			this.axon.neuronB.prevReleaseAxon = this.axon;
		}

	} else if ( this.startingPoint === 'B' ) {
		this.t -= this.speed * deltaTime;
		if ( this.t <= 0 ) {
			this.t = 0;
			this.alive = false;
			this.axon.neuronA.receivedSignal = true;
			this.axon.neuronA.prevReleaseAxon = this.axon;
		}
	}

	pos = this.axon.getPoint( this.t );
	// pos = this.axon.getPointAt(this.t);	// uniform point distribution but slower calculation

	this.particle.set( pos.x, pos.y, pos.z );

};

// Particle Pool ---------------------------------------------------------

function ParticlePool( poolSize ) {

	this.spriteTextureSignal = TEXTURES.electric;

	this.poolSize = poolSize;
	this.pGeom = new THREE.Geometry();
	this.particles = this.pGeom.vertices;

	this.offScreenPos = new THREE.Vector3( 9999, 9999, 9999 );

	this.pColor = '#ffffff';
	this.pSize = 0.6;

	for ( var ii = 0; ii < this.poolSize; ii++ ) {
		this.particles[ ii ] = new Particle( this );
	}

	this.meshComponents = new THREE.Object3D();

	// inner particle
	this.pMat = new THREE.PointCloudMaterial( {
		map: this.spriteTextureSignal,
		size: this.pSize,
		color: this.pColor,
		blending: THREE.AdditiveBlending,
		depthTest: false,
		transparent: true
	} );

	this.pMesh = new THREE.PointCloud( this.pGeom, this.pMat );
	this.pMesh.frustumCulled = false;

	this.meshComponents.add( this.pMesh );


	// outer particle glow
	this.pMat_outer = this.pMat.clone();
	this.pMat_outer.size = this.pSize * 10;
	this.pMat_outer.opacity = 0.04;

	this.pMesh_outer = new THREE.PointCloud( this.pGeom, this.pMat_outer );
	this.pMesh_outer.frustumCulled = false;

	this.meshComponents.add( this.pMesh_outer );

}

ParticlePool.prototype.getAvgExecutionTime = function () {
	return this.profTime / this.itt;
};

ParticlePool.prototype.getParticle = function () {

	for ( var ii = 0; ii < this.poolSize; ii++ ) {
		var p = this.particles[ ii ];
		if ( p.available ) {
			this.lastAvailableIdx = ii;
			p.available = false;
			return p;
		}
	}

	console.error( "ParticlePool.prototype.getParticle return null" );
	return null;

};

ParticlePool.prototype.update = function () {

	this.pGeom.verticesNeedUpdate = true;

};

ParticlePool.prototype.updateSettings = function () {

	// inner particle
	this.pMat.color.setStyle( this.pColor );
	this.pMat.size = this.pSize;
	// outer particle
	this.pMat_outer.color.setStyle( this.pColor );
	this.pMat_outer.size = this.pSize * 10;

};

// Particle --------------------------------------------------------------
// Private class for particle pool

function Particle( particlePool ) {

	this.particlePool = particlePool;
	this.available = true;
	THREE.Vector3.call( this, this.particlePool.offScreenPos.x, this.particlePool.offScreenPos.y, this.particlePool.offScreenPos.z );

}

Particle.prototype = Object.create( THREE.Vector3.prototype );

Particle.prototype.free = function () {

	this.available = true;
	this.set( this.particlePool.offScreenPos.x, this.particlePool.offScreenPos.y, this.particlePool.offScreenPos.z );

};

// Axon extends THREE.CubicBezierCurve3 ------------------------------------------------------------------
/* exported Axon, Connection */

function Axon( neuronA, neuronB ) {

    this.id = 0;
	this.bezierSubdivision = 8;
	this.neuronA = neuronA;
	this.neuronB = neuronB;
	this.cpLength = neuronA.distanceTo( neuronB ) / THREE.Math.randFloat( 1.5, 4.0 );
	this.controlPointA = this.getControlPoint( neuronA, neuronB );
	this.controlPointB = this.getControlPoint( neuronB, neuronA );
	THREE.CubicBezierCurve3.call( this, this.neuronA, this.controlPointA, this.controlPointB, this.neuronB );

	this.vertices = this.getSubdividedVertices();
    this.weight = THREE.Math.randFloat(0.006, 0.03);

}

Axon.prototype = Object.create( THREE.CubicBezierCurve3.prototype );

Axon.prototype.getSubdividedVertices = function () {
	return this.getSpacedPoints( this.bezierSubdivision );
};

// generate uniformly distribute vector within x-theta cone from arbitrary vector v1, v2
Axon.prototype.getControlPoint = function ( v1, v2 ) {

	var dirVec = new THREE.Vector3().copy( v2 ).sub( v1 ).normalize();
	var northPole = new THREE.Vector3( 0, 0, 1 ); // this is original axis where point get sampled
	var axis = new THREE.Vector3().crossVectors( northPole, dirVec ).normalize(); // get axis of rotation from original axis to dirVec
	var axisTheta = dirVec.angleTo( northPole ); // get angle
	var rotMat = new THREE.Matrix4().makeRotationAxis( axis, axisTheta ); // build rotation matrix

	var minz = Math.cos( THREE.Math.degToRad( 45 ) ); // cone spread in degrees
	var z = THREE.Math.randFloat( minz, 1 );
	var theta = THREE.Math.randFloat( 0, Math.PI * 2 );
	var r = Math.sqrt( 1 - z * z );
	var cpPos = new THREE.Vector3( r * Math.cos( theta ), r * Math.sin( theta ), z );
	cpPos.multiplyScalar( this.cpLength ); // length of cpPoint
	cpPos.applyMatrix4( rotMat ); // rotate to dirVec
	cpPos.add( v1 ); // translate to v1
	return cpPos;

};

Axon.prototype.refactor = function( neuronA, neuronB ){
	this.neuronA = neuronA;
	this.neuronB = neuronB;
	this.cpLength = neuronA.distanceTo( neuronB ) / THREE.Math.randFloat( 1.5, 4.0 );
	this.controlPointA = this.getControlPoint( neuronA, neuronB );
	this.controlPointB = this.getControlPoint( neuronB, neuronA );
	THREE.CubicBezierCurve3.call( this, this.neuronA, this.controlPointA, this.controlPointB, this.neuronB );

	this.vertices = this.getSubdividedVertices();
    return this.vertices;

}

// Connection ------------------------------------------------------------
function Connection( axon, startingPoint, EI ) {
	this.axon = axon;
	this.startingPoint = startingPoint;
    this.EI = EI;
    //this.weight = THREE.Math.randFloat(0.01, 0.05);
}

// Neural Network --------------------------------------------------------

function NeuralNetwork() {

	this.initialized = false;

	this.settings = {

		verticesSkipStep: 3,
		maxAxonDist: 25,
		maxConnectionsPerNeuron: 400,
		signalMinSpeed: 1.75,
		signalMaxSpeed: 3.25,
		currentMaxSignals: 3000,
        maxNeurons: 35000,
        maxAxons: 150000,
		limitSignals: 10000,
        layoutScaling: 150,
        layoutStyle: 'random',
        IRatio: 0.618,
        spawned: 0

        /*
		verticesSkipStep: 3,
		maxAxonDist: 25,
		maxConnectionsPerNeuron: 200,
		signalMinSpeed: 1.75,
		signalMaxSpeed: 3.25,
		currentMaxSignals: 3000,
        maxNeurons: 10000,
        maxAxons: 120000,
		limitSignals: 10000,
        layoutScaling: 100,
        layoutStyle: 'random',
        IRatio: 0.618,
        spawned: 0
        */
		/*default
		verticesSkipStep       : 2,
		maxAxonDist            : 10,
		maxConnectionsPerNeuron: 6,
		signalMinSpeed         : 1.75,
		signalMaxSpeed         : 3.25,
		currentMaxSignals      : 3000,
		limitSignals           : 10000
		*/

	};

	this.meshComponents = new THREE.Object3D();
	this.particlePool = new ParticlePool( this.settings.limitSignals );
	this.meshComponents.add( this.particlePool.meshComponents );

	// NN component containers
	this.components = {
		neurons: [],
		allSignals: [],
		allAxons: [],
        allInhibitoryAxons: []

	};
    this.placeHolderA = null;
    this.placeHolderB = null;

    //color scheme
    //default blue orange
	this.neuronColor = '#ff8700';
	this.inhibitoryNeuronColor = '#00ffc3';
	this.axonColor = '#140a00';
	this.inhibitoryAxonColor = '#000f0b';

    
    



	// axon
    
	this.axonOpacityMultiplier = 2.5;
	this.axonGeom = new THREE.BufferGeometry();
	this.axonPositions = [];
	this.axonIndices = [];
	this.axonNextPositionsIndex = 0;

	this.axonUniforms = {
		color: {
			type: 'c',
			value: new THREE.Color( this.axonColor )
		},
		opacityMultiplier: {
			type: 'f',
			value: this.axonOpacityMultiplier
		}
	};

	this.axonAttributes = {
		opacity: {
			type: 'f',
			value: []
		}
	};
	// inhibitory axon
	this.inhibitoryAxonOpacityMultiplier = 2.5;
	this.inhibitoryAxonGeom = new THREE.BufferGeometry();
	this.inhibitoryAxonPositions = [];
	this.inhibitoryAxonIndices = [];
	this.inhibitoryAxonNextPositionsIndex = 0;

	this.inhibitoryAxonUniforms = {
		color: {
			type: 'c',
			value: new THREE.Color( this.inhibitoryAxonColor )
		},
		opacityMultiplier: {
			type: 'f',
			value: this.inhibitoryAxonOpacityMultiplier
		}
	};

	this.inhibitoryAxonAttributes = {
		opacity: {
			type: 'f',
			value: []
		}
	};

	// neuron
	this.neuronSizeMultiplier = 1.0;
	this.spriteTextureNeuron = TEXTURES.electric;
	this.neuronOpacity = 0.75;
	this.neuronsGeom = new THREE.Geometry();

	this.neuronUniforms = {
		sizeMultiplier: {
			type: 'f',
			value: this.neuronSizeMultiplier
		},
		opacity: {
			type: 'f',
			value: this.neuronOpacity
		},
		texture: {
			type: 't',
			value: this.spriteTextureNeuron
		}
	};

	this.neuronAttributes = {
		color: {
			type: 'c',
			value: []
		},
		size: {
			type: 'f',
			value: []
		}
	};

	this.neuronShaderMaterial = new THREE.ShaderMaterial( {

		uniforms: this.neuronUniforms,
		attributes: this.neuronAttributes,
		vertexShader: null,
		fragmentShader: null,
		blending: THREE.AdditiveBlending,
		transparent: true,
		depthTest: false

	} );

	// info api
	this.numNeurons = 0;
	this.numINeurons = 0;
	this.numEAxons = 0;
	this.numIAxons = 0;
	this.numSignals = 0;
    this.numActiveNeurons = 0;

    this.numActiveExcitatoryNeurons = 0;
    this.numActiveInhibitoryNeurons = 0;
    this.numActiveExcitatoryAxons = 0;
    this.numActiveInhibitoryAxons = 0;

	this.numPassive = 0;

    // Other controls
    /*
    this.spawn = function() {
        console.log('shunjianbaozha');

    }
    */
	// initialize NN

    this.dataMonitor = null;
    //this.currentFiringRate = [];
    this.dataRecord = []
	this.initNeuralNetwork();

}

NeuralNetwork.prototype.initNeuralNetwork = function () {

    //var my_url = 'models/c.elegans_neural.male_1.json';
    //this.initFromGraph(my_url, 'random');
	this.initVoid(this.settings.layoutStyle, colorscheme='tessarect');

    //for(var i=0;i<10;i++)
    //    this.spawn_random();

	//this.initNeurons( OBJ_MODELS.brain.geometry.vertices );
	//this.initAxons();
    //console.log(OBJ_MODELS);

	this.neuronShaderMaterial.vertexShader = SHADER_CONTAINER.neuronVert;
	this.neuronShaderMaterial.fragmentShader = SHADER_CONTAINER.neuronFrag;

	this.axonShaderMaterial.vertexShader = SHADER_CONTAINER.axonVert;
	this.axonShaderMaterial.fragmentShader = SHADER_CONTAINER.axonFrag;

	this.inhibitoryAxonShaderMaterial.vertexShader = SHADER_CONTAINER.axonVert;
	this.inhibitoryAxonShaderMaterial.fragmentShader = SHADER_CONTAINER.axonFrag;
	this.initialized = true;

};

//modifications
/*
var seed = 1;
function Random() {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}
*/
NeuralNetwork.prototype.spawn_E = function() {
    console.log('spawned');
    this.settings.spawned += 1;
    var E_num = 225;
    //this.addNeurons(E_num, true);
	//this.addNeurons(E_num, true);
	var EI = new Array(E_num);
	EI.fill(true)
    this.addNeuronsInArray(E_num, EI);
}
NeuralNetwork.prototype.spawn_I = function() {
    console.log('spawned');
    this.settings.spawned += 1;
    var I_num = 225;
    //this.addNeurons(E_num, true);
    //this.addNeurons(I_num, false);
	var EI = new Array(I_num);
	EI.fill(false)
    this.addNeuronsInArray(I_num, EI);
}

NeuralNetwork.prototype.spawn_random = function(){
    console.log('spawned');
    this.settings.spawned += 1;
    var totalNum = 225;
    var EI = [];
    for (var i=0;i<totalNum;i++){
        EI[i] = THREE.Math.randFloat(0,1) >= this.settings.IRatio;
    }
    //console.log(EI);
    //invalidate recording thus far if a 
    //new layer of neuron is attached
    this.dataRecord = [];
    this.addNeuronsInArray(totalNum, EI);
    //console.log(this.axonGeom);
    //console.log(this.components.allAxons);
    //console.log(this.components.allInhibitoryAxons);


}

NeuralNetwork.prototype.spawn_input = function(){
    console.log('input layer added');
}
    

NeuralNetwork.prototype.spawn_replica = function(){
    console.log('spawned');
    this.settings.spawned += 1;
    var totalNum = 81;
}
    
//NeuralNetwork.prototype.drawConnectivity = function(){
    //var = [];
NeuralNetwork.prototype.download= function(){
    //var data = {a:1, b:2, c:3};
    
    var a = document.createElement('a');
    document.body.appendChild(a);
    a.style = "display:none";

    console.log(this.dataRecord.length);
    //prepare meta data
    var allData = {'connectivity':'a', 'EI': 'ei', 'data': this.dataRecord};
    //prepare data
    //var json = JSON.stringify(this.dataRecord);
    var json = JSON.stringify(allData);
    var blob = new Blob([json], {type: "application/json"});
    var url  = URL.createObjectURL(blob);

    a.href = url;
    a.download = "data.json";

    /*
    var a = document.createElement('a');
    a.download    = "backup.json";
    a.href        = url;
    a.textContent = "Download backup.json";
    */
    
    a.click();
    window.URL.revokeObjectURL(url);

    /*
    if(confirm("Download this") == true) {
        x = 1;
        //window.open(url, "otherWindow");
        a.click();
        window.URL.revokeObjectURL(url);

    }else{
        x = 0;
    }
    */
}

NeuralNetwork.prototype.clear_cache = function(){
    this.dataRecord = [];
}
NeuralNetwork.prototype.openMonitor = function(){
    this.dataMonitor = window.open("dynamic_chart.html", "otherWindow", "top=500,left=500,width=400,height=400");
    //this.dataMonitor.document.write("<p>Hello!</p>");
}
NeuralNetwork.prototype.postData = function(){
    var message = "Hello World!";
    var message = [];
    for (var i=0; i<this.numActiveNeurons;i++){
        message.push(this.components.neurons[i].firingRate);
    }
    message.toString();
    //otherWindow.postMessage("other")
    this.dataMonitor.document.write("<p>"+message+"</p>");
}
    
NeuralNetwork.prototype.record = function(){
    var txtFile = new File('testfile.txt');
    txtFile.open('w');
    txtFile.writeln('Hello World!');
    txtFile.close();
}
NeuralNetwork.prototype.record_2 = function(){
    var fso = new ActiveXObject("Scripting.FileSystemObject");
    var fh = fso.OpenTextFile("data.txt", 8, false, 0);
    fh.WriteLine('Hello World!');
    //fh.WriteLine(d1 + ',' + d2);
    fh.Close();
}
NeuralNetwork.prototype.record_1 = function(){
    var link = this.writeFile();
    link.setAttribute('download','info.txt');
    link.href = makeTextFile(textbox.value);
    document.body.appendChild(link);
}

NeuralNetwork.prototype.writeFile = function(){
	
    var text = "Hello World!";
    var textFile = null;
	var data = new Blob([text], {type: 'text/plain'});

    // If we are replacing a previously generated file we need to
    // manually revoke the object URL to avoid memory leaks.
    if (textFile !== null) {
      window.URL.revokeObjectURL(textFile);
    }

    textFile = window.URL.createObjectURL(data);

    // returns a URL you can use as a href
    console.log(textFile);
    return textFile;
}
NeuralNetwork.prototype.reconnectNeuronTo = function(neuronA, neuronB, EorI ) {
    if(EorI){
        var axon = this.components.allAxons[this.numActiveExcitatoryAxons];
        var vertices = axon.refactor(neuronA, neuronB);
        for(var i=0; i<vertices.length; i++){
            var k = i + this.numActiveExcitatoryAxons*9;
            this.axonGeom.attributes.position.array[k*3] = vertices[i].x;
            this.axonGeom.attributes.position.array[k*3+1] = vertices[i].y;
            this.axonGeom.attributes.position.array[k*3+2] = vertices[i].z;

            

        
        }
        for(var i=0; i<vertices.length; i++){
            var k = i + this.numActiveExcitatoryAxons*8;
            this.axonGeom.attributes.opacity.array[k*2] = axon.weight*10;
            this.axonGeom.attributes.opacity.array[k*2+1] = axon.weight*10
        }




        this.numActiveExcitatoryAxons += 1;
        this.axonGeom.attributes.position.needsUpdate = true;
        this.axonGeom.attributes.opacity.needsUpdate = true;

    }else{
        var axon = this.components.allInhibitoryAxons[this.numActiveInhibitoryAxons];
        var vertices = axon.refactor(neuronA, neuronB);
        for(var i=0; i<vertices.length; i++){
            var k = i + this.numActiveInhibitoryAxons*9;
            this.inhibitoryAxonGeom.attributes.position.array[k*3] = vertices[i].x;
            this.inhibitoryAxonGeom.attributes.position.array[k*3+1] = vertices[i].y;
            this.inhibitoryAxonGeom.attributes.position.array[k*3+2] = vertices[i].z;
        }

        for(var i=0; i<vertices.length; i++){
            var k = i + this.numActiveInhibitoryAxons*8;
            this.inhibitoryAxonGeom.attributes.opacity.array[k*2] = axon.weight*10;
            this.inhibitoryAxonGeom.attributes.opacity.array[k*2+1] = axon.weight*10
        }
        this.numActiveInhibitoryAxons += 1;
        this.inhibitoryAxonGeom.attributes.position.needsUpdate = true;
        this.inhibitoryAxonGeom.attributes.opacity.needsUpdate = true;
    }
	neuronA.connection.push( new Connection( axon, 'A', neuronA.excitatory ) );
	neuronB.connection.push( new Connection( axon, 'B', neuronA.excitatory ) );


}

NeuralNetwork.prototype.injectCurrent = function() {
    for(var i = 0; i<this.numActiveNeurons; i++){
        if( !this.components.neurons[i].excitatory ){
            this.components.neurons[i].firingRate = 0;
        }
    }
    /*
    console.log("injected");
    console.log(this.axonGeom);
    console.log(this.inhibitoryAxonGeom);
    for(var i=0; i<this.axonGeom.attributes.position.length/3; i++){
        this.axonGeom.attributes.position.array[i*3] += 100;
        this.axonGeom.attributes.position.array[i*3+1] += 100;
        this.axonGeom.attributes.position.array[i*3+2] += 100;
    }
    this.axonGeom.attributes.position.needsUpdate = true;
    */
    
    
}

NeuralNetwork.prototype.addNeuronsInArray = function ( num, EI ) {
    var currentNeuronNum = this.components.neurons.length;
    var x,y,z;
    var gridDim = Math.ceil(Math.sqrt(num));
    var E_num=0;
    var I_num=0;
    for (var i=this.numActiveNeurons; i < this.numActiveNeurons+num; i++) {

        [x,y,z] = this.getLayout(i-this.numActiveNeurons,num, gridDim);
        //console.log(x,y,z);

        this.components.neurons[i].set(x,y,z);
        this.components.neurons[i].toggleEI(EI[i-this.numActiveNeurons]);
        if (EI[i-this.numActiveNeurons]){
            E_num++;
        }else{
            I_num++;
        }
        this.neuronsGeom.vertices[i].set(x,y,z);
    }
    this.updateSettings();
	this.neuronShaderMaterial.needsUpdate = true;
	this.neuronsGeom.verticesNeedUpdate = true;
    // for recently spawned neurons, connect to nearest neurons
    
    for (var j=0; j < num; j++) {
		var n1 = this.components.neurons[ this.numActiveNeurons + j ];
        //for (var k=0; k < this.numActiveNeurons+num; k++) {
            //forward
        for (var k=this.numActiveNeurons+num-1; k >= 0 ; k--) {
            //backward
			var n2 = this.components.neurons[ k ];
			// connect neuron if distance is within threshold and limit maximum connection per neuron
			if ( n1 !== n2 && n1.distanceTo( n2 ) < this.settings.maxAxonDist &&
				n1.connection.length < this.settings.maxConnectionsPerNeuron &&
				n2.connection.length < this.settings.maxConnectionsPerNeuron ) {
                if (THREE.Math.randFloat(0,1) >= 0.5){
                    var connectedAxon = this.reconnectNeuronTo(n1,n2,n1.excitatory);
                } else {
                    var connectedAxon = this.reconnectNeuronTo(n2,n1,n2.excitatory);
                }


		    }
		}
	}
    this.numActiveNeurons += num;
    this.numActiveExcitatoryNeurons += E_num;
    this.numActiveInhibitoryNeurons += I_num;

}

NeuralNetwork.prototype.addNeurons = function ( num, EorI ) {
    var currentNeuronNum = this.components.neurons.length;
    var x,y,z;
    var gridDim = Math.ceil(Math.sqrt(num));
    for (var i=this.numActiveNeurons; i < this.numActiveNeurons+num; i++) {
        if (this.settings.layoutStyle == 'ring'){
            x = Math.cos(2*Math.PI * (i-this.numActiveNeurons+this.settings.spawned) / num) 
                * (this.settings.layoutScaling+this.settings.layoutScaling/10*(this.settings.spawned+1));  
            if(this.settings.spawned%2 == 0){
                y = Math.sin(2*Math.PI * (i-this.numActiveNeurons+this.settings.spawned) / num) 
                    * (this.settings.layoutScaling+this.settings.layoutScaling/10*(this.settings.spawned+1));
                z = 0;
            }else{
                z = Math.sin(2*Math.PI * (i-this.numActiveNeurons+this.settings.spawned) / num) 
                    * (this.settings.layoutScaling+this.settings.layoutScaling/10*(this.settings.spawned+1));
                y = 0;
            }
        } else if( this.settings.layoutStyle == 'random'){
            x = THREE.Math.randFloat(-0.5,0.5) 
                * (this.settings.layoutScaling+this.settings.layoutScaling/10*(this.settings.spawned+1));
            y = THREE.Math.randFloat(-0.5,0.5) 
                * (this.settings.layoutScaling+this.settings.layoutScaling/10*(this.settings.spawned+1));
            z = THREE.Math.randFloat(-0.5,0.5)
                * (this.settings.layoutScaling+this.settings.layoutScaling/10*(this.settings.spawned+1));
            /*
            x = THREE.Math.randFloat(0.5+0.05*this.settings.spawned,0.5+0.05*(this.settings.spawned+1))
                * (THREE.Math.randInt(0,1.1)*2 - 1) * this.settings.layoutScaling;
            y = THREE.Math.randFloat(0.5+0.05*this.settings.spawned,0.5+0.05*(this.settings.spawned+1))
                * (THREE.Math.randInt(0,1.1)*2 - 1) * this.settings.layoutScaling;
            z = THREE.Math.randFloat(0.5+0.05*this.settings.spawned,0.5+0.05*(this.settings.spawned+1))
                * (THREE.Math.randInt(0,1.1)*2 - 1) * this.settings.layoutScaling;
                */

        } else if( this.settings.layoutStyle == 'randomPolar'){

            rho = THREE.Math.randFloat(0+0.1*this.settings.spawned,1+0.1*this.settings.spawned) * this.settings.layoutScaling/2;
            theta = THREE.Math.randFloat(0, 2*Math.PI);
            phi = THREE.Math.randFloat(0, Math.PI);
            x = rho*Math.cos(theta)*Math.sin(phi);
            y = rho*Math.sin(theta)*Math.sin(phi);
            z = rho*Math.cos(phi); 
        } else if( this.settings.layoutStyle == 'grid') {
            x = (i-this.numActiveNeurons)%gridDim *
                this.settings.layoutScaling /100;

            y = (i-this.numActiveNeurons)/gridDim *
                this.settings.layoutScaling /100;
            z = this.settings.spawned * 20;
        }
        //console.log(x,y,z);

        this.components.neurons[i].set(x,y,z);
        this.components.neurons[i].toggleEI(EorI);
        this.neuronsGeom.vertices[i].set(x,y,z);
    }
    this.updateSettings();
	this.neuronShaderMaterial.needsUpdate = true;
	this.neuronsGeom.verticesNeedUpdate = true;
    // for recently spawned neurons, connect to nearest neurons
    
    for (var j=0; j < num; j++) {
		var n1 = this.components.neurons[ this.numActiveNeurons + j ];
        for (var k=0; k < this.numActiveNeurons+num; k++) {
			var n2 = this.components.neurons[ k ];
			// connect neuron if distance is within threshold and limit maximum connection per neuron
			if ( n1 !== n2 && n1.distanceTo( n2 ) < this.settings.maxAxonDist &&
				n1.connection.length < this.settings.maxConnectionsPerNeuron &&
				n2.connection.length < this.settings.maxConnectionsPerNeuron ) {
                if (THREE.Math.randFloat(0,1) >= 0.5){
                    var connectedAxon = this.reconnectNeuronTo(n1,n2,n1.excitatory);
                } else {
                    var connectedAxon = this.reconnectNeuronTo(n2,n1,n2.excitatory);
                }


		    }
		}
	}
    this.numActiveNeurons += num;
    if(EorI){
        this.numActiveExcitatoryNeurons += num;
    }else{
        this.numActiveInhibitoryNeurons += num;
    }

}
NeuralNetwork.prototype.getLayout = function( i, neuronNum, gridDim ){
    var x,y,z;
    switch(this.settings.layoutStyle){
        case 'ring':
            x = Math.cos(2*Math.PI * i / neuronNum) * this.settings.layoutScaling;  
            y = 0;
            z = Math.sin(2*Math.PI * i / neuronNum) * this.settings.layoutScaling; 
            break;
        case 'random':
            x = THREE.Math.randFloat(-0.5,0.5) * this.settings.layoutScaling;
            y = THREE.Math.randFloat(-0.5,0.5) * this.settings.layoutScaling;
            z = THREE.Math.randFloat(-0.5,0.5) * this.settings.layoutScaling;
            break;
        case 'randomPolar':
            rho = THREE.Math.randFloat(0,1) * this.settings.layoutScaling;
            theta = THREE.Math.randFloat(0, 2*Math.PI);
            phi = THREE.Math.randFloat(0, Math.PI);
            x = rho*Math.cos(theta)*Math.sin(phi);
            y = rho*Math.sin(theta)*Math.sin(phi);
            z = rho*Math.cos(phi); 
            break;
        case 'grid':
            x = i%gridDim * this.settings.layoutScaling/25;
            y = i/gridDim * this.settings.layoutScaling/25;
            z = this.settings.spawned * 20;
            break;
        case 'grid_cyc':
            x = i%gridDim * this.settings.layoutScaling/100;
            y = i/gridDim * this.settings.layoutScaling/100;
            z = this.settings.spawned * 20;
            break;
    }
    return [x,y,z];
}



NeuralNetwork.prototype.initVoid = function ( layout, colorscheme ) {

    var i,x,y,z;
    this.settings.layoutStyle = layout;
    // randomly assign E or I
    //var builtin_layout = ['ring', 'random'];
    if(colorscheme == 'skynet'){
        this.neuronColor = '#88bbca';
        this.inhibitoryNeuronColor = '#e11313';
        this.axonColor = '#251310';
        this.inhibitoryAxonColor = '#140300';
    }else if(colorscheme == 'tessarect'){
        this.neuronColor = '#cdf1fc';
        this.inhibitoryNeuronColor = '#13344a';
        this.axonColor = '#0a1318';
        this.inhibitoryAxonColor = '#010507';
    }else if(colorscheme == 'tacitus'){
        this.neuronColor = '#f7f7b5';
        this.inhibitoryNeuronColor = '#4d4d00';
        this.axonColor = '#0f0c00';
        this.inhibitoryAxonColor = '#0c0b08';
    }
        


    var EI = [];
    var ECount = 0;
    var ICount = 0;
    var neuronNum = 0;
    this.numActiveNeurons = neuronNum;
    // prepare reserved neuron
    console.log(this.settings.maxNeurons);
    var n = new Neuron(0,0,0);
    this.components.neurons.push( n );
    this.neuronsGeom.vertices.push( n );

    for (i=1; i < this.settings.maxNeurons; i++) {
        var n = new Neuron(9999,9999,9999);
		this.components.neurons.push( n );
		this.neuronsGeom.vertices.push( n );
    }
    //console.log(logger);
	for ( i = 0; i < this.components.neurons.length; i++ ) {
		this.neuronAttributes.color.value[ i ] = new THREE.Color( this.neuronColor ); // initial neuron color
        /*
        if (EI[i]){
		    this.neuronAttributes.color.value[ i ] = new THREE.Color( this.neuronColor ); // initial neuron color
        }else{
		    this.neuronAttributes.color.value[ i ] = new THREE.Color( this.inhibitoryNeuronColor ); // initial neuron color
        }
        */

		this.neuronAttributes.size.value[ i ] = THREE.Math.randFloat( 0.75, 3.0 ); // initial neuron size
        
	}


	// neuron mesh
	this.neuronParticles = new THREE.PointCloud( this.neuronsGeom, this.neuronShaderMaterial );
	this.meshComponents.add( this.neuronParticles );

	this.neuronShaderMaterial.needsUpdate = true;
    console.log(this.components.neurons.length);
    //console.log(this.neuronParticles, this.meshComponents);


    // add axons
	var allNeuronsLength = this.components.neurons.length;
    var allAxonsLength = 0;


    // connect neurons according to edges in the graph

    
    


    // Prepare reserve axons for each group
    this.placeHolderA = new Neuron(9999,9999,9999);
    this.placeHolderB = new Neuron(9900,9900,9900);
    //this.placeHolderA = new Neuron(99,99,99);
    //this.placeHolderB = new Neuron(90,90,90);
    var connectedAxon = this.components.neurons[0].connectNeuronTo(this.components.neurons[0]);
    this.constructAxonArrayBuffer(connectedAxon);
    this.constructInhibitoryAxonArrayBuffer(connectedAxon);

    for (var k=1; k<this.settings.maxAxons;k++){
        var connectedAxon = this.placeHolderA.connectNeuronTo(this.placeHolderB);
        this.constructAxonArrayBuffer( connectedAxon );
    }
    for (var k=1; k<this.settings.maxAxons;k++){
        var connectedAxon = this.placeHolderA.connectNeuronTo(this.placeHolderB);
        this.constructInhibitoryAxonArrayBuffer( connectedAxon );
    }


	// enable WebGL 32 bit index buffer or get an error
	if ( !renderer.getContext().getExtension( "OES_element_index_uint" ) ) {
		console.error( "32bit index buffer not supported!" );
	}

    var allAxonsLength = 0;
	var axonIndices = new Uint32Array( this.axonIndices );
	var axonPositions = new Float32Array( this.axonPositions );
    //console.log(axonPositions.length);
	var axonOpacities = new Float32Array( this.axonAttributes.opacity.value );

	this.axonGeom.addAttribute( 'index', new THREE.BufferAttribute( axonIndices, 1 ) );
	this.axonGeom.addAttribute( 'position', new THREE.BufferAttribute( axonPositions, 3 ) );
	this.axonGeom.addAttribute( 'opacity', new THREE.BufferAttribute( axonOpacities, 1 ) );
	this.axonGeom.computeBoundingSphere();

	this.axonShaderMaterial = new THREE.ShaderMaterial( {
		uniforms: this.axonUniforms,
		attributes: this.axonAttributes,
		vertexShader: null,
		fragmentShader: null,
		blending: THREE.AdditiveBlending,
		depthTest: false,
		transparent: true
	} );

	this.axonMesh = new THREE.Line( this.axonGeom, this.axonShaderMaterial, THREE.LinePieces );
	this.meshComponents.add( this.axonMesh );


	var inhibitoryAxonIndices = new Uint32Array( this.inhibitoryAxonIndices );
	var inhibitoryAxonPositions = new Float32Array( this.inhibitoryAxonPositions );
    //console.log(inhibitoryAxonPositions.length);
	var inhibitoryAxonOpacities = new Float32Array( this.inhibitoryAxonAttributes.opacity.value );

	this.inhibitoryAxonGeom.addAttribute( 'index', new THREE.BufferAttribute( inhibitoryAxonIndices, 1 ) );
	this.inhibitoryAxonGeom.addAttribute( 'position', new THREE.BufferAttribute( inhibitoryAxonPositions, 3 ) );
	this.inhibitoryAxonGeom.addAttribute( 'opacity', new THREE.BufferAttribute( inhibitoryAxonOpacities, 1 ) );
	this.inhibitoryAxonGeom.computeBoundingSphere();

	this.inhibitoryAxonShaderMaterial = new THREE.ShaderMaterial( {
		uniforms: this.inhibitoryAxonUniforms,
		attributes: this.inhibitoryAxonAttributes,
		vertexShader: null,
		fragmentShader: null,
		blending: THREE.AdditiveBlending,
		depthTest: false,
		transparent: true
	} );

	this.inhibitoryAxonMesh = new THREE.Line( this.inhibitoryAxonGeom, this.inhibitoryAxonShaderMaterial, THREE.LinePieces );
	this.meshComponents.add( this.inhibitoryAxonMesh );


	var numNotConnected = 0;
	for ( i = 0; i < allNeuronsLength; i++ ) {
		if ( !this.components.neurons[ i ].connection[ 0 ] ) {
			numNotConnected += 1;
		}
	}
	console.log( 'numNotConnected =', numNotConnected );
    //start recorder
    var currentFiringRate = []
    for (var i=0; i<this.numActiveNeurons;i++){
        currentFiringRate.push(this.components.neurons[i].firingRate);
    }
    this.dataRecord.push(currentFiringRate);
    console.log(this.dataRecord.length);
    console.log(currentFiringRate);



}
NeuralNetwork.prototype.initFromGraph = function ( my_url, layout ) {

    var graph = (function () {
        var json = null;
        $.ajax({
            'async': false,
            'global': false,
            'url': my_url,
            'dataType': "json",
            'success': function (data) {
                json = data;
            }
        });
        return json;
    })(); 


    var i,x,y,z;
    this.settings.layoutStyle = layout;
    //var logger="";
    var neuronNum = graph.nodes.length;
    //var neuronNum = 100;
    // randomly assign E or I
    //var builtin_layout = ['ring', 'random'];
    var EI = [];
    var ECount = 0;
    var ICount = 0;
    for (var i=0;i<neuronNum;i++){
        EI[i] = THREE.Math.randFloat(0,1) >= this.settings.IRatio;
        if (EI[i] == true){
            ECount++;
            this.numActiveExcitatoryNeurons++;
        }else{
            ICount++;
            this.numActiveInhibitoryNeurons++;
        }
    }

    var gridDim = Math.ceil(Math.sqrt(neuronNum));
    //console.log(gridDim);
    for (i = 0; i < neuronNum; i++) {
        var n;
        if(graph.nodes[i]['x'] ){
            n = new Neuron( 10*graph.nodes[i]['x'], 
                            10*graph.nodes[i]['y'],
                            10*graph.nodes[i]['z'] );
        } else {
            [x,y,z] = this.getLayout(i,neuronNum, gridDim);
            //console.log(x,y,z);
            n = new Neuron(x,y,z);
        }
        /*
        } else if(layout =='ring'){
            console.log('missing spatial info, randomizing');
            x = Math.cos(2*Math.PI * i / neuronNum) * this.settings.layoutScaling;  
            y = 0;
            z = Math.sin(2*Math.PI * i / neuronNum) * this.settings.layoutScaling; 
            n = new Neuron(x,y,z);
        } else if(layout == 'random'){
            x = THREE.Math.randFloat(-0.5,0.5) * this.settings.layoutScaling;
            y = THREE.Math.randFloat(-0.5,0.5) * this.settings.layoutScaling;
            z = THREE.Math.randFloat(-0.5,0.5) * this.settings.layoutScaling;
            n = new Neuron(x,y,z);

        } else if(layout == 'randomPolar'){
            rho = THREE.Math.randFloat(0,1) * this.settings.layoutScaling;
            theta = THREE.Math.randFloat(0, 2*Math.PI);
            phi = THREE.Math.randFloat(0, Math.PI);
            x = rho*Math.cos(theta)*Math.sin(phi);
            y = rho*Math.sin(theta)*Math.sin(phi);
            z = rho*Math.cos(phi); 
            n = new Neuron(x,y,z);
            
        } else if(layout == 'grid'){
            x = i%gridDim * this.settings.layoutScaling/100;
            y = i/gridDim * this.settings.layoutScaling/100;
            z = 0;
            n = new Neuron(x,y,z);
        } else if(layout == 'grid_cyc') {
            x = i%gridDim * this.settings.layoutScaling/100;
            y = i/gridDim * this.settings.layoutScaling/100;
            z = 0;
            n = new Neuron(x,y,z);
        }
        */

        n.toggleEI(EI[i]);
        //n.firingRate = 100*THREE.Math.randFloat(0.1, 0.3);
        this.components.neurons.push( n );
		this.neuronsGeom.vertices.push( n );
        //logger += graph.nodes[i]['z'];

    }
    this.numActiveNeurons = neuronNum;
    // prepare reserved neuron
    console.log(this.settings.maxNeurons);
    for (i=neuronNum; i < this.settings.maxNeurons; i++) {
        var n = new Neuron(9999,9999,9999);
		this.components.neurons.push( n );
		this.neuronsGeom.vertices.push( n );
    }
    //console.log(logger);
	for ( i = 0; i < this.components.neurons.length; i++ ) {
        if (EI[i]){
		    this.neuronAttributes.color.value[ i ] = new THREE.Color( this.neuronColor ); // initial neuron color
        }else{
		    this.neuronAttributes.color.value[ i ] = new THREE.Color( this.inhibitoryNeuronColor ); // initial neuron color
        }

		this.neuronAttributes.size.value[ i ] = THREE.Math.randFloat( 0.75, 3.0 ); // initial neuron size
        
	}


	// neuron mesh
	this.neuronParticles = new THREE.PointCloud( this.neuronsGeom, this.neuronShaderMaterial );
	this.meshComponents.add( this.neuronParticles );

	this.neuronShaderMaterial.needsUpdate = true;
    console.log(this.components.neurons.length);
    //console.log(this.neuronParticles, this.meshComponents);


    // add axons
	var allNeuronsLength = this.components.neurons.length;


    // connect neurons according to edges in the graph

    //var allAxonsLength = 50000;
    //var allAxonsLength = 1000;
    var allAxonsLength = graph.links.length;
    
    
    for (var j = 0; j < allAxonsLength; j++) {
        src = graph.links[j]['source'];
        tgt = graph.links[j]['target'];
        var connectedAxon = this.components.neurons[src].connectNeuronTo( this.components.neurons[tgt]);
        if(EI[src]){
            this.constructAxonArrayBuffer( connectedAxon );
            this.numActiveExcitatoryAxons += 1;
        }else{
            this.constructInhibitoryAxonArrayBuffer( connectedAxon ); 
            this.numActiveInhibitoryAxons += 1;
        }
    }


    // Prepare reserve axons for each group
    this.placeHolderA = new Neuron(9999,9999,9999);
    this.placeHolderB = new Neuron(9900,9900,9900);
    for (var k=this.components.allAxons.length; k<this.settings.maxAxons;k++){
        var connectedAxon = this.placeHolderA.connectNeuronTo(this.placeHolderB);
        this.constructAxonArrayBuffer( connectedAxon );
    }
    for (var k=this.components.allInhibitoryAxons.length; k<this.settings.maxAxons;k++){
        var connectedAxon = this.placeHolderA.connectNeuronTo(this.placeHolderB);
        this.constructInhibitoryAxonArrayBuffer( connectedAxon );
    }


	// enable WebGL 32 bit index buffer or get an error
	if ( !renderer.getContext().getExtension( "OES_element_index_uint" ) ) {
		console.error( "32bit index buffer not supported!" );
	}

	var axonIndices = new Uint32Array( this.axonIndices );
	var axonPositions = new Float32Array( this.axonPositions );
    //console.log(axonPositions.length);
	var axonOpacities = new Float32Array( this.axonAttributes.opacity.value );

	this.axonGeom.addAttribute( 'index', new THREE.BufferAttribute( axonIndices, 1 ) );
	this.axonGeom.addAttribute( 'position', new THREE.BufferAttribute( axonPositions, 3 ) );
	this.axonGeom.addAttribute( 'opacity', new THREE.BufferAttribute( axonOpacities, 1 ) );
	this.axonGeom.computeBoundingSphere();

	this.axonShaderMaterial = new THREE.ShaderMaterial( {
		uniforms: this.axonUniforms,
		attributes: this.axonAttributes,
		vertexShader: null,
		fragmentShader: null,
		blending: THREE.AdditiveBlending,
		depthTest: false,
		transparent: true
	} );

	this.axonMesh = new THREE.Line( this.axonGeom, this.axonShaderMaterial, THREE.LinePieces );
	this.meshComponents.add( this.axonMesh );


	var inhibitoryAxonIndices = new Uint32Array( this.inhibitoryAxonIndices );
	var inhibitoryAxonPositions = new Float32Array( this.inhibitoryAxonPositions );
    //console.log(inhibitoryAxonPositions.length);
	var inhibitoryAxonOpacities = new Float32Array( this.inhibitoryAxonAttributes.opacity.value );

	this.inhibitoryAxonGeom.addAttribute( 'index', new THREE.BufferAttribute( inhibitoryAxonIndices, 1 ) );
	this.inhibitoryAxonGeom.addAttribute( 'position', new THREE.BufferAttribute( inhibitoryAxonPositions, 3 ) );
	this.inhibitoryAxonGeom.addAttribute( 'opacity', new THREE.BufferAttribute( inhibitoryAxonOpacities, 1 ) );
	this.inhibitoryAxonGeom.computeBoundingSphere();

	this.inhibitoryAxonShaderMaterial = new THREE.ShaderMaterial( {
		uniforms: this.inhibitoryAxonUniforms,
		attributes: this.inhibitoryAxonAttributes,
		vertexShader: null,
		fragmentShader: null,
		blending: THREE.AdditiveBlending,
		depthTest: false,
		transparent: true
	} );

	this.inhibitoryAxonMesh = new THREE.Line( this.inhibitoryAxonGeom, this.inhibitoryAxonShaderMaterial, THREE.LinePieces );
	this.meshComponents.add( this.inhibitoryAxonMesh );


	var numNotConnected = 0;
	for ( i = 0; i < allNeuronsLength; i++ ) {
		if ( !this.components.neurons[ i ].connection[ 0 ] ) {
			numNotConnected += 1;
		}
	}
	console.log( 'numNotConnected =', numNotConnected );
    //start recorder
    var currentFiringRate = []
    for (var i=0; i<this.numActiveNeurons;i++){
        currentFiringRate.push(this.components.neurons[i].firingRate);
    }
    this.dataRecord.push(currentFiringRate);
    console.log(currentFiringRate);

}

NeuralNetwork.prototype.update = function ( deltaTime ) {

	if ( !this.initialized ) return;

	var n, ii;
	//var currentTime = Date.now();
    var currentFiringRate = [];

	// update neurons state and release signal
	for ( ii = 0; ii < this.numActiveNeurons; ii++ ) {

		n = this.components.neurons[ ii ];
        var c;
        for (var j = 0; j< n.connection.length; j++){
            c = n.connection[j];
            // update firing rate and apply learning rules
            if(c.startingPoint === 'B'){
                if(c.EI == true){
                    n.firingRate += c.axon.weight*c.axon.neuronA.firingRate;
                }else{
                    n.firingRate -= c.axon.weight*c.axon.neuronA.firingRate;
                }
                //c.axon.weight += 0.000001* (n.firingRate - 10) * (c.axon.neuronA.firingRate - 10);
                c.axon.weight += 0.000001* (n.firingRate - 10) * (c.axon.neuronA.firingRate - 10);
                if(c.axon.weight < 0)
                    c.axon.weight = 0;
                else if(c.axon.weight > 0.05)
                    c.axon.weight = 0.05;


                for(i=0;i<8;i++){
                    var k = c.axon.id-9 + i;
                    this.axonGeom.attributes.opacity.array[k*2]=c.axon.weight*10;
                    this.axonGeom.attributes.opacity.array[k*2+1]=c.axon.weight*10;
                }

            }
            if (n.firingRate >= 100){
                n.firingRate = 100;
                //auto balancing
                //this.addNeurons(2,false);
                
            }else if(n.firingRate <= 0){
                n.firingRate = 0;
                //this.addNeurons(2,true);
            }
            

        }
        currentFiringRate[ii] = n.firingRate;
        this.neuronAttributes.size.value[ii] = n.firingRate / 20 + 1;
		n.receivedSignal = false; // if neuron recieved signal but still in delay reset it
	}
    this.dataRecord.push(currentFiringRate);


	// reset all neurons and when there is no signal and trigger release signal at random neuron
	if ( this.components.allSignals.length === 0 ) {

		this.resetAllNeurons();
		//this.releaseSignalAt( this.components.neurons[ THREE.Math.randInt( 0, this.numActiveNeurons) ] );

	}

	// update and remove dead signals
	for ( var j = this.components.allSignals.length - 1; j >= 0; j-- ) {
		var s = this.components.allSignals[ j ];
		s.travel( deltaTime );

		if ( !s.alive ) {
			s.particle.free();
			for ( var k = this.components.allSignals.length - 1; k >= 0; k-- ) {
				if ( s === this.components.allSignals[ k ] ) {
					this.components.allSignals.splice( k, 1 );
					break;
				}
			}
		}

	}

    this.neuronAttributes.size.needsUpdate = true;
    this.axonGeom.attributes.opacity.needsUpdate = true;
	// update particle pool vertices
	this.particlePool.update();

	// update info for GUI
	this.updateInfo();

};

NeuralNetwork.prototype.constructAxonArrayBuffer = function ( axon ) {
	this.components.allAxons.push( axon );
	var vertices = axon.vertices;

	for ( var i = 0; i < vertices.length; i++ ) {

		this.axonPositions.push( vertices[ i ].x, vertices[ i ].y, vertices[ i ].z );

		if ( i < vertices.length - 1 ) {
			var idx = this.axonNextPositionsIndex;
			this.axonIndices.push( idx, idx + 1 );

			var opacity = THREE.Math.randFloat( 0.005, 0.2 );
			this.axonAttributes.opacity.value.push( opacity, opacity );

		}

		this.axonNextPositionsIndex += 1;
        axon.id = this.axonNextPositionsIndex;
        
	}
};
NeuralNetwork.prototype.constructInhibitoryAxonArrayBuffer = function ( axon ) {
	this.components.allInhibitoryAxons.push( axon );
	var vertices = axon.vertices;

	for ( var i = 0; i < vertices.length; i++ ) {

		this.inhibitoryAxonPositions.push( vertices[ i ].x, vertices[ i ].y, vertices[ i ].z );

		if ( i < vertices.length - 1 ) {
			var idx = this.inhibitoryAxonNextPositionsIndex;
			this.inhibitoryAxonIndices.push( idx, idx + 1 );

			var opacity = THREE.Math.randFloat( 0.005, 0.2 );
			this.inhibitoryAxonAttributes.opacity.value.push( opacity, opacity );

		}

		this.inhibitoryAxonNextPositionsIndex += 1;
        axon.id = this.inhibitoryAxonNextPositionsIndex;
	}
};

NeuralNetwork.prototype.releaseSignalAt = function ( neuron ) {
	var signals = neuron.createSignal( this.particlePool, this.settings.signalMinSpeed, this.settings.signalMaxSpeed );
	for ( var ii = 0; ii < signals.length; ii++ ) {
		var s = signals[ ii ];
		this.components.allSignals.push( s );
	}
};

NeuralNetwork.prototype.resetAllNeurons = function () {

	this.numPassive = 0;
	for ( var ii = 0; ii < this.components.neurons.length; ii++ ) { // reset all neuron state
		n = this.components.neurons[ ii ];

		if ( !n.fired ) {
			this.numPassive += 1;
		}

		n.reset();

	}
	// console.log( 'numPassive =', this.numPassive );

};

NeuralNetwork.prototype.updateInfo = function () {
	this.numNeurons = this.numActiveNeurons;
	this.numEAxons = this.numActiveExcitatoryAxons;
    this.numIAxons = this.numActiveInhibitoryAxons;

	this.numSignals = this.components.allSignals.length;
};

NeuralNetwork.prototype.updateSettings = function () {

	this.neuronUniforms.opacity.value = this.neuronOpacity;

	for ( i = 0; i < this.components.neurons.length; i++ ) {
        if( this.components.neurons[i].excitatory ) {
		    this.neuronAttributes.color.value[ i ].setStyle( this.neuronColor ); // initial neuron color
        }else{
		    this.neuronAttributes.color.value[ i ].setStyle( this.inhibitoryNeuronColor ); // initial neuron color
        }
	}
	this.neuronAttributes.color.needsUpdate = true;

	this.neuronUniforms.sizeMultiplier.value = this.neuronSizeMultiplier;

	this.axonUniforms.color.value.set( this.axonColor );
	this.axonUniforms.opacityMultiplier.value = this.axonOpacityMultiplier;
	this.inhibitoryAxonUniforms.color.value.set( this.inhibitoryAxonColor );
	this.inhibitoryAxonUniforms.opacityMultiplier.value = this.axonOpacityMultiplier;

	this.particlePool.updateSettings();


};

NeuralNetwork.prototype.testChangOpcAttr = function () {

	var opcArr = this.axonGeom.attributes.opacity.array;
	for ( var i = 0; i < opcArr.length; i++ ) {
		opcArr[ i ] = THREE.Math.randFloat( 0, 0.5 );
	}
	this.axonGeom.attributes.opacity.needsUpdate = true;
};

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


var shaderLoader = new THREE.XHRLoader( loadingManager );
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
// ---- VR related
WEBVR.checkAvailability().catch( function( message ) {

	document.body.appendChild( WEBVR.getMessageContainer( message ) );

} );
var controller1, controller2;

// ---- Scene
container = document.getElementById( 'canvas-container' );
scene = new THREE.Scene();

// ---- Camera
camera = new THREE.PerspectiveCamera( 75, screenRatio, 10, 5000 );
// camera orbit control
//cameraCtrl = new THREE.OrbitControls( camera, container );
//cameraCtrl.object.position.y = 150;
//cameraCtrl.update();

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
renderer.vr.enabled = true; //VR
renderer.vr.standing = true;

WEBVR.getVRDisplay( function ( display ) {

	renderer.vr.setDevice( display );

	document.body.appendChild( WEBVR.getButton( display, renderer.domElement ) );

} );

controller1 = new THREE.ViveController( 0 );
controller1.standingMatrix = renderer.vr.getStandingMatrix();
scene.add( controller1 );

controller2 = new THREE.ViveController( 1 );
controller2.standingMatrix = renderer.vr.getStandingMatrix();
scene.add( controller2 );
// ---- Stats
stats = new Stats();
container.appendChild( stats.domElement );

// ---- grid & axis helper
var gridHelper = new THREE.GridHelper( 600, 50 );
gridHelper.setColors( 0x00bbff, 0xffffff );
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
	gui_info.add( neuralNet, 'numSignals', 0, neuralNet.settings.limitSignals ).name( 'Signals' );
	gui_info.autoListen = false;

	gui_settings = gui.addFolder( 'Settings' );
	gui_settings.add( neuralNet.settings, 'currentMaxSignals', 0, neuralNet.settings.limitSignals ).name( 'Max Signals' );
	gui_settings.add( neuralNet.particlePool, 'pSize', 0.2, 2 ).name( 'Signal Size' );
	gui_settings.add( neuralNet.settings, 'signalMinSpeed', 0.0, 8.0, 0.01 ).name( 'Signal Min Speed' );
	gui_settings.add( neuralNet.settings, 'signalMaxSpeed', 0.0, 8.0, 0.01 ).name( 'Signal Max Speed' );
	gui_settings.add( neuralNet, 'neuronSizeMultiplier', 0, 6 ).name( 'Neuron Size Mult' );
	gui_settings.add( neuralNet, 'neuronOpacity', 0, 1.0 ).name( 'Neuron Opacity' );
	gui_settings.add( neuralNet, 'axonOpacityMultiplier', 0.0, 15.0 ).name( 'Axon Opacity Mult' );
	gui_settings.addColor( neuralNet.particlePool, 'pColor' ).name( 'Signal Color' );
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
	if ( neuralNet.settings.signalMinSpeed > neuralNet.settings.signalMaxSpeed ) {
		neuralNet.settings.signalMaxSpeed = neuralNet.settings.signalMinSpeed;
		gui_settings.__controllers[ 3 ].updateDisplay();
	}
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
