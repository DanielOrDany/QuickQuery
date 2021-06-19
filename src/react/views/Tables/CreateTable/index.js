import React from 'react';

// Styles
import './CreateTable.scss';

// Methods
import {
    addTable,
    testTableQuery,
    updateTableQuery,
    getTableColumns
} from "../../../methods";

// Icons
import xxx from "../../../icons/loop.svg";
import addIcon from "../../../icons/add-icon.svg";
import linkIcon from "../../../icons/link-icon.svg";
import removeIcon from "../../../icons/remove.svg";
import westIcon from "../../../icons/west-arrow.svg";
import eastIcon from "../../../icons/east-arrow.svg";
import deleteIcon from "../../../icons/delete-create-table.svg";
import saveIcon from "../../../icons/save-create-table.svg";
import reloadIcon from "../../../icons/create-table-reload.svg";

const utf8 = require('utf8');
const base64 = require('base-64');
const base64RE = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/g;
const engRE = /^[a-zA-Z]+$/g;

export default class CreateTable extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            options: [],
            tables: ['select table'],
            columns: ['select column'],
            secondColumns: ['select column'],
            errorMessage: "",
            warningMessage: "",
            successMessage: "",
            isLoading: true,
            isTableLoading: false,
            alias: "",
            queryName: ""
        };
    }

    /**
     * Constructor is starting
     */

    async componentDidMount() {
        // Getting query result structure
        const currentResultInfo = localStorage.getItem("current_result_info");

        // Getting connection data
        const currentConnection = JSON.parse(localStorage.getItem("current_connection"));

        // loading names of tables for future selecting
        await this.loadTableNames(currentConnection);

        // verify this data on existing
        if (currentResultInfo) {

            // set 'current_result' as name of query in main top menu
            localStorage.setItem("current_result",
                window.location.href.split('/')[window.location.href.split('/').length - 1]
            );

            // parsing and rendering existing query
            await this.renderFields();

        }
    }

    /**
     * Constructor is updating
     */

    async componentDidUpdate(prevProps, prevState, snapshot) {
        const { errorMessage, warningMessage, successMessage } = this.state;

        if ( // verify if constructor is in editing mode
            window.location.href.split('/')[window.location.href.split('/').length - 2] === "edit-table" &&
            window.location.href.split('/')[window.location.href.split('/').length - 1] !== localStorage.getItem("current_result")
        ) {
            // set 'current_result' as name of query in main top menu
            localStorage.setItem("current_result",
                window.location.href.split('/')[window.location.href.split('/').length - 1]);

            // parsing and rendering existing query
            await this.renderFields();
        }

        if ( // verify on error (if error exist)
            errorMessage !== ""
        ) {
            setTimeout(() => {
                this.setState({
                    errorMessage: ""
                });
            }, 3500); // show error message only 3,5 seconds
        }

        if ( // verify on success
            successMessage !== ""
        ) {
            setTimeout(() => {
                this.setState({
                    successMessage: ""
                });
            }, 3500); // show message message only 3,5 seconds
        }

        if ( // verify on warning
            warningMessage !== ""
        ) {
            setTimeout(() => {
                this.setState({
                    warningMessage: ""
                });
            }, 3500); // show warning message only 3,5 seconds
        }
    }

    reload () {
        const connection = JSON.parse(localStorage.getItem("current_connection"));
        let optionsOfTables = [];

        const nativeNamesOfTables = connection.native_tables;
        const userQueries = connection.queries.filter(query => !!query.table);

        for (const nativeName in nativeNamesOfTables) {

            const updatedQueriesOfNativeTables = userQueries.filter(query => query.table === nativeNamesOfTables[nativeName]);

            if (updatedQueriesOfNativeTables.length > 0) {
                const queryData = updatedQueriesOfNativeTables[0];

                optionsOfTables.push({
                    ...queryData,
                    columns: []
                });
            } else {
                const queryData = {
                    query: ` SELECT * FROM ${nativeNamesOfTables[nativeName]}`,
                    type: 'default_query',
                    alias: nativeNamesOfTables[nativeName],
                    table: nativeNamesOfTables[nativeName]
                };

                optionsOfTables.push({
                    ...queryData,
                    columns: []
                });
            }
        }

        localStorage.setItem("current_result_options", JSON.stringify({
            connectionName: connection.name,
            options: optionsOfTables
        }));

        this.setState({
            options: optionsOfTables,
            isLoading: false
        });

    }

    /** loadTableNames */
    /* Method for loading names of tables */

    async loadTableNames(connection) {

        let optionsOfTables = [];

        if (!localStorage.getItem("current_result_options") ||
            JSON.parse(localStorage.getItem("current_result_options")).connectionName !== connection.name) {

            const nativeNamesOfTables = connection.native_tables;
            const userQueries = connection.queries.filter(query => !!query.table);

            for (const nativeName in nativeNamesOfTables) {

                const updatedQueriesOfNativeTables = userQueries.filter(query => query.table === nativeNamesOfTables[nativeName]);

                if (updatedQueriesOfNativeTables.length > 0) {
                    const queryData = updatedQueriesOfNativeTables[0];

                    optionsOfTables.push({
                        ...queryData,
                        columns: []
                    });
                } else {
                    const queryData = {
                        query: ` SELECT * FROM ${nativeNamesOfTables[nativeName]}`,
                        type: 'default_query',
                        alias: nativeNamesOfTables[nativeName],
                        table: nativeNamesOfTables[nativeName]
                    };

                    optionsOfTables.push({
                        ...queryData,
                        columns: []
                    });
                }
            }

            localStorage.setItem("current_result_options", JSON.stringify({
                connectionName: connection.name,
                options: optionsOfTables
            }));

            this.setState({
                options: optionsOfTables,
                isLoading: false
            });

        } else {
            optionsOfTables = JSON.parse(localStorage.getItem("current_result_options")).options;

            this.setState({
                options: optionsOfTables,
                isLoading: false
            });
        }
    }

    addNewTable() {
        let {
            tables,
            columns,
            secondColumns
        } = this.state;

        const tableIndex = tables.indexOf('select table');
        const columnIndex = columns.indexOf('select column');

        if (tableIndex < 0 && columnIndex < 0) {
            tables.push('select table');
            columns.push('select column');
            secondColumns.push('select column');

            this.setState({
                tables,
                columns,
                secondColumns
            });

        } else {

            this.setState({
                errorMessage: "Please, select the previous table or table column before adding a new one."
            });
        }
    }

    removeTable(index) {
        let { tables, columns, secondColumns } = this.state;
        tables.splice(index, 1);
        columns.splice(index, 1);
        secondColumns.splice(index, 1);
        this.setState({ tables, columns, secondColumns });
    }

    async handleTableChange(e, index) {
        const tableName = e.target.value;

        // Getting connection data
        const connection = JSON.parse(localStorage.getItem("current_connection"));

        let { tables, options } = this.state;

        for (const i in options) {
            const queryData = options[i];

            if (queryData.table === tableName) {
                options[i].columns = await getTableColumns(connection.name, queryData.table);
            }
        }

        tables[index] = tableName;

        this.setState({ options, tables, isTableLoading: false });
    }

    handleColumnChange(e, index) {
        let { columns } = this.state;
        columns[index] = e.target.value;
        this.setState({columns});
    }

    handleSecondColumnChange(e, index) {
        let { secondColumns } = this.state;
        secondColumns[index] = e.target.value;
        this.setState({secondColumns});
    }

    handleQueryNameChange(e) {
        this.setState({queryName: e.target.value});
    }

    async renderFields() {
        this.setState({ isLoading: true });

        // default options of tables
        let tables = [];
        let columns = [];
        let secondColumns = [];

        // getting query info
        let result = JSON.parse(localStorage.getItem("current_result_info"));

        if (result) {
            const query = result.query;
            const joinIndex = query.indexOf("JOIN");

            if (joinIndex >= 0) {
                const selectedQueryColumns = query.slice(joinIndex, query.length).split('JOIN');

                selectedQueryColumns.forEach((selectedQueryColumn, index) => {
                    if (selectedQueryColumn.match("ON")) {
                        const onQuery = selectedQueryColumn.split('ON');
                        const tablesAndColumns = onQuery[1].replace(/ /g, "").split('=');

                        tablesAndColumns.forEach((tableAndColumn, tAndCIndex) => {
                            const table = tableAndColumn.split('.')[0];
                            const column = tableAndColumn.split('.')[1];
                            //console.log("table", table);

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

                            if (index > 0) {
                                if (tAndCIndex === 0) {
                                    secondColumns.push(column);
                                }
                            } else {
                                secondColumns.push("select column");
                            }
                        });
                    }
                });
            } else {
                const fromIndex = query.indexOf("FROM");
                const selectedQueryColumns = query.slice(fromIndex, query.length).split('FROM');
                const table = selectedQueryColumns[1].replace(/ /g, "");

                tables.push(table);
                columns.push("select column");
                secondColumns.push("select column");
            }


            let { options } = this.state;

            const connection = JSON.parse(localStorage.getItem("current_connection"));

            // Adding columns for tables
            for (const t in tables) {
                for (const o in options) {
                    const queryData = options[o];

                    if (queryData.table === tables[t]) {
                        options[o].columns = await getTableColumns(connection.name, queryData.table);
                    }
                }
            }

            this.setState({
                tables,
                columns,
                secondColumns,
                alias: (result && result.alias) ? result.alias : "",
                queryName: result.alias.match(engRE) ? result.alias : (result.alias.match(base64RE) ? utf8.decode(base64.decode(result.alias)) : result.alias),
                isLoading: false
            });
        }
    }

    save() {
        function inputVerify(args) {
            return args.replace(/^\s+|\s+$/gm, '').length;
        }

        this.setState({
            isLoading: true
        });

        const { tables, columns, options, secondColumns, alias, queryName } = this.state;

        if (tables.length < 1 && columns.length < 1) {
            this.setState({
                errorMessage: "Table is not valid.",
                isLoading: false
            });
        } else {
            let newQuery = "";
            const connectionName = JSON.parse(localStorage.getItem('current_connection')).name;

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

            if (tables.length === 1) {
                newQuery += `SELECT ${mergedColumns.join(',')} FROM ${tables[0]}`;
            } else {

                tables.forEach((table, index) => {
                    if (index === 0) {
                        newQuery += `SELECT ${mergedColumns.join(',')} FROM ${table} JOIN ${tables[index + 1]} ON ${table}.${columns[index]} = ${tables[index + 1]}.${columns[index + 1]}`;
                    } else if (index < tables.length - 1) {
                        newQuery += ` JOIN ${tables[index + 1]} ON ${table}.${secondColumns[index]} = ${tables[index + 1]}.${(tables.length - 1) !== index ? columns[index + 1]: secondColumns[index + 1]}`;
                    }
                });
            }

            if(localStorage.getItem("current_result_info")) {
                testTableQuery(connectionName, newQuery).then(data => {
                    if (data) {
                        updateTableQuery(connectionName, alias, newQuery, queryName).then((tables) => {
                            localStorage.setItem("need_update", JSON.stringify(true));
                            window.location.hash = "#/tables";
                        });
                    } else {
                        this.setState({
                            errorMessage: "Table is not valid.",
                            isLoading: false
                        });
                    }
                });
            } else if (
                inputVerify(queryName) > 0
            ) {
                if (queryName.indexOf(' ') !== -1) {
                    this.setState({
                        errorMessage: "Please, remove any spaces in alias.",
                        isLoading: false
                    });
                } else {
                    testTableQuery(connectionName, newQuery).then(data => {
                        if (data) {
                            addTable(connectionName, newQuery, "new", queryName).then(() => {
                                localStorage.setItem("new_table", JSON.stringify(true));
                                window.location.hash = "#tables";
                            });
                        } else {
                            this.setState({
                                errorMessage: "Table is not valid.",
                                isLoading: false
                            });
                        }
                    });
                }
            } else {
                this.setState({
                    errorMessage: "Please, fill in all the fields.",
                    isLoading: false
                });
            }
        }
    }

    run() {
        const { tables, columns, options, secondColumns } = this.state;

        if (tables.length < 1 && columns.length < 1) {
            this.setState({
                errorMessage: "Table is not valid.",
                isLoading: false
            });
        } else {
            let query = "";

            const connectionName = JSON.parse(localStorage.getItem('current_connection')).name;

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

            if (tables.length === 1) {
                query += `SELECT ${mergedColumns.join(',')} FROM ${tables[0]}`;
            } else {
                tables.forEach((table, index) => {
                    if (index === 0) {
                        query += `SELECT ${mergedColumns.join(',')} FROM ${table} JOIN ${tables[index + 1]} ON ${table}.${columns[index]} = ${tables[index + 1]}.${columns[index + 1]}`;
                    } else if (index < tables.length - 1) {
                        query += ` JOIN ${tables[index + 1]} ON ${table}.${secondColumns[index]} = ${tables[index + 1]}.${(tables.length - 1) !== index ? columns[index + 1]: secondColumns[index + 1]}`;
                    }
                });
            }

            try {
                testTableQuery(connectionName, query).then(async data => {
                    if (data) {
                        const db_rows = await Promise.all(data.rows);

                        this.setState({
                            headers: db_rows.length !== 0 ? Object.keys(db_rows[0]) : data.fields.map(field => field.name),
                            rows: db_rows.length !== 0 ? Object.values(db_rows) : [],
                            errorMessage: "",
                            successMessage: db_rows.length !== 0 ? "result is successful" : "",
                            warningMessage: db_rows.length === 0 ? "result has 0 rows" : "",
                            isLoading: false
                        });
                    } else {
                        this.setState({
                            errorMessage: "Table is not valid.",
                            isLoading: false
                        });
                    }
                })
            } catch (e) {
                console.log(e);
            }
        }
    }

    renderTable(table, index) {
        const { options, tables, columns, secondColumns, isTableLoading } = this.state;
        const showLink = index < tables.length && index > 0;
        const tableOption = options.filter(option => option.alias === table);
        const tableColumns = tableOption.length !== 0 ? tableOption[0].columns : [];
        const tableSecondColumns = tableOption.length !== 0 ? tableOption[0].columns : [];
        const tableColumn = columns[index];
        const tableSecondColumn = secondColumns[index];
        const isLastTable = tables.length === index + 1;

        return (
            <div className="constructor-table" key={index}>
                { showLink && <img id="link-icon" src={linkIcon}/> }
                <div className="constructor-table-data">
                    <div className="table-data">
                        <span><b>Table:</b> {table === "select table" ? <span style={{color: "#f4cb4c"}}>select table</span> : <span>{table}</span>}</span>
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
                        <div className="column-name">
                            { ( index !== 0 && (tables.length - 1) !== index )  &&
                            <img className="column-arrows" src={westIcon}/>
                            }

                            <span><b>Column:</b> {tableColumn === "select column" ? <span style={{color: "#f4cb4c"}}>select column</span> : <span>{tableColumn}</span>}</span>

                            <select className="select-column" value="" onChange={(e) => this.handleColumnChange(e, index)}>
                                <option value="" selected disabled hidden>Choose here</option>
                                {
                                    tableColumns && tableColumns.map((column, i) => {
                                        return <option key={i} value={column.column_name}>{column.column_name}</option>
                                    })
                                }
                            </select>
                        </div>

                        { ( index !== 0 && (tables.length - 1) !== index )  &&
                        <div className="column-name">
                            <img className="column-arrows" src={eastIcon}/>
                            <span><b>Column:</b> {tableSecondColumn === "select column" ? <span style={{color: "#f4cb4c"}}>select column</span> : <span>{tableSecondColumn}</span>}</span>
                            <select className="select-column" value="" onChange={(e) => this.handleSecondColumnChange(e, index)}>
                                <option value="" selected disabled hidden>Choose here</option>
                                {
                                    tableSecondColumns && tableSecondColumns.map((column, i) => {
                                        return <option key={i} value={column.column_name}>{column.column_name}</option>
                                    })
                                }
                            </select>
                        </div>
                        }
                    </div>
                    }
                </div>
            </div>
        );
    }

    render() {
        const {errorMessage, successMessage, warningMessage, headers, rows, isLoading, tables, queryName } = this.state;

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

                        <input type="text" id="aliasText" placeholder="Table Name" value={queryName}
                               className="create-table-name-input" onChange={(e) => this.handleQueryNameChange(e)}/>


                        <button type="button" className="save-button" onClick={() => this.save()}>
                            Save
                        </button>







                        {/*
                        <div className="options-buttons">
                            <button type="button" className="runButton">
                                <span>Reload Database</span>
                            </button>

                        </div>

                        <div className="saving-result">
                        <button type="button" className="runButton">
                            <span>Test</span>
                        </button>


                        </div>
                        */}


                    </div>


                    <div className='create-edit-table-body'>

                        <div className="query-constructor">
                            {
                                tables && tables.map((table, i) => this.renderTable(table, i))
                            }
                            <div className="add-table" onClick={() => {
                                this.addNewTable()
                            }}>
                                <img src={addIcon}/>
                            </div>
                        </div>


                        {errorMessage &&
                        <div id="errorMessage" className="alert">
                            <strong>Message!</strong> {errorMessage}
                        </div>
                        }


                        {successMessage &&
                        <div id="successMessage" className="alert">
                            <strong>Success!</strong> {successMessage}
                        </div>
                        }

                        {warningMessage &&
                        <div id="warningMessage" className="alert">
                            <strong>Warning!</strong> {warningMessage}
                        </div>
                        }

                    </div>

                    <div className='create-edit-table-footer'>
                        <img className='create-edit-table-footer-delete' src={deleteIcon} alt='delete icon'/>
                        <img className="create-edit-table-footer-reload" src={reloadIcon} alt='reload icon' onClick={() => this.reload()}/>
                        <img className="create-edit-table-footer-save" src={saveIcon} alt='save icon' onClick={() => this.run()}/>
                    </div>


                </div>
            );
        }
    }
}