'use strict';

import React from 'react';
import PlayCircleFilled from 'material-ui-icons/PlayCircleFilled';

import paper from 'paper';
import Animator from '../animation/animator';

import Helpers from '../helpers';

require('styles//PreviewContainer.scss');
const scssVariables = require('sass-extract-loader!../styles/_variables.scss').global;
// Webpack does static analysis of imports, so require(url)
// won't work but require('/some/path/'+filename) does
// see: https://github.com/webpack/webpack/issues/2401#issuecomment-315709090
var url = scssVariables['$anim-footer-image'].value;
const animationFooter = require('../images/'+url);

// color options for video
const colorOptions =  [
  {
    bgColor: scssVariables['$anim-color-1'].value.hex,
    hColor: scssVariables['$anim-color-highlight-1'].value.hex,
    // we pass "value" because it's an object containing r/g/b vals the anim consumes
    waveColor: scssVariables['$anim-color-wave-1'].value
  },
  {
    bgColor: scssVariables['$anim-color-2'].value.hex,
    hColor: scssVariables['$anim-color-highlight-2'].value.hex,
    waveColor: scssVariables['$anim-color-wave-2'].value
  },
  {
    bgColor: scssVariables['$anim-color-3'].value.hex,
    hColor: scssVariables['$anim-color-highlight-3'].value.hex,
    waveColor: scssVariables['$anim-color-wave-3'].value
  },
  {
    bgColor: scssVariables['$anim-color-4'].value.hex,
    hColor: scssVariables['$anim-color-highlight-4'].value.hex,
    waveColor: scssVariables['$anim-color-wave-4'].value
  }
];

/** This component handles all of the rendering for the `<canvas>` animations for the local, realtime preview of the final mp4 animation. */
class PreviewContainerComponent extends React.Component {
  constructor(props) {
    super(props);
    this.colorIndex = 0; //  Math.floor(Math.random()*colorOptions.length);    // random color
  }

  componentDidMount() {
    window.requestAnimFrame = (function(){
      return  window.requestAnimationFrame       ||
              window.webkitRequestAnimationFrame ||
              window.mozRequestAnimationFrame    ||
              function( callback ){
                window.setTimeout(callback, 1000 / 60);
              };
    })();

    // Listen for orientation changes
    this.res = () => {
      this._resize();
    }
    // window.addEventListener('orientationchange', this.res, false);

    // this.anims = ['basic', 'bounce'];
    // this.animType = 'basic';

    this.cnv = this._canvas;
    this.ctx = this._canvas.getContext('2d');
    this.fps = 20;

    this._initPaperCanvas(this.colorIndex);
  }
  componentWillUnmount() {
    // window.removeEventListener('orientationchange', this.res);

    // destroy paper canvas
    this.paper.project.remove();
  }
  // This looks weird at first but is a nice little trick. It means the simulation runs
  // as fast as the FPS (which is fine because the sim isn't rendering, it's just doing
  // some arithmetic), and then the draw call is still bound to requestAnimationFrame.
  // So we get a very fast simulation and then the render just keeps up.
  draw() {
    window.setTimeout( () => {
      if (this.props.playing) {
        this.tick(this.props.regionStart, this.props.regionEnd);
        window.requestAnimFrame(this.draw.bind(this));
      }
    }, 1000/this.fps);
  }
  _initPaperCanvas(colorIndex) {
    this.colorIndex = colorIndex || 0;
    this.props.onColorChange(colorOptions[this.colorIndex]);

    // set up paper
    paper.setup(this.cnv);
    this.paper = paper;

    if (this._canvasContainer.getBoundingClientRect().width === 0) return;

    this.animator = new Animator({
      paper: this.paper,
      width: this._canvasContainer.getBoundingClientRect().width,
      height: this._canvasContainer.getBoundingClientRect().height,
      fontFamily: scssVariables['$anim-font-family'].value,
      fps: this.fps,
      showNumber: this.props.showNumber,
      // footerImgBase64: this.refs._footerImg.src,
      footerImgBase64: animationFooter,
      style: {
        textColor1 : 'white',
        textColor2 : colorOptions[colorIndex].hColor || '#432958',
        bgColor    : colorOptions[colorIndex].bgColor || '#e44226',
        waveColor: colorOptions[colorIndex].waveColor || {r: 255, g: 255, b: 255}
      }
    });
    this.animator._resize();
    this._selectionChanged();
  }
  _resize() {
    this.paper.project.remove();

    window.setTimeout(() => {
      this._initPaperCanvas(this.colorIndex);
    }, 1);
  }
  _selectionChanged() {
    const peaksArray = Helpers.getPeaksInRange(this.props.peaks, this.props.regionStart, this.props.regionEnd, this.props.totalDuration);
    if (!this.animator) return;
    this.animator.setRegion(this.props.regionStart, this.props.regionEnd - this.props.regionStart, this.props.selectedWords, peaksArray);
  }
  _playingChanged() {
    if (!this.animator) return;
    // update text in animator
    this.animator.reset();

    // start loop, but set timeout to update text in animator first
    setTimeout(() => {
      if (this.props.playing) {
        this.draw();
      }
    }, 200); // give textSaid time to clear

  }
  animPrev() {
    var currentIndex = this.anims.indexOf(this.animType);
    // subtract one from the index, but wrap back around to the end of the array if below 1
    var nextIndex = currentIndex - 1;
    if (nextIndex < 0) {
      nextIndex = this.anims.length-1;
    }
    this.animType = this.anims[nextIndex];
    this.props.togglePlay(true);
  }

