'use strict';

////////////////////
// SiriWave9Curve //
////////////////////

/**
https://github.com/caffeinalab/siriwavejs/

The MIT License (MIT)

Copyright (c) 2015 Caffeina

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
**/

function SiriWave9Curve(opt) {
	opt = opt || {};
	this.controller = opt.controller;
	this.color = opt.color;
	this.tick = 0;

	this.respawn();
}

SiriWave9Curve.prototype.respawn = function() {
	this.amplitude = 0.3 + Math.random() * 0.7;
	this.seed = Math.random();
	this.open_class = 2+(Math.random()*3)|0;
};

SiriWave9Curve.prototype.equation = function(i) {
	var p = this.tick;
	var y = -1 * Math.abs(Math.sin(p)) * this.controller.amplitude * this.amplitude * this.controller.MAX * Math.pow(1/(1+Math.pow(this.open_class*i,2)),2);
	if (Math.abs(y) < 0.001) {
		this.respawn();
	}
	return y;
};

SiriWave9Curve.prototype._draw = function(m) {
	this.tick += this.controller.speed * (1-0.5*Math.sin(this.seed*Math.PI));

	var ctx = this.controller.ctx;
	ctx.beginPath();

	var x_base = this.controller.xOffset + this.controller.width/2 + (-this.controller.width/4 + this.seed*(this.controller.width/2) );
	var y_base = this.controller.yOffset + this.controller.height/2;

	var x, y, x_init;

	var i = -3;
	while (i <= 3) {
		x = x_base + i * this.controller.width/4;
		y = y_base + (m * this.equation(i));
		x_init = x_init || x;
		ctx.lineTo(x, y);
		i += 0.01;
	}

	var h = Math.abs(this.equation(0));
	var gradient = ctx.createRadialGradient(x_base, y_base, h*1.15, x_base, y_base, h * 0.3 );
	gradient.addColorStop(0, 'rgba(' + this.color.join(',') + ',0.7)');
	gradient.addColorStop(1, 'rgba(' + this.color.join(',') + ',0.3)');

	ctx.fillStyle = gradient;

	ctx.lineTo(x_init, y_base);
	ctx.closePath();

	ctx.fill();
};

SiriWave9Curve.prototype.draw = function() {
	this._draw(-1);
	this._draw(1);
};


//////////////
// SiriWave //
//////////////

function SiriWave9(opt) {
	opt = opt || {};

	this.tick = 0;
	this.run = false;

	// UI vars

	this.ratio = opt.ratio || 1;
	this.width = this.ratio * (opt.width || 280);
	this.height = this.ratio * (opt.height || 100);

	this.bgColor = opt.bgColor || undefined;
	this.colors = opt.colors || [ [245,245,41], [245,204,41], [219,188,64] ];

	// position on the canvas
	this.xOffset = opt.xOffset || 0;
	this.yOffset = opt.yOffset || 0;

	this.MAX = this.height;

	this.speed = 0.3;
	this.amplitude = opt.amplitude || 1;

	// Interpolation

	this.speedInterpolationSpeed = opt.speedInterpolationSpeed || 1;
	this.amplitudeInterpolationSpeed = opt.amplitudeInterpolationSpeed || 0.2;

	this._interpolation = {
		speed: this.speed,
		amplitude: this.amplitude
	};

	// Canvas
	this.canvas = opt.canvas;
	if (!this.canvas) {
		this.canvas = document.createElement('canvas');
		this.canvas.width = this.width;
		this.canvas.height = this.height;

		if (opt.cover) {
			this.canvas.style.width = this.canvas.style.height = '100%';
		} else {
			this.canvas.style.width = (this.width / this.ratio) + 'px';
			this.canvas.style.height = (this.height / this.ratio) + 'px';
		};

		this.container = opt.container || document.body;
		this.container.appendChild(this.canvas);
	}
	this.ctx = opt.ctx ? opt.ctx : this.canvas.getContext('2d');

	// Create curves

	this.curves = [];
	for (var i = 0; i < this.colors.length; i++) {
		var color = this.colors[i];
		for (var j = 0; j < (3 * Math.random())|0; j++) {

			this.curves.push(new SiriWave9Curve({
				controller: this,
				color: color
			}));
		}
	}

	if (opt.autostart) {
		this.start();
	}
}

SiriWave9.prototype._interpolate = function(propertyStr) {
	var increment = this[ propertyStr + 'InterpolationSpeed' ];

	if (Math.abs(this._interpolation[propertyStr] - this[propertyStr]) <= increment) {
		this[propertyStr] = this._interpolation[propertyStr];
	} else {
		if (this._interpolation[propertyStr] > this[propertyStr]) {
			this[propertyStr] += increment;
		} else {
			this[propertyStr] -= increment;
		}
	}
};

SiriWave9.prototype._clear = function() {
	// if (!this.bgColor) return;
	// this.ctx.globalCompositeOperation = 'destination-out';
	// this.ctx.strokeStyle = this.bgColor;

	this.ctx.fillStyle = this.bgColor;
	this.ctx.fillRect(this.xOffset, Math.floor(this.yOffset - this.height/2 - 1), this.width, Math.floor(this.height*2 + 1));
	// console.log('clear y position: ', this.yOffset - this.height/2 - 1);
	// console.log('height', this.height, 'yoffset', this.yOffset);
	// this.ctx.globalCompositeOperation = 'lighter';
};

SiriWave9.prototype._draw = function() {
	for (var i = 0, len = this.curves.length; i < len; i++) {
		this.curves[i].draw();
	}
};

SiriWave9.prototype._startDrawCycle = function() {
	if (this.run === false) return;

	this._clear();

	// Interpolate values
	this._interpolate('amplitude');
	this._interpolate('speed');

	this._draw();
	this.phase = (this.phase + Math.PI*this.speed) % (2*Math.PI);

	// if (window.requestAnimationFrame) {
	// 	window.requestAnimationFrame(this._startDrawCycle.bind(this));
	// } else {
	// 	setTimeout(this._startDrawCycle.bind(this), 20);
	// }
};

SiriWave9.prototype.start = function() {
	this.tick = 0;
	this.run = true;
	this._startDrawCycle();
};

SiriWave9.prototype.drawFrame = function() {
	this._startDrawCycle();
}

SiriWave9.prototype.stop = function() {
	this.tick = 0;
	this.run = false;
};

SiriWave9.prototype.setSpeed = function(v, increment) {
	this._interpolation.speed = v;
};

SiriWave9.prototype.setNoise = SiriWave9.prototype.setAmplitude = function(v) {
	this._interpolation.amplitude = Math.max(Math.min(v, 1), 0);
};

// SiriWave9.prototype.COLORS = [
// 	[245,245,41],
// 	[245,204,41],
// 	[219,188,64]
// ];

if (typeof define === 'function' && define.amd) {
	define(function(){ return SiriWave9; });
} else {
	SiriWave9 = SiriWave9;
}

module.exports = SiriWave9;
