import React from 'react';
import Portal from '../../../../components/Portal';
import './popup.scss';
import cross_icon from "../../../../icons/pop-up-cross.svg";
import Button from "../../../../components/Button";

const SimplifiedConnectionPopup = ({
                                       isOpen,
                                       onCancel,
                                       onSubmit,
                                       children,
                                       errorMessage,
                                       isError
                                }) => {
    return (
        <>
            {isOpen &&
            <Portal>

                <div className={'simplified-connection-popup-BG'}>

                    <div className={'simplified-popup-window'}>
                        <div className={'simplified-popup-header'}>
                            <span>Fill out all required information for creating a connection</span>
                        </div>


                        <img className={'simplified-popup-cross'} src={cross_icon} onClick={onCancel} alt={'cross'}/>


                        <div className={'simplified-popup-title'}>
                            <span>Create a connection</span>
                        </div>


                        <div>
                            {children}
                        </div>


                        {isError &&
                        <div className='simplified-error-message'>
                            <span>{errorMessage}</span>
                        </div>
                        }

                        {isError &&
                        <div className='simplified-popup-btn'>
                            <Button id='simplified-popup-cancel-btn' className='simplified-popup-cancel-btn'
                                    onClick={onCancel} invert>Cancel</Button>
                            <Button id='simplified-popup-create-btn' className='simplified-popup-create-btn'
                                    onClick={onSubmit}>Create</Button>
                        </div>
                        }

                        {!isError &&
                        <div className='simplified-popup-btn-no-error'>
                            <Button id='simplified-popup-cancel-btn' className='simplified-popup-cancel-btn'
                                    onClick={onCancel} invert>Cancel</Button>
                            <Button id='simplified-popup-create-btn' className='simplified-popup-create-btn'
                                    onClick={onSubmit}>Create</Button>
                        </div>
                        }
                    </div>


                </div>

            </Portal>
            }
        </>
    )

}


export default SimplifiedConnectionPopup;