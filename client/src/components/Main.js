require('normalize.css/normalize.css');
require('styles/App.scss');

const jQuery = require('jquery');
const Store = require('store'); // localStorage

const isSecure =  window.location.protocol == 'https:';
const apiEndpoint_default = isSecure ? require('config').default.apiEndpointSsl : require('config').default.apiEndpoint;
const maxClipSeconds = require('config').default.maxClipSeconds;
const minClipSeconds = require('config').default.minClipSeconds;
const env = require('config').default.appEnv;
const s3Region = require('config').default.s3Region;
const s3Bucket = require('config').default.s3Bucket;
const cloudFrontDomain = require('config').default.cloudFrontDomain;
const speakerNamesInTranscript = require('config').default.speakerNamesInTranscript;

let tapMsg = {
  start: 'Tap a word to begin selection',
  next: 'Tap another to complete',
  done: 'Hold & drag handles to change selection',
  unavail: function(showNumber) {
    return showNumber + ' isn\'t ready yet. Check back soon!';
  },
  cancel: 'Selection canceled',
  show: true
};

let colorOption = undefined;

import React from 'react';
import PropTypes from 'prop-types';
import {Route, Switch} from 'react-router-dom'
import injectTapEventPlugin from 'react-tap-event-plugin';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Snackbar from '@material-ui/core/Snackbar';
import ScreenLockPortrait from '@material-ui/icons/ScreenLockPortrait';

import ClippingHLSWrapper from './ClippingHLSWrapper';
import NavBar from 'components/NavBarComponent';

import Loader from 'components/LoadingAnimationComponent';
import ShareContainer from 'components/ShareContainerComponent';
import Landing from 'components/Landing';
import Admin from 'components/Admin';
import AdminEditTranscriptComponent from 'components/AdminEditTranscript';
import Setup from 'components/Setup';
import Helpers from '../helpers';
import Page from 'components/About.html';

const aboutDoc = {__html: Page};

