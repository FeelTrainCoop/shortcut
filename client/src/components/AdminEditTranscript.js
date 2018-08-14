import React from 'react';
import { Paper, Button } from 'material-ui';
import TextField from 'material-ui/TextField';
import { FormControlLabel, FormGroup } from 'material-ui/Form';

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
          <div className="content transcript">
            <h1>Edit Episode Transcript</h1>
            <h2>{ep.number} - {ep.title}</h2>
            <textarea
              id="multiline-static"
              placeholder="Paste your transcript here"
              className="edit-transcript"
            />
            <p>Click the button below to submit your transcript. When you do this, you'll see a progress bar while we synchronize your audio with your transcript. This can take a long time (up to the length of your episode), so please be patient!</p>
            <Button raised className="submit">
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
