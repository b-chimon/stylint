'use strict';

var eqEndRe = /=$|=\s$/;

// depending on settings, enforce of disallow @block when defining block vars
module.exports = function blocks(line) {
	if ( line.indexOf('=') === -1 ) { return; }

	var block;

	// if = ends the line and not a block var or hash
	if ( line.indexOf('@block') === -1 && eqEndRe.test( line ) ) {
		block = false;
	}
	else if ( line.indexOf('@block') !== -1 ) {
		block = true;
	}

	if ( this.state.conf === 'always' && !block ) {
		this.msg('block variables must include @block');
	}
	else if ( this.state.conf === 'never' && block ) {
		this.msg('@block is not allowed');
	}

	return block;
};
