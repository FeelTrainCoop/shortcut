import React from 'react';
import { Paper } from 'material-ui';
import RaisedButton from 'material-ui/Button';
import TextField from 'material-ui/TextField';
import Loader from 'components/LoadingAnimationComponent';

const parentSiteName = require('config').default.parentSiteName;
const logo = require('../images/logo.png');
const jQuery = require('jquery');

require('styles/Setup.scss');

class SetupComponent extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      step: 0,
      showData: {
        title: '',
        description: '',
        link: '',
        author: '',
        episodes: 0
      }
    };
    this.apiEndpoint = props.apiEndpoint;
  }

  getPodcastData() {
    this.setState({ loading: true });
    const libsynUrl = document.getElementById('url').value;
    jQuery.ajax({
      type: 'POST',
      url: `${this.apiEndpoint}/setup/setSource`,
      data: {
        type: 'libsyn',
        url: libsynUrl
      },
      success: function(data) {
        console.log('DONE', data);
        this.setState({ loading: false, step: 1, showData: data.showData });
      }.bind(this)
    });

  }

  render() {
    return(
    <div>
      <Paper>
        <div className="hero-space">
          <div className="hero-content">
            <img src={logo} className="logo" alt={parentSiteName}/>
            <h2 className="tagline">Setup Wizard</h2>
          </div>
        </div>
        <div className="content episodes">
          <p>Welcome to Shortcut's configuration wizard. To get started, enter the URL of your Libsyn site, like "mypodcast.libsyn.com".</p>
          <TextField
            id="url"
            label="Libsyn URL"
            margin="normal"
          />
          <br/>
          <RaisedButton className="get-podcast-data" onClick={this.getPodcastData.bind(this)}>
            Get Podcast Data
          </RaisedButton>
          <Loader
            show={this.state.loading}
            msg='updating server...'
          >
          </Loader>
          <div className={this.state.step >= 1 ? '' : 'hidden'}>
            <p>Please review the information below and if it looks correct, press "Make The Shortcut Site" at the bottom of the page.</p>
            <p><strong>Title:</strong> {this.state.showData.title}</p>
            <p><strong>Author:</strong> {this.state.showData.author}</p>
            <p><strong>Website:</strong> {this.state.showData.link}</p>
            <p><strong>Number of Episodes:</strong> {this.state.showData.episodes}</p>
            <p><strong>Description:</strong> {this.state.showData.description}</p>
          </div>
        </div>
      </Paper>
    </div>
    );
  }
}

export default SetupComponent;
