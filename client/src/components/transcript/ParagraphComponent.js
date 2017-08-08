'use strict';

import React from 'react';
import WordComponent from './WordComponent';
import SubheadingComponent from './SubheadingComponent';

const jQuery = require('jquery');

require('styles/transcript/Paragraph.scss');

class ParagraphComponent extends React.Component {
  shouldComponentUpdate(nextProps) {

    if (this.props.visible !== nextProps.visible) return true;

    const wordLen = this.props.words.length;
    const words = this.props.words;
    if (wordLen === 0) return false;

    // if previously-tapped word is in this paragraph, return true
    if (nextProps.tappedWord !== this.props.tappedWord) {
      if (nextProps.tappedWord >= words[0].index && nextProps.tappedWord <= words[wordLen-1].index ||
          this.props.tappedWord >= words[0].index && this.props.tappedWord <= words[wordLen-1].index
        ){return true;}
    }
    // Only update a Paragraph component if it contains the selection, or if it used to contain it but no longer will
    return nextProps.containsSelection /*|| nextProps.isDragging*/ ||
      (this.props.containsSelection && !nextProps.containsSelection)
  }

  componentDidMount() {
    // update selected words
    var selectedWords = jQuery('.selected');
    selectedWords = jQuery.map(selectedWords, function(val) {
      return {text: val.innerText, start: +val.dataset.start};
    });
  }

  render() {
    var heading = false;
    const regionStart = this.props.regionStart*1000;
    const regionEnd = this.props.regionEnd*1000;

    var words = this.props.words.map( (word, i) => {
      // add space after each word
      let text = word.text;
      if (word.heading) heading = word.heading;

      // is the word selected?
      const selected = regionStart < word.end && regionEnd > word.start;
      const tapped = this.props.tappedWord == word.index;
      let onlySelection = false;
      if (selected && regionStart === regionEnd) {
        onlySelection = true;
      }
      // is it the first word or last word?
      let first = false;
      let last = false;
      if (selected && !onlySelection) {
        if (regionStart >= word.start && regionStart <= word.end) {
          first = true;
        }
        if (regionEnd >= word.start && regionEnd <= word.end) {
          last = true;
        }
      }
      return (
        <WordComponent
          start={word.start}
          end={word.end}
          regionStart={this.props.regionStart}
          regionEnd={this.props.regionEnd}
          annotation={heading}
          key={i}
          selected={selected} // is dragging
          onlySelection={onlySelection} // is dragging
          isDragging={this.props.isDragging}
          index={'word-'+word.index}
          first={first}
          last={last}
          tapped={tapped}
          >
          {text}
        </WordComponent>
      );
    });

    heading = heading ? <SubheadingComponent>{heading}</SubheadingComponent> : '';

    return (
      <p className="paragraph-component" data-start={this.props.start}>
        {heading}
        {words}
        {/*<span className="doublespace"/>*/}
      </p>
    );
  }
}

ParagraphComponent.displayName = 'TranscriptParagraphComponent';

// Uncomment properties you need
// ParagraphComponent.propTypes = {};
ParagraphComponent.defaultProps = {
  words: [],
  regionStart: 10,
  regionEnd: 20
};

export default ParagraphComponent;
