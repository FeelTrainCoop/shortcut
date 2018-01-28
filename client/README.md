# shortcut-client

This is the client-side React app. Most of these commands should work, but please refer to [the wiki](https://github.com/FeelTrainCoop/shortcut/wiki) for up-to-date documentation instead. This README will soon be updated to reflect the current state of the project.

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

## Generator
Generated with [react-webpack generator](https://github.com/react-webpack-generators/generator-react-webpack)

### Modules
Each component is a module and can be required using the [Webpack](http://webpack.github.io/) module system. [Webpack](http://webpack.github.io/) uses [Loaders](http://webpack.github.io/docs/loaders.html) which means you can also require CSS and a host of other file types. Read the [Webpack documentation](http://webpack.github.io/docs/home.html) to find out more.
