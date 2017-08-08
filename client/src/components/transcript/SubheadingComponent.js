'use strict';

import React from 'react';

require('styles/transcript/Subheading.scss');

const SubheadingComponent = (props) => {
  return (
    <span className="subheading-component">
      {props.children}
    </span>
  );
}

SubheadingComponent.displayName = 'JasonTranscriptSubheadingComponent';

// Uncomment properties you need
// SubheadingComponent.propTypes = {};
// SubheadingComponent.defaultProps = {};

export default SubheadingComponent;
