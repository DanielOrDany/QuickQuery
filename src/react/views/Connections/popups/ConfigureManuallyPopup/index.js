import React from 'react';
import Portal from '../../../../components/Portal';
import './popup.scss';
import cross_icon from "../../../../icons/pop-up-cross.svg";
import Button from "../../../../components/Button";

const ConfigureManuallyPopup = ({
    isOpen,
    onCancel,
    onSubmit,
    children,
    onSave,
    isEdit
}) => {
    console.log("isOpen", isOpen);
    return (
        <>
            { isOpen &&
                <Portal>
                    <div className='configure-manually-popup-BG'>
                        <div className='configure-manually-popup-window'>
                            <div className='configure-manually-popup-header'>
                                <span>🔌 Connect to database</span>
                                <img className='configure-manually-popup-cross' src={cross_icon} onClick={onCancel}
                                 alt={'cross'}/>
                            </div>
                            <div>{children}</div>
                            <div className='configure-manually-popup-btn-no-error'>
                                <Button id='configure-manually-popup-create-btn' className='configure-manually-popup-create-btn' onClick={isEdit ? onSave : onSubmit}>{isEdit ? "Save" : "Connect & save"}</Button>
                            </div>
                        </div>
                    </div>
                </Portal>
            }
        </>
    )
};

export default ConfigureManuallyPopup;