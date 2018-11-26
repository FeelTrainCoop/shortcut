'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import {AppBar, Button, Drawer, Divider, Hidden, IconButton, List, ListItem, ListItemIcon, ListItemText, Menu, Toolbar, Typography} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import MenuIcon from '@material-ui/icons/Menu';
import HomeIcon from '@material-ui/icons/Home';
import InfoIcon from '@material-ui/icons/Info';
import LinkIcon from '@material-ui/icons/Link';

import LoginTwitterComponent from './LoginTwitterComponent';
import LoginFacebookComponent from './LoginFacebookComponent';
const parentSiteName = require('config').default.parentSiteName;
const parentSiteUrl = require('config').default.parentSiteUrl;

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
    this.setState({
      drawerOpen: false
    });
    this.props.history.push('/about/');
    e.preventDefault();
    e.stopPropagation();
  }

  handleHome(e) {
    this.setState({
      drawerOpen: false
    });
    this.props.history.replace('/');
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
          <Hidden mdUp>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={this.handleToggleDrawer.bind(this)}
              className="menu-toggle"
            >
              <MenuIcon />
            </IconButton>
          </Hidden>
          <Hidden smDown>
            <Typography type="title" color="inherit" className="title-bar">
              <a href="/#/">
                <img src={shortcutLogo} className="shortcut-logo" alt="Shortcut"/>
              </a>
            </Typography>
          </Hidden>
          <Hidden smDown>
            <div className="nav-buttons">
              <Button
                color="inherit"
                href="/#/about"
                onClick={this.toggleAbout.bind(this)}
              >
                About
              </Button>
              <Button
                color="inherit"
                onClick={this.handleTouchTap.bind(this)}
              >
                Connect
              </Button>
              <Menu
                className="xl-menu"
                open={this.state.open}
                anchorEl={this.state.anchorEl}
                onClose={this.handleRequestClose.bind(this)}
              >
                <LoginTwitterComponent
                  twName={this.props.twName}
                  twLogout={this.props.twLogout}
                />
                <LoginFacebookComponent
                  fbName={this.props.fbName}
                  fbLogout={this.props.fbLogout}
                />
              </Menu>
            </div>
          </Hidden>
        </Toolbar>
      </AppBar>
      <Drawer
        className="nav-drawer"
        open={this.state.drawerOpen}
        onClose={(drawerOpen) => this.setState({drawerOpen})}
      >
        <div className="navbar-component">
          <AppBar
            classes={{ colorPrimary: this.props.classes.colorPrimary }}
            position="static"
          >
            <Toolbar>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                onClick={this.handleToggleDrawer.bind(this)}
                className="menu-toggle"
              >
                <MenuIcon />
              </IconButton>
            </Toolbar>
          </AppBar>
        </div>
        <List>
          <LoginTwitterComponent
            twName={this.props.twName}
            twLogout={this.props.twLogout}
            />
          <Divider/>
          <LoginFacebookComponent
            fbName={this.props.fbName}
            fbLogout={this.props.fbLogout}
            />
          <Divider/>
          <ListItem className="loginrow-component"
            href="/#/"
            onClick={this.handleHome.bind(this)}
          >
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItem>
          <Divider/>
          <ListItem className="loginrow-component"
            onClick={this.toggleAbout.bind(this)}
          >
            <ListItemIcon>
              <InfoIcon />
            </ListItemIcon>
            <ListItemText primary="About" />
          </ListItem>
          <Divider/>
          <a href={parentSiteUrl}>
            <ListItem className="loginrow-component"
            >
              <ListItemIcon>
                <LinkIcon />
              </ListItemIcon>
              <ListItemText primary={parentSiteName} />
            </ListItem>
          </a>
        </List>
      </Drawer>
    </div>
    );
  }
}

NavBarComponent.displayName = 'NavBarComponent';

// Uncomment properties you need
NavBarComponent.propTypes = {
  muiTheme: PropTypes.shape({
    palette: PropTypes.shape({
      primary1Color: PropTypes.string
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
