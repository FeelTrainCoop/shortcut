'use strict';

import React from 'react';
import Loader from 'react-loader-advanced';

require('styles//LoadingAnimation.scss');

class LoadingAnimationComponent extends React.Component {
  constructor(props) {
    super(props);
    this.pathData = this.generateWave(90, 60);
    this.state = {
      anim: <div className="animation">
              <div className="loadinganimation-heading">[ {props.msg} ]</div>
              <svg xmlns="http://www.w3.org/2000/svg"
                     viewBox="5 0 80 60"
                     id="loading">
                <path id="wave"
                    d={this.pathData}>
                </path>
              </svg>
            </div>
    }
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.msg !== nextProps.msg) {

      this.setState({
          anim :  <div className="animation">
                    <div className="loadinganimation-heading">[ {nextProps.msg} ]</div>
                    <svg xmlns="http://www.w3.org/2000/svg"
                           viewBox="5 0 80 60"
                           id="loading">
                    <path id="wave"
                        d={this.pathData}>
                    </path>
                  </svg>
                  </div>
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

  // via https://codepen.io/winkerVSbecks/pen/EVJGVj
  generateWave(w, h) {
    const m = 0.512286623256592433;

    const a = h / 4;
    const y = h / 2;

    return [
      'M', w * 0, y + a / 2,
      'c',
        a * m, 0,
        -(1 - a) * m, -a,
        a, -a,
      's',
        -(1 - a) * m, a,
        a, a,
      's',
        -(1 - a) * m, -a,
        a, -a,
      's',
        -(1 - a) * m, a,
        a, a,
      's',
        -(1 - a) * m, -a,
        a, -a,
      
      's',
        -(1 - a) * m, a,
        a, a,
      's',
        -(1 - a) * m, -a,
        a, -a,
      's',
        -(1 - a) * m, a,
        a, a,
      's',
        -(1 - a) * m, -a,
        a, -a,
      's',
        -(1 - a) * m, a,
        a, a,
      's',
        -(1 - a) * m, -a,
        a, -a,
      's',
        -(1 - a) * m, a,
        a, a,
      's',
        -(1 - a) * m, -a,
        a, -a,
      's',
        -(1 - a) * m, a,
        a, a,
      's',
        -(1 - a) * m, -a,
        a, -a
    ].join(' ');
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
