import React from 'react';

import './TableImgModal.scss';
import delete_icon from "../../../../icons/cross.png";
import PropTypes from "prop-types";


const TableImgModal = ({isOpen, tableInfo, onCancel}) => {
    return (


        <div className={isOpen ? "tableImgModal-active" : "no-active-img"}>

            <div  onClick={onCancel} className={'img-cross-div'}><img src={delete_icon} alt={'cross'} className={'cross-table-img-popup'}/></div>

            <img src={tableInfo} className={'img-popup'}/>
        </div>


    )
}


TableImgModal.propTypes = {
    isOpen: PropTypes.bool,
    onCancel: PropTypes.func,
};

TableImgModal.defaultProps = {
    isOpen: false,
    onCancel: () => {},
};



export default TableImgModal;