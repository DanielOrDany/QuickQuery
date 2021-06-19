import './popup.scss';
import React from 'react';
import Portal from '../../../../components/Portal';
import cross_icon from "../../../../icons/pop-up-cross.svg";
import Button from "../../../../components/Button";

const SSHConnectionPopup = ({
    isOpen,
    onCancel,
    onSubmit,
    onSave,
    children,
    isEdit
}) => {
    return (
        <>
            {isOpen &&
            <Portal>
                <div className="ssh-connection-popup">
                    <div className="ssh-popup-window">
                        <div className="ssh-popup-header">
                            <span>Fill out all required information for creating a connection</span>
                        </div>
                        <img className="ssh-popup-cross" src={cross_icon} onClick={onCancel} alt={'cross'}/>
                        <div className="ssh-popup-title">
                            <span>SSH connection</span>
                        </div>
                        <div>{children}</div>
                        <div className="ssh-popup-btn">
                            <Button id='ssh-popup-cancel-btn' className='ssh-popup-cancel-btn' onClick={onCancel} invert>Cancel</Button>
                            <Button id='ssh-popup-create-btn' className='ssh-popup-create-btn' onClick={isEdit ? onSave : onSubmit}>{isEdit ? "Save" : "Create"}</Button>
                        </div>
                    </div>
                </div>
            </Portal>
            }
        </>
    )
};

export default SSHConnectionPopup;