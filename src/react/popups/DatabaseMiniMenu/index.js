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
            <div className='db-mini-menu-window'>
                <div className='db-mini-menu-edit'>Edit</div>
                <div className='db-mini-menu-delete'>Delete</div>
            </div>
            }
        </>
    )

}


export default DatabaseMiniMenuPopup;