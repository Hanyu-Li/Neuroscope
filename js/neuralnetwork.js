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
		//signalMinSpeed: 1.75,
		//signalMaxSpeed: 3.25,
		//currentMaxSignals: 3000,
        //maxNeurons: 35000,
        maxNeurons: 7500,
        maxAxons: 150000,
		//limitSignals: 10000,
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
	//this.particlePool = new ParticlePool( this.settings.limitSignals );
	//this.meshComponents.add( this.particlePool.meshComponents );

	// NN component containers
	this.components = {
		neurons: [],
		//allSignals: [],
		allAxons: [],
        allInhibitoryAxons: []

	};
    this.placeHolderA = null;
    this.placeHolderB = null;

    //color scheme
    //default blue orange
	this.neuronColor = '#ff8700';
	this.inhibitoryNeuronColor = '#00ffc3';

	this.neuronColorRGB = this.hextoRgb(this.neuronColor);
	this.inhibitoryNeuronColorRGB = this.hextoRgb(this.inhibitoryNeuronColor);
	this.inhibitoryNeuronColor = '#00ffc3';

	this.axonColor = '#140a00';
	this.inhibitoryAxonColor = '#000f0b';

    
    



	// axon
    
	this.axonOpacityMultiplier = 1.5;
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
	this.axonGeom = new THREE.BufferGeometry()
	//this.axonGeom = new THREE.BufferGeometry({
		//attributes: this.axonAttributes
	//});
	// inhibitory axon
	this.inhibitoryAxonOpacityMultiplier = 2.5;
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
	this.inhibitoryAxonGeom = new THREE.BufferGeometry({
		attributes: this.inhibitoryAxonAttributes
	});

	// neuron
	this.neuronSizeMultiplier = 1.0;
	this.spriteTextureNeuron = TEXTURES.electric;
	//console.log(this.spriteTextureNeuron)
	this.neuronOpacity = 0.75;
	this.neuronColorArray = [];
	this.neuronPositions = [];
	this.neuronSizes = [];

	var texture = new THREE.TextureLoader().load( "sprites/lensflare_gray.png" );
	var electrictexture = new THREE.TextureLoader().load( "sprites/electric.png" );
	//texture.wrapS = THREE.RepeatWrapping;
	//texture.wrapT = THREE.RepeatWrapping;

	this.neuronUniforms = {
		amplitude: {
			value: 1.0
		},
		sizeMultiplier: {
			value: this.neuronSizeMultiplier
		},
		opacity: {
			value: this.neuronOpacity
		},
		color: {
			value: new THREE.Color( 0x00ffff)
		},
		texture: {
			type : 't',
			value: texture
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
		},
	};
	

	this.neuronsBufferGeom = new THREE.BufferGeometry()
	this.neuronsGeom = new THREE.Geometry();
	this.neuronMaterials = [];

	//this.neuronsGeom = new THREE.Geometry({
	//	attributes:this.neuronAttributes
	//});
	this.neuronShaderMaterial = new THREE.ShaderMaterial( {

		uniforms: this.neuronUniforms,
		//attributes: this.neuronAttributes,
		//vertexShader: SHADER_CONTAINER.neuronVert,
		//fragmentShader: SHADER_CONTAINER.neuronFrag,
		vertexShader: null,
		fragmentShader: null,
		blending: THREE.AdditiveBlending,
		transparent: true,
		depthTest: false

	} );
	this.neuronSpriteMaterial = new THREE.SpriteMaterial( {
		map : this.spriteTextureNeuron
	});
	//this.neuronPointsMaterial = new THREE.PointsMaterial( { 
	//	size: 100, 
	//	map: this.spriteTextureNeuron, 
	//	blending: THREE.AdditiveBlending, 
	//	depthTest: false, 
	//	transparent: true } );

	this.neuronPointsMaterial = new THREE.PointsMaterial( { 
		size: 15, 
		vertexColors: THREE.VertexColors,
		map : this.spriteTextureNeuron
	});
	// info api
	this.numNeurons = 0;
	this.numINeurons = 0;
	this.numEAxons = 0;
	this.numIAxons = 0;
	//this.numSignals = 0;
    this.numActiveNeurons = 0;

    this.numActiveExcitatoryNeurons = 0;
    this.numActiveInhibitoryNeurons = 0;
    this.numActiveExcitatoryAxons = 0;
    this.numActiveInhibitoryAxons = 0;

	this.numPassive = 0;

    // Other controlsSpawn Random

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

    //var my_url = 'models/mouse_retina.json';
    //this.initFromGraph(my_url, 'grid', colorscheme='tessarect');

    //for(var i=0;i<10;i++)
    //    this.spawn_random();

	//this.initNeurons( OBJ_MODELS.brain.geometry.vertices );
	//this.initAxons();
    //console.log(OBJ_MODELS);

	this.initVoid(this.settings.layoutStyle, colorscheme='tessarect');
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

    var EI = [];
    var conn = [];
    for(i=0;i<this.numActiveNeurons;i++){
        var n = this.components.neurons[i];
        n.ID = i;
        if(n.excitatory){
            EI.push(i);
        }
    }
    for(i=0;i<this.numActiveExcitatoryAxons;i++){
        var ax = this.components.allAxons[i];
        conn.push([ax.neuronA.ID, ax.neuronB.ID, ax.weight])
        //console.log(ax.neuronA, ax.neuronB, ax.neuronA.excitatory);
    }
    for(i=0;i<this.numActiveInhibitoryAxons;i++){
        var ax = this.components.allInhibitoryAxons[i];
        conn.push([ax.neuronA.ID, ax.neuronB.ID,ax.weight])
        //console.log(ax.neuronA, ax.neuronB, ax.neuronA.excitatory);
    }
    /*
    for(i=0;i<this.numActiveNeurons;i++){
        var n = this.components.neurons[i];
        var _conn = []
        for(j=0;j<n.connection.length;j++){
            console.log(n.connection.axon.neuronB);
            _conn.push(n.connection.axon.neuronB.ID);
        }
        conn[n.ID] = _conn;
        

    }
    */
    var allData = {'connectivity': conn, 'EI': EI, 'data': this.dataRecord};
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
		//this.neuronsGeom.vertices[i].set(x,y,z);
		this.neuronsBufferGeom.attributes.position.array[i*3] = x
		this.neuronsBufferGeom.attributes.position.array[i*3+1] = y
		this.neuronsBufferGeom.attributes.position.array[i*3+2] = z
    }
	this.neuronsBufferGeom.attributes.position.needsUpdate = true;
	this.neuronShaderMaterial.needsUpdate = true;
	this.neuronsBufferGeom.computeBoundingSphere();
    this.updateSettings();
	//this.neuronPointsMaterial.needsUpdate = true;
	//this.neuronsGeom.verticesNeedUpdate = true;
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
                this.settings.layoutScaling /100 ;

            y = (i-this.numActiveNeurons)/gridDim *
                this.settings.layoutScaling /100 ;
            z = this.settings.spawned * 20 ;
        }
        //console.log(x,y,z);

        this.components.neurons[i].set(x,y,z);
        this.components.neurons[i].toggleEI(EorI);
		//this.neuronsGeom.vertices[i].set(x,y,z);
		this.neuronsBufferGeom.attributes.position.array[i*3] = x
		this.neuronsBufferGeom.attributes.position.array[i*3+1] = y
		this.neuronsBufferGeom.attributes.position.array[i*3+2] = z
    }
    this.updateSettings();
	this.neuronShaderMaterial.needsUpdate = true;
	//this.neuronPointsMaterial.needsUpdate = true;
	//this.neuronsGeom.verticesNeedUpdate = true;
	this.neuronsBufferGeom.attributes.position.needsUpdate = true;
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


