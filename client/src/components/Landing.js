import React from 'react';
import { Link } from 'react-router-dom'
import ArrowRight from '@material-ui/icons/KeyboardArrowRight';
import { Paper } from '@material-ui/core';

const jQuery = require('jquery');
const moment = require('moment');
const Helpers = require('../helpers');
const tagline = require('config').default.tagline;
const parentSiteName = require('config').default.parentSiteName;
const logo = require('../images/logo.png');

require('styles/Landing.scss');

class LandingComponent extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      eps: props.eps,
      badEps: props.badEps,
      apiEndpoint: props.apiEndpoint
    };

  }

  componentDidMount() {
    jQuery.ajax({
      method: 'GET',
      url: this.state.apiEndpoint + '/api/getMeta',
      crossDomain : true,
      headers: {'X-Requested-With': 'XMLHttpRequest'},
      success: (data) => {
        this.setState({
          meta: data.showData
        });
      },
      error: function(xhr, status, err) {
        window.console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
    jQuery.ajax({
      method: 'GET',
      url: this.state.apiEndpoint + '/recent',
      crossDomain : true,
      headers: {'X-Requested-With': 'XMLHttpRequest'},
      success: (data) => {
        this.setState({
          eps: data
        });
      },
      error: function(xhr, status, err) {
        window.console.error(this.props.url, status, err.toString());
      }.bind(this)
    });

  }

  render() {
    this.links = [];
    for (var ep of this.state.eps) {
      if (!ep.number) break;

      // is it a bad episode?
      const isBad = this.state.badEps.indexOf(Number(ep.number)) > -1;

      const to = '/clipping/' + ep.number;
      // const className = "episode-link" + (isBad ? ' bad-episode' : '');
      // const linkClassName = "no-underline episode-link-container" + (isBad ? ' bad-episode' : '');

      if (!isBad) {
        this.links.push(
          <Link
            key={ep.number}
            to={to}
            className="no-underline episode-link-container"
          >
            <div className="episode-link">
              <div className="episode-circle">
                {ep.number}
              </div>
              <span className="episode-name">
                {ep.title}
                <span className="episode-date">
                  {ep.original_air_date ? ` | ${moment(ep.original_air_date).format('LL')}` : ''}
                </span>
              </span>
              <p className="episode-description">
                {Helpers.htmlDecode(ep.description)}
              </p>
              <ArrowRight className="episode-arrow"/>
            </div>
          </Link>);
      } else {
        this.links.push(
          <span
            className="no-underline episode-link-container bad-episode"
          >
            <div className="episode-link bad-episode">
              <div className="episode-circle">
                {ep.number}
              </div>
              <span className="episode-name">
                {ep.title}
                <span className="episode-date">
                  {ep.original_air_date ? ` | ${moment(ep.original_air_date).format('LL')}` : ''}
                </span>
              </span>
              <p className="episode-description">
                {Helpers.htmlDecode(ep.description)}
              </p>
              <span className="episode-unavail">
                Coming <br/> Soon!
              </span>
            </div>
          </span>);
      }
    }
    const content=
      <div>
        <Paper>
          <div className="hero-space">
            <div className="hero-content">
              <img src={this.state.meta ? this.state.meta.image : ''} className="logo"/>
              <h2 className="tagline">{tagline}</h2>
            </div>
          </div>
          <div className="content episodes">
            <h3 className="recent-episodes">Recent episodes</h3>
              {this.links}
          </div>
        </Paper>
      </div>

    return content;
  }
}

export default LandingComponent;
