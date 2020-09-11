import React from 'react';
import {loadTableResult} from "../methods";
import '../styles/Result.scss';
import XLSX from 'xlsx';
import xxx from "../icons/Gear-0.2s-200px (1).svg"

const DESC = "DESC";
const ASC = "ASC";

export default class Result extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            headers: "",
            rows: "",
            pageNumber: 0,
            searchValue: '',
            filterValue1: '',
            filterValue2: '',
            orderScore: DESC,
            selectedItem: '',
            null_results: false,
            records: 0,
            pages: 0
        };

        this.handleOrderSelectChange = this.handleOrderSelectChange.bind(this);
        this.handleCommonSelectChange = this.handleCommonSelectChange.bind(this);
        this.handleChangeFilterValue1 = this.handleChangeFilterValue1.bind(this);
        this.handleChangeFilterValue2 = this.handleChangeFilterValue2.bind(this);
        this.handleChangeSearchValue = this.handleChangeSearchValue.bind(this);
    }

    componentDidMount() {
        let button = document.getElementsByTagName("button");
        let span = document.getElementsByTagName("span");
        localStorage.setItem("current_result", window.location.href.split('/')[window.location.href.split('/').length - 1]);
        localStorage.setItem("current_page", 1);

        if (!this.state.rows === "") {
            if (localStorage.getItem("theme")) {
                button[0].style.color = "#FFFFFF";
                button[0].style.background = "#363740";
                button[1].style.color = "#FFFFFF";
                button[1].style.background = "#363740";
                button[2].style.color = "#FFFFFF";
                button[2].style.background = "#363740";
                button[3].style.color = "#FFFFFF";
                button[3].style.background = "#363740";
                span[0].style.color = "#FFFFFF";
                span[0].style.background = "#363740";
            } else {
                button[0].style.color = "#363740";
                button[0].style.background = "#FFFFFF";
                button[1].style.color = "#363740";
                button[1].style.background = "#FFFFFF";
                button[2].style.color = "#363740";
                button[2].style.background = "#FFFFFF";
                button[3].style.color = "#363740";
                button[3].style.background = "#FFFFFF";
                span[0].style.color = "#363740";
                span[0].style.background = "#FFFFFF";
            }
        }

        this.loadTable();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevState.pageNumber !== this.state.pageNumber) {
            this.loadTable()
        }
        if (window.location.href.split('/')[window.location.href.split('/').length - 1] != localStorage.getItem("current_result")) {
            localStorage.setItem("current_result", window.location.href.split('/')[window.location.href.split('/').length - 1]);
            this.loadTable();
        }
    }

    loadTable = () => {
        const result = localStorage.getItem("current_result");
        const connectionName = JSON.parse(localStorage.getItem('current_connection')).name;
        const options = {
            page: this.state.pageNumber,
            pageSize: 10,
        };

        loadTableResult(connectionName, result, options).then(async data => {
            const db_rows = await Promise.all(data.rows);
            const headers = Object.keys(db_rows[0]);
            const selectedValue = Object.keys(db_rows[0])[0];
            const rows = Object.values(db_rows);

            this.setState({
                headers: headers,
                selectedItem: selectedValue,
                rows: rows,
                pages: data.pages
            });
        });
    };

    reloadTable = (connectionName, result, options) => {
        loadTableResult(connectionName, result, options).then(async data => {
            if (data.rows.length) {
                const db_rows = await Promise.all(data.rows);
                const headers = Object.keys(db_rows[0]);
                const rows = Object.values(db_rows);

                this.setState({
                    headers: headers,
                    rows: rows,
                    null_results: false
                });
            } else {
                this.setState({
                    null_results: true
                });
            }
        });
    };

    changePage = (operation) => {
        let n = this.state.pageNumber + operation;

        if (n === 0) n += 1;
        if (n > 0 && n < this.state.pages) {
            this.setState({
                pageNumber: this.state.pageNumber + operation
            });
        }
    };

    save() {
        const result = localStorage.getItem('current_result');
        const connectionName = JSON.parse(localStorage.getItem('current_connection')).name;
        const options = {
            page: 0,
            pageSize: 1000,
            search: this.state.searchValue === '' ? undefined
                : { column: this.state.selectedItem, value: this.state.searchValue },
            filter: (this.state.filterValue1 === '' || this.state.filterValue2 === '') ? undefined
                : {
                    column: this.state.selectedItem,
                    value1: this.state.filterValue1,
                    value2: this.state.filterValue2
                },
            order: this.state.orderScore === '' ? undefined : {
                column: this.state.selectedItem,
                score: this.state.orderScore
            }
        };

        loadTableResult(connectionName, result, options).then(async data => {
            const db_rows = await Promise.all(data.rows);
            const rows = Object.values(db_rows);

            let binaryWS = XLSX.utils.json_to_sheet(rows);
            let wb = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(wb, binaryWS, `${result}`);
            XLSX.writeFile(wb, `${result}.xlsx`);
        });
    }

    processOperations = () => {
        const result = localStorage.getItem('current_result');
        const connectionName = JSON.parse(localStorage.getItem('current_connection')).name;
        const options = {
            page: this.state.pageNumber,
            pageSize: 1000,
            search: this.state.searchValue === '' ? undefined
                : { column: this.state.selectedItem, value: this.state.searchValue },
            filter: (this.state.filterValue1 === '' || this.state.filterValue2 === '') ? undefined
                : {
                    column: this.state.selectedItem,
                    value1: this.state.filterValue1,
                    value2: this.state.filterValue2
                },
            order: this.state.orderScore === '' ? undefined : {
                column: this.state.selectedItem,
                score: this.state.orderScore
            }
        };

        this.reloadTable(connectionName, result, options);
    };

    handleCommonSelectChange(event) {
        this.setState({
            selectedItem: event.target.value
        });
    }

    handleOrderSelectChange(event) {
        this.setState({
            orderScore: event.target.value
        });
    }

    handleChangeSearchValue(event) {
        this.setState({
            searchValue: event.target.value,
        });
    }

    handleChangeFilterValue1(event) {
        this.setState({
            filterValue1: event.target.value,
        });
    }

    handleChangeFilterValue2(event) {
        this.setState({
            filterValue2: event.target.value,
        });
    }

    render() {
        if (this.state === null) {
            return (
                <div className={"loading"}>
                    <img src={xxx}/>
                    Loading...
                </div>
            );
        } else {
            return (
                <div className="result">
                        <div className="result-menu">
                            <div className="result-operations">
                                <div>
                                    Select column: <select value={ this.state.selectedItem } onChange={ this.handleCommonSelectChange }>
                                    { this.state.headers ? this.state.headers.map((item) => {
                                            return <option value={item}>{item}</option>
                                        })
                                        : null }
                                </select>
                                </div>
                                <div className="result-search">
                                    Search:
                                    <input id="search-field" placeholder={"value"} value={this.state.searchValue}
                                           onChange={this.handleChangeSearchValue}/>
                                </div>
                                <div className="result-filter">
                                    Filtering:
                                    <input id="filter-field1" placeholder={"value"} value={this.state.filterValue1}
                                           onChange={this.handleChangeFilterValue1}/>
                                    <input id="filter-field2" placeholder={"value"} value={this.state.filterValue2}
                                           onChange={this.handleChangeFilterValue2}/>
                                </div>
                                <div className="result-filter">
                                    Order:
                                    <select value={ this.state.orderScore } onChange={ this.handleOrderSelectChange }>
                                        <option value={DESC}>{DESC}</option>
                                        <option value={ASC}>{ASC}</option>
                                    </select>
                                </div>
                                <button id="load-operations-result-btn" onClick={() => this.processOperations()}>process</button>
                            </div>

                            <div id="select-page">
                                <button id="select-page-btn" onClick={() => this.changePage(-1)}>Prev</button>
                                <span>Page: {this.state.pageNumber + 1}</span>
                                <button id="select-page-btn" onClick={() => this.changePage(1)}>Next</button>
                            </div>
                            <div className={"save"}>
                                <button onClick={() => this.save()}>Save</button>
                            </div>
                        </div>
                        {this.state.null_results === true ?
                            <span>{"-none- results"}</span>
                            :
                            <div id="result-tables">
                                <table>
                                    <tr>
                                        {this.state.headers ? this.state.headers.map((item) => {
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
                                                        border: "1px solid grey",
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



