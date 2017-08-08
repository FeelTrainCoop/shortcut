# tal-client

This is the client-side React app.

## Usage
The following commands are available:
```bash
# Start for development
npm start # start with a local server at port 3000 (server-auth) for social auth. The server uses redis, which requires a separate install.
npm run serve # start without local server

# Start the dev-server with the dist version
npm run serve:dist

# Just build the dist version and copy static files
npm run dist

# Run unit tests
npm test

# Lint all files in src (also automatically done AFTER tests are run)
npm run lint

# Clean up the dist directory
npm run clean

# Just copy the static assets
npm run copy

# Generate docs
npm run docs
```

## Deployment
Deployment is a three step process
1. First, bundle all the CSS and JS into one file with `npm run dist`.
2. Upload the app bundle to S3 via the `deploy_s3.sh` script. This uploads the bundled app file to Amazon S3 with a unique version number. The file is cached by CloudFront, and the version number ensures that users don't get old versions from the cache.
3. Update the `APP_VERSION` environment variable in tal-server and/or Elastic Beanstalk environments

## Generator
Generated with [react-webpack generator](https://github.com/react-webpack-generators/generator-react-webpack)

## Generating new components
```bash
cd tal-client/
yo react-webpack:component my/namespaced/components/name
```

The above command will create a new component, as well as its stylesheet and a basic testcase.

## Generating new stateless functional components
```
yo react-webpack:component my/namespaced/components/name --stateless
```

Stateless functional components where introduced in React v0.14. They have a much shorter syntax than regular ones and no state or lifecycle methods at all. Please read the [React 0.14 release notes](https://facebook.github.io/react/blog/2015/10/07/react-v0.14.html) to get more information about those components.

___Note___: You will still be able to set properties for stateless components!

## Adding PostCSS plugins
If you have enabled [PostCSS](https://github.com/postcss/postcss) at generation time, install your PostCSS plugins via npm and *require* it in **postcss** function in *cfg/base.js*.

Example for autoprefixer:
```bash
cd tal-client/
npm install autoprefixer
```
Require in *cfg/base.js*
```JavaScript
...
postcss: function () {
  return [
    require('autoprefixer')({
      browsers: ['last 2 versions', 'ie >= 8']
    })
  ];
}
...
```

### Modules
Each component is a module and can be required using the [Webpack](http://webpack.github.io/) module system. [Webpack](http://webpack.github.io/) uses [Loaders](http://webpack.github.io/docs/loaders.html) which means you can also require CSS and a host of other file types. Read the [Webpack documentation](http://webpack.github.io/docs/home.html) to find out more.
