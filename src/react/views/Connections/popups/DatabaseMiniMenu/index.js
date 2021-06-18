import React from 'react';
import './DatabaseMiniMenuPopup.scss';

const DatabaseMiniMenuPopup = ({
                                   isOpen,
                                   openDeleteConnectionPopup,
                                   openEditConnectionPopup,
                                   connectionName
                               }) => {
    return (
        <>
            { isOpen &&
                <div className='db-mini-menu-window'>
                    <div className='db-mini-menu-edit' onClick={() => openEditConnectionPopup(connectionName)}>Edit</div>
                    <div  className='db-mini-menu-delete' onClick={openDeleteConnectionPopup}>Delete</div>
                </div>
            }
        </>
    )

};

export default DatabaseMiniMenuPopup;