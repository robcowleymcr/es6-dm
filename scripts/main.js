var app = {
	context: null, // audio context instance
	swingIntervalMs: null,
	swingIntervalA: null,
	swingIntervalB: null,
	tempo: 124, //tempo in BPM
	swing: true, //specifies whether pattern plays back with swing
	swingAmount: 69, //percentage
	current: 0, //current position in sequence
	seqLength: 16, //number of steps in sequence
	play: false,
	loop: true,
	swing: false,
	softHitVol: 0.4,
	hardHitVol: 1.0,
	kit : {}, // empty kit object (gets populated from kits.json on init)
	sequence : {
		kick:  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
		snr:   [0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0]
	},

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
				console.log(`${i} loaded`);
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

	playSequence: function() {
		for(var drum in app.kit) {
			var val = app.sequence[drum][app.current]; //1 or zero depending on position in sequence
			var buff = app.kit[drum].buffer;

			app.highlightGridPosition(drum);
			app.stepCounter();

			//calls playSnd if sequence value is 1 or 2
			// if(val == 2) {
			// 	app.playSnd(buff, app.hardHitVol);
			// }
			// else if(val == 1) {
			// 	app.playSnd(buff, app.softHitVol);
			// }
			if(val == 1) {
				app.playSnd(buff);
			}
		}
		if(!app.swing) {
			if((++app.current < app.seqLength)) {
				setTimeout(app.playSequence, app.stepIntervalMs);
			}
			else if (app.loop == 1) {
				setTimeout(app.playSequence, app.stepIntervalMs);
				app.current = 0;
			}
		}
		else {
			if((++app.current < app.seqLength)) {
				if(app.current % 2 == 0) {
					setTimeout(app.playSequence, app.swingIntervalB);
				}
				else {
					setTimeout(app.playSequence, app.swingIntervalA);
				}
			}
			else if (app.loop == 1) {
				setTimeout(app.playSequence, app.swingIntervalB);
				app.current = 0;
			}
		}
	},

	padClick: function(el) {
		var padNumber = el.innerHTML - 1;
		var drum = el.getAttribute('data-drum');
		var sequenceArrLane = app.sequence[drum];
		$(el).toggleClass('active');
		if(sequenceArrLane[padNumber] == 1) {
			sequenceArrLane[padNumber] = 0;
		}
		else {
			sequenceArrLane[padNumber] = 1;
		}
	},

	populateGridHtml: function() {
		var kitObj = this.kit;
		var grid = document.getElementById('grid');

		for(var a in kitObj) {
			var ul = document.createElement('ul');
			var laneLabel = document.createElement('li');
			var laneLabelText = document.createTextNode(a);

			ul.className = 'pads';
			ul.dataset.lane = a;
			grid.appendChild(ul);

			var newUl = document.querySelector(`[data-lane="${a}"]`);

			laneLabel.className = 'pad-label';
			laneLabel.appendChild(laneLabelText);
			newUl.appendChild(laneLabel);

			for(var b = 1; b < 17; b++) {
				var pad = document.createElement('li');
				var text = document.createTextNode(b);

				pad.className = 'pad';
				pad.appendChild(text);
				pad.addEventListener('click', function() {
					app.padClick(this);
				});
				pad.dataset.drum = a;
				ul.appendChild(pad);
			}
		}
		this.populateLanes();
	},

	populateLanes: function() {
		for(var drum in app.sequence) {
			var currentLane = app.sequence[drum];
			var seqLanePadEls = document.querySelectorAll(`[data-drum="${drum}"]`);
			var length = currentLane.length;
			for(var i = 0; i < length; i++) {
				if(currentLane[i] == 1) {
					seqLanePadEls[i].className += ' active';
				}
			}
		}
	},

	init: function() {
		$('.tempo').append(app.tempo);
		this.createContext();

		$.getJSON('json/kits.json', function(json) {
			app.kit = json;
			console.log('json file loaded');
		}).done(function(data) {
			app.loadSounds(app.kit);
		});
		this.stepIntervalMs = 60000 / this.tempo / 4;
	}
}

$(document).ready(function() {
	app.init();
});