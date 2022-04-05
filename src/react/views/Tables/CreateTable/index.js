import React from 'react';
import LineTo from 'react-lineto';
import Arrow, { DIRECTION } from 'react-arrows';

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
import MessagePopup from "../../../popups/MessagePopup";
import mixpanel from "mixpanel-browser";

const utf8 = require('utf8');
const base64 = require('base-64');
const base64RE = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/g;
const engRE = /^[a-zA-Z]+$/g;
//const colors = ["#5da45e", "#5b68a3", "#5da48c", "#735da3", "#a4745d", "#a45c7f", "#985da3"];
const colors = Array.from(Array(50).keys()).map((e, i) => getUniqueColor(i + 1 + Math.floor(Math.random() * 11) + 1 + Math.floor(Math.random() * 8)));

function getUniqueColor(n) {
    const rgb = [0, 0, 0];

    for (let i = 0; i < 24; i++) {
        rgb[i%3] <<= 1;
        rgb[i%3] |= n & 0x01;
        n >>= 1;
    }

    return '#' + rgb.reduce((a, c) => (c > 0x0f ? c.toString(16) : '0' + c.toString(16)) + a, '')
}

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
            isQueryTableLoading: false,
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
    }

    closeError = () => {
        this.setState({
            errorMessage: ""
        });
    };

    closeSuccess = () => {
        this.setState({
            successMessage: ""
        });
    };

    closeWarning = () => {
        this.setState({
            warningMessage: ""
        });
    };

    reload () {
        const employeeId = localStorage.getItem("employeeId");
        mixpanel.track('Reload tables', { employeeId: employeeId});

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

        const employeeId = localStorage.getItem("employeeId");
        mixpanel.track('Add new table in constructor', { employeeId: employeeId});

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

    async removeTable(index) {
        const employeeId = localStorage.getItem("employeeId");
        mixpanel.track('Remove table in constructor', { employeeId: employeeId});

        let { tables, columns, secondColumns } = this.state;
        tables.splice(index, 1);
        columns.splice(index, 1);
        secondColumns.splice(index, 1);

        this.setState({ tables, columns, secondColumns });
    }

    removeAllJoins() {
        let { tables, columns, secondColumns } = this.state;
        this.setState({ tables: [], columns: [], secondColumns: [] });
    }

    async handleTableChange(e, index) {
        const employeeId = localStorage.getItem("employeeId");
        mixpanel.track('Select table column in constructor', { employeeId: employeeId});

        const tableName = e.target.value;

        // Getting connection data
        const connection = JSON.parse(localStorage.getItem("current_connection"));

        let { tables, options } = this.state;

        for (const i in options) {
            const queryData = options[i];

            if (queryData.table === tableName) {
                this.setState({ isQueryTableLoading: true });

                options[i].columns = await getTableColumns(connection.name, queryData.table);
            }
        }

        tables[index] = tableName;

        this.setState({ options, tables, isTableLoading: false, isQueryTableLoading: false });
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
                errorMessage: "The result of the query is not valid! Please check your chosen columns to see if any of them work together by type. For example, in the first table with column name \"user_id\" you should select a second column name like \"employee_id\" into another table. So, please do not do something like join table 1 with table 2 by \"user_id\" and \"company_name\" - they are different logic types of data.",
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
                        newQuery += `SELECT ${mergedColumns.join(',')} FROM ${table} JOIN ${tables[index + 1]} ON ${table}.${columns[index]}::text = ${tables[index + 1]}.${columns[index + 1]}::text`;
                    } else if (index < tables.length - 1) {
                        newQuery += ` JOIN ${tables[index + 1]} ON ${table}.${secondColumns[index]}::text = ${tables[index + 1]}.${(tables.length - 1) !== index ? columns[index + 1]: secondColumns[index + 1]}::text`;
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

                        const employeeId = localStorage.getItem("employeeId");
                        mixpanel.track('Update existing table in constructor', { employeeId: employeeId});
                    } else {
                        this.setState({
                            errorMessage: "The result of the query is not valid! Please check your chosen columns to see if any of them work together by type. For example, in the first table with column name \"user_id\" you should select a second column name like \"employee_id\" into another table. So, please do not do something like join table 1 with table 2 by \"user_id\" and \"company_name\" - they are different logic types of data.",
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
                            const employeeId = localStorage.getItem("employeeId");
                            mixpanel.track('Create new table', { employeeId: employeeId});

                            addTable(connectionName, newQuery, "new", queryName).then(() => {
                                localStorage.setItem("new_table", JSON.stringify(true));
                                window.location.hash = "#tables";
                            });
                        } else {
                            this.setState({
                                errorMessage: "The result of the query is not valid! Please check your chosen columns to see if any of them work together by type. For example, in the first table with column name \"user_id\" you should select a second column name like \"employee_id\" into another table. So, please do not do something like join table 1 with table 2 by \"user_id\" and \"company_name\" - they are different logic types of data.",
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
        const employeeId = localStorage.getItem("employeeId");
        mixpanel.track('Test-run table in constructor', { employeeId: employeeId});
        
        if (tables.length < 1 && columns.length < 1) {
            this.setState({
                errorMessage: "The result of the query is not valid! Please check your chosen columns to see if any of them work together by type. For example, in the first table with column name \"user_id\" you should select a second column name like \"employee_id\" into another table. So, please do not do something like join table 1 with table 2 by \"user_id\" and \"company_name\" - they are different logic types of data.",
                isLoading: false
            });
        } else {
            let query = "";

            const connection = JSON.parse(localStorage.getItem('current_connection'));
            const connectionName = connection.name;

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

            if (connection.dtype === "firestore") {
                if (tables.length !== 1) {
                    tables.forEach((table, index) => {
                        if (index === 0) {
                            query += `${table}.${columns[index]}=${tables[index + 1]}.${columns[index + 1]}`;
                        } else if (index < tables.length - 1) {
                            query += `#${table}.${secondColumns[index]}=${tables[index + 1]}.${(tables.length - 1) !== index ? columns[index + 1]: secondColumns[index + 1]}`;
                        }
                    });
                }
            } else {
                if (tables.length === 1) {
                    query += `SELECT ${mergedColumns.join(',')} FROM ${tables[0]}`;
                } else {
                    tables.forEach((table, index) => {
                        if (index === 0) {
                            query += `SELECT ${mergedColumns.join(',')} FROM ${table} JOIN ${tables[index + 1]} ON ${table}.${columns[index]}::text = ${tables[index + 1]}.${columns[index + 1]}::text`;
                        } else if (index < tables.length - 1) {
                            query += ` JOIN ${tables[index + 1]} ON ${table}.${secondColumns[index]}::text = ${tables[index + 1]}.${(tables.length - 1) !== index ? columns[index + 1]: secondColumns[index + 1]}::text`;
                        }
                    });
                }
            }

            try {
                testTableQuery(connectionName, query).then(async data => {
                    if (data) {
                        const db_rows = await Promise.all(data.rows);

                        this.setState({
                            headers: db_rows.length !== 0 ? Object.keys(db_rows[0]) : data.fields.map(field => field.name),
                            rows: db_rows.length !== 0 ? Object.values(db_rows) : [],
                            errorMessage: "",
                            successMessage: db_rows.length !== 0 ? "Result of query is successful!" : "",
                            warningMessage: db_rows.length === 0 ? "Result of query has 0 rows. You may have entered the wrong type, please check your chosen columns to see if any of them work together by type. For example, in the first table with column name \"user_id\" you should select a second column name like \"employee_id\" into another table. So, please do not do something like join table 1 with table 2 by \"user_id\" and \"company_name\" - they are different logic types of data." : "",
                            isLoading: false
                        });
                    } else {
                        this.setState({
                            errorMessage: "The result of the query is not valid! Please check your chosen columns to see if any of them work together by type. For example, in the first table with column name \"user_id\" you should select a second column name like \"employee_id\" into another table. So, please do not do something like join table 1 with table 2 by \"user_id\" and \"company_name\" - they are different logic types of data.",
                            isLoading: false
                        });
                    }
                })
            } catch (e) {
                console.log(e);
            }
        }
    }

    sortColumnsByKeyword(array) {
        const keyword = 'id';

        let res = array.sort(el => new RegExp(keyword,"ig").test(el.column_name)).sort((a,b) => {
            let re = new RegExp("^"+keyword, "i")
            return re.test(a.column_name) ? re.test(b.column_name) ? a.name.localeCompare(b.column_name) : -1 : 1
        });

        return res;
    }

    renderTable(table, index) {
        const { options, tables, columns, secondColumns, isTableLoading, isQueryTableLoading } = this.state;
        const showLink = index < tables.length && index > 0;
        const tableOption = options.filter(option => option.alias === table);
        const tableColumns = tableOption.length !== 0 ? tableOption[0].columns : [];
        const tableSecondColumns = tableOption.length !== 0 ? tableOption[0].columns : [];
        const tableColumn = columns[index];
        const colorIndex = index > colors.length - 1 ? index - colors.length : index;
        const tableSecondColumn = secondColumns[index];
        const isLastTable = tables.length === index + 1;

        return (
            <div className={"constructor-table table-number-" + index} id={"table-number-" + index} key={index}>
                <div className="constructor-table-data" style={{backgroundColor: colors[colorIndex], marginRight: isLastTable && '50px'}}>
                    <div className="table-data">
                        <span><b>Table</b> {table === "select table" ? <span>'select table'</span> : <span>{table}</span>}</span>
                        <select className="select-table" value="" onChange={(e) => this.handleTableChange(e, index)}>
                            <option value="" selected disabled hidden>Choose here</option>
                            {
                                options.map((option, i) => <option key={i} value={option.table}>{option.alias}</option>)
                            }
                        </select>
                        <img id="remove-icon" onClick={() => {this.removeTable(index)}} src={deleteIcon} alt='delete icon'/>
                    </div>
                    { isLastTable && isQueryTableLoading &&
                        <div className="query-table-loader">
                            <div className="dot-flashing"/>
                        </div>
                    }
                    { table !== 'select table' &&
                    <div className="table-column">
                        <div className="column-name">
                            { ( index !== 0 && (tables.length - 1) !== index )  &&
                                <img className="column-arrows" src={westIcon}/>
                            }

                            <span style={{paddingLeft: ( index !== 0 && (tables.length - 1) !== index ) && "10px", background: ( index !== 0 && (tables.length - 1) !== index ) && colors[colorIndex - 1]}}><b>Column</b> {tableColumn === "select column" ? <span>'select column'</span> : <span>{tableColumn}</span>}</span>

                            <select className="select-column" value="" onChange={(e) => this.handleColumnChange(e, index)}>
                                <option value="" selected disabled hidden>Choose here</option>
                                {
                                    tableColumns && this.sortColumnsByKeyword(tableColumns).map((column, i) => {
                                        return <option key={i} value={column.column_name}>{column.column_name}</option>
                                    })
                                }
                            </select>
                        </div>

                        { ( index !== 0 && (tables.length - 1) !== index )  &&
                        <div className="column-name">
                            <img className="column-arrows" src={eastIcon}/>
                            <span style={{marginTop: "10px", paddingLeft: ( index !== 0 && (tables.length - 1) !== index ) && "10px", background: ( index !== 0 && (tables.length - 1) !== index ) && colors[colorIndex + 1]}}><b>Column</b> {tableSecondColumn === "select column" ? <span>'select column'</span> : <span>{tableSecondColumn}</span>}</span>
                            <select className="select-column" value="" onChange={(e) => this.handleSecondColumnChange(e, index)}>
                                <option value="" selected disabled hidden>Choose here</option>
                                {
                                    tableSecondColumns && this.sortColumnsByKeyword(tableColumns).map((column, i) => {
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

                        <input type="text" id="aliasText" placeholder="New Table Name" value={queryName}
                               className="create-table-name-input" onChange={(e) => this.handleQueryNameChange(e)}/>

                        <button type="button" className="save-button" onClick={() => this.save()}>
                            Save
                        </button>

                    </div>


                    <div className='create-edit-table-body'>

                        <div className="query-constructor">
                            <div className="constructor-tables">
                                {
                                    tables && tables.map((table, i) => this.renderTable(table, i))
                                }
                                {

                                    tables.length > 1 && tables.map((table, i) => <Arrow
                                        className='arrow'
                                        from={{
                                            direction: DIRECTION.RIGHT,
                                            node: () => document.getElementById("table-number-" + i),
                                            translation: [0, 0],
                                        }}
                                        to={{
                                            direction: DIRECTION.LEFT,
                                            node: () => document.getElementById("table-number-" + (i + 1)),
                                            translation: [0, 0],
                                        }}
                                    />)
                                }

                            </div>
                        </div>


                        { errorMessage &&
                            <MessagePopup title={"Constructor error."} isOpen={true} text={errorMessage} onSubmit={() => this.closeError()}/>
                        }


                        { successMessage &&
                            <MessagePopup title={"Constructor success!"} isOpen={true} text={successMessage} onSubmit={() => this.closeSuccess()}/>
                        }

                        { warningMessage &&
                            <MessagePopup title={"Constructor warning.."} isOpen={true} text={warningMessage} onSubmit={() => this.closeWarning()}/>
                        }

                    </div>

                    <div className='create-edit-table-footer'>
                        <div className="create-edit-table-footer-add-table">
                            <span>Add Table</span>
                            <img className="create-edit-table-footer-add-table-btn" src={addIcon} alt='add table icon' onClick={() => this.addNewTable()}/>
                        </div>

                        <div className="create-edit-table-footer-reload">
                            <span>Reload</span>
                            <img className="create-edit-table-footer-reload-btn" src={reloadIcon} alt='reload icon' onClick={() => this.reload()}/>
                        </div>

                        <div className="create-edit-table-footer-test">
                            <span>Test</span>
                            <img className="create-edit-table-footer-test-btn" src={saveIcon} alt='save icon'
                                 onClick={() => this.run()}/>
                        </div>
                    </div>
                </div>
            );
        }
    }
}