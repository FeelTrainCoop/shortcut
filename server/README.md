# THE DOCS BELOW ARE DEPRECATED!

Please refer to [the wiki](https://github.com/FeelTrainCoop/shortcut/wiki) instead. This README will soon be updated to reflect the current state of the project.

# shortcut-server
A node/express server that
- serves a single page application ("shortcut-client")
- provides an API for handling social authentication for the client. Currently Twitter and Facebook are supported.
- provides web hooks for updating individual episodes and the list of available episodes
- ensures that only authorized requests can access episode data

## Development

### Pre-reqs

##### Install dependencies
```
npm install
```

##### Env Variables
Copy `.env-template` to `.env` and fill in environment variables. 

*NOTE: Environment Variables are not automatically copied over to Elastic Beanstalk deployments. Enter the environment variables manually in the EB console.

### Run Locally

### Build & run with Docker:
- Mac only: eval "$(docker-machine env default)"
- `docker build -t shortcut-server .`
- `docker run -p 3000:3000 -d shortcut-server`
- server will be running at docker-machine ip, i.e. `http://192.168.99.100:3000/`

### Run with Node:
- `npm start`
- `npm run dev` # run with nodemon
Runs on `localhost:3000`

## Deploy

### Deploy via AWS Elastic Beanstalk
- [AWS notes on deploying node.js to ebs](http://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create_deploy_nodejs.html)
- Or, [use the CLI](http://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-configuration.html):
	- `eb deploy`
	- **Deploy Scripts** (these assume you have IAM credentials for `shortcut` in `~/.aws/credentials`)
		- `bash deploy.sh` --> deploy to production
		- `bash deploy-staging.sh` --> deploy to staging
- set environment variables from .env file by running `bash setenv.sh`, or via AWS website: All Applications --> <app> --> <app environment> --> configuration --> Environment Properties
