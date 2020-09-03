import React from 'react';
import {addTable, getAllTables, testTableQuery, updateTableQuery} from "../methods";
import '../styles/CreateTable.scss';

export default class CreateTable extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            header: "",
            rows: "",
            badQuery: 0,
            errorMessage: ""
        };
    }

    componentDidMount() {
        if(localStorage.getItem("current_result_info")) {
            console.log("Here");
            let result = JSON.parse(localStorage.getItem("current_result_info"));
            let name = document.getElementById("aliasText");
            let query = document.getElementById("queryText");
            name.value = result.alias;
            name.disabled = true;
            query.value = result.query;
        }
    }

    save() {
        function inputVerify(args) {
            return args.replace(/^\s+|\s+$/gm, '').length;
        }

        const connectionName = JSON.parse(localStorage.getItem('current_connection')).name;
        const alias = document.getElementById("aliasText").value;
        const query = document.getElementById("queryText").value;

        if(localStorage.getItem("current_result_info") && inputVerify(query) > 0) {
            updateTableQuery(connectionName, alias, query).then(() => {
                getAllTables(connectionName).then(tables => {
                    localStorage.setItem("current_tables", JSON.stringify(tables));
                    window.location.hash = "#/tables";
                });
            });
        } else if (
            inputVerify(alias) > 0 &&
            inputVerify(query) > 0
        ) {
            addTable(connectionName, query,"new", alias).then((data) => {
                if (data) {
                    return "#/tables";
                } else {
                    this.setState({
                        header: "",
                        rows: "",
                        badQuery: 1,
                        errorMessage: "Query is not valid."
                    });
                }
            }).then((url) => {
                getAllTables(connectionName).then(tables => {
                    localStorage.setItem("current_tables", JSON.stringify(tables));
                    window.location.pathname = url;
                });
            });
        } else {
            this.setState({
                header: "",
                rows: "",
                badQuery: 1,
                errorMessage: "Please, fill in all the fields."
            });
        }
    }

    run() {
        function inputVerify(args) {
            return args.replace(/^\s+|\s+$/gm, '').length;
        }

        const connectionName = JSON.parse(localStorage.getItem('current_connection')).name;
        const query = document.getElementById("queryText").value;

        if (
            inputVerify(query) > 0
        ) {
            try {
                testTableQuery(connectionName, query).then(async data => {
                    if (data) {
                        const db_rows = await Promise.all(data.rows);

                        this.setState({
                            header: Object.keys(db_rows[0]),
                            rows: Object.values(db_rows),
                            badQuery: 0,
                            errorMessage: ""
                        });
                    } else {
                        this.setState({
                            header: "",
                            rows: "",
                            badQuery: 1,
                            errorMessage: "Query is not valid."
                        });
                    }
                })
            } catch (e) {
                console.log(e);
            }
        } else {
            this.setState({
                header: "",
                rows: "",
                badQuery: 1,
                errorMessage: "Please, fill in query field."
            });
        }
    }

    render() {
        if (this.state === null){
            return (
                <div>
                    Loading...
                </div>
            );
        } else {
            return(
                <div className="create_edit_table">
                    <div id="mini-menu">
                        <div className="actions">
                            <button type="button" className="runButton" onClick={() => this.run()}><span>Run </span></button>
                            <div className="saving-result">
                                <input type="text" id="aliasText" placeholder="Table name" className="form-control"/>
                                <button type="button" className="saveButton" onClick={() => this.save()}>Save</button>
                            </div>
                        </div>
                    </div>
                    <textarea id="queryText" placeholder="/*  SQL select query should be here  */" />
                    {this.state.badQuery > 0 &&
                        <div id="errorMessage" className="alert">
                            <strong>Message!</strong> {this.state.errorMessage}
                        </div>
                    }
                    {this.state.header !== "" && this.state.rows !== "" &&

                        <div id="add-btn-table">
                            <table id="your-new-table">
                                <tr>
                                {this.state.header ? this.state.header.map((item) => {
                                        return <th>{item}</th>
                                    })
                                    : null}
                                </tr>
                                {this.state.rows ? this.state.rows.map((item, key) => {
                                        return <tr className={key++ % 2 === 0 ? "column_one" : "column_two"}>{
                                            Object.values(item).map((get_item, key) => {
                                                return <td style={key === 0 ? {
                                                    color: "#3E3E3E",
                                                    background: "#EFEFEF",
                                                    border: "1px solid grey"
                                                } : {color: "#3E3E3E"}}>{get_item}</td>

                                            })}
                                        </tr>

                                    })
                                    : null}
                            </table>
                        </div>
                    }
                </div>
            );
        }
    }
}
