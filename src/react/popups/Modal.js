import React from 'react';
import PropTypes from 'prop-types';
import Portal from '../components/Portal';
import Button from '../components/Button';
import arrow from "../icons/modal-arrow.svg";
import second_arrow from "../icons/second-modal-arrow.svg";
import cancel_icon from "../icons/pop-up-cross.svg";
import hint_cross from "../icons/hint-cross.svg";
import '../styles/Modal.scss';

const Modal = ({
                 isOpen,
                 onCancel,
                 onSubmit,
                 cancelButton,
                 submitButton,
                 cancelTitle,
                 submitTitle,
                 noCross,
                 children,
                 isBigModal,
                 closeFirstModalHints,
                 firstModalHint,
                 closeSecondModalHints,
                 secondModalHint
               }) => {



  return (
      <>
        {isOpen &&
        <Portal>

          <div className="modalOverlay">
            {isBigModal ?
                <div>

                </div>
                :
                firstModalHint ?
                    <div className={'first-modal-hint'}>
                      <img src={arrow} className={'modal-arrow'}/>
                      <span>First step, you need to create a database connection, please start here  👇</span>
                      <img src={hint_cross} className={'first-hint-cross'} onClick={closeFirstModalHints}/>
                    </div>

                    :
                    <div>

                    </div>
            }

            <div className={isBigModal ? "modalWindowBig" : "modalWindowSmall"}>


              {isBigModal ?
                  <div className={"headerBig"}>
                    <span
                        className={"headerText"}>Fill out all required information for creating a connection manually</span>
                  </div>
                  :
                  <div className={"headerSmall"}>
                    <span className={"headerText"}>Fill out all required information for creating a connection</span>
                  </div>}


              {!noCross &&
              <img alt={"delete icon"} src={cancel_icon} onClick={onCancel} id="delete-icon"/>
              }

              {isBigModal ?
                  <div className="bigModalTitle">
                    <span>Manual connection</span>
                  </div>
                  :
                  <div className="smallModalTitle">
                    <span>Create a connection</span>
                  </div>
              }



              <div className="modalBody">
                {children}
              </div>

              {isBigModal ?
                  <div className="bigModalFooter">
                    {cancelButton &&
                    <Button id="cancelBtn" onClick={onCancel} invert>{cancelTitle}</Button>
                    }
                    {submitButton &&
                    <Button id="subBtn" onClick={onSubmit}>{submitTitle}</Button>
                    }
                  </div>
                  :
                  <div className="smallModalFooter">
                    {cancelButton &&
                    <Button id="cancelBtn" onClick={onCancel} invert>{cancelTitle}</Button>
                    }
                    {submitButton &&
                    <Button id="subBtn" onClick={onSubmit}>{submitTitle}</Button>
                    }
                  </div>

              }

            </div>


            {isBigModal ?
                <div>

                </div>
                :
                secondModalHint ?
                    <div className={'second-modal-hint'}>
                      <img src={second_arrow} className={'second-modal-arrow'}/>
                      <span>Or configure it manually by your own  😎</span>
                      <img src={hint_cross} className={'second-hint-cross'} onClick={closeSecondModalHints}/>
                    </div>
                    :
                    <div>

                    </div>
            }


          </div>
        </Portal>
        }
      </>
  );
};
Modal.propTypes = {
  isOpen: PropTypes.bool,
  onCancel: PropTypes.func,
  onSubmit: PropTypes.func,
  cancelButton: PropTypes.bool,
  submitButton: PropTypes.bool,
  cancelTitle: PropTypes.string,
  submitTitle: PropTypes.string,
  noCross: PropTypes.bool,
  children: PropTypes.node
};
Modal.defaultProps = {
  title: 'Modal title',
  isOpen: false,
  onCancel: () => {},
  onSubmit: () => {},
  cancelButton: false,
  submitButton: true,
  cancelTitle: "Cancel",
  submitTitle: "Submit",
  noCross: false,
  children: null,
};

export default Modal;