  animNext() {
    var currentIndex = this.anims.indexOf(this.animType);
    // add one to the index, but wrap back around to the start of the array if above 1
    var nextIndex = (currentIndex + 1) % this.anims.length
    this.animType = this.anims[nextIndex];
    this.props.togglePlay(true);
  }

  changeColorScheme(e) {
    const index = e.target.dataset.index;
    const easing = this.animator.introOffset;

    this.paper.project.remove();
    this._initPaperCanvas(index);

    window.ga('send', {
      'hitType': 'event',
      'eventCategory': 'Preview',
      'eventAction': 'ChangeColorScheme',
      'eventLabel': 'ChangeColorScheme',
      'eventValue': index
    });

    // reset easing to the previous amount
    this.animator.introOffset = easing;
  }

  render() {

    const colorSquares = colorOptions.map( (opt, i) => {
      return <div className="preview-option" key={`square-${i}`} data-index={i} onClick={this.changeColorScheme.bind(this)}style={{backgroundColor: colorOptions[i].bgColor}}></div>
    });

    return (
      <div className="previewcontainer-component">
        <div className="preview-canvas-container" ref={(c) => this._canvasContainer = c}>
          <PlayCircleFilled
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              fill: 'rgb(255,255,255)',
              opacity: this.props.playing ? '0' : '0.7',
              cursor: 'pointer',
              left: '0px',
              right: '0px',
              margin: 'auto',
              backgroundColor: 'rgba(50,50,50,0.5)'
            }}
            viewBox='-12 -12 48 48'
            onClick={() => this.togglePlay()}
          />
          <canvas ref={(c) => this._canvas = c} onClick={() => this.togglePlay()} id="canvas" width="200" height="200"/>
        </div>
        <div className="preview-option-container">
          {colorSquares}
        </div>

      </div>
    );
  }

  shouldComponentUpdate(nextProps) {
    // if the selected words are different (either a different length, or different start/end times), we should update the preview container. we cast the start times to numbers using `+` because sometimes they come in as strings, sometimes as numbers
    return (nextProps.playing !== this.props.playing || nextProps.selectedWords.length > 0 && (nextProps.selectedWords.length !== this.props.selectedWords.length || +nextProps.selectedWords[0].start !== +this.props.selectedWords[0].start || +nextProps.selectedWords[nextProps.selectedWords.length-1].start !== +this.props.selectedWords[this.props.selectedWords.length-1].start) );
  }

  componentDidUpdate(prevProps) {
    const selectionChanged = prevProps.regionStart && (prevProps.regionStart !== this.props.regionStart || prevProps.regionEnd !== this.props.regionEnd);
    const playingChanged = prevProps.playing !== this.props.playing;
    if (!playingChanged && !selectionChanged) return;

    this._selectionChanged();

    // autoplay on selection change ... ?
    if (playingChanged) {
      this._playingChanged();
    } else {
      window.setTimeout(() => {
        this.props.togglePlay(true);
      }, 1);
    }

  }

  tick() {
    if (this.props.playing && this.props.selectedWords.length > 0) {
      this.animator.step(this.props.pos * 1000);
    } else {
      return;
    }
  }

  togglePlay() {
    const _label = this.props.playing ? 'Pause' : 'Play';
    window.ga('send', {
      'hitType': 'event',
      'eventCategory': 'Preview',
      'eventAction': 'TogglePlay',
      'eventLabel': _label
    });
    this.props.togglePlay();
  }
}

PreviewContainerComponent.displayName = 'PreviewContainerComponent';

// Uncomment properties you need
PreviewContainerComponent.propTypes = {
  clipTooLong: React.PropTypes.bool
};
PreviewContainerComponent.defaultProps = {
  selectedWords: [],
  clipTooLong: false,
  muiTheme: {
    palette: {
    }
  }
};

export default PreviewContainerComponent;
