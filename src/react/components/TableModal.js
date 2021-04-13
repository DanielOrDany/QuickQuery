import React from 'react';

import '../styles/TableModal.scss';
import delete_icon from "../icons/delete_icon.png";
import PropTypes from "prop-types";



const TableModal = ({isOpen, tableInfo, onCancel}) => {

    return (

        <div className={isOpen ? "tableModal-active" : "no-active"}>
            <div className={'table-popup'}>

                <div className={'cross-popup'} onClick={onCancel}><img src={delete_icon} alt={'cross'}/></div>

                <div className={'row-info'}>
                    {tableInfo.map(tableName => {
                            if (String(tableName[1]).indexOf(".png") > -1) {
                                return (
                                <div className={'table-rows'}>
                                    <div className={'table-name'}><input value={tableName[0]}/></div>
                                    <div className={'table-infos'}><img src={tableName[1]} className={'table-info-img'} alt={'img'}/></div>
                                </div>
                                )
                            } else {
                                return (
                                    <div className={'table-rows'}>
                                        <div className={'table-name'}><input value={tableName[0]}/></div>
                                        <div className={'table-infos'}><input value={tableName[1]}/></div>
                                    </div>
                                )
                            }
                        }
                    )}
                </div>


            </div>


        </div>
    );
};



TableModal.propTypes = {
    isOpen: PropTypes.bool,
    onCancel: PropTypes.func,
};

TableModal.defaultProps = {
    isOpen: false,
    onCancel: () => {},
};


export default TableModal;