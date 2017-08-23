'use strict';

import React from 'react';
import Wave from './waveform/WaveComponent';
import WaveRegion from './waveform/WaveRegionComponent';
import WavePlayhead from './waveform/WavePlayheadComponent';
import AudioController from './waveform/AudioController';
import Subhead from './SubheadComponent';

import PreviewContainer from './PreviewContainerComponent';
import TranscriptComponent from './TranscriptComponent';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import Button from 'material-ui/Button';
import IconButton from 'material-ui/IconButton';
import PlayArrow from 'material-ui-icons/PlayArrow';
import PauseCircle from 'material-ui-icons/Stop';
import {_debounce, _throttle, getPeaksInRange} from '../helpers';

require('styles/ClippingContainer.scss');

const moment = require('moment');

const regionColor = 'rgba(255, 0, 255, 0.3)';
const regionViewDuration = 45; // how many seconds

/** The main component for all things clipper-related. */
class ClippingContainer extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      playing: props.playing,
      pos: props.regionStart,
      actualPos: props.regionStart,
      posDisplay: this.convertPos(props.regionStart),
      regionViewStart: Math.max( Number(props.regionStart) - 15, 0),
      innerWidth: window.innerWidth,
      clipTooLong: props.clipTooLong
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.regionStart !== this.props.regionStart || nextProps.regionEnd !== this.props.regionEnd) {
      const newState = {
        regionStart: nextProps.regionStart,
        regionEnd: nextProps.regionEnd
      };

      this.setState(newState);
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.regionStart !== prevProps.regionStart || this.props.regionEnd !== prevProps.regionEnd) {
      const viewEnd = this.state.regionViewStart+regionViewDuration;
      if (this.props.view !== prevProps.view || !(this.props.regionStart > this.state.regionViewStart && this.props.regionEnd < (viewEnd))) {
        this._recenterWaveformView(true);
      } else {
        this._recenterWaveformView(false);
      }
    }

    // if we switched to the mobile "preview" view, resize paper animation
    if (this.props.view === 'preview' && prevProps.view !== 'preview') {
      this._previewContainer._resize();
      this._recenterWaveformView(true);
      this.stop();
    }

    if (this.props.view === 'clipping' && prevProps.view !== 'clipping') {
      this.stop();
    }

    // this.res = () => {
    //   this._resize();
    // }
    // window.addEventListener('orientationchange', this.res, false);
  }
  componentWillUnmount() {
    // window.removeEventListener('orientationchange', this.res);
  }
  _recenterWaveformView(changeView) {
    let regionViewStart = changeView ? this.props.regionStart - 10 : this.state.regionViewStart;
    regionViewStart = Math.max(regionViewStart, 0);
    let shouldPlay = !changeView;
    if (shouldPlay) {
      // this.togglePlay
    }
    this.setState({
      pos: this.props.regionStart,
      posDisplay: this.convertPos(this.props.regionStart),
      regionViewStart,
      // playing
    });
  }
  donePlaying() {
    this.setState({
      playing: false,
      pos: this.props.regionStart,
      posDisplay: this.convertPos(this.props.regionStart)
    });
  }
  handleTimeUpdate(currentTime) {
    window.pos = currentTime;
    this.setState({
      actualPos: currentTime,
      posDisplay: this.convertPos(currentTime)
    });
  }
  updateDimensions(width) {
    this.setState({
      width: width
    });
  }
  _resize() {
    this.setState({
      innerWidth: window.innerWidth
    });
  }
  render() {
    let children = 'loading waveform...';
    const regionViewStart = this.state.regionViewStart;

    const componentClass = `show-waveform ${this.props.view}`

    // if MediaElement ID and Peaks exist, render element:
    if (this.props.mediaElt.length > 0 && this.props.peaks.length > 0) {
      children = <div className={componentClass}>
        <WaveRegion
          regionStart={this.props.regionStart}
          regionEnd={this.props.regionEnd}
          regionViewStart={regionViewStart}
          regionViewDuration={regionViewDuration}
          totalDuration={this.props.totalDuration}
          regionColor={regionColor}
          regionChanged={this.props.textSelectionChanged}
          togglePlay={this.togglePlay.bind(this)}
          updateDimensions={this.updateDimensions.bind(this)}
        >
          <Wave
            peaks={this.props.peaks}
            pos={this.props.pos}
            regionStart={this.props.regionStart}
            regionEnd={this.props.regionEnd}
            totalDuration={this.props.totalDuration}
            regionViewStart={regionViewStart}
            regionViewDuration={regionViewDuration}
          />
        </WaveRegion>
        <WavePlayhead
          regionViewStart={regionViewStart}
          regionViewDuration={regionViewDuration}
          actualPos={this.state.actualPos}
          width={this.state.width}
          playing={this.state.playing}
        />
        <div className="wave-background"/>
        <AudioController
          mediaEltId={this.props.mediaElt}
          pos={this.state.pos}
          playing={this.state.playing}
          regionStart={this.props.regionStart}
          regionEnd={this.props.regionEnd}
          donePlaying={this.donePlaying.bind(this)}
          setActualPos={this.handleTimeUpdate.bind(this)}
        />
      </div>
    }

    const friendlyDate = moment(this.props.airDate).format('LL');

    // axis of slider should be top or left?
    // const scrubberAxis = window.innerWidth > '992' ? 'x' : 'y-reverse';
    // const scrubberSclass = window.innerWidth > '992' ? 'scrubber' : 'scrubber-vertical';

    const scrubberX = this.state.innerWidth > '992' ? (<Slider
            className="scrubber"
            trackStyle={{
              height:10
            }}
            railStyle={{
              height:10
            }}
            onChange={
              _debounce(_throttle(this.scrubberChange.bind(this)), 5)
            }
            totalDuration={this.props.totalDuration}
            step={.001}
            max={1}
            defaultValue={this.state.pos && this.props.totalDuration
              ? this.state.pos/this.props.totalDuration
              : 0
            }
          />) : null;

    const scrubberY = this.state.innerWidth > '992' ? null : (
              <Slider
                className="scrubber-vertical"
                onChange={
                  _debounce(_throttle(this.scrubberChange.bind(this, 'vertical')), 5)
                }
                totalDuration={this.props.totalDuration}
                step={.001}
                vertical
                max={1}
                defaultValue={regionViewStart && this.props.clippingDuration
                  ? 1-(regionViewStart/this.props.clippingDuration)
                  : 0
                }
                value={regionViewStart && this.props.clippingDuration
                  ? 1-(regionViewStart/this.props.clippingDuration)
                  : 0
                }
              />
    );

    const playPauseButton = this.state.playing ? <PauseCircle color="white"/> : <PlayArrow color="white"/>
    const leftContainerClass = `left-container ${this.props.view}`;
    const rightContainerClass = `right-container flex-top ${this.props.view}`;

    // hide transcript if not clipping (i.e. on "preview" view)
    const transcript = this.props.view !== 'clipping' ? null : <TranscriptComponent
            wordMillis={this.props.wordMillis}
            paragraphMillis={this.props.paragraphMillis}
            wordDictionary={this.props.wordDictionary}
            paragraphDictionary={this.props.paragraphDictionary}
            textSelectionChanged={this.props.textSelectionChanged}
            regionStart={this.props.regionStart}
            regionEnd={this.props.regionEnd}
            regionViewStart={regionViewStart}
            regionViewDuration={regionViewDuration}
            clippingDuration={this.props.clippingDuration}
            clippingOffset={this.props.clippingOffset}
            handleWordTap={this.props.handleWordTap}
            tappedWord={this.props.tappedWord}
            totalDuration={this.props.totalDuration}
            offsetRegionViewStart={this.offsetRegionViewStart.bind(this)}
            >
          </TranscriptComponent>

    const previewWaveform = this.props.view === 'preview' ? children : null;
    const transcriptWaveform = this.props.view === 'clipping' ? children : null;

    const containerClass = `clipping-container-component content step-${this.props.view}`;

    return (
      <div className={containerClass}>
        <div className="episode-header"><div className="state-tag">Editing</div> <span className="episode-title">{this.props.episode}</span> | <span className="air-date">{friendlyDate}</span></div>
        <div className={rightContainerClass}>

          <Subhead
            heading="Select Filter"
            next=""
            nextOnClick={this.createVideo.bind(this)}
            prev={`/#/clipping/${this.props.showNumber}`}
            step={2}
          />

          <PreviewContainer
            mediaEltId={this.props.mediaEltId}
            selectedWords={this.props.selectedWords}
            // pos={this.state.pos}
            pos={this.state.actualPos}
            playing={this.state.playing}
            peaks={this.props.peaks}
            totalDuration={this.props.totalDuration}
            muiTheme={this.props.muiTheme}
            togglePlay={this.togglePlay.bind(this)}
            // createVideo={this.createVideo.bind(this)}
            regionStart={this.props.regionStart}
            regionEnd={this.props.regionEnd}
            clipTooLong={this.props.clipTooLong}
            onColorChange={this.props.onColorChange}
            showNumber={this.props.showNumber}
            ref={(p) => this._previewContainer = p}
          />

          {previewWaveform}
        </div>

        <div className={leftContainerClass}>

          <Subhead
            heading="Select Text"
            prev="/#/"
            next={`/#/preview/${this.props.showNumber}`}
            step={1}
          />
          {scrubberX}
          {scrubberY}
          {transcript}
          <div className="time time-desktop"><span>{this.state.posDisplay} / {this.convertPos(this.props.clippingDuration)}</span></div>
          {transcriptWaveform}

          <span
            className="play-pause"
            onClick={() => {
              const _label = this.props.playing ? 'Pause' : 'Play';
              window.ga('send', {
                'hitType': 'event',
                'eventCategory': 'PlayPauseButton',
                'eventAction': 'TogglePlay',
                'eventLabel': _label
              });
              this.togglePlay();
            }}
          >
            <IconButton>
              {playPauseButton}
            </IconButton>
          </span>
        </div>

        <div className="mobile-transport">
          <span className="time time-mobile">{this.state.posDisplay} / {this.convertPos(this.props.clippingDuration)}</span>
        </div>

        <Button
          color="primary"
          className="preview-button desktop"
          raised
          onClick={() => {
            if (this.props.clipTooLong) {
              window.alert('Clips must be between 0.5 and 30 seconds. Please select some text or use the waveform. If you dont see the waveform, click the Feedback button to file a bug report.');
            } else {
              this.createVideo();
            }
          }}
        >
          Next
        </Button>
        <Button
          raised
          className="preview-button mobile"
          // href={this.props.view === 'clipping' ? `/#/preview/${this.props.showNumber}` : null}
          onClick={() => {
            if (this.props.clipTooLong) {
              window.alert('clips must be between 0.5 and 30 seconds. Please tap the transcript to update your selection.');
            } else {
              this.props.view === 'preview' ? this.createVideo() : this.props.view === 'clipping' ? window.location.href = `/#/preview/${this.props.showNumber}` : null
            }
          }}
        >
           {this.props.view === 'clipping' ? 'Next': 'Create Video'}
        </Button>
      </div>
    );
  }

  /**
   *  POST request to create video (sent from Main.js)
   */
  createVideo() {
    const peaksInRange = getPeaksInRange(this.props.peaks, this.props.regionStart, this.props.regionEnd, this.props.totalDuration);

    const data = {
      show: this.props.showNumber,
      start: this.props.regionStart,
      dur: this.props.regionEnd - this.props.regionStart,
      type: this._previewContainer.animType,
      opts: {
        duration: this.props.totalDuration,
        peaks: peaksInRange
      },
      words: this.props.selectedWords
    };

    this.props.createVideo(data);
  }


  scrubberChange(isVertical, value) {
    console.log("ARG",arguments);
    if (isVertical !== 'vertical') {
      value = isVertical;
    }
    else {
      value = 1 - value;
    }
    const centerPos = value * this.props.clippingDuration;

    // update waveform
    let newState = {
      regionViewStart: Math.min( Math.max(value * this.props.totalDuration, 0), this.props.totalDuration - regionViewDuration),
      playing: false
    };
    if (!this.state.playing) {
      // update timecode
      newState.posDisplay = this.convertPos(centerPos);
    }
    this.setState(newState);


  }

  // convert the pos (in seconds) to a timestamp format
  // http://stackoverflow.com/a/1322830
  convertPos(pos) {
    var isOverAnHour = this.props.totalDuration > 60*60;
    var totalSec = pos || this.props.pos;
    var hours = parseInt( totalSec / 3600 ) % 24;
    var minutes = parseInt( totalSec / 60 ) % 60;
    var seconds = Math.floor(totalSec % 60);
    // only show the hours if the episode is over an hours long
    var hoursFormatted = isOverAnHour ? (hours < 10 ? '0' + hours : hours) + ':' : '';
    var result = hoursFormatted + (minutes < 10 ? '0' + minutes : minutes) + ':' + (seconds  < 10 ? '0' + seconds : seconds);
    return result;
  }

  stop() {
    this.setState({
      playing: false
    });
  }

  togglePlay(forcePlay) {
    let newState = {};

    // ignore forcePlay if it is an event
    if (forcePlay && forcePlay.nativeEvent) forcePlay = false;

    // set state in AudioController too
    // if (_pos) {
    //   newState.pos = this.props.regionStart;
    // } else {
    newState.pos = this.props.regionStart;
    // }

    if (forcePlay) {
      newState.playing = true;
    } else {
      newState.playing = !this.state.playing;
    }

    this.setState(newState);
  }

  offsetRegionViewStart(amt) {
    var newStart = Math.max(this.state.regionViewStart + amt, 0);//, this.props.totalDuration - regionViewDuration);
    if (this.props.totalDuration) {
      newStart = Math.min(newStart, this.props.totalDuration - regionViewDuration);
    }
    this.setState({
      regionViewStart: newStart,
      pos: newStart,
      playing: false,
      posDisplay: this.convertPos(newStart)
    });
  }
}

ClippingContainer.displayName = 'ClippingContainer';

// Uncomment properties you need
ClippingContainer.propTypes = {
  drewPeaks: React.PropTypes.bool,
  playing: React.PropTypes.bool,
  pos: React.PropTypes.number,
  posDisplay: React.PropTypes.string,
  peaks: React.PropTypes.array,
  mediaElt: React.PropTypes.string,
  waveformSelectionChanged: React.PropTypes.func,
  regionStart: React.PropTypes.number,
  totalDuration: React.PropTypes.number,
  clipTooLong: React.PropTypes.bool,
  onDrewPeaks: React.PropTypes.func,
  airDate: React.PropTypes.string
};

ClippingContainer.defaultProps = {
  drewPeaks: false,
  playing: false,
  pos: 10,
  airDate: '2016-06-03T16:20:10',
  posDisplay: '00:00:00',
  peaks: [],
  mediaElt: '',
  regionStart: 10,
  totalDuration: 0,
  clipTooLong: false,
  waveformSelectionChanged: () => {},
  posChanged: () => {},
  onDrewPeaks: () => {}
};

export default ClippingContainer;
