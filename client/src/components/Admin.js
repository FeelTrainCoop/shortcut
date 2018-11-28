import React from 'react';
import { Paper } from '@material-ui/core';
import Switch from '@material-ui/core/Switch';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import LinearProgress from '@material-ui/core/LinearProgress';
import Modal from '@material-ui/core/Modal';
import { FormControlLabel, FormGroup } from '@material-ui/core';

const parentSiteName = require('config').default.parentSiteName;
const logo = require('../images/logo.png');
const jQuery = require('jquery');

require('styles/Admin.scss');

class AdminComponent extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      eps: props.eps,
      authenticated: false,
      switches: [],

    };
    this.apiEndpoint = props.apiEndpoint;
  }

  componentDidMount() {
    jQuery.when(
      // get our stored list of what episodes are enabled/disabled
      jQuery.ajax({
        url: `${this.apiEndpoint}/admin/getEpisodes`,
        xhrFields: { withCredentials: true },
      }),
      // get our list of all episodes, unfiltered since this is the admin pane
      jQuery.ajax({
        url: `${this.apiEndpoint}/recent?filter=0`,
      }),
      // get our list of application key credentials
      jQuery.ajax({
        url: `${this.apiEndpoint}/admin/getApplicationKeys`,
        xhrFields: { withCredentials: true },
      }),
    ).done(function (episodeStateData, allEpisodeData, applicationKeys) {
      let tempSwitches = allEpisodeData[0].map(episode => {
        let foundElement = episodeStateData[0].find(el => el.guid === episode.guid);
        episode.checked = foundElement ? foundElement.isEnabled : false;
        episode.hasTranscript = foundElement ? foundElement.hasTranscript : false;
        episode.value = episode.guid;
        return episode;
      });
      this.setState({
        switches: tempSwitches,
        authenticated: true,
        applicationKeys: applicationKeys[0]
      });
    }.bind(this));
  }

  renderSwitches() {
    return this.state.switches
      .map((el, index) =>
          <div key={index}>
            <FormControlLabel
              control={
                <Switch
                  disabled={!el.checked && !el.hasTranscript}
                  checked={!!el.checked}
                  value={el.value}
                  onChange={this.handleClick.bind(this,index)}
                />
              }
              key={el.value}
              label={el.title}
            />
            {
              el.hasTranscript ? ( <p className="edit-transcript"><a href={`/#/admin/${el.number}/edit-transcript`}>Edit Transcript</a></p> ) :
                ( <p className="edit-transcript"><a href={`/#/admin/${el.number}/edit-transcript`}>Add Transcript</a></p> )
            }
          </div>
      );
  }

  handleClick(index) {
    let switches = this.state.switches;
    switches[index].checked = !switches[index].checked;
    this.setState({
      switches,
    }, () => {
      jQuery.ajax({
        type: 'POST',
        url: `${this.apiEndpoint}/admin/setEpisode`,
        xhrFields: { withCredentials: true },
        data: {
          guid: switches[index].guid,
          enabled: +switches[index].checked
        }
      });
      this.forceUpdate()
    });
  }

  handleSettingsChange(key, e) {
    let applicationKeys = this.state.applicationKeys;
    applicationKeys[key] = e.target.value;
    this.setState({
      applicationKeys,
    }, () => {
      this.forceUpdate()
    });
  }

  renderSettings() {
    return Object.keys(this.state.applicationKeys)
      .map((key) =>
        <div key={key}>
          <TextField
            id={key}
            label={key}
            placeholder="xx-xxxx-n"
            margin="dense"
            value={this.state.applicationKeys[key]}
            onChange={this.handleSettingsChange.bind(this,key)}
          />
        </div>
      );
  }

  submitSettings() {
    // serialize settings into object
    let result = Object.keys(this.state.applicationKeys)
      .reduce((allKeys, key) => {
        allKeys[key] = document.getElementById(key).value;
        return allKeys;
      }, {});
    // POST object to server
    this.handleModalOpen(<div><h1>Updating Settings</h1><span></span></div>);
    this.setState({ isSyncing: true });
    jQuery.ajax({
      type: 'POST',
      url: `${this.apiEndpoint}/admin/setApplicationKeys`,
      xhrFields: { withCredentials: true },
      data: {
        applicationKeys: this.state.applicationKeys
      },
      success: data => {
        if (data.err) {
          this.setState({
            modalMessage: <div><h1>Error:</h1><span>{JSON.stringify(data.err, null, 2)}</span></div>
          });
        }
        else {
          this.setState({ modalOpen: false});
        }
      }
    });
  }

  handleModalOpen(message) {
    this.setState({ modalOpen: true, modalMessage: message });
  }

  render() {
    const isAuthenticated = this.state.authenticated;
    
    if (isAuthenticated) {
      return(
      <div>
        <Paper>
          <div className="hero-space">
            <div className="hero-content">
              <img src={logo} className="logo" alt={parentSiteName}/>
              <h2 className="tagline">Admin Panel</h2>
            </div>
          </div>
          <div className="content episodes">
            <h3 className="recent-episodes">Configure Episodes</h3>
              <FormGroup>
              {this.renderSwitches.call(this)}
              </FormGroup>
            <h3 className="recent-episodes">Set Preferences</h3>
              <FormGroup className="set-variables">
                {this.renderSettings.call(this)}
                <Button
                  variant="outlined"
                  size="large"
                  color="primary"
                  className="button aws-save"
                  onClick={this.submitSettings.bind(this)}
                  //disabled={!this.state.isUsernameValid || !this.state.isPasswordValid || !this.state.doPasswordsMatch}
                >
                  Submit
                </Button>
              </FormGroup>
          </div>
          <Modal
            open={this.state.modalOpen}
          >
            <div className="modal-window">
              <LinearProgress
                className={this.state.isSyncing ? "" : "vis-hidden"}
                variant="indeterminate"
                value={this.state.syncPercent}
              />
              {this.state.modalMessage}
            </div>
          </Modal>
        </Paper>
      </div>
      );
    }
    else {
      return (
      <div>
        <Paper>
          <div className="content">
          </div>
        </Paper>
      </div>
      );
    }
  }
}

export default AdminComponent;
