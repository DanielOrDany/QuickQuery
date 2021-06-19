import React from 'react';
import './index.scss';

const HiddenColumnsPopup = ({
    isOpen,
    showAll,
    columns,
    hide,
    unhide,
    selectedColumns,
    done
}) => {
    const filteredColumns = columns.filter(function(x) {
        return selectedColumns.indexOf(x) < 0;
    });

    console.log(filteredColumns);

    return (
        <>
            { isOpen &&
                <div className="hidden-columns-popup">
                    <div className="hidden-columns">
                        { selectedColumns && selectedColumns.map(column => (
                            <div className="hidden-column">
                                <input className="column-checkbox" onChange={(() => unhide(column))} type="checkbox" id={column} checked={true}/>
                                <label className="column-label" htmlFor={column}>{column}</label>
                            </div>
                        ))}
                        { filteredColumns && filteredColumns.map(column => (
                            <div className="hidden-column">
                                <input className="column-checkbox" onChange={(() => hide(column))} type="checkbox" id={column} checked={false}/>
                                <label className="column-label" htmlFor={column}>{column}</label>
                            </div>
                        ))}
                    </div>
                    <div className="columns-footer">
                        <div id="show-all-hidden-columns-btn" onClick={() => showAll()}>
                            Show all
                        </div>
                        <div id="done-hidden-column-btn" onClick={() => done()}>
                            Done
                        </div>
                    </div>
                </div>
            }
        </>
    )
};

export default HiddenColumnsPopup;