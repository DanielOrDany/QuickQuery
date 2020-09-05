import React from 'react';
import PropTypes from 'prop-types';

import Portal from './Portal';
import Button from './Button';
import delete_icon from "../icons/delete_icon.png";

import '../styles/Modal.scss';

const Modal = ({
    title, isOpen, onCancel, onSubmit, children,
  }) => {
  
    return (
      <>
        { isOpen &&
          <Portal>
            <div className="modalOverlay">
              <div className="modalWindow">
                <div className="modalHeader">
                  <div className="modalTitle">{title}</div>
                  <img alt={"delete icon"} src={delete_icon} onClick={onCancel} id="delete-icon"/>
                </div>
                <div className="modalBody">
                  {children}
                </div>
                <div className="modalFooter">
                  <Button onClick={onCancel} invert>Cancel</Button>
                  <Button onClick={onSubmit}>Submit</Button>
                </div>
              </div>
            </div>
          </Portal>
        }
      </>
    );
  };
  Modal.propTypes = {
    title: PropTypes.string,
    isOpen: PropTypes.bool,
    onCancel: PropTypes.func,
    onSubmit: PropTypes.func,
    children: PropTypes.node,
  };
  Modal.defaultProps = {
    title: 'Modal title',
    isOpen: false,
    onCancel: () => {},
    onSubmit: () => {},
    children: null,
  };

  export default Modal;
