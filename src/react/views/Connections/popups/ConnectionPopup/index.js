import React from 'react';
import Portal from '../../../../components/Portal';
import './popup.scss';
import cross_icon from "../../../../icons/pop-up-cross.svg";

const ConnectionPopup = ({
    isOpen,
    onCancel,
    children
}) => {
    return (
        <>
            { isOpen &&
                <Portal>
                    <div className={'connection-popup-BG'}>
                        <div className={'connection-popup-window'}>
                            <div className={'connection-popup-header'}>
                                <span>Adding new database</span>
                            </div>
                            <img className='connection-popup-cross' src={cross_icon} onClick={onCancel}
                                 alt={'cross'}/>
                            <div className='connection-popup-title'>
                                <span>Select your database</span>
                            </div>
                            <div>{children}</div>
                        </div>
                    </div>
                </Portal>
            }
        </>
    )
};

export default ConnectionPopup;