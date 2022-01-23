import React from 'react';
import './TableModal.scss';
import cross_icon from "../../../../icons/pop-up-cross.svg";
import {authVerifyToken} from "../../../../methods";

export default class TableRowPopup extends React.Component {
    constructor(props) {
        super(props);
        const {
            onCancel,
            onUpdate,
            onDelete,
            tableInfo,
            tableName } = this.props;

        this.state = {
            onCancel,
            onUpdate,
            onDelete,
            tableName,
            oldRowColumns: JSON.parse(JSON.stringify(tableInfo)),
            rowColumns: tableInfo
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

                        <img className='table-row-popup-cross' src={cross_icon} onClick={this.state.onCancel} alt={'cross'}/>

                        <div className='table-row-popup-title'>
                            <span>{this.state.tableName}</span>
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
                                {this.state.rowColumns.map(columnName => {
                                    return (
                                        <div className='table-row-popup-body-row'>
                                            <div className='body-row-name'>
                                                <input className='body-row-text' value={columnName[0]}/>
                                            </div>

                                            <div className='body-row-info'>
                                                <input className='body-row-text' value={columnName[1]} onChange={(e) => {
                                                    this.handleColumnChange(e, columnName[0], this.state.rowColumns);
                                                }}/>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                        </div>

                        <div className='table-row-popup-buttons'>
                            { updateAccess &&
                                <div className='table-row-popup-btn update'>
                                    <button onClick={() => this.state.onUpdate(this.state.rowColumns)}>Update</button>
                                </div>
                            }

                            { deleteAccess &&
                                <div className='table-row-popup-btn delete'>
                                    <button onClick={() => this.state.onDelete(this.state.rowColumns)}>Delete</button>
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