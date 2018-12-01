'use strict';

import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import FlatButton from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import PropTypes from 'prop-types';
import Switch from '@material-ui/core/Switch';
import TextField from '@material-ui/core/TextField';
import DownloadIcon from '@material-ui/icons/GetApp';

import LoginTwitterComponent from './LoginTwitterComponent';
import Subhead from './SubheadComponent';

import Config from '../../cfg/master';

const moment = require('moment');
const Store = require('store'); // localStorage
const tweetMaxChars = 280;
const isSecure =  window.location.protocol == 'https:';

const scssVariables = require('sass-extract-loader!../styles/_variables.scss').global;
// Style override for toggle switch
const styles = {
  bar: {},
  checked: {
    color: scssVariables['$primary-color'].value.hex,
    '& + $bar': {
      backgroundColor: scssVariables['$primary-color'].value.hex,
    },
  },
};

require('styles//ShareContainer.scss');

/** This component renders the whole "share" page, including the `<video>` element for the rendered mp4 and all of the social media sharing options. */
class ShareContainerComponent extends React.Component {
  constructor(props) {
    super(props);

    const videoData = this.props.videoData || Store.get('share-state');

    if (this.props.videoData && Store.enabled) {
      Store.set('share-state', videoData);
    } else if (!videoData) {
      // user may have hit the back button, but we have no video to display. Redirect to home page.
      this.props.history.replace('/');
      window.location.reload();
      return;
    }

    const episodeNumber = videoData.Key.match(/(\d+)_/)[1];
    let defaultSocialMessage = Config.socialMediaMessageDefault;
    let initialCharsUsed = this._calculateStatusLength('');

    var defaultState = {
      charsUsed: initialCharsUsed,
      twitterToggle: !!this.props.twAuth,
      defaultSocialMessage: defaultSocialMessage,
      videoData: videoData || {},
      textFieldValue: '',
      episodeNumber: this.props.episode || episodeNumber
    };

    this.state = defaultState;
  }

  componentWillReceiveProps(nextProps) {
    // if no accounts were signed in but now one is...
    this.setState({
      twitterToggle: nextProps.twAuth ? (this.props.twAuth ? this.state.twitterToggle : true) : false,
    });
  }

