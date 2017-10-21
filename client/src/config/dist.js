'use strict';

import baseConfig from './base';

let config = {
  appEnv: 'dist',
  authServer: 'http://localhost:3000',
  apiEndpoint: 'http://localhost:3000',
  dataBucket: 'http://localhost:8080/',
  s3Region: 'us-west-2',
  s3Bucket: 'shortcut-getting-started',
  // Uncomment this to enable Amazon Cloudfront CDN, make sure to have CORS headers whitelisted!
  // cloudFrontDomain: 'd2dw7fri03nzvu.cloudfront.net',
  analyticsPropertyId: '' // your gAnalytics ID
};

export default Object.freeze(Object.assign({}, baseConfig, config));
