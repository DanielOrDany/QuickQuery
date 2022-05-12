import React from 'react';
import Portal from '../../components/Portal';
import Button from '../../components/Button';
import PropTypes from 'prop-types';
import './index.scss';
import cyborg_man_dancing_icon from "../../icons/cyborg-man-dancing.png";

const MessagePopup = ({
    isOpen,
    onSubmit,
    title,
    submitButton,
    submitTitle,
    text
}) => {
    return (
        <>
            {isOpen &&
            <Portal>
                <div className="message-popup-overlay">
                    <div className="message-popup-window">
                        <div className="message-popup-box">
                            
                            <div className="message-popup-title">
                                <img src={cyborg_man_dancing_icon}/>
                                <span>This is not a screamer - this is a message</span>
                            </div>
                            <div className="message-popup-body">
                                <div className="message">{text}</div>
                            </div>
                            <div className="message-popup-footer">
                                {submitButton &&
                                <Button id="subBtn" onClick={onSubmit}>{submitTitle}</Button>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </Portal>
            }
        </>
    );
};

MessagePopup.propTypes = {
    isOpen: PropTypes.bool,
    onSubmit: PropTypes.func,
    submitButton: PropTypes.bool,
    submitTitle: PropTypes.string,
    children: PropTypes.node
};

MessagePopup.defaultProps = {
    title: 'Message',
    isOpen: false,
    onSubmit: () => {},
    submitButton: true,
    submitTitle: "Close",
    children: null
};

export default MessagePopup;
