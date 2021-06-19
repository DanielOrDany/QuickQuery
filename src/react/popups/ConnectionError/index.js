import React from 'react';
import Portal from '../../components/Portal';
import Button from '../../components/Button';
import PropTypes from 'prop-types';
import './index.scss';

const ConnectionErrorModal = ({
    isOpen,
    onSubmit,
    submitButton,
    submitTitle,
    children
}) => {
    return (
        <>
            {isOpen &&
            <Portal>
                <div className="connection-error-modal-overlay">
                    <div className="connection-error-modal-window">
                        <div className="connection-error-modal-box">
                            <div className="connection-error-modal-title">
                                <span>Create/edit connection error</span>
                            </div>
                            <div className="connection-error-modal-body">
                                {children}
                            </div>
                            <div className="connection-error-modal-footer">
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

ConnectionErrorModal.propTypes = {
    isOpen: PropTypes.bool,
    onSubmit: PropTypes.func,
    submitButton: PropTypes.bool,
    submitTitle: PropTypes.string,
    children: PropTypes.node
};

ConnectionErrorModal.defaultProps = {
    title: 'Connection Error',
    isOpen: false,
    onSubmit: () => {},
    submitButton: true,
    submitTitle: "Close",
    children: null
};

export default ConnectionErrorModal;
