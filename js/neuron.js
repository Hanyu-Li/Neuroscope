// Neuron ----------------------------------------------------------------
function Neuron( x, y, z ) {

	this.ID = 0;
	this.connection = [];
	//this.receivedSignal = false;
	//this.lastSignalRelease = 0;
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
/*
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
*/
Neuron.prototype.reset = function () {

	//this.receivedSignal = false;
	//this.lastSignalRelease = 0;
	//this.releaseDelay = 0;
	this.fired = false;
	this.firedCount = 0;

};