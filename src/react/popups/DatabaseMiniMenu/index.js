import React from 'react';
import './DatabaseMiniMenuPopup.scss';
import Button from "../../components/Button";
import cross_icon from "../../icons/pop-up-cross.svg";


const DatabaseMiniMenuPopup = ({
                         isOpen

                     }) => {
    return (
        <>
            {isOpen &&
            <div className={'db-mini-menu-window'}>
                fasf
            </div>
            }
        </>
    )

}


export default DatabaseMiniMenuPopup;