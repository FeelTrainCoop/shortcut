'use strict';

const SiriWave9 = require('./siriwave9');

var text, textSaid, bgRect, raster, textGroup, epNumText;
var easing = 0.2;

/*
  - set font
  - set/create canvas
  - set colors
  - drawImage(s)
 */

/**
 *  @param {number} width in pixels
 *  @param {number} height in pixels
 *  @param {string} style the style of animation and/or colorscheme
 *  @param {string} footerImgBase64 the base64 data of the footer image
 *  @param {string} fontFamily the CSS font family for rendering text
 *  @param {object} paper instance of paper.js
 */
var Animator = function(opts) {
  opts = opts || {};

  this.width = opts.width || 400;
  this.height = opts.height || 400;
  this.fontFamily = opts.fontFamily || 'sans-serif';
  this.fontFamilyEpNum = opts.fontFamilyEpNum || 'sans-serif';

  this.xPadding = 0.05;
  this.yPadding = 0.05; // text winds up at 5% of height

  this.textColor1 = opts.style.textColor1 || 'white';
  this.textColor2 = opts.style.textColor2 || '#432958'; // highlight color
  this.bgColor = opts.style.bgColor || '#e44226';
  this.waveColor = convertWaveColors(opts.style.waveColor) || [ [255,0,255], [245,204,41], [219,188,64] ];

  this.footerImgBase64 = opts.footerImgBase64;
  this.epNum = opts.showNumber;
  this.paper = opts.paper || window.paper;

  // overwrite paper.js draw loop
  // This hack was inspired by https://groups.google.com/forum/#!topic/paperjs/F1YRd8zQry4
  let originalDraw = this.paper.project.draw;
  this.paper.project.draw = (ctx, matrix, pixelRatio) => {
    originalDraw.apply(this.paper.project, [ctx, matrix, pixelRatio]);
    this._drawWaveform(this.amplitude);
  };

  this.waveform = this._initWaveform();
  this.waveform.start();
  this.initPaperObjects();

  this.amplitude = 0;
  this.reset();
};

