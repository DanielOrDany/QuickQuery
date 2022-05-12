import React from 'react';
import './DatabaseMiniMenuPopup.scss';

const DatabaseMiniMenuPopup = ({
    isOpen,
    openDeleteConnectionPopup,
    openEditConnectionPopup,
    connectionName,
    onClose
}) => {
    return (
        <>
            { isOpen &&
                <div className='db-mini-background' onClick={() => onClose()}>
                    <div className='db-mini-menu-window'>
                        <div className='db-mini-menu-edit' onClick={() => openEditConnectionPopup(connectionName)}>Rename</div>
                        <div  className='db-mini-menu-delete' onClick={openDeleteConnectionPopup}>Delete</div>
                    </div>
                </div>   
            }
        </>
    )

};

export default DatabaseMiniMenuPopup;