  render() {
    const charsUsed = this.state ? `${this.state.charsUsed}/${tweetMaxChars}` : 0;
    return (
      <div className="sharecontainer-component content">
        <div className="row hide-s">
          <div className="episode-header"><div className="state-tag">Previewing</div> <span className="episode-title">{this.props.episode}</span> | <span className="air-date">{moment(this.props.airDate).format('LL')}</span></div>
        </div>
        <Subhead
          heading="Share Video"
          prev={`/#/preview/${this.props.showNumber}`}
          step={3}
        />
        <div className="row">
          <div className="col-md-6 middle flex-top">
            <div
              className="preview-video-container"
              onClick={this._toggleVideoPlayback.bind(this)}
            >
              <video
                className="preview-video"
                src={this.state && this.state.videoData ? this.state.videoData.url : undefined}
                controls={false}
                id="preview-video"
              />
            </div>
          </div>

          <div className="col-md-6 middle flex-bottom">
            <div className="share-options">
              <div className="social-pad hide-s">
                <h4>Write a Caption</h4>
              </div>
              <TextField
                className="social-textarea"
                // defaultValue={this.state.defaultSocialMessage}
                label={charsUsed}
                placeholder={charsUsed}
                fullWidth={true}
                rows={4}
                multiline={true}
                ref={(txtField) => this._textField = txtField}
                value={this.state ? this.state.textFieldValue : ''}
                onChange={(e) => {
                  this.handleSocialMessageChange(e.target.value)
                }}
              />

              <hr className="hide-s"/>

              <div className="social-toggle-container">

                <div className="social-pad hide-s">
                  {<h4>Share On</h4>}
                </div>

                <div className="social-toggle-item">
                  <LoginTwitterComponent
                    twName={this.props.twName}
                    twLogout={this.props.twLogout}
                  />
                  <Switch
                    classes={{ checked: this.props.classes.checked, bar: this.props.classes.bar }}
                    className="social-toggle"
                    disabled={this.props.twAuth ? false : true}
                    checked={this.state ? this.state.twitterToggle : false}
                    onChange={this.handleTwitterToggle.bind(this)}
                  />
                </div>
                <hr className="hide-s"/>

                <IconButton
                  className="download-button no-underline share-download"
                  onClick={() => {
                    window.ga('send', {
                      'hitType': 'event',
                      'eventCategory': 'Share',
                      'eventAction': 'Download',
                      'eventLabel': this.props.showNumber
                    });
                    window.open(this.state.videoData ? this.state.videoData.url : undefined, '_blank');
                  }}
                >
                  <DownloadIcon color="white"/>
                </IconButton>
                <a
                  href={this.state && this.state.videoData ? this.state.videoData.url : undefined}
                  target="_blank"
                  className="share-download"
                  onClick={() => {
                    window.ga('send', {
                      'hitType': 'event',
                      'eventCategory': 'Share',
                      'eventAction': 'Download',
                      'eventLabel': this.props.showNumber
                    });
                  }}
                >
                  <span> Download</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <FlatButton
          disabled={ (!this.state || !this.state.twitterToggle) || (this.state.twitterToggle && this.state.charsUsed > tweetMaxChars) ? true : false}
          className="share-button"
          onClick={this.createSocialMedia.bind(this)}
        >
          Share
        </FlatButton>
      </div>
    );
  }
  componentDidMount() {
    this._audioElt = document.getElementById('audio-element');
  }
  /**
   *  Calculate length of a status msg according to Twitter
   *  by replacing actual urls with t.co/ urls
   *  @param   {String} text initial text
   *  @return  {Number}      tweet length
   *  @private
   */
  _calculateStatusLength(text) {
    let exp = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
    let count = text.replace(exp,"https://t.co/Bsg2KuUZTW");
    return count.length;
  }
  handleSocialMessageChange(val) {
    let twCharCount = this._calculateStatusLength(val);
    this.socialMessage = val;
    this.setState({
      charsUsed: twCharCount,
      textFieldValue: val
    });
  }
  handleTwitterToggle(e) {
    const disabled = !this.props.twAuth ? true : false;

    if (disabled) {
      isSecure ? window.open(require('config').default.authServerSsl + '/auth/twitter', '_blank') : window.open(require('config').default.authServer + '/auth/twitter', '_blank');
      e.preventDefault();
      e.stopPropagation();
      return;
    } else {
      const newState = !this.state.twitterToggle;
      this.setState({
        twitterToggle: newState
      });
    }
  }
  handleTwitterClick() {
    console.log('clicked');
  }
  createSocialMedia() {
    const data = {
      video_data: this.state.videoData,
      msg: this.socialMessage || '',
      twitter_info: this.state.twitterToggle ? this.props.twAuth : false,
    };

    // --> Main.js
    this.props.createSocialMedia(data)
  }

  _toggleVideoPlayback() {
    const video = document.getElementById('preview-video');

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }

    window.ga('send', {
      'hitType': 'event',
      'eventCategory': 'Share',
      'eventAction': video.paused ? 'Play' : 'Pause',
      'eventLabel': this.props.showNumber
    });
  }

  togglePlay() {
    this._audioElt.play();
  }

  insertSocialMsg(msg) {
    const space = this.state.textFieldValue.length > 0 ? ' ' : ''
    const newVal = String(this.state.textFieldValue) + space + msg;
    this.setState({
      textFieldValue: newVal
    });
    this.handleSocialMessageChange(newVal);
  }
}

ShareContainerComponent.displayName = 'ShareContainerComponent';

// Uncomment properties you need
ShareContainerComponent.propTypes = {
  classes: PropTypes.object.isRequired
};
ShareContainerComponent.defaultProps = {
  muiTheme: {
    palette: {
      secondaryColorLight: 'white',
      whiteColor: 'white',
      tertiaryColor: 'white',
      tertiaryColorLight: 'white'
    }
  }
};

export default withStyles(styles)(ShareContainerComponent);
