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
                                <span>🔌 Connect to database</span>
                                <img className='simplified-popup-cross' src={cross_icon} onClick={onCancel}
                                 alt={'cross'}/>
                            </div>
                            <div>{children}</div>
                            <div className='simplified-popup-btn-no-error'>
                                <Button id='simplified-popup-create-btn' className='simplified-popup-create-btn'
                                        onClick={isEdit ? onSave : onSubmit}>{isEdit ? "Save" : "Connect & save"}</Button>
                            </div>
                        </div>
                    </div>
                </Portal>
            }
        </>
    )
};

export default SimplifiedConnectionPopup;