import React from 'react';
import { Paper } from 'material-ui';
import Switch from 'material-ui/Switch';
import { FormControlLabel, FormGroup } from 'material-ui/Form';

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
      switches: []
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
      })
    ).done(function (episodeStateData, allEpisodeData) {
      let tempSwitches = allEpisodeData[0].map(episode => {
        let foundElement = episodeStateData[0].find(el => el.value === episode.guid);
        episode.checked = foundElement ? foundElement.enabled : false;
        episode.value = episode.guid;
        return episode;
      });
      this.setState({
        switches: tempSwitches,
        authenticated: true
      });
    }.bind(this));
  }

  renderSwitches() {
    return this.state.switches
      .map((el, index) =>
          <FormControlLabel
            control={
              <Switch
                checked={el.checked}
                value={el.value}
                onChange={this.handleClick.bind(this,index)}
              />
            }
            key={el.value}
            label={el.title}
          />
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
          enabled: switches[index].checked
        }
      });
      this.forceUpdate()
    });
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
            <h3 className="recent-episodes">Enable/Disable Episodes</h3>
              <FormGroup>
              {this.renderSwitches.call(this)}
              </FormGroup>
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

export default AdminComponent;
