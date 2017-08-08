'use strict';

import React from 'react';
import ParagraphComponent from './transcript/ParagraphComponent';
import Waypoint from 'react-waypoint';
import Tappable from 'react-tappable/lib/Tappable';

const jQuery = require('jquery');
const timeToLoad = 50;
const isMobile = require('../helpers').isMobile;

require('styles/Transcript.scss');

/** This component handles all things related to the transcript rendering. */
class TranscriptComponent extends React.Component {
  constructor(props) {
    super(props);
    this.wordsByParagraph = []
    this.firstSelection = undefined;

    this.state = {
      loading: props.loading,
      canScroll: props.canScroll
    };
  }
  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps.tappedWord !== this.props.tappedWord) {
      return true;
    }
    if (nextProps.regionViewStart !== this.props.regionViewStart || nextProps.regionViewDuration !== this.props.regionViewDuration) {
      return true;
    }
    if (nextState.loading !== this.state.loading) {
      return true;
    }

    // A re-render on TranscriptComponent is extremely expensive so we only run the render() function for this component if the transcript is being rendered for the first time (AKA it's currently empty) or if there's been a change in the region selection in the waveform, or if we're selecting new text in the transcript
    // const firstSelection = document.querySelector('.selected');

    const didRegionStateChange = this.state ? (nextState.regionStart == this.state.regionStart && nextState.regionEnd === this.state.regionEnd) : false;
    return (this.wordsByParagraph.length === 0 || !(nextProps.regionStart == this.props.regionStart && nextProps.regionEnd === this.props.regionEnd) || didRegionStateChange);
  }
  componentDidUpdate(prevProps) {
    // if regionView change, scroll to beginning of the region
    if (prevProps.regionViewStart !== this.props.regionViewStart) {
      const centerWordIndex = this.props.wordMillis.findIndex( el => el > this.props.regionViewStart*1000);

      this._clearLoading();

      // scroll transcript to this element
      window.setTimeout(() => {
        const centerWordEl = document.getElementById(`word-${centerWordIndex}`);
        if (!centerWordEl) return;
        jQuery('.transcript-component').scrollTop(jQuery('.transcript-component').scrollTop()
            + jQuery(centerWordEl).offset().top - (jQuery('.transcript-component').offset().top+75));
      }, 30);

      // return;
    }
    const firstSelection = document.querySelector('.selected');

    // only scroll if firstSelection changed
    if (!firstSelection || firstSelection === this.firstSelection) {
      return;
    }

    // scroll start node to the top
    window.setTimeout(() => {
      jQuery('.transcript-component').animate({
        scrollTop: jQuery('.transcript-component').scrollTop()
          + jQuery(firstSelection).offset().top - (jQuery('.transcript-component').offset().top+jQuery('.transcript-component').height()/5)
        }, {
          duration: 3, easing: 'swing'
      });

      this.firstSelection = firstSelection;
      this._clearTextSelection();
    }, 30);
  }
  render() {
    const regionStart = this.props.regionStart*1000;
    const regionEnd = this.props.regionEnd*1000;
    const viewDur = this.props.regionViewDuration*1000;
    const viewStart = this.props.regionViewStart*1000;
    const viewEnd = viewStart + viewDur;
    const paragraphStartTimes = this.props.paragraphMillis;

    if (paragraphStartTimes.length <= 0) {
      return (
      <p
        type="paragraph"
        id="transcript-container"
        className="transcript-component"
        >
          loading
        </p>);
    }

    this.wordsByParagraph = paragraphStartTimes.map( (key, i) => {
      const paragraphObj = this.props.paragraphDictionary[key];
      if (!paragraphObj) return '';

      // does the paragraph contain selected text?
      const startTime = paragraphObj.start;
      const endTime = paragraphObj.end;
      const containsSelection = regionStart < endTime && regionEnd > startTime;

      // if paragraph is not within x seconds of current selection dont render it
      const diffMs = (timeToLoad * 1.5) * 1000;

      if ( isMobile() &&
        (Math.abs(viewStart - startTime) > diffMs*2 && Math.abs(viewEnd - endTime) > diffMs) &&
        (Math.abs(viewStart - startTime) > (diffMs + viewDur) && Math.abs(viewEnd - endTime) > (diffMs + viewDur))
        ) return;

      return (
        <ParagraphComponent
          words={paragraphObj.words}
          start={paragraphObj.start_time}
          nextStart={paragraphObj.end_time}
          key={i}
          regionStart={this.props.regionStart}
          regionEnd={this.props.regionEnd}
          visible={true}
          containsSelection={containsSelection}
          tappedWord={this.props.tappedWord}
          isDragging={!this.state.canScroll}
          >
        </ParagraphComponent>
      );
    });
    let tClass = `transcript-component transcript-component${this.props.tappedWord ? ' tapped' : ''}`;
    if (!this.state.canScroll) {
      tClass += ' no-scroll';
    }

    const pressDelay = isMobile() ? 120 : 60;
    return (
      <p
        type="paragraph"
        id="transcript-container"
        className={tClass}

        onMouseUp={this._handleSelect.bind(this)} /*onTouchEnd={this._handleSelect.bind(this)}*/
        onTouchEnd={this._handleWordDragEnd.bind(this)}
        onMouseMove={this._handleWordDrag.bind(this)}
        onTouchMove={this._handleWordDrag.bind(this)}
      >
        {this.props.children}

        {this._renderWaypointTop()}
        <Tappable
          onMouseDown={(e) => e.persist()}
          onTouchStart={(e) => e.persist()}
          onPress={(e) => {
            const firstWord = e.target.dataset.first === 'true'; //word.props.first;
            const lastWord = e.target.dataset.last  === 'true'; //word.props.last;
            const selected = e.target.classList.contains('selected'); //word.props.selected;
            if (selected && (firstWord || lastWord)) {
              this._handleWordDragStart(e, firstWord, lastWord);
            }
            else {
              // bubble up
              e.persist();
            }
          }}
          pressDelay={pressDelay}

          onTap={(e) => {
            if (e.target.id.indexOf('word') === 0 && this.state.canScroll) {
              this.props.handleWordTap(e);
            } else {
              // bubble up in case tap was not on a word to cancel selection
              e.persist();
            }
          }}
          moveThreshold={60}
        >
          {this.wordsByParagraph}
        </Tappable>
        {this._renderWaypointBot()}
      </p>
    );
  }
  _renderWaypointTop() {
    if (!this.state.loading) {
      return (
        <Waypoint
          id="waypoint-top"
          className="waypoint"
          onEnter={({previousPosition}) => this._loadMoreTop(previousPosition)}
          scrollableAncestor={document.getElementById('transcript-container')}
          // onPositionChange={this.onPositionChange.bind(this)}
          topOffset={-100}
          fireOnRapidScroll={false}
        />
        )
    }
  }
  _renderWaypointBot() {
    if (!this.state.loading) {
      return (
        <Waypoint
          id="waypoint-bottom"
          onEnter={({previousPosition}) => this._loadMoreBottom(previousPosition)}
          className="waypoint"
          scrollableAncestor={document.getElementById('transcript-container')}
          // onPositionChange={this.onPositionChange.bind(this)}
          bottomOffset={-2}
          fireOnRapidScroll={false}
        />
        )
    }
  }
  _clearTextSelection() {
    // clear text selection
    // via http://stackoverflow.com/a/3169849/2994108
    if (window.getSelection) {
      if (window.getSelection().empty) {  // Chrome
        window.getSelection().empty();
      } else if (window.getSelection().removeAllRanges) {  // Firefox
        window.getSelection().removeAllRanges();
      }
    } else if (document.selection) {  // IE?
      document.selection.empty();
    }

    // update selected words
    // jQuery('.selected').removeClass('selected');
  }

  /** Select some words (on drag) or select a single word (on click) */
  _handleSelect(e) {
    let sel = document.getSelection();

    if (!this.state.canScroll && this.state.anchorTime) {
      this._handleWordDragEnd(e);
      return;
    }

    var startNode, endNode;
    var badSelection = false;

    // if no anchorNode or focusNode, return b/c nothing was selected
    if (!sel.anchorNode || !sel.focusNode) return;

    var nodes = [sel.anchorNode.parentNode, sel.focusNode.parentNode];

    nodes = nodes.map(function(node) {
      // if it is a subheading-component
      if ( !node.classList.contains('word-component') ) {
        if (node.nextSibling && !node.nextSibling.classList.contains('word-component')) badSelection = true;
        return node.nextSibling;
      } else {
        return node;
      }
    });

    // nodes should be word-components, if not return
    if (badSelection) return;

    // if no nodes were selected, return
    if (nodes.length === 0 || nodes[0] === null) return;

    // if we're selecting one word, assume user wants to tap
    if (nodes[0].id === nodes[1].id) {
      startNode = endNode = nodes[0];
      if (e.target.id.indexOf('word') === 0 && this.state.canScroll) {
        this.props.handleWordTap(e);
        return false;
      } else {
        // user clicked somewhere else, cancel the tap-to-select sequence
        return;
      }
    }
    else if (nodes[0].id.split('word-')[1] < nodes[1].id.split('word-')[1]) {
      startNode = nodes[0];
      endNode = nodes[1];
    } else {
      startNode = nodes[1];
      endNode = nodes[0];
    }

    this._clearTextSelection();

    window.ga('send', {
      'hitType': 'event',
      'eventCategory': 'RegionChange',
      'eventAction': 'SelectTranscript',
      'eventLabel': 'Transcript'
    });

    this.props.textSelectionChanged(startNode.dataset.start, endNode.dataset.end);
    return false;
  }
  _padParagraphs(offset) {
    if (this.state.loading) return;
    this.setState({
      loading: true
    }, () => {
      this.props.offsetRegionViewStart(offset);
    });
  }
  _loadMoreBottom() {
    const viewEnd = (this.props.regionViewDuration + this.props.regionViewStart)*1000;
    if (viewEnd < this.props.totalDuration*1000) {
      this._padParagraphs(timeToLoad);
    }
  }
  _loadMoreTop(previousPosition) {
    if (previousPosition !== 'above') return;
    const viewStart = this.props.regionViewStart*1000;
    if (viewStart > 0) {
      var t = -timeToLoad;
      this._padParagraphs(t);
    }
  }
  // throttle component updates
  _clearLoading() {
    setTimeout(() => {
      this.setState({
        loading: false
      });
    }, 60);
  }
  _handleWordDrag(e) {
    e.persist();
    if (!this.state.canScroll) {
      e.preventDefault();
      e.stopPropagation();

      let target = e.target;
      if (e.touches && e.touches[0]) {
        target = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
      }
      if (target.id.indexOf('word') === -1) return;

      let idMin = parseInt(target.id.split('-').pop());
      let idMax = parseInt(this.state.anchorEltId.split('-').pop());

      if (idMin > idMax) {
        [idMax, idMin] = [idMin, idMax];
      }

      // update UI
      jQuery('.selected').removeClass('selected');
      jQuery('.first-word').removeClass('first-word');
      jQuery('.last-word').removeClass('last-word');

      for (let i = idMin; i <= idMax; i++ ) {
        let elt = document.getElementById(`word-${i}`);
        if (!elt) return;
        elt.classList.add('selected');
        if (i === idMin) {
          elt.classList.add('first-word');
        } else if (i === idMax) {
          elt.classList.add('last-word');
        }
      }
    }
  }
  _handleWordDragStart(e, firstWord, lastWord) {
    // start time that is not this word
    // TIME ANCHOR
    const anchorElt = document.querySelectorAll('.selected')[(lastWord && !firstWord) ? 0 : (document.querySelectorAll('.selected').length - 1) ];
    const anchorTime = (lastWord && !firstWord) ? this.props.regionStart : this.props.regionEnd;

    this.setState({
      canScroll: false,
      anchorTime: anchorTime,
      anchorEltId: anchorElt.id
    }, function() {
      jQuery('body').bind('touchmove', function(e){e.preventDefault()});
    });
  }
  _handleWordDragEnd() {
    jQuery('body').unbind('touchmove');
    let startWord = document.querySelector('.first-word');
    if (!startWord) return;

    let endWord = document.querySelector('.last-word');
    if (!endWord) return;

    if (this.state.canScroll) return;

    let startTime = startWord.dataset.start;
    let endTime = document.querySelector('.last-word').dataset.end;

    this.setState({
      canScroll: true,
      anchorTime: undefined,
      anchorEltId: undefined
    });

    window.ga('send', {
      'hitType': 'event',
      'eventCategory': 'RegionChange',
      'eventAction': 'DragTranscript',
      'eventLabel': 'Transcript'
    });
    this.props.textSelectionChanged(startTime, endTime);
  }
}

TranscriptComponent.displayName = 'TranscriptComponent';

TranscriptComponent.propTypes = {
  paragraphMillis: React.PropTypes.array,
  paragraphDictionary: React.PropTypes.object,
  regionStart: React.PropTypes.number,
  regionEnd: React.PropTypes.number,
  offset: React.PropTypes.number,
  loading: React.PropTypes.bool,
  canScroll: React.PropTypes.bool
};
TranscriptComponent.defaultProps = {
  paragraphMillis: [],
  regionStart: 10,
  regionEnd: 20,
  paragraphDictionary: {},
  offset: 0,
  loading: false,
  canScroll: true
};

export default TranscriptComponent;
