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
			console.log('audio context created');
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
		var grid = document.getElementById("grid");

		for(var a in kitObj) {
			var ul = document.createElement("ul");
			var laneLabel = document.createElement("li");
			var laneLabelText = document.createTextNode(a);

			ul.className = 'pads';
			ul.dataset.lane = a;
			grid.appendChild(ul);

			var newUl = document.querySelector('[data-lane="' + a + '"]');

			laneLabel.className = 'pad-label';
			laneLabel.appendChild(laneLabelText);
			newUl.appendChild(laneLabel);

			for(var b = 1; b < 17; b++) {
				var pad = document.createElement("li");
				var text = document.createTextNode(b);

				pad.className = 'pad';
				pad.appendChild(text);
				pad.dataset.drum = a;
				ul.appendChild(pad);
			}
		}
		$('.pad').on('tap', function() {
			app.padClick(this);
		});
	},

	padClick: function(el) {
		$(el).toggleClass('active');
	},

	init: function() {
		$('.tempo').append(app.tempo);
		this.createContext();

		$.getJSON('json/kits.json', function(json) {
			app.kit = json;
			console.log('json file loaded');
		})
			.done(function(data) {
				app.loadSounds(app.kit);
			});
		this.stepIntervalMs = 60000 / this.tempo / 4;
	}
}

$(document).ready(function() {
	app.init();
});