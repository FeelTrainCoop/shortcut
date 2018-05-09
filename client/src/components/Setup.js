import React from 'react';
import { Paper } from 'material-ui';
import Switch from 'material-ui/Switch';
import { FormControlLabel, FormGroup } from 'material-ui/Form';

const parentSiteName = require('config').default.parentSiteName;
const logo = require('../images/logo.png');
const jQuery = require('jquery');

require('styles/Setup.scss');

class SetupComponent extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
    };
    this.apiEndpoint = props.apiEndpoint;
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
        </div>
      </Paper>
    </div>
    );
  }
}

export default SetupComponent;
