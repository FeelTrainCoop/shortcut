'use strict';

import React from 'react';

class AudioController extends React.PureComponent {
	constructor(props) {
		super(props);
	}
	componentDidMount() {
		if (!this.props.mediaEltId) return;
		this._setupMediaElt();
	}
	_setupMediaElt() {
		let audioElt = document.querySelector(this.props.mediaEltId);
		this.audioElt = audioElt;
	}
	componentWillUnmount() {
		// stop handleTimeUpdate
		this._unmounted = true;
	}
	componentDidUpdate(prevProps) {
		if (!this.props.mediaEltId) return;
		if (!prevProps.mediaEltId) this._setupMediaElt();
		let audioElt = document.querySelector(this.props.mediaEltId);

		if (this.props.pos !== prevProps.pos) {
			audioElt.currentTime = this.props.pos;
		}
		if (this.props.playing !== prevProps.playing) {
			this.updatePlay();
		}
	}
	updatePlay() {
		window.setTimeout(() => {
			if (this.props.playing) {
				this.audioElt.play();

				// update time
				window.setTimeout(() => {
					this.handleTimeUpdate()
				}, 1000/24);

			} else if (!this.audioElt.paused) {
				this.audioElt.pause();
				this.audioElt.currentTime = this.props.regionStart;
			}
		}, 1);
	}
	handleTimeUpdate() {
		// set actualPos, a more precise pos, in parent state
		this.props.setActualPos(this.audioElt.currentTime);

		// console.log(this.audioElt.currentTime, this.props.regionEnd);

		if (this.audioElt.currentTime > this.props.regionEnd) {
			this.props.donePlaying();
		}
		if (this.props.playing && !this._unmounted) {
			setTimeout(this.handleTimeUpdate.bind(this), 1000 / 24);
		}
	}
	render() {
		return null;
	}
}

export default AudioController;
