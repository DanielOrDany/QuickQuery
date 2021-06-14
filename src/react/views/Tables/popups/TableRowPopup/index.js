import React from 'react';
import './TableModal.scss';
import cross_icon from "../../../../icons/pop-up-cross.svg";


const TableRowPopup = ({
                           isOpen,
                           onCancel,
                           tableInfo

                       }) => {
    return (
        <>
            {isOpen &&
            <div className='table-row-popup-BG'>

                <div className='table-row-popup-window'>

                    <img className='table-row-popup-cross' src={cross_icon} onClick={onCancel} alt={'cross'}/>

                    <div className='table-row-popup-title'>
                        <span>todos</span>
                    </div>

                    <div className='table-row-popup-body'>

                        <div className='table-row-popup-body-header'>
                            <div className='body-header-column-name'>
                                <span className='body-header-text'>name</span>
                            </div>

                            <div className='body-header-column-info'>
                                <span className='body-header-text'>description</span>
                            </div>
                        </div>

                        {tableInfo.map(columnName => {
                            return (
                                <div className='table-row-popup-body-row'>
                                    <div className='body-row-name'>
                                        <input className='body-row-text' value={columnName[0]}/>
                                    </div>

                                    <div className='body-row-info'>
                                        <input className='body-row-text' value={columnName[1]}/>
                                    </div>
                                </div>
                            )
                        })}

                    </div>


                    <div className='table-row-popup-btn'>
                        <button onClick={onCancel}>Cancel</button>
                    </div>

                </div>

            </div>
            }
        </>
    )

}


export default TableRowPopup;



{/*<div className={'row-info'}>
    {tableInfo.map(tableName => {
            return (
                <div className={'table-rows'}>
                    <div className={'table-name'}><input value={tableName[0]}/></div>
                    <div className={'table-infos'}><input value={tableName[1]}/></div>
                </div>
            )

        }
    )}
</div>*/}