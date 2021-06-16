import React from 'react';
import './DatabaseMiniMenuPopup.scss';

const DatabaseMiniMenuPopup = ({
                                   isOpen,
                                   openDeleteConnectionPopup
                               }) => {
    return (
        <>
            {isOpen &&
            <div className='db-mini-menu-window'>
                <div className='db-mini-menu-edit'>Edit</div>
                <div  className='db-mini-menu-delete' onClick={openDeleteConnectionPopup}>Delete</div>
            </div>
            }
        </>
    )

};

export default DatabaseMiniMenuPopup;