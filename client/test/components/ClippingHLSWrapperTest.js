/* eslint-env node, mocha */
/* global expect */
/* eslint no-console: 0 */
'use strict';

// Uncomment the following lines to use the react test utilities
// import TestUtils from 'react-addons-test-utils';
import createComponent from 'helpers/shallowRenderHelper';

import ClippingHLSWrapper from 'components//ClippingHLSWrapper.js';

describe('ClippingHLSWrapper', () => {
  let component;

  beforeEach(() => {
    component = createComponent(ClippingHLSWrapper);
  });

  it('should have its component name as clipping-wrapper', () => {
    expect(component.props.className).to.equal('clipping-wrapper');
  });
});
