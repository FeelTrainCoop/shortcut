/* eslint-env node, mocha */
/* global expect */
/* eslint no-console: 0 */
'use strict';

// Uncomment the following lines to use the react test utilities
// import TestUtils from 'react-addons-test-utils';
import createComponent from 'helpers/shallowRenderHelper';

import ShareContainerComponent from 'components//ShareContainerComponent.js';

describe('ShareContainerComponent', () => {
  let component;

  beforeEach(() => {
    component = createComponent(ShareContainerComponent);
  });

  it('should have its component name as default className', () => {
    expect(component.props).to.have.property('muiTheme');
  });
});
