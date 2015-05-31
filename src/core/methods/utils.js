var fs                = require('fs');
var async             = require('async');
var glob              = require('glob').Glob;
var osType            = require('os').type().toLowerCase();
var pathIsAbsolute    = require('path-is-absolute');
var stampit           = require('stampit');


/**`
 * @description collection of utility functions for the linter
 * @return {Object} [i expose the modules to the entire app, so we only do it once]
 */
module.exports = stampit().methods({
	checkPrefix: function(prop, css, valid) {
		return valid.prefixes.some(function(prefix) {
			return prop === prefix + css;
		});
	},

	checkPseudo: function(prop, html, valid) {
		return valid.pseudo.some(function( pseudo ) {
			return prop === html + pseudo;
		});
	},

	emojiAllClear: function( emoji, os ) {
		var emojiClear = '';
		if ( emoji || this.config.emoji === true ) {
			if ( os || osType.indexOf('windows') >= 0 ) {
				emojiClear = ':)';
			}
			else {
				emojiClear = '\uD83D\uDC4D  ';
			}
		}
		return emojiClear;
	},

	emojiWarning: function( emoji, os ) {
		var emojiWarning = '';
		if ( emoji || this.config.emoji === true ) {
			if ( os || osType.indexOf('windows') >= 0 ) {
				emojiWarning = ':(';
			}
			else {
				emojiWarning = '\uD83D\uDCA9  ';
			}
		}
		return emojiWarning;
	},

	getFiles: function( dir ) {
		if ( typeof dir !== 'string' ) {
			throw new TypeError( 'getFiles err. Expected string, but received: ' + typeof dir );
		}

		glob(dir, {}, function( err, files ) {
			if ( err ) { throw err; }
			this.cache.filesLen = files.length - 1;
			this.cache.files = files;
			return async.map( this.cache.files, fs.readFile, this.parse.bind( this ) )
		}.bind( this ));
	},

	// takes a string, outputs said string + reporter boilerplate
	// @TODO hook up reporter boilerplate
	msg: function(msg) {
		var arr;
		this.state.severity === 'Warning' ? arr = this.cache.warnings : arr = this.cache.errs;
		return arr.push( this.state.severity + ': ' + msg + '\nFile: ' + this.cache.file + '\nLine: ' + this.cache.lineNo + ': ' + this.cache.line.trim() );
	},

	resetOnChange: function( newPath ) {
		this.state.path = newPath;
		this.cache.warnings = [];
		this.cache.alphaCache = [];
		this.cache.selectorCache = [];
		this.cache.rootCache = [];
		this.cache.zCache = [];
		this.cache.prevLine = '';
		this.cache.prevFile = '';
		this.cache.prevContext = 0;

		if ( this.state.watching ) {
			return this.read();
		}
	},

	setConfig: function( potentialPath ) {
		if ( typeof potentialPath !== 'string' ) {
			throw new TypeError('setConfig err. Expected string, but received: ' + typeof dir);
		}

		var path = pathIsAbsolute( potentialPath ) ? potentialPath : process.cwd() + '/' + potentialPath;
		return JSON.parse( fs.readFileSync( path ) );
	},

	setContext: function( line ) {
		this.state.prevContext = this.state.context;
		var i = 0;
		var context = 0;
		var whitespace = 0;
		var arr = [];

		if ( this.config.indentPref === 'tabs' ) {
			while ( line.charAt( i++ ) === '\t' ) {
				context++;
			}
		}
		else if ( typeof this.config.indentPref === 'number' ) {
			arr = line.split(/[\s\t]/);
			arr.forEach(function( val, i ) {
				if ( arr[i].length === 0 ) {
					whitespace++; // spaces or tabs
				}
				else {
					context = whitespace / this.config.indentPref;
				}
			}.bind(this));
		}

		return context.toString();
	},

	// strip all whitespace from a string, customizable regex, returns new array
	splitAndStrip: function( re, str ) {
		return str.split( re ).filter(function( str ) {
			return str.length > 0;
		});
	},

	// removes line comments and interpolation
	trimLine: function( line ) {
		this.state.hasComment = false;
		var startsWithCommentRe = /(^\/\/)/;

		// strip line comments
		if ( line.indexOf('//') !== -1 &&
			!startsWithCommentRe.test( line.trim() ) ) {

			this.cache.comment = line.slice( line.indexOf('//'), line.length );
			line = line.slice( 0, line.indexOf('//') - 1 );
			this.state.hasComment = true;
		}

		// strip interpolated variables
		return line.replace(/{\S+}/, '');
	}
});
