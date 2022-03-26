import React from 'react';
import './popup.scss';
import Portal from '../../../../components/Portal';
import cross_icon from "../../../../icons/pop-up-cross.svg";
import Button from "../../../../components/Button";

const SimplifiedConnectionPopup = ({
    isOpen,
    onCancel,
    onSubmit,
    children,
    onSave,
    isEdit
}) => {
    return (
        <>
            { isOpen &&
                <Portal>
                    <div className={'simplified-connection-popup-BG'}>
                        <div className={'simplified-popup-window'}>
                            <div className={'simplified-popup-header'}>
                                <span>Fill out all required information for creating a connection</span>
                            </div>
                            <img className={'simplified-popup-cross'} src={cross_icon} onClick={onCancel} alt={'cross'}/>
                            <div className={'simplified-popup-title'}>
                                <span>{isEdit ? "Edit" : "Create"} a connection</span>
                            </div>
                            <div>
                                {children}
                            </div>
                            <div className='simplified-popup-btn-no-error'>
                                <Button id='simplified-popup-cancel-btn' className='simplified-popup-cancel-btn'
                                        onClick={onCancel} invert>Cancel</Button>
                                <Button id='simplified-popup-create-btn' className='simplified-popup-create-btn'
                                        onClick={isEdit ? onSave : onSubmit}>{isEdit ? "Save" : "Create"}</Button>
                            </div>
                        </div>
                    </div>
                </Portal>
            }
        </>
    )
};

export default SimplifiedConnectionPopup;