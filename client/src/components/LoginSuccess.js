import React from 'react';

class LoginSuccessComponent extends React.PureComponent {

	componentDidMount() {
		// post login details to parent
		if (window.opener) {
			window.opener.postMessage(this.props.routeParams, window.location.origin);
			console.log(this.props.routeParams);
		}
		window.close();
		window.addEventListener('load', window.close);
	}

	render() {
		return (<div>
			<p>Welcome, {this.props.routeParams.twUserName || this.props.routeParams.fbUserName}</p>
			<p onClick={() => {window.close()}}>Click here if not redirected</p>
		</div>);
	}
}

export default LoginSuccessComponent;
