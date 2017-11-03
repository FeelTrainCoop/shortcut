'use strict';

import React from 'react';
import PropTypes from 'prop-types';

require('styles/transcript/Word.scss');

const WordComponent = (props) => {
  const selected = props.selected ? ' selected' : '';
  const tapped = props.tapped ? ' tapped' : '';
  const first = props.first ? ' first-word' : '';
  const last = props.last ? ' last-word' : '';
  const dragging = props.isDragging ? ' while-dragging' : '';
  const onlySelection = props.onlySelection ? ' selected--hide' : '';
  let className = `word-component${selected + tapped + first + last + dragging + onlySelection}`;

  return (
    <span
      className={className}
      id={props.index}
      data-annotation={props.annotation}
      data-start={props.start}
      data-end={props.end}
      data-paragraph={props.paragraph}
      data-first={props.first}
      data-last={props.last}
      data-selected={props.selected}
    >
      {props.children}&nbsp;
    </span>
  );
}

WordComponent.displayName = 'TranscriptWordComponent';

// Uncomment properties you need
WordComponent.propTypes = {
  tapped: PropTypes.bool
};
WordComponent.defaultProps = {
  tapped: false
};

export default WordComponent;