Animator.prototype = {

  initPaperObjects() {
    bgRect = new this.paper.Path.Rectangle( new this.paper.Point(0, 0), this.width);
    bgRect.fillColor = this.bgColor;

    text = new this.paper.PointText(new this.paper.Point(0, 0));
    text.style = {
      fontFamily: this.fontFamily,
      // fontWeight: 600,
      fontSize: 0.086 * this.height,
      fillColor: this.textColor1
    };

    textSaid = new this.paper.PointText(new this.paper.Point(0, 0));
    textSaid.style = {
      fontFamily: this.fontFamily,
      // fontWeight: 600,
      fillColor: this.textColor2,
      fontSize: 0.086 * this.height,
      strokeColor: this.textColor2,
      strokeWeight: 1.5
    };

    textGroup = new this.paper.Group();

    // topRect
    new this.paper.Path.Rectangle({
      point: [0, 0],
      size: [this.width, this.yPadding*this.height],
      fillColor: this.bgColor,
      strokeColor: this.bgColor
    });

    // bottomRect
    new this.paper.Path.Rectangle({
      // point: [0, this.height/2],
      point: [0, this.height *(1-0.41) - (2.5*this.yPadding*this.height + 1)],
      size: [this.width, this.height * (0.41) + (2.5*this.yPadding*this.height + 1)],
      fillColor: this.bgColor,
      strokeColor: this.bgColor
    });

    // footer image must be 8% above bottom
    raster = new this.paper.Raster(this.footerImgBase64);
    raster.position = new this.paper.Point({
      x: this.width/2,
      y: this.height * 0.86
    });

    // episode number text
    const epNumFontSize = 0.05 * this.height;
    const epNumX = this.xPadding * this.width;
    const epNumY = this.height - this.yPadding * this.height - epNumFontSize/2.5;
    epNumText = new this.paper.PointText( new this.paper.Point(epNumX, epNumY));
    epNumText.style = {
      fontFamily: this.fontFamilyEpNum,
      fillColor: this.textColor1,
      fontSize: epNumFontSize
    };
    epNumText.fillColor.alpha = 0.4;
    epNumText.content = this.epNum ? `ep. ${this.epNum}` : '';

    // resize image (must wait until image has loaded in browser)
    if (typeof(window) !== 'undefined' && window.addEventListener) {
      window.addEventListener('load', () => {
        this._resize();
      });
    } else {
      this._resize();
    }

  },

  setRegion: function(startTime, duration, wordArray, peaksArray) {
    // calculate totalFrames
    // TO DO

    // reset text position
    // reset text easing
    this.reset();

    this.wordArray = wordArray;
    this.peaksArray = peaksArray;
    this.startTime = startTime;
    this.duration = duration;

    // draw new text
    this._initText();
    this._moveText();

    this.waveform.start();
  },

  reset: function() {
    this.wordIndex = 0;
    this.introOffset = this.width;
    this.pagingOffset = 0;
    this.currentLine = 0;
    this.amplitude = 0;
    textSaid.content = '';
  },

  step: function(pos) {

    // ease in the introOffset
    if (this.introOffset < 0.1) {
      this.introOffset = 0;
    } else {
      let dist = Math.abs(this.introOffset - 0);
      this.introOffset = this.introOffset - dist * easing;
    }

    // UPDATE
    // update text and waveform based on current playback position
    this.update(pos);

    // RENDER

    // draw waveform only if paper doesnt need to update anything else
    if (!this.paper.view._needsUpdate) {
      this._drawWaveform(this.amplitude);
    } else {
      this.paper.view._needsUpdate = true;
      // this.paper.view.update(true);
    }

  },

  update: function(pos) {
    this._updateText(pos);
    this._updateWaveformAmplitude(pos);
    this._moveText();
  },

  // aka draw
  // render: function() {
  //   this._drawText();
  // },

  _initText: function() {
    let wordArray = this.wordArray;

    let i = 0;
    let textWidth = this.width * 0.8;
    // let maxY = 0.75 * this.height;

    let lineCount = 1;


    // remove children from the group in case we're creating a new group
    textGroup.removeChildren();
    text.content = '';
    textSaid.content = '';

    while (i < wordArray.length) {
      let prevTextContent = text.content;

      let heading = i > 0 && wordArray[i].heading;
      let nextWord = wordArray[i] ? wordArray[i].text.trim() : ''

      if (heading) {
        // find y position
        let ySoFar = text.bounds.y + text.bounds.height;

        // add <hr> style line at ySoFar + text.fontSize * 0.75
        let hr = new this.paper.Path.Line({
          from: [this.width*0.25, ySoFar + text.fontSize * 0.75],
          to: [this.width*0.75, ySoFar + text.fontSize * 0.75], // use text.leading?
          strokeColor: this.textColor1
        });

        textGroup.addChild(hr);

        text.content += '\n\n';
        lineCount+=2;
      }

      // add space if not the last word
      let spc = wordArray[i+1] ? ' ' : ''
      text.content += nextWord + spc;
      if (text.bounds.width > textWidth) {

        // make sure this word wasn't what pushed us over
        let testText = text.clone();
        testText.content = text.content.split('\n').pop();

        // reset text content, then add line break and next word
        if (testText.bounds.width > textWidth) {
          if (heading) {
            text.content = `${prevTextContent}\n\n${nextWord}\n `;
          } else {
            text.content = `${prevTextContent}\n${nextWord} `;
          }
          lineCount++;
        }
      }

      i++;
    }

    textGroup.addChild(text);
    textGroup.addChild(textSaid);
    textGroup.scaling = 1;
  },

  _moveText: function() {
    let x = this.xPadding * this.width;
    let y = this.yPadding * this.height + this.introOffset + this.pagingOffset;

    textGroup.bounds.x = x;
    textGroup.bounds.y = y;

    text.bounds.x = x;
    textSaid.bounds.x = x;
  },

  _updateText: function(pos) {
    // figure out if we need to move the text up
    var wordIndex = 0;
    var words = this.wordArray;

    // the following check is to take care of a situation where one word is selected...
    if (words[1] === undefined) {
      wordIndex = 0;
    }

    // otherwise, we do the loop search. this isn't optimized but it's never going to be
    // an array of more than ~30 elements
    else {
      for (var i=0; i<words.length-1; i++) {
        if (pos >= words[i].start && pos < words[i+1].start) {
          wordIndex = i;
          break;
        }
      }
      // now we check if it's the very last word
      if (pos > words[words.length-1].start) {
        wordIndex = words.length-1;
      }
    }

    if (wordIndex > this.wordIndex) {

      // dont update unless we have a new word
      this.wordIndex = wordIndex;

      // account for the fact that some "words" from our transcript selection actually have spaces in them
      var wordsWithSpacesSoFar = words.slice(0, wordIndex)
        .map(function(word) { return word.text })
        .reduce(function(prevVal, val){ return prevVal + (val.match(/ /g) || []).length - (val.indexOf(' ') === 0 ? 1 : 0)}, 0);

      // highlight words so far
      textSaid.content = text.content.split(' ').slice(0, wordIndex + 1 + wordsWithSpacesSoFar).join(' ');

      var lineBreaksPlayed = textSaid.content.split('\n').length - 1; // add one to factor in first line

      if (lineBreaksPlayed > this.currentLine) {

        // shift paragraphs up
        if (Math.floor(lineBreaksPlayed/4) > Math.floor(this.currentLine / 4)) {
          this.pagingOffset -= text.leading*4;
        }
        this.currentLine = lineBreaksPlayed;
      }
    }
  },

  _initWaveform: function() {
    const opts = {
      canvas: this.paper.view._context.canvas,
      ctx: this.paper.view._context,
      width: this.width,
      height: this.height/7.5,
      xOffset: 0,
      yOffset: this.width * 0.56,
      ratio: 1,
      bgColor: this.bgColor,
      colors: this.waveColor
    };
    var waveform = new SiriWave9(opts);
    waveform.setSpeed(0.1);
    return waveform;
  },

  _updateWaveformAmplitude: function(pos) {
    // figure out our offset within the peaks array
    const peaksOffset = Math.floor(( (pos/1000 - this.startTime) / this.duration)*this.peaksArray.length);
    this.amplitude = this.peaksArray[peaksOffset];
  },

  _drawWaveform: function(_amp) {
    let amp = _amp || 0;
    this.waveform.setAmplitude(amp);
    this.waveform.drawFrame();
  },

  _resize: function() {
    raster.width = this.width;
    raster.height = this.height * 0.215;
  }
};

// HELPERS

// adapted from https://stackoverflow.com/a/13542669/4869657
// takes a color array like [255, 128, 128] and then lightens or darkens
// by a percentage 0 to 1
function shadeRGBColor(colorArray, percent) {
    var t = percent<0?0:255,p=percent<0?percent*-1:percent;
    var R = colorArray[0];
    var G = colorArray[1];
    var B = colorArray[2];
    return [Math.round((t-R)*p)+R,Math.round((t-G)*p)+G,Math.round((t-B)*p)+B];
}

// Converts a scss-extract object like {r: 0, g: 255, b: 128}
// to [[0, 255, 128], [0, 255, 128], [0, 255, 128]]
function convertWaveColors(waveColor) {
  return [
    [waveColor.r, waveColor.g, waveColor.b],
    shadeRGBColor([waveColor.r, waveColor.g, waveColor.b],0.2),
    shadeRGBColor([waveColor.r, waveColor.g, waveColor.b],0.4)
  ]
}

// trim string
if(typeof(String.prototype.trim) === "undefined")
{
    String.prototype.trim = function()
    {
        return String(this).replace(/^\s+|\s+$/g, '');
    };
}

module.exports = Animator;
