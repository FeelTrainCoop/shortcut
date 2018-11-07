import React from 'react';
import { Paper, Button } from '@material-ui/core';
import LinearProgress from '@material-ui/core/LinearProgress';
import Modal from '@material-ui/core/Modal';
import Loader from 'components/LoadingAnimationComponent';

const parentSiteName = require('config').default.parentSiteName;
const logo = require('../images/logo.png');
const jQuery = require('jquery');

require('styles/Admin.scss');

class AdminEditTranscriptComponent extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      eps: props.eps,
      isSyncing: false,
      syncPercent: 0,
      isLoading: true,
      modalOpen: false,
      authenticated: false,
      modalMessage: '',
      switches: [],
    };
    this.apiEndpoint = props.apiEndpoint;
  }

  componentDidMount() {
    jQuery.when(
      // get our list of all episodes, unfiltered since this is the admin pane
      jQuery.ajax({
        url: `${this.apiEndpoint}/recent?filter=0`,
      })
    ).done(function (allEpisodeData) {
      let episodeData = allEpisodeData.filter(episode => episode.number === this.props.match.params.showNumber)[0];
      this.setState({
        authenticated: true,
        episodeData
      });
      jQuery.ajax({
        xhrFields: { withCredentials: true },
        url: `${this.apiEndpoint}/admin/getTranscript?guid=${episodeData.guid}`,
      }).then(result => {
        this.setState({
          isLoading: false
        });
        if (result && result.transcript) {
          document.getElementById('edit-transcript').value = result.transcript;
          this.setState({
            transcript: result.transcript,
          });
        }
      });
    }.bind(this));
  }

  handleChange(e) {
    let transcript = e.target.value;
    this.setState({
      transcript
    });
  }

  handleModalOpen(message) {
    this.setState({ modalOpen: true, modalMessage: message });
  }

  handleModalClose() {
    if (!this.state.isSyncing) {
      this.setState({ modalOpen: false });
    }
  }

  handleModalButton(enable, location) {
    let doneUrl = `${this.apiEndpoint}/admin/syncEpisodeDone?location=${location}&guid=${this.state.episodeData.guid}&enable=${enable}`;
    fetch(doneUrl, {credentials: 'include'})
      .then(() => {
        window.location='/#/admin/';
      });
  }

  handleClick() {
    this.handleModalOpen(<div><h1>Syncing Transcript...</h1><span>Loading mp3 (this could take a few minutes)...</span></div>);
    this.setState({ isSyncing: true });
    jQuery.ajax({
      type: 'POST',
      url: `${this.apiEndpoint}/admin/syncEpisode`,
      xhrFields: { withCredentials: true },
      data: {
        guid: this.state.episodeData.guid,
        transcript: this.state.transcript
      },
      success: data => {
        if (data.err) {
          this.setState({
            modalMessage: <div><h1>Error:</h1><span>{JSON.stringify(data.err, null, 2)}</span></div>
          });
        }
        else if (data.location) {
          this.pollTranscriptionStatus.bind(this, data.location)();
        }
        else {
          this.setState({
            modalMessage: <div><h1>Error:</h1><span>Something went wrong and we're not sure what happened (no data at all was returned from the syncEpisode endpoint).</span></div>
          });
        }
      }
    });
  }

  pollTranscriptionStatus(location) {
    let transcriptionStatusUrl = `${this.apiEndpoint}/admin/syncEpisodeStatus?location=${location}`;
    fetch(transcriptionStatusUrl, {credentials: 'include'})
      .then(response => response.json())
			.then(json => {
        let statusMessage = 'Transcription starting up...';
        switch (json.status) {
          case 'OK':
            statusMessage = `Done syncing! Enable the episode immediately? Either choice will send you back to the main admin screen.`;
            break;
          case 'TRANSCRIBING':
            statusMessage = `Transcription${json.percent ? ' (part 1/2) in progress, '+(json.percent*100).toFixed(0)+'% done' : ' starting up...'}`;
            break;
          case 'ALIGNING':
            statusMessage = `Aligning ${json.percent ? ' (part 2/2) in progress, '+(json.percent*100).toFixed(0)+'% done' : ' starting up...'}`;
            break;
        }

        // Keep polling unless we are done with sync, in which case we hit the "done" endpoint
        if (json.status === 'OK' && json.percent === 1) {
          this.setState({
            modalMessage: <div>
              <h1>Syncing Transcript...</h1>
              <span>{statusMessage}</span>
              <p>&nbsp;</p>
              <Button
                variant="contained"
                className="submit"
                onClick={this.handleModalButton.bind(this, true, location)}
              >
                Yes
              </Button>
              <Button
                variant="contained"
                className="submit"
                onClick={this.handleModalButton.bind(this, false, location)}
              >
                No
              </Button>
            </div>,
            syncPercent: json.percent*100
          });
        }
        else {
          this.setState({
            modalMessage: <div><h1>Syncing Transcript...</h1><span>{statusMessage}</span></div>,
            syncPercent: json.percent*100
          });

          setTimeout(this.pollTranscriptionStatus.bind(this, location), 1*1000);
        }
    });
  }

  render() {
    const isAuthenticated = this.state.authenticated;
    const ep = this.state.episodeData;
    //<h1>{this.props.match.params.showNumber}</h1>

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
          <Loader
            show={this.state.isLoading}
            msg='getting episode data...'
          >
          </Loader>
          <div className={this.state.isLoading ? "hidden content transcript" : "content transcript"}>
            <h1>Edit Episode Transcript</h1>
            <h2>{ep.number} - {ep.title}</h2>
            <audio controls src={ep.mp3}></audio>
            <p><a href={ep.mp3}>{ep.mp3}</a></p>
            <textarea
              id="edit-transcript"
              placeholder="Paste your transcript here"
              className="edit-transcript"
              onChange={this.handleChange.bind(this)}
            />
            <p>Click the "Submit" button below to submit your transcript. When you do this, you'll see a progress bar while we synchronize your audio with your transcript. This can take a long time (up to the length of your episode), and can't be canceled once started, so please be patient! You can also click "Back" to go back to the admin menu.</p>
            <Button
              variant="contained"
              className="submit"
              onClick={this.handleClick.bind(this)}
            >
              Submit
            </Button>

            <Button
              variant="contained"
              className="submit"
              href="/#/admin/"
            >
              Back
            </Button>
          </div>
          <Modal
            open={this.state.modalOpen}
            onClose={this.handleModalClose.bind(this)}
          >
            <div className="modal-window">
              <LinearProgress
                className={this.state.isSyncing ? "" : "vis-hidden"}
                variant="determinate"
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

export default AdminEditTranscriptComponent;
