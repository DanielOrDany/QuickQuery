import React from 'react';
import {
    addTable,
    getAllTables,
    testTableQuery,
    updateTableQuery
} from "../methods";
import '../styles/CreateTable.scss';
import xxx from "../icons/Gear-0.2s-200px (1).svg";

export default class CreateTable extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            badQuery: 0,
            errorMessage: "",
            isLoading: false
        };
    }

    componentDidMount() {
        if(localStorage.getItem("current_result_info")) {
            localStorage.setItem("current_result", window.location.href.split('/')[window.location.href.split('/').length - 1]);
            this.renderFields();
        }
    }

    componentDidUpdate() {
        if(window.location.href.split('/')[window.location.href.split('/').length - 2] == "edit-table" && window.location.href.split('/')[window.location.href.split('/').length - 1] != localStorage.getItem("current_result")) {
            localStorage.setItem("current_result", window.location.href.split('/')[window.location.href.split('/').length - 1]);
            this.renderFields();
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
        this.setState({
            isLoading: true
        });

        function inputVerify(args) {
            return args.replace(/^\s+|\s+$/gm, '').length;
        }

        const connectionName = JSON.parse(localStorage.getItem('current_connection')).name;
        const alias = document.getElementById("aliasText").value;
        const query = document.getElementById("queryText").value;

        if(localStorage.getItem("current_result_info") && inputVerify(query) > 0) {
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
            inputVerify(alias) > 0 &&
            inputVerify(query) > 0
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
                            headers: Object.keys(db_rows[0]),
                            rows: Object.values(db_rows),
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
        } else {
            this.setState({
                badQuery: 1,
                errorMessage: "Please, fill in query field.",
                isLoading: false
            });
        }
    }

    render() {
        const { badQuery, errorMessage, headers, rows, isLoading } = this.state;

        if (isLoading) {
            return (
                <div className={"loading"}>
                    <img src={xxx}/>
                    Loading...
                </div>
            );
        } else {
            return(
                <div className="create_edit_table">
                    <div id="mini-menu">
                        <div className="actions">
                            <button type="button" className="runButton" onClick={() => this.run()}><span>Run</span></button>
                            <div className="saving-result">
                                <input type="text" id="aliasText" placeholder="Query Name" className="form-control" type="search"/>
                                <button type="button" className="saveButton" onClick={() => this.save()}>Save</button>
                            </div>
                        </div>
                    </div>
                    <textarea id="queryText" placeholder=" /* SQL select query should be here */" />
                    { badQuery > 0 &&
                        <div id="errorMessage" className="alert">
                            <strong>Message!</strong> {errorMessage}
                        </div>
                    }
                    {(headers && rows) &&

                        <div id="add-btn-table">
                            <table id="your-new-table">
                                <tr>
                                { headers ? headers.map((item) => {
                                    return <th>{item}</th>
                                }) : null }
                                </tr>
                                { rows ? rows.map((item, key) => {
                                    return <tr className={key++ % 2 === 0 ? "column_one" : "column_two"}>{
                                                Object.values(item).map((get_item, key) => {
                                                    return <td style={key === 0 ? {
                                                        color: "#3E3E3E",
                                                        background: "#EFEFEF",
                                                        border: "1px solid grey"
                                                    } : { color: "#3E3E3E" }}>{get_item}</td>
                                                })}
                                            </tr>
                                }) : null }
                            </table>
                        </div>
                    }
                </div>
            );
        }
    }
}
