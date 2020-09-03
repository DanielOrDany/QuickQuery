import React from 'react';
import {loadTableResult} from "../methods";
import '../styles/Result.scss';
import XLSX from 'xlsx';
import xxx from "../icons/Gear-0.2s-200px (1).svg"

export default class Result extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            headers: "",
            rows: "",
            pageNumber: 0,
            value: '',
            selectedItem: '',
            null_results: false,
            records: 0,
            pages: 0
        };


        this.handleChange = this.handleChange.bind(this);
        this.handleChange_value = this.handleChange_value.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({
            selectedItem: event.target.value
        });
    }

    handleChange_value(event) {
        this.setState({
            value: event.target.value,
        });
    }

    handleSubmit() {
        alert('Отправленное имя: ' + this.state.value + this.state.column);
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

    save() {
        const result = localStorage.getItem('current_result');
        const connectionName = JSON.parse(localStorage.getItem('current_connection')).name;
        const options = {
            page: 0,
            pageSize: 1000,
            search: this.state.value === '' ? undefined
                : { column: this.state.selectedItem, value: this.state.value }
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

    changePage = (operation) => {
        let n = this.state.pageNumber + operation;

        if (n === 0) n += 1;
        if (n > 0 && n < this.state.pages) {
            this.setState({
                pageNumber: this.state.pageNumber + operation
            });
        }
    };

    search = () => {
        const result = localStorage.getItem('current_result');
        const connectionName = JSON.parse(localStorage.getItem('current_connection')).name;
        const options = {
            page: this.state.pageNumber,
            pageSize: 1000,
            search: this.state.value === '' ? undefined
                : { column: this.state.selectedItem, value: this.state.value }
        };

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
                <div className="all-page-result">
                        <div className={"menu_table"}>
                            <div id="sorting-and-search">
                                <select value={ this.state.selectedItem } onChange={ this.handleChange }>
                                    { this.state.headers ? this.state.headers.map((item) => {
                                            return <option value={item}>{item}</option>
                                        })
                                        : null }
                                </select>
                                <input id="search-field" placeholder={"value"} value={this.state.value}
                                       onChange={this.handleChange_value}/>
                                <button id="search-btn" onClick={() => this.search()}>Search</button>
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



