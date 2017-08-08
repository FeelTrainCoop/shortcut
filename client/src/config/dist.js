'use strict';

import baseConfig from './base';

let config = {
  appEnv: 'dist',  // feel free to remove the appEnv property here
  apiEndpoint: 'https://wanz89yyu8.execute-api.us-east-1.amazonaws.com/shortcutdev/',
  apiEndpointBackup: 'https://lu49rv1wa8.execute-api.us-west-2.amazonaws.com/shortcutdev/',
  // apiEndpoint: 'https://wanz89yyu8.execute-api.us-east-1.amazonaws.com/shortcutdev/', // TAL
  // apiEndpoint: 'https://3rr1yij7g0.execute-api.us-east-1.amazonaws.com/staging/',
  // apiEndpoint: 'https://3rr1yij7g0.execute-api.us-east-1.amazonaws.com/dev/',
  // apiEndpointBackup: 'https://xi6sq2h422.execute-api.us-west-2.amazonaws.com/dev/',
  authServer: '.',
  // dataBucket: 'https://d1bojkr1jokyfh.cloudfront.net/'
  dataBucket: '/d/',
  analyticsPropertyId: 'UA-1548748-7'
};

export default Object.freeze(Object.assign({}, baseConfig, config));
