import React, { useState, useRef, useEffect } from 'react';
import '../styles/MiniMenu.scss';
import { getTable, deleteTable} from "../methods";

import Modal from './Modal';

function openTable(alias) {
    const connectionName = JSON.parse(localStorage.getItem('current_connection')).name;
    getTable(connectionName, alias).then(result => {
        localStorage.setItem("current_result_info", JSON.stringify(result));
        const results = JSON.parse(localStorage.getItem("results"));
        if (results) {
            results.push(result);
            localStorage.setItem("results", JSON.stringify(results));
        } else {
            localStorage.setItem("results", JSON.stringify([result]));
        }

        return `#/tables/result/${alias}`; 
    }).then(url => window.location.hash = url);
}

function removeTable(alias) {
    const connectionName = JSON.parse(localStorage.getItem('current_connection')).name;
    deleteTable(connectionName, alias).then(tables => {
        if(tables)  {
            document.getElementById(alias).remove();
            return `#/tables/${alias}`;
        }
    }).then(url => window.location.hash = url);
}

function editTable(table) {
    localStorage.setItem("current_result_info", JSON.stringify(table));
    window.location.hash = `#/tables/edit-table/${table.alias}`;
}

function MiniMenu(props) {
    const [open, setOpen] = useState(false);
    const [isOpen, openPopup] = useState(false);
    const [table, setTable] = useState();
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    function openModal(alias) {
        setTable(alias);
        openPopup(true);
    };
    
    function handleSubmit() {
        removeTable(table);
        openPopup(false);
    };
    
    function handleCancel() {
        openPopup(false);
    };

    return(
        <>
            <Modal
                title="Delete query"
                isOpen={isOpen}
                onCancel={handleCancel}
                onSubmit={handleSubmit}
                cancelButton={true}
                cancelTitle="No"
                submitTitle="Yes"
                noCross={true}
            >
                <div>
                    <strong>Are you sure?</strong>
                </div>
            </Modal>
            <div id="table_menu" onClick={() => {setOpen(!open)}} ref={wrapperRef}>
                {props.icon}
                {open && (
                    <div className="dropdown" id="dropdown">
                        <div className="menu">
                            <div className="menu-item" onClick={() => openTable(props.table.alias)}>
                                Open
                            </div>
                            <div className="menu-item" onClick={() => editTable(props.table)}>
                                Edit
                            </div>
                            <div className="menu-item" onClick={() => openModal(props.table.alias)}>
                                Delete
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

export default MiniMenu;