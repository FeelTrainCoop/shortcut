/**
 *  Helper Module
 */
const Hash = require('crypto-js/hmac-sha256');
const b64 = require('crypto-js/enc-base64');

module.exports = {
  htmlDecode( html ) {
    let a = document.createElement( 'a' ); a.innerHTML = html;
    return a.textContent;
  },
  getPeaksInRange(peaks, start, end, duration) {
    const peaksLength = peaks.length;
    const startPeakIndex = Math.round(start/duration * peaksLength);
    const endPeakIndex = Math.round(end/duration * peaksLength);
    return peaks.slice(startPeakIndex, endPeakIndex);
  },
  getPixelScale() {
    if ('devicePixelRatio' in window) {
      if (window.devicePixelRatio > 1) {
        return window.devicePixelRatio;
      }
    }
    return 1;
  },
  map: function(n, start1, stop1, start2, stop2) {
    return ((n-start1)/(stop1-start1))*(stop2-start2)+start2;
  },
  // via http://stackoverflow.com/a/34044976/2994108
  _throttle: function(fn, threshhold, scope) {
    threshhold = threshhold || 250;
    var last,
        deferTimer;
    return function() {
      var context = scope || this;

      var now = +new Date(),
          args = arguments;
      if (last && now < last + threshhold) {
        // hold on to it
        clearTimeout(deferTimer);
        deferTimer = setTimeout(function() {
          last = now;
          fn.apply(context, args);
        }, threshhold);
      } else {
        last = now;
        fn.apply(context, args);
      }
    }
  },
  _debounce: function(fn, delay) {
    var timer = null;
    return function() {
      var context = this,
          args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function() {
          fn.apply(context, args);
      }, delay);
    };
  },
  isMobile: function() {
    return window.document.body.clientWidth <= 992;
  },
  hash: function(words, k) {
    const WORDS = words.map(function(word) {
      return word.text;
    }).join(' ').trim();

    return b64.stringify(Hash(WORDS, k));
  }
}
