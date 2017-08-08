let app = {
	context: null, // audio context instance
	tempo: 100,
	stepIntervalMs: null,
	pos: 1,
	kit : {}, //empty kit object (gets populated from kits.json on init)

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

	loadSounds: function(obj) {

		// iterate over sounds obj
		for (var i in obj) {
		if (obj.hasOwnProperty(i)) {
			// load sound
			this.loadSoundObj(obj[i]);
			console.log(i + ' loaded');
			}
		}
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

	padClick: function(el) {
		$(el).toggleClass('active');
	},

	transportBtnClick: function(el) {
		var btnFunc = $(el).attr('data-transport');
		// $(el).toggleClass('active');
		if(btnFunc == "play") {
			this.playSequence();
		}
		else if (btnFunc == "stop") {
			this.stopSequence();
		}
	},

	init: function() {
		$('.tempo').append(app.tempo);
		this.createContext();

		$.getJSON("json/kits.json", function(json) {
			this.kit = json;
			console.log(this.kit); // this will show the info it in firebug console
		})
			.done(function(data) {
				app.loadSounds(this.kit);
			});

		this.stepIntervalMs = 60000 / this.tempo / 4;

		$('.pad').on('click', function() {
			app.padClick(this);
		});

		$('.btn').on('click', function() {
			app.transportBtnClick(this);
		});

	}
}

$(document).ready(function() {
	app.init();
});
