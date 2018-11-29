import React from 'react';

class LoginSuccessComponent extends React.PureComponent {

	componentDidMount() {
		// post login details to parent
		if (window.opener) {
			window.opener.postMessage(this.props.match.params, window.location.origin);
		}
		window.close();
		window.addEventListener('load', window.close);
	}

	render() {
		return (<div>
			<p>Welcome, {this.props.match.params.twUserName}</p>
			<p onClick={() => {window.close()}}>Click here if not redirected</p>
		</div>);
	}
}

export default LoginSuccessComponent;