NeuralNetwork.prototype.hextoRgb = function (hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
	var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	//console.log("hex",hex)
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return [parseInt(result[1], 16)/255, parseInt(result[2], 16)/255,parseInt(result[3], 16)/255]
	/*
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
	} : null;
	*/
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
    }else if(colorscheme == 'EI'){
        this.neuronColor = '#ffffff';
        this.inhibitoryNeuronColor = '#13344a';
        this.axonColor = '#4d3410';
        this.inhibitoryAxonColor = '#004f70';
    }
        

	this.neuronColorRGB = this.hextoRgb(this.neuronColor);
	this.inhibitoryNeuronColorRGB = this.hextoRgb(this.inhibitoryNeuronColor);

    var EI = [];
    var ECount = 0;
    var ICount = 0;
    var neuronNum = 0;
    this.numActiveNeurons = neuronNum;
    // prepare reserved neuron	//this.neuronParticles = new THREE.Points( this.neuronsGeom, this.neuronMaterials );
	//this.neuronParticles = new THREE.Points( this.neuronsGeom, new THREE.PointsMaterial({
	//	size:15, 
	//	vertexColors: THREE.VertexColors}));
		//map:this.spriteTextureNeuron}) );
    console.log("Max Neuron:", this.settings.maxNeurons);
    var n = new Neuron(0,0,0);
    this.components.neurons.push( n );
    var n = new Neuron(-9999,-9999,-9999);
    this.components.neurons.push( n );
	//this.neuronsGeom.vertices.push( n );
	//var neuronPositions = new Float32Array(this.settings.maxNeurons * 3 );

    for (i=2; i < this.settings.maxNeurons; i++) {
        var n = new Neuron(9999,9999,9999);
		this.components.neurons.push( n );
		//this.neuronsGeom.vertices.push( n );

    }
    //console.log(logger);
	//var bufferNeuronColors = new Float32Array(this.neuronColorArray);
	//var bufferNeuronPositions = new Float32Array(this.neuronPositions);
	//var bufferNeuronSizes= new Float32Array( this.neuronSizes);
	var bufferNeuronColors = new Float32Array(this.settings.maxNeurons*3);
	var bufferNeuronPositions = new Float32Array(this.settings.maxNeurons*3);
	var bufferNeuronSizes= new Float32Array(this.settings.maxNeurons);

	for ( i = 0; i < this.components.neurons.length; i++ ) {
		//this.neuronColorArray[ i ] = new THREE.Color( this.neuronColor ); // initial neuron color
		//this.neuronPositions[i*3] = 9999;
		//this.neuronPositions[i*3+1] = 9999;
		//this.neuronPositions[i*3+2] = 9999;

		// this.neuronColorArray[i*3] = this.neuronColorRGB[0];
		// this.neuronColorArray[i*3+1] = this.neuronColorRGB[1];
		// this.neuronColorArray[i*3+2] = this.neuronColorRGB[2]; 

		// this.neuronSizes[ i ] = THREE.Math.randFloat( 10*0.75, 10*3.0 ); // initial neuron size
		bufferNeuronPositions[i*3] = 9999;
		bufferNeuronPositions[i*3+1] = 9999;
		bufferNeuronPositions[i*3+2] = 9999;

		bufferNeuronColors[i*3] = this.neuronColorRGB[0];
		bufferNeuronColors[i*3+1] = this.neuronColorRGB[1];
		bufferNeuronColors[i*3+2] = this.neuronColorRGB[2]; 

		bufferNeuronSizes[ i ] = THREE.Math.randFloat( 10*0.75, 10*3.0 ); // initial neuron size
		//this.neuronColor.value[ i ] = new THREE.Color( this.neuronColor ); // initial neuron color
		
		/*
        if (EI[i]){
		    this.neuronAttributes.color.value[ i ] = new THREE.Color( this.neuronColor ); // initial neuron color
        }else{
		    this.neuronAttributes.color.value[ i ] = new THREE.Color( this.inhibitoryNeuronColor ); // initial neuron color
        }
        

		this.neuronAttributes.size.value[ i ] = THREE.Math.randFloat( 10*0.75, 10*3.0 ); // initial neuron size
		*/

        
	}
	//this.neuronsGeom.addAttribute( 'index', new THREE.BufferAttribute( neuronIndices, 1 ) );
	//this.neuronsGeom.addAttribute( 'color', new THREE.BufferAttribute( bufferNeuronColors, 3 ) );
	//this.neuronsGeom.addAttribute( 'position', new THREE.BufferAttribute( bufferNeuronPositions, 3 ) );
	//this.neuronsGeom.addAttribute( 'size', new THREE.BufferAttribute(bufferNeuronSizes, 1 ) );
	//this.neuronsGeom.computeBoundingSphere();

	this.neuronsBufferGeom.addAttribute( 'color', new THREE.BufferAttribute( bufferNeuronColors, 3 ) );
	this.neuronsBufferGeom.addAttribute( 'position', new THREE.BufferAttribute( bufferNeuronPositions, 3 ) );
	this.neuronsBufferGeom.addAttribute( 'size', new THREE.BufferAttribute(bufferNeuronSizes, 1 ) );
	this.neuronsBufferGeom.computeBoundingSphere();

	console.log(this.neuronsBufferGeom.attributes);

