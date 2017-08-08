import React from 'react';
import { Link } from 'react-router'
import ArrowRight from 'material-ui/svg-icons/hardware/keyboard-arrow-right';

const Infinite = require('react-infinite');
const moment = require('moment');
const Helpers = require('../helpers');
const shortcutLogo = require('../images/shortcut-logo.svg');

require('styles/Landing.scss');

function Landing(props) {
  var eps = props.eps;
  var badEps = props.badEps;

  var links = [];
  for (var ep of eps) {
    if (!ep.number) break;

    // is it a bad episode?
    const isBad = badEps.indexOf(Number(ep.number)) > -1;

    const to = '/clipping/' + ep.number;
    // const className = "episode-link" + (isBad ? ' bad-episode' : '');
    // const linkClassName = "no-underline episode-link-container" + (isBad ? ' bad-episode' : '');

    if (!isBad) {
      links.push(
        <Link
          key={ep.number}
          onClick={props.clickLink}
          to={to}
          className="no-underline episode-link-container"
          activeClassName="active"
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
      links.push(
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
      <div className="hero-space">
        <div className="hero-content">
          <img src={shortcutLogo} className="shortcut-logo-big" alt="Shortcut"/>
          <h3 className="for-tal">From This American Life</h3>
          <h2 className="tagline">Cut and share your favorite podcast on social media</h2>
        </div>
      </div>
      <div className="content episodes">
        <h3 className="recent-episodes">Recent episodes</h3>
        <Infinite
          elementHeight={50}
          useWindowAsScrollContainer={true}
          infiniteLoadBeginEdgeOffset={100}
          onInfiniteLoad={props.loadMoreEpisodes}
        >
          {links}
        </Infinite>
      </div>
    </div>

  return content;
}

export default Landing;
