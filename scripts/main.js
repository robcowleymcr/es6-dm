let app = {
	context: null, // audio context instance
	tempo: 100,
	stepIntervalMs: null,
	pos: 1,
	totalSteps: 16,
	kit : {}, //empty kit object (gets populated from kits.json on init)
	sequence : [], //gets populated dynamically on init

	createContext: function() {
		try {
			// still needed for Safari
			window.AudioContext = window.AudioContext || window.webkitAudioContext;
			// create an AudioContext
			context = new AudioContext();
			console.log('context created');
		} catch(e) {
			// API not supported
			throw new Error('Web Audio API not supported.');
		}
	},

	loadSounds: function(obj, callback) {
		// iterate over sounds obj
		for (var i in obj) {
			if (obj.hasOwnProperty(i)) {
				// load sound
				this.loadSoundObj(obj[i]);
				console.log(i + ' loaded');
			}
		}
		this.populateGridHtml();
	},

	loadSoundObj: function(obj) {
		var request = new XMLHttpRequest();

		request.open('GET', obj.src, true);
		request.responseType = 'arraybuffer';
		request.onload = function() {
		// request.response is encoded... so decode it now
		context.decodeAudioData(request.response, function(buffer) {
			obj.buffer = buffer;
		}, function(err) {
			throw new Error(err);
		});
		}
		request.send();
	},

	populateGridHtml: function() {
		const kitObj = this.kit;
		const kitSize = Object.keys(kitObj).length;
		const indicatorsUl = $('.indicators');
		const padsUl = $('.pads');
		const grid = $('.grid');

		for(var i = 0; i < this.totalSteps; i++) {
			indicatorsUl.append('<li class="indicator"></li>');
			padsUl.append('<li class="pad">' + (i + 1) + '</li>');
		}
		console.log('initialised sequencer grid');
	},

	padClick: function(el) {
		$(el).toggleClass('active');
	},

	init: function() {
		$('.tempo').append(app.tempo);
		this.createContext();

		$.getJSON("json/kits.json", function(json) {
			app.kit = json;
		})
			.done(function(data) {
				app.loadSounds(app.kit);
				this.populateGridHtml;
			});

		this.stepIntervalMs = 60000 / this.tempo / 4;

		$('.pad').on('click', function() {
			app.padClick(this);
		});
	}
}

$(document).ready(function() {
	app.init();
});