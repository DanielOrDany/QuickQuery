import React from 'react';
import './TableImgModal.scss';


const TableImgPopup = ({
                           isOpen,
                           onCancel,
                           columnImg

                       }) => {
    return (
        <>
            {isOpen &&

            <div className='table-img-popup-BG' onClick={onCancel}>
                <img src={columnImg} className='img-popup' alt='img'/>
            </div>

            }
        </>
    )

}


export default TableImgPopup;