import React from "react";
import 'react-day-picker/lib/style.css';
import dateFnsFormat from 'date-fns/format';
import { loadTableResult } from "../methods";
import "../styles/Result.scss";
import XLSX from "xlsx";
import xxx from "../icons/Gear-0.2s-200px (1).svg";
import calendarIcon from "../icons/calendar.svg";
import filterIcon from "../icons/filter.svg";
import DayPickerInput from "react-day-picker/DayPickerInput";

const DESC = "DESC";
const ASC = "ASC";

export default class Result extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            headers: "",
            rows: "",
            pageNumber: 0,
            isNullResults: false,
            records: 0,
            pages: 0,
            options: []
        };

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
        const {pageNumber} = this.state;

        if (prevState.pageNumber !== pageNumber) {
            this.loadTable();
        }

        if (window.location.href.split('/')[window.location.href.split('/').length - 1] != localStorage.getItem("current_result")) {
            localStorage.setItem("current_result", window.location.href.split('/')[window.location.href.split('/').length - 1]);
            this.loadTable();
        }
    }

    loadTable = () => {
        const {pageNumber, options} = this.state;
        const result = localStorage.getItem("current_result");
        const connectionName = JSON.parse(localStorage.getItem('current_connection')).name;
        const loadingOptions = {
            page: pageNumber,
            pageSize: 10
        };

        localStorage.setItem('isChangedPicker1', false);
        localStorage.setItem('isChangedPicker2', false);

        loadTableResult(connectionName, result, loadingOptions).then(async data => {
            if (data) {
                if (data.records == 0) {
                    this.setState({
                        isNullResults: true
                    });
                } else {
                    const db_rows = await Promise.all(data.rows);
                    const headers = Object.keys(db_rows[0]);
                    const rows = Object.values(db_rows);
                    const tableOptions = headers.map((header) => {
                        return {
                            column: header,
                            order: ASC,
                            search: "",
                            filter1: "",
                            filter2: "",
                            last: false,
                            isFilterOpened: false
                        }
                    });

                    this.setState({
                        pages: data.pages,
                        options: tableOptions,
                        isNullResults: false,
                        headers,
                        rows
                    });
                }
            } else {
                console.error("ERROR, loadTableResult: ", data);
            }
        });
    };

    reloadTable = () => {
        const {pageNumber, options} = this.state;
        const result = localStorage.getItem("current_result");
        const connectionName = JSON.parse(localStorage.getItem('current_connection')).name;
        const loadingOptions = {
            page: pageNumber,
            pageSize: 10,
            operationsOptions: options.length ? options : null
        };

        loadTableResult(connectionName, result, loadingOptions).then(async data => {
            if (data) {
                console.log("loaded res: ", data);
                if (data.records == 0) {
                    this.setState({
                        isNullResults: true
                    });
                } else {
                    const db_rows = await Promise.all(data.rows);
                    console.log("db_rows", db_rows);
                    const headers = Object.keys(db_rows[0]);
                    const selectedValue = Object.keys(db_rows[0])[0];
                    const rows = Object.values(db_rows);

                    this.setState({
                        pages: data.pages,
                        selectedItem: selectedValue,
                        isNullResults: false,
                        headers,
                        rows
                    });
                }
            } else {
                console.error("ERROR, loadTableResult: ", data);
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
        const {options} = this.state;
        const result = localStorage.getItem('current_result');
        const connectionName = JSON.parse(localStorage.getItem('current_connection')).name;
        const loadingOptions = {
            page: 0,
            pageSize: 1000,
            operationsOptions: options.length ? options : null
        };

        loadTableResult(connectionName, result, loadingOptions).then(async data => {
            const db_rows = await Promise.all(data.rows);
            const rows = Object.values(db_rows);

            let binaryWS = XLSX.utils.json_to_sheet(rows);
            let wb = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(wb, binaryWS, `${result}`);
            XLSX.writeFile(wb, `${result}.xlsx`);
        });
    }

    handleOpenFilter(columnName) {
        const newOptions = this.state.options.map(option => {
            if (option.column === columnName) {
                if (option.isFilterOpened) {
                    option.isFilterOpened = false;
                } else {
                    option.isFilterOpened = true;
                }
            }

            return option;
        });
        this.setState({
            options: newOptions
        });
    }

    handleChangeOrder(columnName) {
        const newOptions = this.state.options.map(option => {
            if (option.column === columnName) {
                option.last = true;

                if (option.order === ASC) {
                    option.order = DESC;
                } else {
                    option.order = ASC;
                }

            } else {
                option.last = false;
            }

            return option;
        });
        this.setState({
            options: newOptions
        });
        this.reloadTable();
    }

    handleChangeSearchValue(event, columnName) {
        const searchedValue = event.target.value;
        const newOptions = this.state.options.map(option => {
            if (option.column === columnName) {
                if (option.search !== searchedValue) {
                    option.search = searchedValue;
                }
            }
            return option;
        });
        this.setState({
            options: newOptions
        });
        this.reloadTable();
    }

    handleChangeFilterValue1(event, columnName) {
        const filteredValue = event.target.value;
        const newOptions = this.state.options.map(option => {
            if (option.column === columnName) {
                if (option.filter1 !== filteredValue) {
                    option.filter1 = filteredValue;
                }
            }
            return option;
        });
        this.setState({
            options: newOptions
        });
        this.reloadTable();
    }

    handleChangeFilterValue2(event, columnName) {
        const filteredValue = event.target.value;
        const newOptions = this.state.options.map(option => {
            if (option.column === columnName) {
                if (option.filter2 !== filteredValue) {
                    option.filter2 = filteredValue;
                }
            }
            return option;
        });

        this.setState({
            options: newOptions
        });
        this.reloadTable();
    }

    handleDatePicker1(filteredValue, columnName) {
        const newOptions = this.state.options.map(option => {
            if (option.column === columnName) {
                if (option.filter1 !== filteredValue) {
                    option.filter1 = filteredValue;
                    localStorage.setItem('isChangedPicker1', true);
                }
            }
            return option;
        });

        if (JSON.parse(localStorage.getItem('isChangedPicker1'))) {
            localStorage.setItem('isChangedPicker1', false);
            this.setState({
                options: newOptions
            });
            this.reloadTable();
        }
    }

    handleDatePicker2(filteredValue, columnName) {
        const newOptions = this.state.options.map(option => {
            if (option.column === columnName) {
                if (option.filter2 !== filteredValue) {
                    option.filter2 = filteredValue;
                    localStorage.setItem('isChangedPicker2', true);
                }
            }
            return option;
        });

        if (JSON.parse(localStorage.getItem('isChangedPicker2'))) {
            localStorage.setItem('isChangedPicker2', false);
            this.setState({
                options: newOptions
            });
            this.reloadTable();
        }
    }

    formatDate(date, format, locale) {
        return dateFnsFormat(date, format, {locale});
    }

    clearFilters(columnName) {
        const newOptions = this.state.options.map(option => {
            if (option.column === columnName) {
                option.filter1 = "";
                option.filter2 = "";
            }
            return option;
        });

        this.setState({
            options: newOptions
        });
        this.reloadTable();
    }

    render() {
        const {options, headers, rows, isNullResults} = this.state;

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
                        <div className={"save"}>
                            <button onClick={() => this.save()}>Export excel</button>
                        </div>
                    </div>
                    <div className="result-table">
                        <table>
                            <tr>
                                { // Headers
                                    headers ? headers.map((header) => {
                                        const currentOption = options.find(option => option.column === header);
                                        const firstRow = rows[0];
                                        let currentHeaderIsDate = false;
                                        let currentHeaderIsNumber = false;
                                        for (const [key, value] of Object.entries(firstRow)) {
                                            if (firstRow) {
                                                if (key === header) {
                                                    if (typeof value !== "boolean") {
                                                        if (typeof value === "string") {
                                                            const dateFormat = value.split("T")[0];
                                                            currentHeaderIsDate = /^\d{4}(\-)(((0)[0-9])|((1)[0-2]))(\-)([0-2][0-9]|(3)[0-1])$/.test(dateFormat);

                                                        } else {
                                                            currentHeaderIsNumber = /^-?\d+$/.test(value);
                                                        }
                                                    }
                                                }
                                            }
                                        }

                                        const FORMAT = 'MM/dd/yyyy';

                                        return (
                                            <th key={header}>
                                                <div className="header">
                                                    <div className="header-data-ordering">
                                                        <span id="header-title">{header}</span>
                                                        <div className="header-options">
                                                            <span className={ currentOption.order === ASC ? "arrow-up" : "arrow-down"}
                                                                  id="header-order"
                                                                  onClick={() => this.handleChangeOrder(header)}>
                                                            </span>
                                                            {
                                                                ((!currentHeaderIsDate && currentHeaderIsNumber)) &&
                                                                <img id="header-filter" src={filterIcon} onClick={() => this.handleOpenFilter(header)}/>
                                                            }
                                                            {
                                                                (currentHeaderIsDate && !currentHeaderIsNumber) &&
                                                                <img id="header-calendar" src={calendarIcon}
                                                                     onClick={() => this.handleOpenFilter(header)}/>
                                                            }
                                                        </div>
                                                    </div>
                                                    <div className="header-data-operations">
                                                        <input id="header-search"
                                                               type="search"
                                                               placeholder={"search.."}
                                                               value={currentOption.search}
                                                               onChange={(e) => this.handleChangeSearchValue(e, header)}
                                                        />
                                                        {
                                                            (((!currentHeaderIsDate && currentHeaderIsNumber)) && currentOption.isFilterOpened) &&
                                                            <div className="header-filters">

                                                                <div id="header-filters-inputs">
                                                                    <input id="filter-field1"
                                                                           type="search"
                                                                           placeholder={"from"}
                                                                           value={currentOption.filter1}
                                                                           onChange={(e) => this.handleChangeFilterValue1(e, header)}/>
                                                                    <input id="filter-field2"
                                                                           type="search"
                                                                           placeholder={"to"}
                                                                           value={currentOption.filter2}
                                                                           onChange={(e) => this.handleChangeFilterValue2(e, header)}/>
                                                                </div>

                                                                <btn onClick={() => this.clearFilters(header)}>clear
                                                                    selected values
                                                                </btn>
                                                            </div>
                                                        }
                                                        {
                                                            ((currentHeaderIsDate && !currentHeaderIsNumber) && currentOption.isFilterOpened) &&
                                                            <div className="header-filters">

                                                                <div id="header-filters-inputs">
                                                                    <DayPickerInput
                                                                        style={{color: "#3E3E3E"}}
                                                                        formatDate={this.formatDate}
                                                                        format={FORMAT}
                                                                        value={currentOption.filter1}
                                                                        parseDate={(date) => this.handleDatePicker1(date, header)}
                                                                        placeholder={`${dateFnsFormat(new Date(), FORMAT)}`}
                                                                    />
                                                                    <DayPickerInput
                                                                        style={{color: "#3E3E3E"}}
                                                                        formatDate={this.formatDate}
                                                                        format={FORMAT}
                                                                        value={currentOption.filter2}
                                                                        parseDate={(date) => this.handleDatePicker2(date, header)}
                                                                        placeholder={`${dateFnsFormat(new Date(), FORMAT)}`}
                                                                    />
                                                                </div>


                                                                <btn onClick={() => this.clearFilters(header)}>clear
                                                                    selected days
                                                                </btn>

                                                            </div>
                                                        }
                                                    </div>
                                                </div>
                                            </th>
                                        );
                                    }) : null
                                }
                            </tr>
                            { // Rows
                                (rows && !isNullResults) ? rows.map((item, key) => {
                                    return (
                                        <tr key={key} className={key++ % 2 === 0 ? "column_one" : "column_two"}>
                                            {Object.values(item).map((get_item, key) => {
                                                return (
                                                    <td key={key} style={key === 0 ? {
                                                        color: "#3E3E3E",
                                                        background: "#EFEFEF",
                                                        border: "1px solid grey",
                                                    } : {color: "#3E3E3E"}}>{get_item}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                }) : null
                            }
                        </table>
                    </div>
                    <div id="pages-field">
                        <div id="select-page">
                            <button id="select-page-btn" onClick={() => this.changePage(-1)}
                                    disabled={this.state.pageNumber == 0}>Prev
                            </button>
                            <span>Page: {this.state.pageNumber + 1}</span>
                            <button id="select-page-btn" onClick={() => this.changePage(1)}
                                    disabled={this.state.pageNumber == this.state.pages - 1}>Next
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
    }
}
