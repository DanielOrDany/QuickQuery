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
            isLoading: true,
            tables: ['select table'],
            columns: ['select column'],
            options: [],
        };
    }

    async componentDidMount() {
        const currentConnection = JSON.parse(localStorage.getItem("current_connection"));

        if (currentConnection) {
            let newOptions = [];

            const queries = currentConnection.queries.filter(query => !!query.table);
            for (const query in queries) {
                const queryData = currentConnection.queries[query];
                const columns = await getTableColumns(currentConnection.name, queryData.table);

                newOptions.push({
                    ...queryData,
                    columns: columns
                });
            }

            this.setState({
                options: newOptions,
                isLoading: false
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
        name.value = result.alias;
        name.disabled = true;

        const query = result.query;
        const fromIndex = query.indexOf("JOIN");
        const selectedQueryColumns = query.slice(fromIndex, query.length).split('JOIN');
        let tables = [];
        let columns = [];

        selectedQueryColumns.forEach(selectedQueryColumn => {
            if (selectedQueryColumn.match("ON")) {
                const onQuery = selectedQueryColumn.split('ON');
                const tablesAndColumns = onQuery[1].replace(/ /g, "").split('=');

                tablesAndColumns.forEach(tableAndColumn => {
                    const table = tableAndColumn.split('.')[0];
                    const column = tableAndColumn.split('.')[1];

                    const prevTable = tables[tables.length - 1];

                    if (prevTable) {
                        if (prevTable !== table) {
                            tables.push(table);
                            columns.push(column);
                        }
                    } else {
                        tables.push(table);
                        columns.push(column);
                    }
                });
            }
        });

        this.setState({ tables, columns });
    }

    save() {
        function inputVerify(args) {
            return args.replace(/^\s+|\s+$/gm, '').length;
        }

        this.setState({
            isLoading: true
        });

        const { tables, columns, options } = this.state;

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

            const columnNames = tables.map(table => {
                const tableOption = options.filter(option => option.alias === table);
                const tableColumns = tableOption.length !== 0 ? tableOption[0].columns : [];
                const columnNames = tableColumns.map((column) => column.column_name);
                return columnNames;
            });

            const selectedColumns = columnNames.map((names, index) => {
                return names.map(name => {
                   return `${tables[index]}.${name} AS ${tables[index]}_${name}`
                });
            });

            const mergedColumns = [].concat.apply([], selectedColumns);

            tables.forEach((table, index) => {
                if (index === 0) {
                    query += `SELECT ${mergedColumns.join(',')} FROM ${table} JOIN ${tables[index + 1]} ON ${table}.${columns[index]} = ${tables[index + 1]}.${columns[index + 1]}`;
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
        const { tables, columns, options } = this.state;

        if (tables.length < 1 && columns.length < 1) {
            this.setState({
                badQuery: 1,
                errorMessage: "Query is not valid.",
                isLoading: false
            });
        } else {
            const connectionName = JSON.parse(localStorage.getItem('current_connection')).name;
            let query = "";

            const columnNames = tables.map(table => {
                const tableOption = options.filter(option => option.alias === table);
                const tableColumns = tableOption.length !== 0 ? tableOption[0].columns : [];
                const columnNames = tableColumns.map((column) => column.column_name);
                return columnNames;
            });

            const selectedColumns = columnNames.map((names, index) => {
                return names.map(name => {
                    return `${tables[index]}.${name} AS ${tables[index]}_${name}`
                });
            });

            const mergedColumns = [].concat.apply([], selectedColumns);

            tables.forEach((table, index) => {
                if (index === 0) {
                    query += `SELECT ${mergedColumns.join(',')} FROM ${table} JOIN ${tables[index + 1]} ON ${table}.${columns[index]} = ${tables[index + 1]}.${columns[index + 1]}`;
                } else if (index < tables.length - 1) {
                    query += ` JOIN ${tables[index + 1]} ON ${table}.${columns[index]} = ${tables[index + 1]}.${columns[index + 1]}`;
                }
            });

            try {
                testTableQuery(connectionName, query).then(async data => {
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
            <div className="constructor-table" key={index}>
                { showLink && <img id="link-icon" src={linkIcon}/> }
                <div className="constructor-table-data">
                    <div className="table-data">
                        <span>{table}</span>
                        <select className="select-table" value="" onChange={(e) => this.handleTableChange(e, index)}>
                            <option value="" selected disabled hidden>Choose here</option>
                            {
                               options.map((option, i) => <option key={i} value={option.table}>{option.alias}</option>)
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
                                    tableColumns && tableColumns.map((column, i) => {
                                        return <option key={i} value={column.column_name}>{column.column_name}</option>
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
        const {errorMessage, headers, rows, isLoading, tables } = this.state;

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
