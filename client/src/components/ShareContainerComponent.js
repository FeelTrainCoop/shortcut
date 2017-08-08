'use strict';

import React from 'react';
import { hashHistory } from 'react-router'
import FlatButton from 'material-ui/FlatButton';
import IconButton from 'material-ui/IconButton';
import RaisedButton from 'material-ui/RaisedButton';
import Toggle from 'material-ui/Toggle';
import TextField from 'material-ui/TextField';
import DownloadIcon from 'material-ui/svg-icons/action/get-app';

import LoginTwitterComponent from './LoginTwitterComponent';
import LoginFacebookComponent from './LoginFacebookComponent';
import Subhead from './SubheadComponent';

import Helpers from '../helpers';
import Config from '../../cfg/master';

const moment = require('moment');
const Store = require('store'); // localStorage

const tweetMaxChars = 115;

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
      hashHistory.replace('/');
      window.location.reload();
      return;
    }

    const episodeNumber = videoData.Key.match(/(\d+)_/)[1];
    let defaultSocialMessage = Config.socialMediaMessageDefault;
    let initialCharsUsed = this._calculateStatusLength('');

    var defaultState = {
      charsUsed: initialCharsUsed,
      twitterToggle: !!this.props.twAuth,
      facebookToggle: !!this.props.fbAuth,
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
      facebookToggle: nextProps.fbAuth ? (this.props.fbAuth ? this.state.facebookToggle : true) : false
      // facebookToggle: nextProps.fbAuth ? this.state.facebookToggle : (this.props.fbAuth ? this.state.facebookToggle : false)
    });
  }

  render() {
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
                floatingLabelText={this.state
                  ? (this.state.charsUsed + 140 - tweetMaxChars) + '/' + 140
                  : 0
                }
                fullWidth={true}
                rows={4}
                multiLine={true}
                ref={(txtField) => this._textField = txtField}
                value={this.state ? this.state.textFieldValue : ''}
                onChange={(e) => {
                  this.handleSocialMessageChange(e.target.value)
                }}
              />
              <div className="suggested-text">
                <div className="social-pad">
                  <RaisedButton
                    onClick={
                      () => {
                        window.ga('send', {
                          'hitType': 'event',
                          'eventCategory': 'Share',
                          'eventAction': 'AddLinkToShow',
                          'eventLabel': this.props.showNumber
                        });
                        this.insertSocialMsg(this.state.defaultSocialMessage);
                    }}
                    style={{width:'100%', overflow: 'hidden'}}
                    backgroundColor={this.props.muiTheme.palette.secondaryColorLight}
                    labelColor={this.props.muiTheme.palette.whiteColor}
                    label={Helpers.isMobile() ? `Add a link to your episode` : `Add a link to your episode: ${this.state.defaultSocialMessage}`}
                  />
                </div>
              </div>

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
                  <Toggle
                    className="social-toggle"
                    defaultToggled={this.props.twAuth ? true : false}
                    toggled={this.state ? this.state.twitterToggle : false}
                    onToggle={this.handleTwitterToggle.bind(this)}
                    labelPosition="right"
                  />
                </div>
                <div
                  className="social-toggle-item"
                >
                  <LoginFacebookComponent
                    fbName={this.props.fbName}
                    fbLogout={this.props.fbLogout}
                    href="http://hello.com"
                  />
                  <Toggle
                    className="social-toggle"
                    toggled={this.state ? this.state.facebookToggle : false}
                    defaultToggled={this.props.fbAuth ? true : false}
                    onToggle={this.handleFacebookToggle.bind(this)}
                    labelPosition="right"
                  />
                </div>
                <hr className="hide-s"/>

                <IconButton
                  label="Download"
                  labelStyle={{color: this.props.muiTheme.palette.whiteColor}}
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
                  <span className="half-white"> Download</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <FlatButton label="Share" labelStyle={{color: 'white'}}
          backgroundColor={this.props.muiTheme.palette.tertiaryColor}
          hoverColor={this.props.muiTheme.palette.tertiaryColorLight}
          disabled={ (!this.state || !this.state.twitterToggle && !this.state.facebookToggle) || (this.state.twitterToggle && this.state.charsUsed > tweetMaxChars) ? true : false}
          rippleColor="white"
          className="share-button"
          onClick={this.createSocialMedia.bind(this)}
        />
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
      window.open(require('config').default.authServer + '/auth/twitter', '_blank');
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
  handleFacebookToggle(e) {
    const disabled = !this.props.fbAuth ? true : false;

    if (disabled) {
      window.open(require('config').default.authServer + '/auth/facebook', '_blank');
      e.preventDefault();
      e.stopPropagation();
      return;
    } else {
      const newState = !this.state.facebookToggle;
      this.setState({
        facebookToggle: newState
      });
    }


  }
  handleTwitterClick() {
    console.log('clicked');
  }
  createSocialMedia() {
    const data = {
      video_data: this.state.videoData,
      msg: this.socialMessage || this.state.defaultSocialMessage,
      twitter_info: this.state.twitterToggle ? this.props.twAuth : false,
      facebook_info: this.state.facebookToggle ? this.props.fbAuth : false
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
  muiTheme: React.PropTypes.shape({
    palette: React.PropTypes.shape({
      secondaryColorLight: React.PropTypes.string,
      whiteColor: React.PropTypes.string,
      tertiaryColor: React.PropTypes.string,
      tertiaryColorLight: React.PropTypes.string
    })
  })
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

export default ShareContainerComponent;
