import React from 'react';
import './TableModal.scss';
import cross_icon from "../../../../icons/pop-up-cross.svg";
import {authVerifyToken} from "../../../../methods";
import toast from "react-hot-toast";

export default class TableRowPopup extends React.Component {
    constructor(props) {
        super(props);
        const {
            onCancel,
            onUpdate,
            onDelete,
            tableRows,
            tableName } = this.props;

        this.state = {
            onCancel,
            onUpdate,
            onDelete,
            tableName,
            tableType: JSON.parse(localStorage.getItem('current_result_info')).type,
            oldRowColumns: JSON.parse(JSON.stringify(tableRows)),
            rowColumns: tableRows
        };

        this.handleColumnChange = this.handleColumnChange.bind(this);
    }

    async componentDidMount() {
        const id = localStorage.getItem("employeeId");
        const token = localStorage.getItem("employeeToken");

        if (id && token) {
            const verified = await authVerifyToken(id, token);

            if (verified && verified.data) {
                localStorage.setItem("deleteAccess", verified.data.employee.dataValues.delete_access);
                localStorage.setItem("updateAccess", verified.data.employee.dataValues.update_access);
            }
        }
    }

    handleColumnChange(e, column, columns) {
        const newValue = e.target.value;
        const cIndex = columns.findIndex((c) => c[0] === column);
        const tableColumn = this.state.oldRowColumns.find((c) => c[0] === column);
        columns[cIndex][1] = newValue;
        columns[cIndex][2] = tableColumn[1];
        this.setState({
            rowColumns: columns
        })
    }

    render() {
        const deleteAccess = 'true' == localStorage.getItem("deleteAccess");
        const updateAccess = 'true' == localStorage.getItem("updateAccess");

        return (
            <>
                <div className='table-row-popup-BG'>

                    <div className='table-row-popup-window'>
                        <div className='table-row-popup-title'>
                            <div>✏️ Edit Row️</div>
                            <img className='table-row-popup-cross' src={cross_icon} onClick={this.state.onCancel} alt={'cross'}/>
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

                            <div className='table-row-popup-body-rows'>
                                { this.state.rowColumns.map(columnName => {

                                    let renderItem;

                                    if (typeof columnName[1] === 'object') {

                                        if (columnName[1] === null) {
                                            renderItem = "";
                                        } else {
                                            renderItem = JSON.stringify(columnName[1]);
                                        }

                                    } else {
                                        renderItem = columnName[1];
                                    }

                                    return (
                                        <div className='table-row-popup-body-row'>
                                            <div className='body-row-name'>
                                                <input className='body-row-text' value={columnName[0]}/>
                                            </div>

                                            <div className='body-row-info'>
                                                <input className='body-row-text' value={renderItem} onChange={(e) => {
                                                    this.handleColumnChange(e, columnName[0], this.state.rowColumns);
                                                }}/>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                        </div>

                        <div className='table-row-popup-buttons'>
                            { updateAccess && this.state.tableType !== 'new' &&
                                <div className='table-row-popup-btn update'>
                                    <button disabled={this.state.tableType === 'new'} onClick={() => toast.promise(this.state.onUpdate(this.state.rowColumns), {
                                        loading: '⏳ Saving...',
                                        success: <b>👏 Table updated!</b>,
                                        error: <b>❌ Could not save.</b>,
                                    })}>Update</button>
                                </div>
                            }

                            { deleteAccess && this.state.tableType !== 'new' &&
                                <div className='table-row-popup-btn delete'>
                                    <button disabled={this.state.tableType === 'new'} onClick={() => toast.promise(this.state.onDelete(this.state.rowColumns), {
                                        loading: '⏳ Deleting...',
                                        success: <b>👏 Table updated!</b>,
                                        error: <b>❌ Could not delete.</b>,
                                    })}>Delete</button>
                                </div>
                            }

                            <div className='table-row-popup-btn cancel'>
                                <button onClick={this.state.onCancel}>Cancel</button>
                            </div>
                        </div>

                    </div>
                </div>
            </>
        )
    }
}