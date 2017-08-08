'use strict';

import React from 'react';
import Helpers from '../../helpers';

// styled inline, which overwrites the scss
// require('styles/waveform/WavePlayheadComponent.scss');

const WavePlayhead = (props) => {
  const offsetLeft = Helpers.map(props.actualPos, props.regionViewStart, props.regionViewStart + props.regionViewDuration, 0, props.width);

  if (isNaN(offsetLeft)) return null;

  const playheadStyle = {
    left: offsetLeft - 5,
    opacity: props.playing ? '0.7' : '0.0',
    transition: 'opacity 0.2s'
  };

  return(
    <div
      className="wave-playhead-component"
      style={playheadStyle}
    />
  );
}

export default WavePlayhead;