/** The root React component */
class AppComponent extends React.Component {
  /**
   * constructor
   * @param {object} props
   */
  constructor(props) {
    super(props);
    let localState, defaultState, userState;
    let apiEndpoint = apiEndpoint_default;

    // Required for the Material UI theme
    injectTapEventPlugin();

    // localStorage enabled?
    if (Store.enabled) {
      // retrieve an initial state from localStorage if possible
      localState = Store.get('app-state');
      if (localState) localState.loading = true;
    }

    defaultState = {
      showNumber: props.match.params.showNumber || props.showNumber,
      airDate: '',
      episode: '',
      wordMillis: props.wordMillis,
      paragraphMillis: props.paragraphMillis,
      selectedWords: props.selectedWords,
      regionStart: Number(props.match.params.regionStart) || props.regionStart,
      regionEnd: props.match.params.regionStart ? Number(props.match.params.regionStart) : props.regionEnd,
      pos: props.match.params.regionStart || props.regionStart,
      clippingDuration: props.clippingDuration,
      clippingOffset: props.clippingOffset,
      tappedWord: props.tappedWord || undefined
    };

    // If there is no state stored in localStorage, use our default state.
    if (!localState) {
      this.state = defaultState;
    }
    // If there is an episode number, we must be coming back to a page, so use localState if we have it. Otherwise this is a "clean" entry so use the default state instead.
    else {
      this.state = props.match.params.showNumber && localState.showNumber === props.match.params.showNumber ? localState : defaultState;
      this.state.episode = localState.episode;
      this.state.airDate = localState.airDate;
    }

    if (props.match.params.regionStart) {
      this.state.regionStart = Number(props.match.params.regionStart);
      this.state.regionEnd = Number(props.match.params.regionStart);
      this.state.pos = Number(props.match.params.regionStart);
    }


    this.state.view = props.match.params.view || props.view;
    this.state.showNumber = props.match.params.showNumber || props.showNumber;
    this.state.loading = props.loading;
    this.state.snackbarOpen = false;
    this.state.snackbarMessage = 'default message';
    this.state.clipTooLong = Math.abs(this.state.regionEnd - this.state.regionStart) > maxClipSeconds || Math.abs(this.state.regionEnd - this.state.regionStart) < minClipSeconds;

    // get episode data rendered by server
    this.state.eps = window.__latestEpisodes || props.eps;
    // BUT, if we're in a development environment, just grab the JSON/RSS file of all episodes and overwrite
    if (env === 'dev') {
      let devUrl = apiEndpoint + '/recent';
      jQuery.ajax({
        method: 'GET',
        url: devUrl,
        crossDomain : true,
        headers: {'X-Requested-With': 'XMLHttpRequest'},
        success: (data) => {
          this.setState({
            eps: data
          });
        },
        error: function(xhr, status, err) {
          window.console.error(this.props.url, status, err.toString());
        }.bind(this)
      });
    }

    this.state.episodesWithProblems = window.__inactiveEpisodes || require('config').default.episodesWithProblems;


    // get credentials from localStorage if they exist
    userState = Store.get('user-state');
    if (userState) {
      this.state.twUserName = userState.twUserName;
      this.state.twAuthToken = userState.twAuthToken;
      this.state.sessionId = userState.sessionId;
    }

    this.customTheme = createMuiTheme({
    });
  }
  componentWillMount() {
    // if page is initialized from the /clipping/{show} route
    if (this.state.showNumber && (this.state.view === 'clipping' || this.state.view === 'preview')) {
      this.loadEpisode(this.state.showNumber);
    }
    if (window.__latestEpisodes && window.__inactiveEpisodes) {
      this.setState({
        eps : window.__latestEpisodes,
        episodesWithProblems: window.__inactiveEpisodes
      });
    }

  }
  /**
  * If the application mounted, we update `state` with any authenticated session tokens and then we save the tokens to `localStorage`.
  */
  componentDidMount() {

    // clear script data
    document.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('shortcut-data')) {
        document.getElementById('shortcut-data').innerText = '';
      }
    });

    // listen for postMessage if user logged in
    window.addEventListener('message', (event) => {
      if (event.origin === window.location.origin) {
        this._handleLoginMessage(event.data)
      }
    });

    this.setState({
      twUserName: this.props.match.params.twUserName || this.state.twUserName,
      twAuthToken: this.props.match.params.twAuthToken || this.state.twAuthToken,
      sessionId: this.props.match.params.sessionId || this.state.sessionId
    }, function() {
      this.saveUserToLocalStorage();
    });
  }
  /**
  * Before we update any properties from our routes, we check to see if we're on the home page. If we are, then we reset the application state to defaults. If we're on a clipping page and it's the same show as before, then don't reload our waveform data, just use what we already have. If we're clipping a different episode, do reload the waveform data.
  */
  componentWillReceiveProps(props, prevProps) {
    let view = props.match.params.view || this.props.view;
    let show = props.match.params.showNumber || this.props.showNumber || this.state.showNumber;
    let newState = {};

    // analytics: log page view
    if (view !== prevProps.view) {
    }

    // load default Landing page
    if (view === 'default') {
      // we're on the home page, reset our application state
      this.setState({
        wordMillis: [],
        paragraphMillis: [],
        showNumber: undefined,
        showDuration: 0,
        selectedWords: [],
        hls: undefined,
        peaks: [],
        regionStart: 10,
        regionEnd: 20,
        pos: 10,
        view: 'default',
        loading: false,
        videoData: {}
      });
    }
    else {
      // not on the homepage, load a different view
      newState.view = view;
      newState.showNumber = show;

      // if page is initialized with a non-clipping route
      if (show !== this.state.showNumber && view === 'clipping' && prevProps.view !== 'clipping') {
        this.loadEpisode(show);
      }

      else if (show === this.state.showNumber && view === 'clipping') {
        // same show, already have peaks, dont reload, but update waveform
        newState.drewPeaks = false;
        newState.loading = false;
      }

      // show toast message "Tap a word to begin selection" on mobile
      if (view === 'clipping' && tapMsg.show && Helpers.isMobile()) {
        newState.snackbarOpen = true;
        newState.snackbarMessage = tapMsg.start;
      }

      this.setState(newState);
    }
  }
  /**
  * This function is called when waveform is done drawing peaks, and sets `drewPeaks` to true on the state.
  */
  onDrewPeaks() {
    this.setState({
      drewPeaks: true
    });
  }
  /**
  * Load a new episode. We reset `drewPeaks` and set the `loading` state so the spinner appears, then we make two ajax calls: one to get metadata about the episode, and one to get the pre-rendered `peaks` data.
  */
  loadEpisode(showNumber) {
    this.setState({
      loading: true,
      drewPeaks: false,
      regionEnd: this.state.regionStart
    }, () => {
      this._loadEpisodeChunk(showNumber);
    });
  }
  _loadEpisodeChunk(showNumber, signedURL, shouldCache) {
    let path = `https://s3-${s3Region}.amazonaws.com/${s3Bucket}/episodes/${showNumber}-data.json`;
    if (cloudFrontDomain) {
      path = `https://${cloudFrontDomain}/episodes/${showNumber}-data.json`;
    }
    if (signedURL) {
      path = signedURL;
    }

    // check to see if episode is available
    if (this.state.episodesWithProblems.indexOf(Number(showNumber)) > -1) {
      this.setState({
        loading: false,
        snackbarOpen: true,
        snackbarMessage: tapMsg.unavail(showNumber),
        showNumber: undefined
      }, function() {
        this.props.history.push('/');
      });
      return;
    }

    jQuery.ajax({
      url: path,
      cache: shouldCache ? true : false,
      crossDomain: true,
      headers: {
          'X-Requested-With': 'XMLHttpRequest'
      },
      success: (data) => {
        // Safari redirect
        if (data.regionData) {
          this._parseShowData(data);
        } else if (data.indexOf('http' === 0)) {
          // load from cloudfront
          this._loadEpisodeChunk(showNumber, data, true);
        }
      },
      error: (err) => {
        console.log('error', err);

        // back to loading screen
        this.setState({
          loading: false,
          snackbarOpen: true,
          snackbarMessage: tapMsg.unavail(showNumber),
          view: 'default'
        });

        this.props.history.replace('/');
        // window.location.reload();

      }
    });
  }
  _parseShowData(data) {
    const words = data.regionData.words;
    const paragraphs = data.regionData.paragraphs;

    // expensive function, might pre-render transcripts on server
    this._makeWordsByParagraph(words, paragraphs);

    const segOffset = ~~data.regionData.start;
    this.setState({
      showNumber: data.showData.number,
      showDuration: data.showData.duration,
      airDate: data.showData.original_air_date, //data.air_dates.length ? data.air_dates[0].replace('T00:00:00','') : '',
      hls: location.protocol === 'https:' ? data.showData.hls.replace('http://stream', 'https://ssl') : data.showData.hls,
      loading: false,
      episode: `${data.showData.number}: ${data.showData.title}`,
      title: data.showData.title,
      peaks: data.regionData.waveform,
      clippingDuration: ~~data.regionData.end - segOffset,
      clippingOffset: segOffset,
      snackbarOpen: this.state.view === 'clipping' && Helpers.isMobile() ? true : false,
      snackbarMessage: tapMsg.start
    });

    this.saveStateToLocalStorage();
  }
  _handleLoginMessage(data) {
    const whichNetwork = 'Twitter';

    this.setState({
      twUserName: data.twUserName || this.state.twUserName,
      twAuthToken: data.twAuthToken || this.state.twAuthToken,
    }, function() {
      this.saveUserToLocalStorage();
    });
  }
  _handleWordTap(e) {
    const wordStart = e.target.dataset.start;
    const wordEnd = e.target.dataset.end;
    const wordIndex = e.target.id;

    if (!this.state.tappedWord) {
      this.setState({
        tappedWord: wordIndex.split('word-')[1],
        snackbarOpen: tapMsg.show,
        snackbarMessage: tapMsg.next
      });
    } else {
      const oldWord = this.state.wordDictionary[this.state.wordMillis[this.state.tappedWord - 1]]

      let regionStart  = Math.min(oldWord.start, wordStart);
      let regionEnd = Math.max(oldWord.end, wordEnd);
      this.textSelectionChanged(regionStart, regionEnd);

      if (tapMsg.show && Helpers.isMobile()) {
        // selection complete. show "done" message
        this.setState({
          snackbarOpen: tapMsg.show,
          snackbarMessage: tapMsg.done
        });
        window.setTimeout(() => {
          this.refs._snackbar.setState({
            open: false
          });
        }, 10000);

        // done with snackbar for this user
        tapMsg.show = false;
      }
    }
  }
  _cancelTranscriptTap(e) {
    if (e.target.id.indexOf('word') > -1) return;
    if (this.state.tappedWord) {
      this.setState({
        tappedWord: undefined,
        snackbarOpen: true,
        snackbarMessage: tapMsg.cancel
      });
    }
  }
  /**
  This is triggered in {@link TranscriptComponent#handleSelect} and in {@link ClippingContainerComponent#handleRegionUpdateEnd}. It sets new values on the state for start/end times as well as `selectedWords`. It also calculates `clipTooLong` and pops up an error message if this is the case.
  */
  textSelectionChanged(startTime, endTime) {
    let selWords = this.findWordsInRange(Math.min(startTime, endTime), Math.max(startTime, endTime));

    startTime = Number(startTime)/1000;
    endTime = Number(endTime)/1000 || this.state.showDuration;

    if (endTime < startTime) {
      [endTime, startTime] = [startTime, endTime];
    }

    // prevent duration < times < 0
    startTime = Math.max(startTime, 0);
    endTime = Math.min(endTime, this.state.showDuration);

    const clipTooLong = Math.abs(endTime - startTime) > maxClipSeconds || false;
    const clipTooShort = Math.abs(endTime - startTime) <= minClipSeconds || false;

    // add firstSpeaker to heading of first selected word
    // so that we can store headings (speakers) in database
    const firstSpeaker = this.findSpeakerAtTime(startTime);
    // make a copy of the first word so that we don't have the heading for future selections
    selWords[0] = Object.assign({}, selWords[0], {heading: firstSpeaker} );

    let newState = {
      regionStart: startTime,
      regionEnd: endTime,
      pos: startTime,
      selectedWords: selWords,
      clipTooLong: clipTooLong ? clipTooLong : clipTooShort,
      tappedWord: undefined,
      h: Helpers.hash(selWords, startTime.toString() + this.state.showNumber)// has for selected words
    };

    // snackbar if clip is too long but wasnt before
    if (clipTooLong && !this.state.clipTooLong) {
      newState.snackbarOpen = true,
      newState.snackbarMessage = 'Clip exceeds ' + maxClipSeconds + ' second limit'
    } else if (clipTooShort && !this.state.clipTooLong) {
      newState.snackbarOpen = true,
      newState.snackbarMessage = 'Clip too short '
    }

    this.setState(newState);
  }
  /** When the error message `Snackbar` element closes, we set the appropriate state to `false`. */
  handleSnackbarClose() {
    this.setState({
      snackbarOpen: false
    });
  }

  /** POST request to create video */
  createVideo(data) {
    let apiEndpoint = apiEndpoint_default;
    var that = this;
    const h = this.state.h;
    // add color option
    data.opts.style = colorOption;
    data.opts.style.textColor2 = colorOption.hColor; // TO DO fix redundant names
    data.via = document.referrer;

    function handleError(err) {
      console.error(err);
      let msg = err.msg ? err.msg : 'Error creating video';
      msg += '. Please submit a bug report.';

      that.setState({
        view: 'default',
        snackbarOpen: true,
        snackbarMessage: msg
      });
    }

    // start the loading animation
    this.setState({
      loading: true
    });
    
    jQuery.ajax({
      url: apiEndpoint + '/create-video',
      type: 'POST',
      data: JSON.stringify(data),
      crossDomain: true,
      headers: {
          'h': h,
          'Content-Type': 'application/json'
      },
      success: (res) => {
        console.log('success posting snippet', res);

        // catch cases where API Gateway does not send the proper response codes
        if (res.errorMessage) {
          handleError(res.errorMessage);
          return;
        }

        this.setState({
          view: 'share',
          loading: false,
          videoData: res
        }, function() {
          this.props.history.push('/share/' + this.state.showNumber );
        });
      },
      error: (err) => {
        handleError(err.responseText ? JSON.parse(err.responseText) : err);
      }
    });
  }

  /** POST request to post to social media on Lambda, triggered when user clicks the "Preview" button in {@link ShareContainerComponent|ShareContainer}.*/
  createSocialMedia(data) {
    var that = this;
    let apiEndpoint = apiEndpoint_default;

    // start the loading animation
    this.setState({
      loading: true
    });

    function handleError(err) {
      console.error(err);
      that.setState({
        view: 'share',
        snackbarOpen: true,
        snackbarMessage: err.msg ? err.msg : 'There was an error. Please submit a bug report.'
      });
    }

    jQuery.ajax({
      url: apiEndpoint + '/social-post',
      type: 'POST',
      data: JSON.stringify(data),
      crossDomain: true,
      contentType: 'application/json',
      success: (res) => {
        if (res.errorMessage) {
          handleError(res.errorMessage);
          return;
        }

        that.setState({
          view: undefined,
          loading: false,
          snackbarOpen: true,
          snackbarMessage: 'Shared successfully!'
        }, function() {
          this.props.history.push('/');
        });
      },
      error: (err) => {
        handleError(err.responseText ? JSON.parse(err.responseText) : err);
      }
    });
  }
  /** "Log out" of Twitter by deleting the auth keys on both the temporary state and in `localStorage`. Twitter doesn't provide a deauth endpoint so this is as close as we get. */
  twLogout() {
    this.setState({
      twUserName: undefined,
      twAuthToken: undefined
    }, function() {
      this.saveUserToLocalStorage();
    });
  }
  /**
  * Save the relevant clipper state data to `localStorage`. Doesn't do auth state, only what show we're on and what our selection is.
  */
  saveStateToLocalStorage() {
    if (!Store.enabled) return;
    const statesToSave = {
      showNumber: this.state.showNumber,
      selectedWords: this.state.selectedWords,
      h: this.state.h,
      regionStart: this.state.regionStart,
      regionEnd: this.state.regionEnd,
      pos: this.state.regionStart,
      episode: this.state.episode,
      airDate: this.state.airDate
    };

    Store.set('app-state', statesToSave);
  }

  /**
  * Save the auth info to `localStorage`.
  */
  saveUserToLocalStorage() {
    if (!Store.enabled) return;

    const statesToSave = {
      twUserName: this.state.twUserName,
      twAuthToken: this.state.twAuthToken,
    };

    // TODO: catch when localStorage is full. probably use an external localStorage library for this?
    Store.set('user-state', statesToSave);
  }

  /**
  * Calculate `wordDictionary`, `paragraphDictionary`, `paragraphMillis`, `wordMillis`, and `selectedWords` from the raw transcript data returned by {@link AppComponent#loadEpisode}. This is a pretty expensive function.
  * @param {Object[]} words Raw transcript data.
  * @param {Array} paragraphMillis An array of strings of numerical values, each corresponding to the offset in milliseconds of a paragraph in the transcript.
  */
  _makeWordsByParagraph(words, paragraphMillis) {
    let reducedWords = {};
    let initialSelectedWords = [];

    words.reduce(function(prevVal, curVal, curIndex) {
      let startTime = parseInt(curVal[0]);
      let endTime = parseInt( words[curIndex+1] ? words[curIndex+1][0] : curVal + 10000 );
      let heading;
      let text = curVal[1];

      // split heading (i.e. "ACT 1: ..."or "IRA GLASS: This" )
      if (curVal[1].indexOf(':') > -1 && !jQuery.isNumeric(curVal[1].split(':')[0]) ) {
        let textSplit = curVal[1].split(':');
        heading = textSplit[0];
        text = textSplit[1];
      }

      return reducedWords[curVal[0]] = {
        start: startTime,
        end: endTime,
        text: text,
        index: curIndex,
        heading
      };
    });

    var wordStartTimeArray = Object.keys(reducedWords);

    var reducedParagraphs = {};

    paragraphMillis.unshift(0);
    paragraphMillis.reduce( (prevVal, curVal, curIndex) => {
      let endTime = parseInt( paragraphMillis[curIndex + 1] || curVal + 10000 );
      let startTime = parseInt(curVal);
      let wordsInRange = this.findWordsInRange(startTime, endTime, reducedWords, wordStartTimeArray, true);
      if (wordsInRange.length === 0) return false;
      return reducedParagraphs[curVal] = {
        start: startTime,
        end: endTime,
        words: wordsInRange,
        heading: wordsInRange[0].heading // speaker
      };
    });

    // dont init with selected words unless we have a regionEnd
    initialSelectedWords = this.findWordsInRange(
      this.state.regionStart * 1000,
      this.state.regionEnd * 1000,
      reducedWords,
      wordStartTimeArray,
      true
    );

    console.log(reducedWords, reducedParagraphs);

    this.setState({
      wordDictionary: reducedWords,
      paragraphDictionary: reducedParagraphs,
      paragraphMillis: Object.keys(reducedParagraphs), // trim empty paragraphs
      wordMillis: wordStartTimeArray,
      selectedWords: initialSelectedWords,
      h: Helpers.hash(initialSelectedWords, this.state.regionStart.toString() + this.state.showNumber)
    });

  }

  /**
  * @param {Number} startTime The beginning of the range we're searching.
  * @param {Number} endTime The end of the range we're searching.
  * @param {Object} _reducedWords A `wordDictionary` object whose keys correspond to start times in milliseconds of each word in the transcript. The value is a {@link AppComponent#word|word} object.
  * @param {Array} _words A `wordMillis` array of strings of numerical values, each corresponding to the offset in milliseconds of a word in the transcript.
  * @returns {Object[]} Array of {@link AppComponent#word|words} that occur between two points in time.
  */
  findWordsInRange(startTime, endTime, _reducedWords, _words, paragraphSplitting) {
    if (startTime === endTime) return [];
    const reducedWords = _reducedWords || this.state.wordDictionary;
    const wordStartTimeArray = _words || Object.keys(reducedWords) || this.state.wordMillis;

    return wordStartTimeArray.filter(function(wordStart) {
      let testWord = reducedWords[wordStart];
      // we handle this function differently if we're looking to split paragraphs up than
      // if we're looking to find words to render for animation
      if (paragraphSplitting && !speakerNamesInTranscript) {
        return startTime < testWord.start && endTime >= testWord.start;
      }
      else {
        return startTime < testWord.end && endTime > testWord.start;
      }
    }).map(function(start) {
      return reducedWords[start];
    });
  }
  findSpeakerAtTime(startTime) {
    const paragraphDict = this.state.paragraphDictionary;
    const paragraphMillis = this.state.paragraphMillis;

    let speakerStartTimes = {};
    let name = '';

    paragraphMillis.filter(function(pStart) {
      return paragraphDict[pStart].heading
    }).forEach(function(start) {
      speakerStartTimes[start] = paragraphDict[start].heading
    });

    Object.keys(speakerStartTimes).forEach(function(start, i, arr) {
      if (start > startTime && !name) {
        name = speakerStartTimes[arr[i-1]];
      }
    });
    return name;
  }
  loadMoreEpisodes() {
    const epsLength = this.state.eps.length;
    const perPage = this.props.eps.length;
    const page = (epsLength / perPage);

    jQuery.ajax({
      method: 'GET',
      url: apiEndpoint_default+'/recent?page=' + page,
      cache: true,
      crossDomain : false,
      headers: {'X-Requested-With': 'XMLHttpRequest'},
      success: (data) => {
        this.setState({
          eps: this.state.eps.concat(data)
        });
      },
      error: function(xhr, status, err) {
        window.console.error(this.props.url, status, err.toString());
      }.bind(this)
    })
  }
  onColorChange(colors) {
    colorOption = colors;
  }

  /** Render the application. This also loads our custom React theme, and renders different views based on the state of `view`. */
  render() {
    const customTheme = createMuiTheme(this.customTheme);
    return (
    <MuiThemeProvider theme={customTheme}>
      <div className="index" onClick={this._cancelTranscriptTap.bind(this)}>
        <NavBar
          history={this.props.history}
          twAuth={this.state.twAuthToken}
          twName={this.state.twUserName}
          twLogout={this.twLogout.bind(this)}
          muiTheme={customTheme}
          episode={this.state.episode}
          view={this.state.view}
        />
        <Switch>
          <Route exact path="/" render={()=>
            <Landing eps={this.state.eps} badEps={this.state.episodesWithProblems} loadMoreEpisodes={this.loadMoreEpisodes.bind(this)}/>
          }/>
          <Route exact path="/setup" render={()=><Setup apiEndpoint={apiEndpoint_default}/>}/>
          <Route exact path="/admin" render={()=><Admin apiEndpoint={apiEndpoint_default} eps={this.state.eps}/>}/>
          <Route exact path="/admin/:showNumber/edit-transcript" render={(props)=>
            <AdminEditTranscriptComponent
              {...props}
              apiEndpoint={apiEndpoint_default}
            />
          }/>
          <Route exact path="/about" render={()=>
            <div className="content">
              <div className="about-page" dangerouslySetInnerHTML={aboutDoc} />
            </div>
          }/>

          <Route exact path="/clipping/:showNumber" render={()=>
            <Loader
              show={this.state.loading}
              msg='loading episode'
            >
              <ClippingHLSWrapper
                hls={this.state.hls}
                peaks={this.state.peaks}
                regionStart={this.state.regionStart}
                regionEnd={this.state.regionEnd}
                selectedWords={this.state.selectedWords}
                showNumber={this.state.showNumber}
                totalDuration={this.state.showDuration}
                clippingDuration={this.state.clippingDuration}
                clippingOffset={this.state.clippingOffset}
                wordDictionary={this.state.wordDictionary}
                paragraphMillis={this.state.paragraphMillis}
                wordMillis={this.state.wordMillis}
                paragraphDictionary={this.state.paragraphDictionary}
                episode={this.state.episode}
                airDate={this.state.airDate}
                textSelectionChanged={this.textSelectionChanged.bind(this)}
                muiTheme={customTheme}
                createVideo={this.createVideo.bind(this)}
                clipTooLong={this.state.clipTooLong}
                onDrewPeaks={this.onDrewPeaks.bind(this)}
                drewPeaks={this.state.drewPeaks}
                handleWordTap={this._handleWordTap.bind(this)}
                tappedWord={this.state.tappedWord}
                view={this.state.view}
                onColorChange={this.onColorChange.bind(this)}
              />
            </Loader>
          }/>

          <Route exact path="/preview/:showNumber" render={()=>
            <Loader
              show={this.state.loading}
              msg='loading episode'
            >
              <ClippingHLSWrapper
                hls={this.state.hls}
                peaks={this.state.peaks}
                regionStart={this.state.regionStart}
                regionEnd={this.state.regionEnd}
                selectedWords={this.state.selectedWords}
                showNumber={this.state.showNumber}
                totalDuration={this.state.showDuration}
                clippingDuration={this.state.clippingDuration}
                clippingOffset={this.state.clippingOffset}
                wordDictionary={this.state.wordDictionary}
                paragraphMillis={this.state.paragraphMillis}
                wordMillis={this.state.wordMillis}
                paragraphDictionary={this.state.paragraphDictionary}
                episode={this.state.episode}
                airDate={this.state.airDate}
                textSelectionChanged={this.textSelectionChanged.bind(this)}
                muiTheme={customTheme}
                createVideo={this.createVideo.bind(this)}
                clipTooLong={this.state.clipTooLong}
                onDrewPeaks={this.onDrewPeaks.bind(this)}
                drewPeaks={this.state.drewPeaks}
                handleWordTap={this._handleWordTap.bind(this)}
                tappedWord={this.state.tappedWord}
                view={this.state.view}
                onColorChange={this.onColorChange.bind(this)}
              />
            </Loader>
          }/>

          <Route exact path="/share/:showNumber" render={()=>
            <ShareContainer
              muiTheme={customTheme}
              history={this.props.history}
              videoData={this.state.videoData}
              episode={this.state.episode}
              airDate={this.state.airDate}
              twAuth={this.state.twAuthToken}
              twName={this.state.twUserName}
              createSocialMedia={this.createSocialMedia.bind(this)}
            />
          }/>
        </Switch>
        {/* Tell user to rotate from landscape */}
        <div className="no-mobile landscape">
          <h1><ScreenLockPortrait/></h1>
          <p>Please rotate your screen</p>
        </div>
        <Snackbar
          className="error-message"
          open={this.state.snackbarOpen}
          message={this.state.snackbarMessage}
          autoHideDuration={10000}
          onRequestClose={this.handleSnackbarClose.bind(this)}
          ref="_snackbar"
        />
      </div>
    </MuiThemeProvider>
    );
  }
}

