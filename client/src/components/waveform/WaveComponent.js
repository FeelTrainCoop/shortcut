'use strict';

import React from 'react';
import ReactDOM from 'react-dom';

import Helpers from '../../helpers';

require('styles/waveform/WaveComponent.scss');
const waveStyles = {
  waveColor: 'white'
};

class Wave extends React.PureComponent {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    let canvas = ReactDOM.findDOMNode(this.refs._canvas);
    let ctx = canvas.getContext('2d');

    ctx.fillRect(0, 0, canvas.width, canvas.height);

    this._drawWave();

    window.addEventListener('resize', this._handleResize.bind(this));
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this._handleResize.bind(this));
  }
  shouldComponentUpdate(nextProps) {
    return nextProps.regionViewStart !== this.props.regionViewStart || nextProps.regionViewDuration !== this.props.regionViewDuration;
  }
  componentDidUpdate() {
    this._drawWave();
  }
  render() {
    return (
      <div className="wave-component" ref="_parent">
        <canvas
          className="wave-component__canvas"
          ref="_canvas"
        ></canvas>
        <div className="clearfix"/>
      </div>);
  }
  _handleResize() {
    // wait for next event loop before resizing.
    // This avoids a type error on "clientWidth of null" in _drawWave
    setTimeout(() => {
      this._drawWave();
    }, 1);
  }
  _drawWave() {
    // access canvas
    const canvas = ReactDOM.findDOMNode(this.refs._canvas);
    const parent = ReactDOM.findDOMNode(this.refs._parent);

    if (!parent) return;

    // get peaksToDraw
    const viewStart = this.props.regionViewStart;
    const viewEnd = viewStart + this.props.regionViewDuration;
    const totalDur = this.props.totalDuration;
    const totalPeaks = this.props.peaks;
    const peaks = Helpers.getPeaksInRange(totalPeaks, viewStart, viewEnd, totalDur);

    // calculate scaling
    const pixelScale = 1;//Helpers.getPixelScale();
    const width = canvas.width = parent.clientWidth;
    const height = canvas.height = parent.clientHeight;
    const step = peaks.length / width;
    const amp = height/3;

    // draw to canvas...
    let ctx = canvas.getContext('2d');

    // clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw waveform
    ctx.fillStyle = waveStyles.waveColor;

    ctx.beginPath();
    ctx.moveTo(0, height/2 + peaks[0]);

    // draw positive
    for (let i = 0; i < width; i++) {
      ctx.lineTo(i * pixelScale, height/2 + peaks[Math.ceil(step*i)] * amp);
    }
    // draw negative
    for (let j = width; j >=0; j--) {
      ctx.lineTo(j * pixelScale, height/2 - peaks[Math.ceil(step*j)] * amp);
    }
    ctx.closePath();
    ctx.fill();
  }
}

export default Wave;
