import 'core-js/fn/object/assign';
import React from 'react';
import {Router, Route, hashHistory} from 'react-router';
import ReactDOM from 'react-dom';
import App from './components/Main';
import Login from './components/LoginSuccess';

import 'babel-polyfill';

import config from 'config';

// analytics
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
window.ga('create', config.analyticsPropertyId, 'auto');
window.ga('set', 'page', window.location.hash.split('?')[0].split('#')[1] || '/');
window.ga('send', {
  hitType: 'pageview',
  title: window.location.hash.split('#')[1] ? window.location.hash.split('#')[1].split('/')[1] : 'default'
});

// Render the main component into the dom
ReactDOM.render(
  <Router history={hashHistory}>
    <Route path="/" component={App} mode="regular" />
    <Route path="/login/facebook/:fbUserName/:fbAuthToken" component={Login}/>
    <Route path="/login/twitter/:twUserName/:twAuthToken" component={Login}/>
    <Route path="/:view" component={App}/>
    <Route path="/:view/:showNumber" component={App}/>
    <Route path="/:view/:showNumber/:regionStart" component={App}/>
  </Router>,
  document.getElementById('app')
);
