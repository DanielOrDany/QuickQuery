import React from 'react';
import './index.scss';
import cross_icon from "../../icons/pop-up-cross.svg";




const DeleteTablePopup = ({
                                   isOpen,
                                   onCancel,
                                   deleteTable
                               }) => {

    return (
        <>
            {isOpen &&
            <div className='delete-table-popup-BG'>

                <div className='delete-table-popup-window'>

                    <img className='delete-table-popup-cross' src={cross_icon} onClick={onCancel} alt={'cross'}/>


                    <span className='delete-table-popup-title'>
                        Delete table
                    </span>

                    <span className='delete-table-popup-subtitle'>
                        Are you sure you want to permanently delete this table?
                    </span>

                    <div className='delete-table-popup-btn'>
                        <button className='delete-table-popup-cancel-btn' onClick={onCancel}>Cancel</button>
                        <button className='delete-table-popup-delete-btn'
                                onClick={deleteTable}
                        >
                            Delete
                        </button>
                    </div>

                </div>

            </div>
            }
        </>
    )

};


export default DeleteTablePopup;