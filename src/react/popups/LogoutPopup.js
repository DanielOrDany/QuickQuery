import React from 'react';
import '../popup_styles/LogoutPopup.scss';
import Button from "../components/Button";
import cross_icon from "../icons/pop-up-cross.svg";


const LogoutPopup = ({
                         isOpen,
                         onCancel,
                         logout

                     }) => {
    return (
        <>
            {isOpen &&
            <div className={'logout-popup-BG'}>

                <div className={'logout-popup-window'}>

                    <img className={'logout-popup-cross'} src={cross_icon} onClick={onCancel} alt={'cross'}/>

                    <div className={'logout-popup-title'}>
                        <span>Are you sure want to sign out?</span>
                    </div>

                    <div className={'logout-popup-subtitle'}>
                        <span>Come back soon!</span>
                    </div>

                    <div className={'logout-popup-btn'}>
                        <Button id='logout-popup-cancel-btn' onClick={onCancel}>Cancel</Button>
                        <Button id='logout-popup-sign-out-btn' onClick={logout}>Sign out</Button>
                    </div>

                </div>

            </div>
            }
        </>
    )

}


export default LogoutPopup;