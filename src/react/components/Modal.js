import React from 'react';
import PropTypes from 'prop-types';

import Portal from './Portal';
import Button from './Button';
import delete_icon from "../icons/delete_icon.png";

import '../styles/Modal.scss';

const Modal = ({
    title, isOpen, onCancel, onSubmit, cancelButton, cancelTitle, submitTitle, noCross, children,
  }) => {
  
    return (
      <>
        { isOpen &&
          <Portal>
            <div className="modalOverlay">
              <div className="modalWindow">
                <div className="modalHeader">
                  <div className="modalTitle">{title}</div>
                  {!noCross &&
                    <img alt={"delete icon"} src={delete_icon} onClick={onCancel} id="delete-icon"/>
                  }
                </div>
                <div className="modalBody">
                  {children}
                </div>
                <div className="modalFooter">
                  {cancelButton &&
                    <Button id="cancelBtn" onClick={onCancel} invert>{cancelTitle}</Button>
                  }
                  <Button id="subBtn" onClick={onSubmit}>{submitTitle}</Button>
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
    cancelButton: PropTypes.bool,
    cancelTitle: PropTypes.string,
    submitTitle: PropTypes.string,
    noCross: PropTypes.bool,
    children: PropTypes.node,
  };
  Modal.defaultProps = {
    title: 'Modal title',
    isOpen: false,
    onCancel: () => {},
    onSubmit: () => {},
    cancelButton: false,
    cancelTitle: "Cancel",
    submitTitle: "Submit",
    noCross: false,
    children: null,
  };

  export default Modal;
