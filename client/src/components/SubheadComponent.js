'use strict';

import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';

require('styles/Subhead.scss');

const SubheadComponent = (props) => {
  const dotClass = `subhead-component-dots step-${props.step}`;

  return (
  <div className="subhead-component">
    <IconButton
      href={props.prev}
    >
      <KeyboardArrowLeft className="key-left-icon"/>
    </IconButton>
    <h2 className="">{props.heading}</h2>

    <h5 className={dotClass}>
      <span>•</span> <span>•</span> <span>•</span>
    </h5>
  </div>
)};

SubheadComponent.displayName = 'SrcComponentsSubheadComponent';

// Uncomment properties you need
// SubheadComponent.propTypes = {};
// SubheadComponent.defaultProps = {};

export default SubheadComponent;