//	this.neuronShaderMaterial = new THREE.ShaderMaterial( {
//
//		uniforms: this.neuronUniforms,
//		//attributes: this.neuronAttributes,
//		vertexShader: SHADER_CONTAINER.neuronVert,
//		fragmentShader: SHADER_CONTAINER.neuronFrag,
//		blending: THREE.AdditiveBlending,
//		transparent: true,
//		depthTest: false
//
//	} );
//
	// neuron mesh
	//this.neuronParticles = new THREE.Points( this.neuronsGeom, this.neuronShaderMaterial );
	//this.neuronParticles = new THREE.Points( this.neuronsGeom, new THREE.SpriteMaterial({map:this.spriteTextureNeuron}));
	//this.neuronParticles = new THREE.Points( this.neuronsGeom, this.neuronPointsMaterial );
	/*
	this.neuronMaterials = new THREE.PointsMaterial({
		size : this.neuronAttributes.size.value[i],
		color : this.neuronAttributes.color.value[i],
		map : this.spriteTextureNeuron,
		blending : THREE.AdditiveBlending,
		depthTest : false,
		transparent : true
	});
	*/
	//console.log(neuronMaterials)
	this.neuronParticles = new THREE.Points( this.neuronsBufferGeom, this.neuronShaderMaterial );
	//this.neuronParticles = new THREE.Points( this.neuronsGeom, this.neuronMaterials );
	//this.neuronParticles = new THREE.Points( this.neuronsGeom, new THREE.PointsMaterial({
	//	size:15, 
	//	vertexColors: THREE.VertexColors}));
		//map:this.spriteTextureNeuron}) );
	this.meshComponents.add( this.neuronParticles );

	//console.log(this.neuronsBufferGeom.getAttribute('size').array);
	console.log(this.neuronParticles.material)

	this.neuronsBufferGeom.attributes.position.needsUpdate = true;
	this.neuronShaderMaterial.needsUpdate = true;
	//this.neuronPointsMaterial.needsUpdate = true;
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
		//attributes: this.axonAttributes,
		vertexShader: null,
		fragmentShader: null,
		blending: THREE.AdditiveBlending,
		depthTest: false,
		transparent: true
	} );

	//this.axonMesh = new THREE.Line( this.axonGeom, this.axonShaderMaterial, THREE.LinePieces );
	this.axonMesh = new THREE.Line( this.axonGeom, this.axonShaderMaterial, THREE.LineSegments );
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
		//attributes: this.inhibitoryAxonAttributes,
		vertexShader: null,
		fragmentShader: null,
		blending: THREE.AdditiveBlending,
		depthTest: false,
		transparent: true
	} );

	//this.inhibitoryAxonMesh = new THREE.Line( this.inhibitoryAxonGeom, this.inhibitoryAxonShaderMaterial, THREE.LinePieces );
	this.inhibitoryAxonMesh = new THREE.Line( this.inhibitoryAxonGeom, this.inhibitoryAxonShaderMaterial, THREE.LineSegments );
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
NeuralNetwork.prototype.initFromGraph = function ( my_url, layout,colorscheme ){

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
    }else if(colorscheme == 'EI'){
        this.neuronColor = '#ffffff';
        this.inhibitoryNeuronColor = '#13344a';
        this.axonColor = '#4d3410';
        this.inhibitoryAxonColor = '#004f70';
    }
	this.neuronColorRGB = this.hextoRgb(this.neuronColor);
	this.inhibitoryNeuronColorRGB = this.hextoRgb(this.inhibitoryNeuronColor);
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
            n = new Neuron( 1*graph.nodes[i]['x'], 
                            1*graph.nodes[i]['y'],
                            1*graph.nodes[i]['z'] );
        } else {
            // if no coord found, average previous two 
            //[x,y,z] = this.getLayout(i,neuronNum, gridDim);
            //console.log(x,y,z);
            [x,y,z] = [0,0,0];
            if(i > 2){
                x = (this.components.neurons[i-1].x + this.components.neurons[i-2].x ) / 2;
                y = (this.components.neurons[i-1].y + this.components.neurons[i-2].y ) / 2;
                z = (this.components.neurons[i-1].z + this.components.neurons[i-2].z ) / 2;
            }

            n = new Neuron(x,y,z);
        }

        n.toggleEI(EI[i]);
        //n.firingRate = 100*THREE.Math.randFloat(0.1, 0.3);
        this.components.neurons.push( n );
		//this.neuronsGeom.vertices.push( n );

        //logger += graph.nodes[i]['z'];

    }
    this.numActiveNeurons = neuronNum;
    // prepare reserved neuron
    console.log(this.settings.maxNeurons);

	var bufferNeuronColors = new Float32Array(this.settings.maxNeurons*3);
	var bufferNeuronPositions = new Float32Array(this.settings.maxNeurons*3);
	var bufferNeuronSizes= new Float32Array(this.settings.maxNeurons);

	for ( i = 0; i < this.components.neurons.length; i++ ) {
		bufferNeuronPositions[i*3] = this.components.neurons[i].x;
		bufferNeuronPositions[i*3+1] = this.components.neurons[i].y;
		bufferNeuronPositions[i*3+2] = this.components.neurons[i].z;

		bufferNeuronColors[i*3] = this.neuronColorRGB[0];
		bufferNeuronColors[i*3+1] = this.neuronColorRGB[1];
		bufferNeuronColors[i*3+2] = this.neuronColorRGB[2]; 

		bufferNeuronSizes[ i ] = THREE.Math.randFloat( 10*0.75, 10*3.0 ); // initial neuron size
	}

	this.neuronsBufferGeom.addAttribute( 'color', new THREE.BufferAttribute( bufferNeuronColors, 3 ) );
	this.neuronsBufferGeom.addAttribute( 'position', new THREE.BufferAttribute( bufferNeuronPositions, 3 ) );
	this.neuronsBufferGeom.addAttribute( 'size', new THREE.BufferAttribute(bufferNeuronSizes, 1 ) );
	this.neuronsBufferGeom.computeBoundingSphere();

	console.log(this.neuronsBufferGeom.attributes);

	this.neuronParticles = new THREE.Points( this.neuronsBufferGeom, this.neuronShaderMaterial );
	this.meshComponents.add( this.neuronParticles );

	console.log(this.neuronParticles.material)

	this.neuronsBufferGeom.attributes.position.needsUpdate = true;
	this.neuronShaderMaterial.needsUpdate = true;
    console.log(this.components.neurons.length);


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
		//attributes: this.axonAttributes,
		vertexShader: null,
		fragmentShader: null,
		blending: THREE.AdditiveBlending,
		depthTest: false,
		transparent: true
	} );

	//this.axonMesh = new THREE.Line( this.axonGeom, this.axonShaderMaterial, THREE.LinePieces );
	this.axonMesh = new THREE.Line( this.axonGeom, this.axonShaderMaterial, THREE.LineSegments );
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
		//attributes: this.inhibitoryAxonAttributes,
		vertexShader: null,
		fragmentShader: null,
		blending: THREE.AdditiveBlending,
		depthTest: false,
		transparent: true
	} );

	//this.inhibitoryAxonMesh = new THREE.Line( this.inhibitoryAxonGeom, this.inhibitoryAxonShaderMaterial, THREE.LinePieces );
	this.inhibitoryAxonMesh = new THREE.Line( this.inhibitoryAxonGeom, this.inhibitoryAxonShaderMaterial, THREE.LineSegments );
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
function swc_parser(swc_file) {
    // split by lines
    var swc_ar = swc_file.split("\n");
    var swc_json = {};
 
    var float = '-?\\d*(?:\\.\\d+)?';
    var pattern = new RegExp('^[ \\t]*(' + [
       '\\d+',   // index
       '\\d+',  // type
       float,    // x
       float,    // y
       float,    // z
       float,    // radius
       '-1|\\d+' // parent
    ].join(')[ \\t]+(') + ')[ \\t]*$', 'm');
 
    swc_ar.forEach(function (e) {
       // if line is good, put into json
       var match = e.match(pattern);
       if (match) {
          swc_json[match[1]] = {
             'type': parseInt(match[2]),
             'x': parseFloat(match[3]),
             'y': parseFloat(match[4]),
             'z': parseFloat(match[5]),
             'radius': parseFloat(match[6]),
             'parent': parseInt(match[7]),
          };
       }
    });
 
    // return json
    return swc_json;
 }
