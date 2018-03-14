/* eslint-env node, mocha */
/* global expect */
/* eslint no-console: 0 */
'use strict';

// Uncomment the following lines to use the react test utilities
// import TestUtils from 'react-addons-test-utils';
import createComponent from 'helpers/shallowRenderHelper';

import ClippingContainerComponent from 'components/ClippingContainerComponent.js';

describe('ClippingContainerComponent', () => {
  let component;

  beforeEach(() => {
    component = createComponent(ClippingContainerComponent);
  });

  it('should have its component name as default className', () => {
    expect(component.props.className).to.contain('clipping-container-component');
  });
});
