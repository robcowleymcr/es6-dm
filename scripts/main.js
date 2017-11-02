var app = {
	context: null, // audio context instance
	stepIntervalMs: null,
	swingIntervalA: null,
	swingIntervalB: null,
	filterControlVal: 100, // default value for filter knob
	tempo: 124, // tempo in BPM
	swing: false, // specifies whether pattern plays back with swing
	swingAmount: 69, // percentage
	current: 0, // current position in sequence
	seqLength: 16, // number of steps in sequence
	play: false,
	loop: true,
	swing: true,
	softHitVol: 0.4,
	hardHitVol: 1.0,
	kit : {}, // empty kit object (gets populated from kits.json on init)
	sequence : {
		kick:  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
		snr:   [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
		c_hat: [0, 1, 1, 0, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0],
		o_hat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
	},

	logSeq: function() {},

	calcStepInterval: function() {

		var step = app.stepIntervalMs;
		var a = (app.swingAmount / 100) * 0.4; // 0.4 sets upper maximum amount of swing (any more sounds too loose)
		// console.log(app.swingIntervalA);
		// console.log(app.swingIntervalB);
		app.stepIntervalMs = Math.round(60000 / app.tempo / (app.seqLength / 4));
		app.swingIntervalA = Math.round(step + (step * a));
		app.swingIntervalB = Math.round(step - (step * a));
		console.log(app.swingIntervalA);
		console.log(app.swingIntervalB);
	},

	createContext: function() {
		try {
			// still needed for Safari
			window.AudioContext = window.AudioContext || window.webkitAudioContext;
			// create an AudioContext
			context = new AudioContext();
			filter = context.createBiquadFilter();
			filter.type = 3;
			filter.frequency.value = 20000;
			filter.Q.value = 0;
			filter.gain.value = 0;
			filter.connect(context.destination);

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

	resetPattern: function() {
		var seq = app.sequence;
		for(var a in seq) {
			for(var i = 0; i < seq[a].length; i++) {
				app.sequence[a][i] = 0;
			}
		}
		console.dir(app.sequence);
		app.populateLanes();
	},

	playSequence: function() {
		console.log(app.swing);
		if(app.play == true) {
			for(var drum in app.kit) {
				var val = app.sequence[drum][app.current]; //1 or zero depending on position in sequence
				var buff = app.kit[drum].buffer;

				app.highlightGridPosition();

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
		}
	},

	stopSequence: function() {
		app.current = 0;
		app.highlightGridPosition();
	},

	highlightGridPosition: function(drum) {
		var indicatorEls = document.querySelectorAll('.indicator');
		var currentPosIndicator = indicatorEls[app.current];
		var pads = document.querySelectorAll('[data-drum]');

		for(var i = 0; i < indicatorEls.length; i++) {
			var classList = indicatorEls[i].classList;
			classList.remove('pos');
		}
		currentPosIndicator.classList.add('pos');
	},

	playSnd: function(buffer) { // plays sound buffer when called
		var source = context.createBufferSource();
		source.buffer = buffer;
		source.connect(filter);
		source.start(0);
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
			var laneLabelText = document.createTextNode(kitObj[a].label);

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
					seqLanePadEls[i].classList.add('active');
				}
				else {
					seqLanePadEls[i].classList.remove('active');
				}
			}
		}
	},

	init: function() {
		$('.tempo').append(app.tempo);
		$('[data-dial="filter"]').knob({
			'min': 0,
			'max': 100,
			'angleOffset': -140,
			'angleArc': 280,
			'bgColor': '#ebebeb',
			'fgColor': '#666666',
			'change': 	function (v) {
				// position will be between 0 and 100
				var minp = 0;
				var maxp = 100;

				// The result should be between 20 an 20000
				var minv = Math.log(20);
				var maxv = Math.log(20000);

				// calculate adjustment factor
				var scale = (maxv-minv) / (maxp-minp);
				var logVal = Math.exp(minv + scale*(v-minp));

				filter.frequency.value = Math.floor(logVal);
			},
			'draw': function() {
				$(this.i).css('font-size', '20pt');
			},
			'format': function(v) {
				return v + '%';
			}
		});
		$('[data-dial="tempo"]').knob({
			'min': 40,
			'max': 220,
			'angleOffset': -140,
			'angleArc': 280,
			'bgColor': '#ebebeb',
			'fgColor': '#666666',
			'change': function (v) {
				var roundedVal = Math.floor(v);
				app.tempo = v;
				app.calcStepInterval();
			},
			'draw': function() {
				$(this.i).css('font-size', '20pt');
			},
			'format': function(v) {
				return v + 'bpm';
			}
		});
		$('[data-dial="swing"]').knob({
			'min': 0,
			'max': 100,
			'angleOffset': -140,
			'angleArc': 280,
			'bgColor': '#ebebeb',
			'fgColor': '#666666',
			'change': 	function (v) {
				app.swingAmount = v;
				app.calcStepInterval();
			},
			'draw': function() {
				$(this.i).css('font-size', '20pt');
			},
			'format': function(v) {
				return v + '%';
			}
		});
		document.querySelector('[data-button="play"]').addEventListener('click', function(e) {
			if(app.play !== true) {
				app.play = true;
				app.playSequence();
				e.target.classList.add('pressed');
				document.querySelector('[data-button="stop"]').classList.remove('pressed');
			}
		});
		document.querySelector('[data-button="pause"]').addEventListener('click', function() {
			app.play = false;
			document.querySelector('[data-button="play"]').classList.remove('pressed');
		});
		document.querySelector('[data-button="stop"]').addEventListener('click', function(e) {
			if(app.play == true)
			app.play = false;
			app.stopSequence();
			document.querySelector('[data-button="play"]').classList.remove('pressed');
			e.target.classList.add('pressed');
		});
		document.querySelector('[data-button="reset"]').addEventListener('click', function() {
			app.resetPattern();
		});

		this.createContext();

		$.getJSON('json/kits.json', function(json) {
			app.kit = json;
			console.log('json file loaded');
		}).done(function(data) {
			app.loadSounds(app.kit);
		});
		this.stepIntervalMs = 60000 / this.tempo / 4;
		this.calcStepInterval();
	}
}

$(document).ready(function() {
	app.init();
});