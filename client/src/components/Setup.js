import React from 'react';
import { Paper } from '@material-ui/core';
import RaisedButton from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
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
      },
      password: '',
      confirmPassword: '',
      isPasswordValid: false,
      doPasswordsMatch: true,
      isUsernameValid: true,
      warnUserOverride: false,
    };
    this.apiEndpoint = props.apiEndpoint;
  }

  componentWillMount() {
    jQuery.ajax({
      method: 'GET',
      url: `${this.apiEndpoint}/api/isSourceSet`,
      headers: {'X-Requested-With': 'XMLHttpRequest'},
      success: function(data) {
        console.log('DATA',data);
        this.setState({
          warnUserOverride: data.isSourceSet
        });
      }.bind(this),
    });
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
      xhrFields: { withCredentials: true },
      success: function(data) {
        console.log('DONE', data);
        this.setState({ loading: false, step: 1, showData: data.showData });
      }.bind(this)
    });
  }

  validatePassword(e) {
    let val = e.target.value;
    if (val.length >= 16) {
      this.setState({isPasswordValid: true, password: val});
    }
    else {
      this.setState({isPasswordValid: false, password: val});
    }
    if (val === this.state.confirmPassword) {
      this.setState({doPasswordsMatch: true});
    }
    else {
      this.setState({doPasswordsMatch: false});
    }
  }

  matchPasswords(e) {
    let val = e.target.value;
    if (val === this.state.password) {
      this.setState({doPasswordsMatch: true, confirmPassword: val});
    }
    else {
      this.setState({doPasswordsMatch: false, confirmPassword: val});
    }
  }

  validateUsername(e) {
    let val = e.target.value;
    if (val.length > 0) {
      this.setState({isUsernameValid: true});
    }
    else {
      this.setState({isUsernameValid: false});
    }
  }

  makeSite() {
    this.setState({ loading: true });
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    jQuery.ajax({
      type: 'POST',
      xhrFields: { withCredentials: true },
      url: `${this.apiEndpoint}/setup/setAdmin`,
      data: {
        username,
        password
      },
      success: function(data) {
        console.log('DONE', data);
        this.setState({ loading: false });
        location.hash = 'admin';
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
          <div>
            {this.state.warnUserOverride && <h2><strong className="red">Warning: it looks like you've already set up Shortcut on this server. You can continue but you will overwrite all of your previous settings.</strong></h2>}
          </div>
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
            <p>Please set the username and password for the administrator panel.</p>
            <TextField
              id="username"
              label="Set Admin Username"
              margin="normal"
              defaultValue="admin"
              error={!this.state.isUsernameValid}
              onChange={this.validateUsername.bind(this)}
            />
            <br/>
            <TextField
              helperText="Must be at least 16 characters."
              error={!this.state.isPasswordValid}
              onChange={this.validatePassword.bind(this)}
              id="password"
              label="Set Admin Password"
              margin="normal"
            />
            <br/>
            <TextField
              error={!this.state.doPasswordsMatch}
              onChange={this.matchPasswords.bind(this)}
              id="password"
              label="Confirm Admin Password"
              margin="normal"
            />
            <br/>
            <RaisedButton
              className="get-podcast-data"
              onClick={this.makeSite.bind(this)}
              disabled={!this.state.isUsernameValid || !this.state.isPasswordValid || !this.state.doPasswordsMatch}
            >
              Make the Shortcut Site
            </RaisedButton>
          </div>
        </div>
      </Paper>
    </div>
    );
  }
}

export default SetupComponent;
