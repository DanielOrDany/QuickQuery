import React from 'react';
import {loadTableResult} from "../methods";
import '../styles/Result.scss';
import XLSX from 'xlsx';
import xxx from "../icons/Gear-0.2s-200px (1).svg"

export default class Result extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            header: "",
            rows: "",
            pageNumber: 0,
            value: '',
            selectValue: '',
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
            selectValue: event.target.value
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

    loadTable = () => {
        const result = JSON.parse(localStorage.getItem('current_result'));
        const connectionName = JSON.parse(localStorage.getItem('current_connection')).name;
        const options = {
            page: this.state.pageNumber,
            pageSize: 10,
        };

        loadTableResult(connectionName, result.alias, options).then(async data => {
            console.log(data);
            const db_rows = await Promise.all(data.rows);
            this.setState({
                header: Object.keys(db_rows[0]),
                selectValue: Object.keys(db_rows[0])[0],
                rows: Object.values(db_rows),
                pages: data.pages
            });

        });
    };

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevState.pageNumber !== this.state.pageNumber) {
            this.loadTable()
        }
    }

    save() {
        const result = JSON.parse(localStorage.getItem('current_result'));
        const connectionName = JSON.parse(localStorage.getItem('current_connection')).name;
        const options = {page: 0, pageSize: 1000};
        loadTableResult(connectionName, result.alias, options).then(async data => {
            const db_rows = await Promise.all(data.rows);
            const rows = Object.values(db_rows);

            let binaryWS = XLSX.utils.json_to_sheet(rows);
            var wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, binaryWS, `${result.alias}`);

            XLSX.writeFile(wb, `${result.alias}.xlsx`);
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

    searchMthods = () => {
        const result = JSON.parse(localStorage.getItem('current_result'));
        const connectionName = JSON.parse(localStorage.getItem('current_connection')).name;
        const options = {
            page: this.state.pageNumber,
            pageSize: 10000000,
            search: {column: this.state.selectValue, value: this.state.value}
        };

        loadTableResult(connectionName, result.alias, options).then(async data => {
            if (data.rows.length) {
                const db_rows = await Promise.all(data.rows);

                this.setState({
                    header: Object.keys(db_rows[0]),
                    rows: Object.values(db_rows),
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
                <div className="page">
                    <div id="left-menu">Hello</div>

                    <div className="line"></div>

                    <div id="right-side">
                        <div className={"menu_table"}>
                            <div className={'pagination_page search'}>
                                <select
                                    value={this.state.selectValue}
                                    onChange={this.handleChange}
                                >
                                    {this.state.header ? this.state.header.map((item) => {
                                            return <option value={item}>{item}</option>
                                        })
                                        : null}
                                </select>
                                <input placeholder={"value"} value={this.state.value}
                                       onChange={this.handleChange_value}/>
                                <button id="search-btn" onClick={() => this.searchMthods()}>Search</button>
                            </div>
                            <div className={"pagination_page"}>
                                <button onClick={() => this.changePage(-1)}>Prev</button>
                                <span>Page: {this.state.pageNumber + 1}</span>
                                <button onClick={() => this.changePage(1)}>Next</button>
                            </div>
                            <div className={"save"}>
                                <button onClick={() => this.save()}>Save</button>
                            </div>
                        </div>
                        {this.state.null_results === true ?
                            <span>{"none results"}</span>
                            :

                            <table>
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
                                                    border: "1px solid grey",
                                                } : {color: "#3E3E3E"}}>{get_item}</td>

                                            })}
                                        </tr>

                                    })
                                    : null}
                            </table>

                        }
                    </div>
                </div>
            );
        }
    }
}



