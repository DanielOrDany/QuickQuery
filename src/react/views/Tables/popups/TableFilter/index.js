import React from 'react';
import './index.scss';

const TableFilter = ({
    isOpen,
    children
}) => {
    return (
        <>
            { isOpen &&
                <div className="table-filter-popup">
                    {children}
                </div>
            }
        </>
    )
};

export default TableFilter;