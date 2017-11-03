'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import ClippingContainer from './ClippingContainerComponent';

require('styles/ClippingHLSWrapper.scss');

const Hls = require('hls.js');
const mediaElt = '#audio-element';
let hls;
let hlsWasInitialized = false;

class ClippingHLSWrapper extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      mediaElt: props.mediaElt
    };
  }
  componentWillReceiveProps(nextProps) {
    // wait for hls and audio element to exist
    if (this.props.hls !== nextProps.hls) {
      var audioElt = document.querySelector(mediaElt);
      this.initHLS(nextProps.hls, audioElt);
    }
  }
  componentDidMount() {
    // if HLS was already initialized and we have an HLS path
    // (i.e. if user hits back from /share page)
    if (hlsWasInitialized && this.props.hls.length > 0) {
      var audioElt = document.querySelector(mediaElt);
      this.initHLS(this.props.hls, audioElt);
    }
  }
  render() {
    return (
      <div className="clipping-wrapper">
        <audio id="audio-element" type="application/vnd.apple.mpegurl"></audio>
        <ClippingContainer
          mediaElt={this.state.mediaElt}
          regionStart={this.props.regionStart}
          regionEnd={this.props.regionEnd}
          showNumber={this.props.showNumber}
          peaks={this.props.peaks}
          totalDuration={this.props.totalDuration}
          clippingDuration={this.props.clippingDuration}
          clippingOffset={this.props.clippingOffset}
          selectedWords={this.props.selectedWords}
          wordMillis={this.props.wordMillis}
          paragraphMillis={this.props.paragraphMillis}
          wordDictionary={this.props.wordDictionary}
          paragraphDictionary={this.props.paragraphDictionary}
          episode={this.props.episode}
          airDate={this.props.airDate}
          textSelectionChanged={this.props.textSelectionChanged}
          muiTheme={this.props.muiTheme}
          createVideo={this.props.createVideo}
          clipTooLong={this.props.clipTooLong}
          onDrewPeaks={this.props.onDrewPeaks}
          drewPeaks={this.props.drewPeaks}
          handleWordTap={this.props.handleWordTap}
          tappedWord={this.props.tappedWord}
          view={this.props.view}
          onColorChange={this.props.onColorChange}
        />
      </div>
    );
  }
  initHLS(hlsPath, elt) {
    if (Hls.isSupported() && !nativeHLS(elt) ) {
      let config = {
        autoStartLoad: true
        // debug: true
      };
      hls = new Hls(config);

      hls.on(Hls.Events.ERROR, function (event, data) {
        console.log('HLS ERROR', event, data);
      });

      hls.attachMedia(elt);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        // now load source
        hls.loadSource(hlsPath);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setTimeout(() => {
            this.mediaElementIsReady(elt);
          }, 0);
        });
      })
    } else if (nativeHLS(elt)) {
      console.log('hls 2');
      elt.src = hlsPath;
      elt.setAttribute('type', 'audio/mpegURL');
      this.mediaElementIsReady(elt);
    } else if (canPlayMp3(elt)) {
      console.log('hls 3');
      // replace the stream path with an mp3 path
      var mp3Path = hlsPath.replace(/stream|ssl\/(\d\d?\d?).*/,'$1.mp3');
      elt.src = mp3Path;
      elt.setAttribute('type', 'audio/mpeg');
      this.mediaElementIsReady(elt);
    } else {
      console.log('hls 4');
      // TO DO...better error handling when MPEG is not supported
      window.alert('Sorry, Shortcut is not supported by this browser. Audio will not play.');
      window.ga(('send', 'exception', {
        'exDescription': 'audio not supported'
      }));
    }

    function nativeHLS(mediaElt) {
      var canPlay = mediaElt.canPlayType('audio/mpegURL');
      return canPlay.length > 1 && canPlay !== 'no';
    }

    function canPlayMp3(mediaElt) {
      var canPlay = mediaElt.canPlayType('audio/mpeg');
      return canPlay.length > 1 && canPlay !== 'no';
    }
  }
  /**
   *  Setting the mediaElt lets the WaveComponent
   *  child know that the media Element
   *  is ready and it can proceed to load peaks.
   */
  mediaElementIsReady(elt) {
    const self = this;

    this.setState({
      mediaElt: mediaElt
    });
    hlsWasInitialized = true;

    // seek to start time
    elt.addEventListener('canplay', firstCanPlay);

    function firstCanPlay() {
      window.setTimeout(() => {
        elt.currentTime = self.props.regionStart;
      }, 1);
      elt.removeEventListener('canplay', firstCanPlay);
    }
    // if mobile, set event listener so that
    // the first click plays (silently) and then immediately pauses.
    // Otherwise, we can't control playback.
    // TO DO: display an overlay saying "click here to begin"
    if (isMobile) {
      document.addEventListener('touchend', startMobile, false);
      function startMobile(e) {
        console.log('start mobile', e);
        elt.volume = 0;
        elt.play();

        document.removeEventListener('touchend', startMobile);
        // allow playback if clicked on a thing that should trigger playback
        if (e.target.id == 'canvas' || e.target.id == 'wave-region') {
          elt.volume = 1;
        }
        else {
          window.setTimeout(function() {
            elt.pause();
            elt.volume = 1;
          }, 0);
        }
      }
    }

  }

}

ClippingHLSWrapper.displayName = 'ClippingHLSWrapper';

ClippingHLSWrapper.propTypes = {
  hls: PropTypes.string,
  mediaElt: PropTypes.string,
  peaks: PropTypes.array,
  regionStart: PropTypes.number,
  regionEnd: PropTypes.number,
  totalDuration: PropTypes.number,
  clippingOffset: PropTypes.number,
  clippingDuration: PropTypes.number,
  onDrewPeaks: PropTypes.func,
  drewPeaks: PropTypes.bool
};

ClippingHLSWrapper.defaultProps = {
  mediaElt: '',
  peaks: [],
  regionStart: 10,
  regionEnd: 20,
  totalDuration: 0,
  onDrewPeaks: () => {},
  drewPeaks: false,
  clippingOffset: 0,
  clippingDuration: 500,
  hls: ''
};

function isMobile() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
}

export default ClippingHLSWrapper;
