import React from 'react';
import './index.scss';
import Button from "../../../../components/Button";
import cross_icon from "../../../../icons/pop-up-cross.svg";

const DeleteConnectionPopup = ({
                                   isOpen,
                                   onCancel,
                                   deleteConnectionName,
                                   deleteConnection
                               }) => {

    return (
        <>
            {isOpen &&
            <div className='delete-connection-popup-BG'>

                <div className='delete-connection-popup-window'>

                    <img className='delete-connection-popup-cross' src={cross_icon} onClick={onCancel} alt={'cross'}/>

                    <span className='delete-connection-popup-title'>
                        Delete connection
                    </span>

                    <span className='delete-connection-popup-subtitle'>
                        Are you sure you want to permanently delete this connection?
                    </span>

                    <div className='delete-connection-popup-btn'>
                        <Button className='delete-connection-popup-cancel-btn' onClick={onCancel}>Cancel</Button>
                        <Button className='delete-connection-popup-delete-btn'
                                onClick={() => deleteConnection(deleteConnectionName)}
                        >
                            Delete
                        </Button>
                    </div>

                </div>

            </div>
            }
        </>
    )

};


export default DeleteConnectionPopup;