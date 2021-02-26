import React from 'react';
import {
    addTable,
    testTableQuery,
    updateTableQuery,
    getTableColumns
} from "../methods";
import '../styles/CreateTable.scss';
import xxx from "../icons/Gear-0.2s-200px (1).svg";
import addIcon from "../icons/add-icon.svg";
import linkIcon from "../icons/link-icon.svg";
import removeIcon from "../icons/remove.svg";

export default class CreateTable extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            badQuery: 0,
            errorMessage: "",
            isLoading: false,
            tables: ['select table'],
            columns: ['select column'],
            options: [],
        };
    }

    async componentDidMount() {
        console.log(JSON.parse(localStorage.getItem("current_connection")));
        const currentConnection = JSON.parse(localStorage.getItem("current_connection"));

        if (currentConnection) {
            let newOptions = [];

            for (const query in currentConnection.queries) {
                const queryData = currentConnection.queries[query];
                const columns = await getTableColumns(currentConnection.name, queryData.table);

                newOptions.push({
                    ...queryData,
                    columns: columns
                });
            }

            this.setState({
                options: newOptions
            })
        }

        if (localStorage.getItem("current_result_info")) {
            localStorage.setItem("current_result", window.location.href.split('/')[window.location.href.split('/').length - 1]);
            this.renderFields();
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { errorMessage } = this.state;

        if (window.location.href.split('/')[window.location.href.split('/').length - 2] == "edit-table" && window.location.href.split('/')[window.location.href.split('/').length - 1] != localStorage.getItem("current_result")) {
            localStorage.setItem("current_result", window.location.href.split('/')[window.location.href.split('/').length - 1]);
            this.renderFields();
        }

        if (errorMessage !== "") {
            setTimeout(() => {
                this.setState({errorMessage: ""});
            }, 3500);
        }
    }

    renderFields() {
        let result = JSON.parse(localStorage.getItem("current_result_info"));
        let name = document.getElementById("aliasText");
        let query = document.getElementById("queryText");
        name.value = result.alias;
        name.disabled = true;
        query.value = result.query;
    }

    save() {
        function inputVerify(args) {
            return args.replace(/^\s+|\s+$/gm, '').length;
        }

        this.setState({
            isLoading: true
        });

        const { tables, columns } = this.state;

        if (tables.length < 1 && columns.length < 1) {
            this.setState({
                badQuery: 1,
                errorMessage: "Query is not valid.",
                isLoading: false
            });
        } else {
            const connectionName = JSON.parse(localStorage.getItem('current_connection')).name;
            const alias = document.getElementById("aliasText").value;
            let query = "";

            tables.forEach((table, index) => {
                if (index === 0) {
                    query += `SELECT * FROM ${table} JOIN ${tables[index + 1]} ON ${table}.${columns[index]} = ${tables[index + 1]}.${columns[index + 1]}`;
                } else if (index < tables.length - 1) {
                    query += ` JOIN ${tables[index + 1]} ON ${table}.${columns[index]} = ${tables[index + 1]}.${columns[index + 1]}`;
                }
            });

            if(localStorage.getItem("current_result_info")) {
                testTableQuery(connectionName, query).then(data => {
                    if (data) {
                        updateTableQuery(connectionName, alias, query).then((tables) => {
                            localStorage.setItem("need_update", JSON.stringify(true));
                            window.location.hash = "#/tables";
                        });
                    } else {
                        this.setState({
                            badQuery: 1,
                            errorMessage: "Query is not valid.",
                            isLoading: false
                        });
                    }
                });
            } else if (
                inputVerify(alias) > 0
            ) {
                if (alias.indexOf(' ') !== -1) {
                    this.setState({
                        badQuery: 1,
                        errorMessage: "Please, remove any spaces in alias.",
                        isLoading: false
                    });
                } else {
                    testTableQuery(connectionName, query).then(data => {
                        if (data) {
                            addTable(connectionName, query, "new", alias).then(() => {
                                localStorage.setItem("new_table", JSON.stringify(true));
                                window.location.hash = "#tables";
                            });
                        } else {
                            this.setState({
                                badQuery: 1,
                                errorMessage: "Query is not valid.",
                                isLoading: false
                            });
                        }
                    });
                }
            } else {
                this.setState({
                    badQuery: 1,
                    errorMessage: "Please, fill in all the fields.",
                    isLoading: false
                });
            }
        }
    }

    run() {
        const { tables, columns } = this.state;

        if (tables.length < 1 && columns.length < 1) {
            this.setState({
                badQuery: 1,
                errorMessage: "Query is not valid.",
                isLoading: false
            });
        } else {
            const connectionName = JSON.parse(localStorage.getItem('current_connection')).name;

            let query = "";

            tables.forEach((table, index) => {
                if (index === 0) {
                    query += `SELECT * FROM ${table} JOIN ${tables[index + 1]} ON ${table}.${columns[index]} = ${tables[index + 1]}.${columns[index + 1]}`;
                } else if (index < tables.length - 1) {
                    query += ` JOIN ${tables[index + 1]} ON ${table}.${columns[index]} = ${tables[index + 1]}.${columns[index + 1]}`;
                }
            });
            console.log(query);

            try {
                testTableQuery(connectionName, query).then(async data => {
                    console.log(data)
                    if (data) {
                        const db_rows = await Promise.all(data.rows);

                        this.setState({
                            headers: db_rows.length !== 0 ? Object.keys(db_rows[0]) : data.fields.map(field => field.name),
                            rows: db_rows.length !== 0 ? Object.values(db_rows) : [],
                            badQuery: 0,
                            errorMessage: "",
                            isLoading: false
                        });
                    } else {
                        this.setState({
                            badQuery: 1,
                            errorMessage: "Query is not valid.",
                            isLoading: false
                        });
                    }
                })
            } catch (e) {
                console.log(e);
            }
        }
    }

    handleTableChange(e, index) {
        let { tables } = this.state;
        tables[index] = e.target.value;
        this.setState({tables});
    }

    handleColumnChange(e, index) {
        let { columns } = this.state;
        columns[index] = e.target.value;
        this.setState({columns});
    }

    addNewTable() {
        let { tables, columns } = this.state;
        const tableIndex = tables.indexOf('select table');
        const columnIndex = tables.indexOf('select column');

        if (tableIndex < 0 && columnIndex < 0) {
            tables.push('select table');
            columns.push('select column');

            this.setState({tables, columns});
        } else {
            this.setState({errorMessage: "Please, select the previous table or table column before adding a new one."});
        }
    }

    removeTable(index) {
        let { tables, columns } = this.state;
        tables.splice(index, 1);
        columns.splice(index, 1);
        this.setState({ tables, columns });
    }

    renderTable(table, index) {
        const { options, tables, columns } = this.state;
        const showLink = index < tables.length && index > 0;
        const tableOption = options.filter(option => option.alias === table);
        const tableColumns = tableOption.length !== 0 ? tableOption[0].columns : [];
        const tableColumn = columns[index];

        return (
            <div className="constructor-table">
                { showLink && <img id="link-icon" src={linkIcon}/> }
                <div className="constructor-table-data">
                    <div className="table-data">
                        <span>{table}</span>
                        <select className="select-table" value="" onChange={(e) => this.handleTableChange(e, index)}>
                            <option value="" selected disabled hidden>Choose here</option>
                            {
                                options.map((option) => <option value={option.table}>{option.alias}</option>)
                            }
                        </select>
                        <img id="remove-icon" onClick={() => {this.removeTable(index)}} src={removeIcon}/>
                    </div>
                    { table !== 'select table' &&
                        <div className="table-column">
                            <span>{tableColumn}</span>
                            <select className="select-table" value="" onChange={(e) => this.handleColumnChange(e, index)}>
                                <option value="" selected disabled hidden>Choose here</option>
                                {
                                    tableColumns && tableColumns.map((column) => {
                                        console.log(column);
                                        return <option value={column.column_name}>{column.column_name}</option>
                                    })
                                }
                            </select>
                        </div>
                    }
                </div>
            </div>
        );
    }

    render() {
        const {badQuery, errorMessage, headers, rows, isLoading, tables } = this.state;

        if (isLoading) {
            return (
                <div className={"loading"}>
                    <img src={xxx}/>
                    Loading...
                </div>
            );
        } else {
            return (
                <div className="create_edit_table">
                    <div id="mini-menu">
                        <div className="actions">
                            <button type="button" className="runButton" onClick={() => this.run()}>
                                <span>Run</span>
                            </button>

                            <div className="saving-result">
                                <input type="text" id="aliasText" placeholder="Query Name" className="form-control"
                                       type="search"/>
                                <button type="button" className="saveButton" onClick={() => this.save()}>
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="query-constructor">
                        {
                            tables && tables.map((table, i) => this.renderTable(table, i))
                        }
                        <div className="add-table" onClick={() => {this.addNewTable()}}>
                            <img src={addIcon}/>
                        </div>
                    </div>


                    { errorMessage &&
                        <div id="errorMessage" className="alert">
                            <strong>Message!</strong> {errorMessage}
                        </div>
                    }


                    {(headers && rows) &&
                        <div id="add-btn-table">
                            <table id="your-new-table">
                                <tr>
                                    {headers ? headers.map((item) => {
                                        return <th>{item}</th>
                                    }) : null}
                                </tr>
                                {rows ? rows.map((item, key) => {
                                    return <tr className={key++ % 2 === 0 ? "column_one" : "column_two"}>{
                                        Object.values(item).map((get_item, key) => {
                                            return <td style={key === 0 ? {
                                                color: "#3E3E3E",
                                                background: "#EFEFEF",
                                                border: "1px solid grey"
                                            } : {color: "#3E3E3E"}}>{get_item}</td>
                                        })}
                                    </tr>
                                }) : null}
                            </table>
                        </div>
                    }
                </div>
            );
        }
    }
}
