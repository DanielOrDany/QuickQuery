import React from 'react';
import './popup.scss';
import Portal from '../../../../components/Portal';
import cross_icon from "../../../../icons/pop-up-cross.svg";
import Button from "../../../../components/Button";

const FirebasePopup = ({
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
                    <div className={'firebase-popup-BG'}>
                        <div className={'firebase-popup-window'}>
                            <div className={'firebase-popup-header'}>
                                <span>🔌 Connect to database</span>
                                <img className='connection-popup-cross' src={cross_icon} onClick={onCancel}
                                 alt={'cross'}/>
                            </div>
                            <div>{children}</div>
                            <div className='firebase-popup-btn-no-error'>
                                <Button id='firebase-popup-create-btn' className='firebase-popup-create-btn'
                                        onClick={isEdit ? onSave : onSubmit}>{isEdit ? "Update" : "Connect & save"}</Button>
                            </div>
                        </div>
                    </div>
                </Portal>
            }
        </>
    )
};

export default FirebasePopup;