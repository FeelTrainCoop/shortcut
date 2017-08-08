'use strict';

import React from 'react';
import SvgIcon from 'material-ui/SvgIcon';
import CancelIcon from 'material-ui/svg-icons/navigation/cancel';

const leftIconStyles = {
  marginRight: 12,
  verticalAlign: 'middle'
};

require('styles//LoginRow.scss');

const authRoute = require('config').default.authServer + '/auth/facebook';

const LoginFacebookComponent = (props) => {
  if (props.fbName) {
    return (
      <div className="loginrow-component" onClick={props.fbLogout}>
        <SvgIcon viewBox="0 0 486.392 486.392" style={leftIconStyles}>
          <path d="M395.193,0H91.198C40.826,0,0,40.826,0,91.198v303.995c0,50.372,40.826,91.198,91.198,91.198 h303.995c50.372,0,91.198-40.827,91.198-91.198V91.198C486.392,40.826,445.565,0,395.193,0z M306.062,243.165l-39.854,0.03 l-0.03,145.917h-54.689V243.196H175.01v-50.281l36.479-0.03l-0.061-29.609c0-41.039,11.126-65.997,59.431-65.997h40.249v50.311 h-25.171c-18.817,0-19.729,7.022-19.729,20.124l-0.061,25.171h45.234L306.062,243.165z"/>
        </SvgIcon>
        {props.fbName}
        <CancelIcon className="logout"/>
      </div>
    );
  } else {
    return (
      <div className="loginrow-component" >
        <div className="connect-button">
          <a onClick={connect}>
            <SvgIcon viewBox="0 0 486.392 486.392" style={leftIconStyles}>
              <path d="M395.193,0H91.198C40.826,0,0,40.826,0,91.198v303.995c0,50.372,40.826,91.198,91.198,91.198 h303.995c50.372,0,91.198-40.827,91.198-91.198V91.198C486.392,40.826,445.565,0,395.193,0z M306.062,243.165l-39.854,0.03 l-0.03,145.917h-54.689V243.196H175.01v-50.281l36.479-0.03l-0.061-29.609c0-41.039,11.126-65.997,59.431-65.997h40.249v50.311 h-25.171c-18.817,0-19.729,7.022-19.729,20.124l-0.061,25.171h45.234L306.062,243.165z"/>
            </SvgIcon>
            Connect Facebook
          </a>
        </div>
      </div>
    );
  }
}

function connect(e) {
  window.open(authRoute, '_blank');
  e.preventDefault();
  e.stopPropagation();
  return;
}

LoginFacebookComponent.displayName = 'LoginFacebookComponent';

// Uncomment properties you need
// LoginFacebookComponent.propTypes = {};
// LoginFacebookComponent.defaultProps = {};

export default LoginFacebookComponent;
