import React, { Component } from 'react';
import PropTypes from 'prop-types';
import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';
import Item from '../item/item';

class Modal extends Component {
  getItem() {
    const { item, theme, vote, auth } = this.props;
    return <Item key={item.id} theme={theme} cardItem={item} vote={vote} auth={auth} />;
  }
  onOutsideClick(e) {
    if (e.target.className === 'item_container modal') {
      this.props.close();
    }
  }
  render() {
    const { item, close } = this.props;
    return (
      <CSSTransitionGroup
        transitionName="fade_item"
        transitionEnterTimeout={250}
        transitionLeaveTimeout={150}
        className="modal"
      >
        {
          item ?
            <div
              className="modal_container"
              onClick={e => this.onOutsideClick(e)}
            >
              <div className="close_modal" onClick={() => close()}>
                <i className="ion-close-round" />
              </div>
              { this.getItem() }
            </div>
          : null
        }
      </CSSTransitionGroup>

    );
  }
}

Modal.propTypes = {
  item: PropTypes.object, //eslint-disable-line
  theme: PropTypes.object.isRequired,
  auth: PropTypes.object.isRequired,
  close: PropTypes.func.isRequired,
  vote: PropTypes.func.isRequired,
};

export default Modal;
