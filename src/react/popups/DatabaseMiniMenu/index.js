import React from 'react';
import './DatabaseMiniMenuPopup.scss';
import PropTypes from "prop-types";
import Modal from "../Modal";

const DatabaseMiniMenuPopup = ({ isOpen, connectionName, deleteConnection }) => {
    return (
        <>
            {isOpen &&
            <div className='db-mini-menu-window'>
                <div className='db-mini-menu-edit'>Edit</div>
                <div onClick={()=>deleteConnection(connectionName)} className='db-mini-menu-delete'>Delete</div>
            </div>
            }
        </>
    )

};

// Modal.propTypes = {
//     isOpen: PropTypes.bool,
//     deleteConnection: PropTypes.func,
//     connectionName: PropTypes.string
// };

export default DatabaseMiniMenuPopup;