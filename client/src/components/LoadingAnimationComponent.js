'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import Loader from 'react-loader-advanced';
import { CircularProgress } from 'material-ui/Progress';

require('styles//LoadingAnimation.scss');

// TODO update material-ui?

class LoadingAnimationComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      anim: <div className="animation"><CircularProgress size={50}/></div>
    }
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.msg !== nextProps.msg) {
      this.setState({
        anim: <div className="animation"><CircularProgress size={50}/></div>
      });
    }
  }
  render() {
    return (
      <div className="loadinganimation-component">
        <Loader show={this.props.show}
                message={this.state.anim}
                backgroundStyle={{backgroundColor: 'white'}}
                >
          {this.props.children}
        </Loader>
      </div>
    );
  }
}

LoadingAnimationComponent.displayName = 'LoadingAnimationComponent';

LoadingAnimationComponent.propTypes = {
  msg: PropTypes.string,
  show: PropTypes.bool,
  value: PropTypes.number
};
LoadingAnimationComponent.defaultProps = {
  msg: 'Loading',
  show: false,
  value: undefined
};

export default LoadingAnimationComponent;
