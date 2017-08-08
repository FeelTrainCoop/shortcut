'use strict';

import React from 'react';
import { hashHistory } from 'react-router'

import {AppBar, Drawer, IconButton, MenuItem} from 'material-ui';
import NavigationMenu from 'material-ui/svg-icons/navigation/menu'
import { Link } from 'react-router'
import LoginTwitterComponent from './LoginTwitterComponent';
import LoginFacebookComponent from './LoginFacebookComponent';

require('styles//NavBar.scss');

const shortcutLogo = require('../images/shortcut-logo.svg');

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
          style={{backgroundColor: this.props.muiTheme.palette.primary1Color, color: 'white'}}
          onLeftIconButtonTouchTap={this.handleToggleDrawer.bind(this)}
          title={this.props.episode && this.props.view !== 'default' ? `${this.props.episode}` : ''}
        >
        <div className="nav-title">
          <Link to="/" className="no-underline white">
            <img src={shortcutLogo} className="shortcut-logo" alt="Shortcut"/>
          </Link>
        </div>
      <Drawer
        containerClassName="drawer"
        docked={false}
        open={this.state.drawerOpen}
        width={280}
        onRequestChange={(drawerOpen) => this.setState({drawerOpen})}
      >
        <div className="navbar-component">
          <AppBar
            style={{backgroundColor: this.props.muiTheme.palette.primary1Color, color: 'white'}}
            showMenuIconButton={false}
            iconElementRight={<IconButton onClick={this.handleToggleDrawer.bind(this)}><NavigationMenu/></IconButton>}
          />
        </div>
        <div className="top">
          <MenuItem className="login-row-menu" primaryText={
            <LoginTwitterComponent
              twName={this.props.twName}
              twLogout={this.props.twLogout}
              />
          }/>
          <MenuItem className="login-row-menu" primaryText={
            <LoginFacebookComponent
              fbName={this.props.fbName}
              fbLogout={this.props.fbLogout}
              />
          }/>
        </div>

        <div className="bottom">
          <MenuItem
            className="login-row-menu"
            href="/#/"
            onClick={this.handleToggleDrawer.bind(this)}
            primaryText="Home"
          />
          <MenuItem
            className="login-row-menu"
            href="/#/about"
            onClick={this.handleToggleDrawer.bind(this)}
            primaryText="About"
          />
          <MenuItem
            className="login-row-menu"
            primaryText="thisamericanlife.org"
            href="http://thisamericanlife.org"
          />
        </div>
      </Drawer>
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

export default NavBarComponent;
