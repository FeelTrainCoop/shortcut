'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import Helpers from '../../helpers';

require('styles/waveform/WaveRegionComponent.scss');

let moving = false;
var onResize;

class WaveRegion extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      leftOffset : props.leftOffset || -100,
      regionWidth: props.regionWidth || 20,
      dragging: false,
      dragStart: undefined,
      dragEnd: undefined,
      moveOffset: 0
    };

    onResize = this._updateOffset.bind(this);
    window.addEventListener('resize', onResize, false);
  }
  componentDidMount() {
    this._parent = ReactDOM.findDOMNode(this.refs._parent);
    this._updateOffset();
  }
  componentWillUnmount() {
    window.removeEventListener('resize', onResize, false);
  }
  componentDidUpdate(prevProps) {
    if (prevProps.regionStart !== this.props.regionStart ||
      prevProps.regionEnd !== this.props.regionEnd ||
      prevProps.regionViewStart !== this.props.regionViewStart ||
      prevProps.regionViewDuration !== this.props.regionViewDuration) {
        this._updateOffset();
    }
  }
  _handleDragStart(e) {
    if (moving) return;
    const clientX = e.clientX || e.touches[0].clientX;

    // if it is near regionStart or regionEnd, assume clicked on Handle
    const dRange = 7; // distance from handle in pixels
    const regLeft = ReactDOM.findDOMNode(this.refs._region).getBoundingClientRect().left
    const regRight = regLeft + ReactDOM.findDOMNode(this.refs._region).getBoundingClientRect().width;
    if (Math.abs(clientX - regRight) < dRange) {
      this.handleClickOnHandle(e, 'right');
      return;
    } else if (Math.abs(clientX - regLeft) < dRange) {
      this.handleClickOnHandle(e, 'left');
      return;
    }

    if (!this.state.dragging) {
      const dragStart = clientX - this._parent.getBoundingClientRect().left;
      this.setState({
        dragging: true,
        dragStart: dragStart,
        dragEnd: dragStart + 1
      });
    }
    e.preventDefault();
    e.stopPropagation();
  }
  _handleDrag(e) {
    if (this.state.dragging || this.state.dragStart && this.state.dragEnd) {
      let dragEnd = (e.clientX || e.touches[0].clientX) - this._parent.getBoundingClientRect().left;

      if (Math.abs(dragEnd - this.state.dragEnd) > 1) {
        this.setState({
          dragEnd: dragEnd,
          dragging: true
        });
      }
    } else if (moving) {
      const offset = (e.clientX || e.touches[0].clientX) - this.state.moveStart;
      this.setState({
        moveOffset: offset
      });
    }

    e.preventDefault();
    e.stopPropagation();
  }

  _handleDragEnd(e) {
    // convert regionStart / regionEnd to times
    const parentOffset = this._parent.getBoundingClientRect().left;
    let leftOffset = ReactDOM.findDOMNode(this.refs._region).getBoundingClientRect().left - parentOffset;
    let regionWidth = ReactDOM.findDOMNode(this.refs._region).getBoundingClientRect().width;

    const startTime = Helpers.map(leftOffset, 0, this.width, this.props.regionViewStart, this.viewEnd);
    const endTime = startTime + Helpers.map(regionWidth, 0, this.width, 0, this.props.regionViewDuration);

    moving = false;
    this.setState({
      dragging: false,
      moveOffset: 0,
      dragStart: undefined
    });

    // clicked on region
    if (Math.abs(startTime - this.props.regionStart) < 0.01 && Math.abs(endTime - this.props.regionEnd) < 0.01) {
      this.props.togglePlay(undefined, 'reset');
    } else {
      this.props.regionChanged(startTime * 1000, endTime * 1000);
    }

    window.ga('send', {
      'hitType': 'event',
      'eventCategory': 'RegionChange',
      'eventAction': 'WaveformRegionChange',
      'eventLabel': 'Waveform'
    });

    e.preventDefault();
    e.stopPropagation();
  }
  handleClickOnHandle(e, whichOne) {
    const parentOffset = this._parent.getBoundingClientRect().left;
    let regionBox = ReactDOM.findDOMNode(this.refs._region).getBoundingClientRect();
    let relStart = regionBox.left - parentOffset + regionBox.width;
    let dragEnd = regionBox.left - parentOffset;
    if (e.target.id === 'handle-right' || whichOne === 'right') {
      [relStart, dragEnd] = [dragEnd, relStart];
    }
    this.setState({
      dragStart: relStart,
      dragging: true,
      dragEnd: dragEnd
    });
    e.stopPropagation();
    e.preventDefault();
  }
  handleClickOnRegion(e) {
    // clicked on handle?
    if (e.target.id[0] === 'h') {
      return;
    }
    this.setState({
      moveStart: e.clientX || e.touches[0].clientX
    });
    moving = true;

    e.preventDefault();
    e.stopPropagation();
  }
  _updateOffset() {
    // return if component is not mounted (this should never happen, but does sometimes)
    if (!this._parent.clientWidth) return;

    const width = this.width = this._parent.clientWidth;
    const viewEnd = this.viewEnd = this.props.regionViewStart + this.props.regionViewDuration;
    const leftOffset = Helpers.map(this.props.regionStart, this.props.regionViewStart, viewEnd, 0, width);
    const regionWidth = Helpers.map(this.props.regionEnd - this.props.regionStart, 0, this.props.regionViewDuration, 0, width);
    this.setState({
       leftOffset: leftOffset,
       regionWidth: regionWidth
    });
    this.props.updateDimensions(width);
  }
  shouldComponentUpdate(nextProps, nextState) {
    return this.state.moveOffset !== nextState.moveOffset ||
      this.state.dragStart !== nextState.dragStart||
      this.state.dragEnd !== nextState.dragEnd||
      this.state.regionWidth !== nextState.regionWidth ||
      this.state.leftOffset !== nextState.leftOffset ||
      this.props.peaks !== nextProps.peaks ||
      this.props.regionStart !== nextProps.regionStart ||
      this.props.regionEnd !== nextProps.regionEnd ||
      this.props.regionViewStart !== nextProps.regionViewStart;
  }
  render() {
    let regionOffset = this.state.leftOffset + this.state.moveOffset;
    let regionWidth = this.state.regionWidth;

    if (this.state.dragging && this.state.dragEnd) {
      regionOffset = Math.min(this.state.dragStart, this.state.dragEnd);
      regionWidth = Math.abs(this.state.dragStart - this.state.dragEnd);
    }

    const regionStyle = {
      // backgroundColor: 'rgba(255,232,100, 0.7)', //'rgba(123,114,152,1)',
      // height: '100%',
      zIndex: '-1',
      width: '50%',
      cursor: 'move',
      position: 'absolute',
      left: regionOffset,
      width: regionWidth
    };

    const invisRegionStyle = {
      height: '100%',
      zIndex: '2',
      width: '50%',
      cursor: 'move',
      position: 'absolute',
      left: regionOffset,
      width: regionWidth
    };

    return (
      <div
        className="wave-region-component"
        ref="_parent"
        onTouchStart={this._handleDragStart.bind(this)}
        onTouchEnd={this._handleDragEnd.bind(this)}
        onTouchCancel={this._handleDragEnd.bind(this)}
        onTouchMove={this._handleDrag.bind(this)}
        onMouseDown={this._handleDragStart.bind(this)}
        onMouseUp={this._handleDragEnd.bind(this)}
        onMouseMove={this._handleDrag.bind(this)}
        // onMouseOut={this._handleDragEnd.bind(this)}
      >
        <div
          className="wave-region-component__region"
          id="wave-region"
          style={invisRegionStyle}
          onMouseDown={this.handleClickOnRegion.bind(this)}
          onTouchStart={this.handleClickOnRegion.bind(this)}
          draggable="false"
          ref="_region"
        >
          <div
            id="handle-left"
            className="wave-region-component__handle left"
            onMouseDown={this.handleClickOnHandle.bind(this)}
            onTouchStart={this.handleClickOnHandle.bind(this)}
            draggable="false"
            ref="_left"
          />
          <div
            id="handle-right"
            className="wave-region-component__handle right"
            onMouseDown={this.handleClickOnHandle.bind(this)}
            onTouchStart={this.handleClickOnHandle.bind(this)}
            draggable="false"
            ref="_right"
          />
        </div>
        {this.props.children}
        <div
          className="wave-region-component__region-background"
          id="wave-region"
          style={regionStyle}
          onMouseDown={this.handleClickOnRegion.bind(this)}
          onTouchStart={this.handleClickOnRegion.bind(this)}
          draggable="false"
          ref="_region"
        />

      </div>);
  }

}

export default WaveRegion;
