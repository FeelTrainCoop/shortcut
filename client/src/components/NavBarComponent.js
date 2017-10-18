'use strict';

import React from 'react';
import { hashHistory } from 'react-router'

import {AppBar, Button, Drawer, IconButton, Menu, MenuItem, Toolbar, Typography} from 'material-ui';
import { withStyles } from 'material-ui/styles';
import MenuIcon from 'material-ui-icons/Menu';
import { Link } from 'react-router'
import LoginTwitterComponent from './LoginTwitterComponent';
import LoginFacebookComponent from './LoginFacebookComponent';

require('styles//NavBar.scss');

const shortcutLogo = require('../images/shortcut-logo.svg');

const scssVariables = require('sass-extract-loader!../styles/_variables.scss').global;
// Style override for AppBar
const styles = {
  colorPrimary: {
    backgroundColor: scssVariables['$primary-color'].value.hex,
  },
};

class NavBarComponent extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      drawerOpen: false
    };
  }

  handleTouchTap(event) {
    // This prevents ghost click.
    event.preventDefault();

    this.setState({
      open: true,
      anchorEl: event.currentTarget
    });
  }

  handleRequestClose() {
    this.setState({
      open: false
    });
  }

  handleToggleDrawer() {
    this.setState({
      drawerOpen: !this.state.drawerOpen
    });
  }

  toggleAbout(e) {
    if (this.props.view !== 'about') {
      hashHistory.push('/about/');
    } else {
      hashHistory.goBack();
    }
    e.preventDefault();
    e.stopPropagation();
  }

  render() {
    return (
      <div className="navbar-component">
      <AppBar
        classes={{ colorPrimary: this.props.classes.colorPrimary }}
        position="static"
      >
        <Toolbar>
          <Typography type="title" color="inherit" className="title-bar">
            <img src={shortcutLogo} className="shortcut-logo" alt="Shortcut"/>
          </Typography>
          <div className="nav-buttons">
            <Button
              color="contrast"
              href="/#/about"
            >
              About
            </Button>
            <Button
              color="contrast"
              onClick={this.handleTouchTap.bind(this)}
            >
              Connect
            </Button>
            <Menu
              open={this.state.open}
              anchorEl={this.state.anchorEl}
              onRequestClose={this.handleRequestClose.bind(this)}
            >
              <MenuItem className="login-row-menu">
                <LoginTwitterComponent
                  twName={this.props.twName}
                  twLogout={this.props.twLogout}
                />
              </MenuItem>
              <MenuItem className="login-row-menu">
                <LoginFacebookComponent
                  fbName={this.props.fbName}
                  fbLogout={this.props.fbLogout}
                />
              </MenuItem>
            </Menu>
          </div>
          <a href="http://thisamericanlife.org"><img src={talLogo} className="tal-logo" alt="This American Life"/></a>
        </Toolbar>
      </AppBar>
    </div>
    );
  }
}

NavBarComponent.displayName = 'NavBarComponent';

// Uncomment properties you need
NavBarComponent.propTypes = {
  muiTheme: React.PropTypes.shape({
    palette: React.PropTypes.shape({
      primary1Color: React.PropTypes.string
    })
  })
};
NavBarComponent.defaultProps = {
  muiTheme: {
    palette: {
      primary1Color: 'yellow'
    }
  }
};

export default withStyles(styles)(NavBarComponent);
