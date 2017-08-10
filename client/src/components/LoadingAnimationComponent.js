'use strict';

import React from 'react';
import Loader from 'react-loader-advanced';
import CircularProgress from 'material-ui/CircularProgress';

require('styles//LoadingAnimation.scss');

class LoadingAnimationComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      anim: <div className="animation"><CircularProgress size={1.5}/></div>
    }
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.msg !== nextProps.msg) {
      this.setState({
        anim: <div className="animation"><CircularProgress size={1.5}/></div>
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
  msg: React.PropTypes.string,
  show: React.PropTypes.bool
};
LoadingAnimationComponent.defaultProps = {
  msg: 'Loading',
  show: false
};

export default LoadingAnimationComponent;