NeuralNetwork.prototype.initFromSWC = function ( layout, colorscheme ) {
    ;
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
		//this.neuronAttributes.size.value[ii] = n.firingRate / 20 + 1;
		this.neuronsBufferGeom.attributes.size.array[ii] = n.firingRate / 20 + 1
		//this.neuronMaterials.size[ii]= n.firingRate / 20 + 1;
		//this.neuronsGeom.attributes.size.array[ii] = 1000* n.firingRate / 20 + 1;
		//console.log("geomsize changed");
		//n.receivedSignal = false; // if neuron recieved signal but still in delay reset it
	}
    this.dataRecord.push(currentFiringRate);


    // reset all neurons and when there is no signal and trigger release signal at random neuron
    /*
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
    */

	//this.neuronAttributes.size.needsUpdate = true;
	this.neuronsBufferGeom.attributes.size.needsUpdate = true;
    //this.neuronsGeom.attributes.size.needsUpdate = true;
    this.axonGeom.attributes.opacity.needsUpdate = true;
	// update particle pool vertices
	//this.particlePool.update();

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
/*
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
*/
NeuralNetwork.prototype.updateInfo = function () {
	this.numNeurons = this.numActiveNeurons;
	this.numEAxons = this.numActiveExcitatoryAxons;
    this.numIAxons = this.numActiveInhibitoryAxons;

	//this.numSignals = this.components.allSignals.length;
};

