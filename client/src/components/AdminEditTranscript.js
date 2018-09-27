import React from 'react';
import { Paper, Button } from 'material-ui';
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
      authenticated: false,
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
    }.bind(this));
  }

  handleChange(e) {
    let transcript = e.target.value;
    this.setState({
      transcript
    });
  }

  handleClick() {
    // this should go to an endpoint that's protected by basic auth
    // maybe POST to https://server/admin/syncEpisode with the guid of the episode and the transcript content in the form body.
    // curl -u admin:1234 -d "guid=https://explainjojo.com/episodes/s01e02.html&transcript=Hello" -H "Content-Type: application/x-www-form-urlencoded" -X POST http://localhost:3000/admin/syncEpisode
    console.log(this.state.episodeData.guid, this.state.transcript);
    jQuery.ajax({
      type: 'POST',
      url: `${this.apiEndpoint}/admin/syncEpisode`,
      xhrFields: { withCredentials: true },
      data: {
        guid: this.state.episodeData.guid,
        transcript: this.state.transcript
      }
    });
    
    // the endpoint then: download the mp3, sends gentle the mp3 and the form data, forwards the status info back to the shortcut client, stores the plaintext transcript and the sync data in sqlite, sends a "we are done" when done
  }

  render() {
    const isAuthenticated = this.state.authenticated;
    const ep = this.state.episodeData;
    //<h1>{this.props.match.params.showNumber}</h1>

    if (isAuthenticated) {
      return(
      <div>
        <Paper>
          <Loader
            show={true}
            msg='updating server...'
          />
          <div className="hero-space">
            <div className="hero-content">
              <img src={logo} className="logo" alt={parentSiteName}/>
              <h2 className="tagline">Admin Panel</h2>
            </div>
          </div>
          <div className="content transcript">
            <h1>Edit Episode Transcript</h1>
            <h2>{ep.number} - {ep.title}</h2>
            <textarea
              id="edit-transcript"
              placeholder="Paste your transcript here"
              className="edit-transcript"
              onChange={this.handleChange.bind(this)}
            />
            <p>Click the button below to submit your transcript. When you do this, you'll see a progress bar while we synchronize your audio with your transcript. This can take a long time (up to the length of your episode), so please be patient!</p>
            <Button
              raised
              className="submit"
              onClick={this.handleClick.bind(this)}
            >
              Submit
            </Button>
          </div>
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