AppComponent.propTypes = {
  wordMillis: PropTypes.array,
  paragraphMillis: PropTypes.array,
  showNumber: PropTypes.string,
  showDuration: PropTypes.number,
  selectedWords: PropTypes.array,
  hls: PropTypes.string,
  peaks: PropTypes.array,
  regionStart: PropTypes.number,
  regionEnd: PropTypes.number,
  pos: PropTypes.number,
  view: PropTypes.string,
  loading: PropTypes.bool,
  videoData: PropTypes.object,
  paragraphDictionary: PropTypes.object,
  wordDictionary: PropTypes.object,
  clipTooLong: PropTypes.bool,
  drewPeaks: PropTypes.bool,
  eps: PropTypes.array,
  episodesWithProblems: PropTypes.array,
  tappedWord: PropTypes.string,
  h: PropTypes.string,
  params: PropTypes.shape({
    showNumber: PropTypes.string
  })
};

/**
 * Props on this component.
 * @name AppComponent#props
 * @type {object}
 * @property {Array} wordMillis An array of strings of numerical values, each corresponding to the offset in milliseconds of a word in the transcript.
 * @property {Array} paragraphMillis An array of strings of numerical values, each corresponding to the offset in milliseconds of a paragraph in the transcript.
 * @property {String} showNumber The number of the episode. Our primary identifier, used to match transcripts to audio files.
 * @property {Number} showDuration Length of the show in seconds.
 * @property {Number} clippingDuration Length of the portion of the show we are clipping (downloaded transcript and waveform) in seconds.
 * @property {Number} clippingOffset Start time of the portion of the show we are clipping (downloaded transcript and waveform) in seconds.
 * @property {Object[]} selectedWords An array of {@link AppComponent#word|words} that are currently selected by the user.
 * @property {String} hls The URI for the HLS stream (*.m3u8 file).
 * @property {Number[]} peaks An array representing the "peaks" of the waveform. This is what the visual outline of the waveform is composed of. It's in pairs of positive/negative peaks.
 * @property {Number} regionStart The starting time of the current selected Waveform region, in seconds.
 * @property {Number} regionEnd The ending time of the current selected Waveform region, in seconds.
 * @property {Number} pos The current play position of Waveform, in seconds.
 * @property {Boolean} loading Whether the app is loading an asset. When this is true, the loading spinner renders.
 * @property {Object} videoData Empty at initialization, this contains an object with information returned by the Lambda function that renders video.
 * @property {String} videoData.Bucket The s3 bucket where the video is stored.
 * @property {String} videoData.Key The filename for the mp4 rendered.
 * @property {Number} videoData.database_id
 * @property {String} videoData.message A success/failure message.
 * @property {String} videoData.url The fully-qualified URL for the rendered mp4.
 * @property {Object} paragraphDictionary An object whose keys correspond to start times in milliseconds of the first word in a paragraph.
 * @property {Number} paragraphDictionary.start The start time in milliseconds of the first word in the paragraph.
 * @property {Number} paragraphDictionary.end The start time in milliseconds of the last word in the paragraph.
 * @property {Object[]} paragraphDictionary.words An array of {@link AppComponent#word|words} in the paragraph.
 * @property {Object} wordDictionary An object whose keys correspond to start times in milliseconds of each word in the transcript. The value is a {@link AppComponent#word|word} object.
 * @property {Boolean} clipTooLong This is `true` if the user's selected region is greater than `maxClipSeconds`.
 * @property {Boolean} drewPeaks This is `true` if Waveform has rendered the waveform.
 * @property {String} h Hash for selected text.
 */
/**
 * @alias word
 * @memberof! AppComponent#
 * @property {Number} word.index The index of the word, useful for references to its DOM element among other things.
 * @property {Number} word.start Starting offset of the word in milliseconds.
 * @property {Number} word.end Ending offset of the word in milliseconds.
 * @property {Boolean} word.heading This is `true` if this word is part of a header element.
 * @property {String} word.text The text of the word. A "word" can be more than one English word, this is just what our word-aligned metadata considers a word.
*/

AppComponent.defaultProps = {
  match: {
    params: {}
  },
  wordMillis: [],
  paragraphMillis: [],
  showNumber: undefined,
  showDuration: 0,
  selectedWords: [],
  hls: undefined,
  peaks: [],
  regionStart: 0,
  regionEnd: 0,
  pos: 0,
  view: 'default',
  loading: true,
  videoData: {},
  paragraphDictionary: {},
  wordDictionary: {},
  clipTooLong: false,
  drewPeaks: false,
  clippingDuration: 500,
  clippingOffset: 0,
  tappedWord: undefined,
  h: undefined,
  eps: [],
  episodesWithProblems: require('config').default.episodesWithProblems,
  params: {
    showNumber: '500'
  }
};

export default AppComponent;
