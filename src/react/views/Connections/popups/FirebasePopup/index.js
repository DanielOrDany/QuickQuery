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
                                <span>Fill out all required information for creating a connection</span>
                            </div>
                            <img className={'firebase-popup-cross'} src={cross_icon} onClick={onCancel} alt={'cross'}/>
                            <div className={'firebase-popup-title'}>
                                <span>{isEdit ? "Edit" : "Create"} a connection</span>
                            </div>
                            <div>
                                {children}
                            </div>
                            <div className='firebase-popup-btn-no-error'>
                                <Button id='firebase-popup-cancel-btn' className='firebase-popup-cancel-btn'
                                        onClick={onCancel} invert>Cancel</Button>
                                <Button id='firebase-popup-create-btn' className='firebase-popup-create-btn'
                                        onClick={isEdit ? onSave : onSubmit}>{isEdit ? "Save" : "Create"}</Button>
                            </div>
                        </div>
                    </div>
                </Portal>
            }
        </>
    )
};

export default FirebasePopup;