NeuralNetwork.prototype.updateSettings = function () {

	this.neuronUniforms.opacity.value = this.neuronOpacity;
	this.neuronColorRGB = this.hextoRgb(this.neuronColor)
	this.inhibitoryNeuronColorRGB = this.hextoRgb(this.inhibitoryNeuronColor)

	for ( i = 0; i < this.components.neurons.length; i++ ) {
        if( this.components.neurons[i].excitatory ) {
		    //this.neuronAttributes.color.value[ i ].setStyle( this.neuronColor ); // initial neuron color
		    this.neuronsBufferGeom.attributes.color.array[ i*3 ] = this.neuronColorRGB[0]; // initial neuron color
		    this.neuronsBufferGeom.attributes.color.array[ i*3+1 ] = this.neuronColorRGB[1]; // initial neuron color
		    this.neuronsBufferGeom.attributes.color.array[ i*3+2 ] = this.neuronColorRGB[2]; // initial neuron color
        }else{
		    //this.neuronAttributes.color.value[ i ].setStyle( this.inhibitoryNeuronColor ); // initial neuron color
		    this.neuronsBufferGeom.attributes.color.array[ i*3 ] = this.inhibitoryNeuronColorRGB[0]; // initial neuron color
		    this.neuronsBufferGeom.attributes.color.array[ i*3+1 ] = this.inhibitoryNeuronColorRGB[1]; // initial neuron color
		    this.neuronsBufferGeom.attributes.color.array[ i*3+2 ] = this.inhibitoryNeuronColorRGB[2]; // initial neuron color
        }
	}
	//this.neuronAttributes.color.needsUpdate = true;
	this.neuronsBufferGeom.attributes.color.needsUpdate = true;
	this.neuronsBufferGeom.attributes.size.needsUpdate = true;

	this.neuronUniforms.sizeMultiplier.value = this.neuronSizeMultiplier;

	this.axonUniforms.color.value.set( this.axonColor );
	this.axonUniforms.opacityMultiplier.value = this.axonOpacityMultiplier;
	this.inhibitoryAxonUniforms.color.value.set( this.inhibitoryAxonColor );
	this.inhibitoryAxonUniforms.opacityMultiplier.value = this.axonOpacityMultiplier;

	//this.particlePool.updateSettings();


};

NeuralNetwork.prototype.testChangOpcAttr = function () {

	var opcArr = this.axonGeom.attributes.opacity.array;
	for ( var i = 0; i < opcArr.length; i++ ) {
		opcArr[ i ] = THREE.Math.randFloat( 0, 0.5 );
	}
	this.axonGeom.attributes.opacity.needsUpdate = true;
};