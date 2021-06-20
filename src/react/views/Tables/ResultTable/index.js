import React from "react";
import 'react-day-picker/lib/style.css';
import dateFnsFormat from 'date-fns/format';
import {
    loadTableResult,
    saveTableResult,
    getTableSize
} from "../../../methods";
import "./Result.scss";
import XLSX from "xlsx";
import xxx from "../../../icons/loop.svg";
import TableImgPopup from "../popups/TableImagePopup";
import footer_arrow_down from "../../../icons/connections-page-footer-arrow.svg";
import footer_arrow_left from "../../../icons/connections-page-footer-arrow-left.svg";
import footer_arrow_right from "../../../icons/connections-page-footer-arrow-right.svg";
import TableRowPopup from "../popups/TableRowPopup";
import HiddenColumnsPopup from "../popups/HiddenColumnsPopup";
import filterIcon from "./filterIcon.svg";
import DayPickerInput from "react-day-picker/DayPickerInput";
import TableFilter from "../popups/TableFilter";

const DESC = "DESC";
const ASC = "ASC";


const isEqual = function (value, other) {

    // Get the value type
    let type = Object.prototype.toString.call(value);

    // If the two objects are not the same type, return false
    if (type !== Object.prototype.toString.call(other)) return false;

    // If items are not an object or array, return false
    if (['[object Array]', '[object Object]'].indexOf(type) < 0) return false;

    // Compare the length of the length of the two items
    let valueLen = type === '[object Array]' ? value.length : Object.keys(value).length;
    let otherLen = type === '[object Array]' ? other.length : Object.keys(other).length;
    if (valueLen !== otherLen) return false;

    // Compare two items
    let compare = function (item1, item2) {

        // Get the object type
        let itemType = Object.prototype.toString.call(item1);

        // If an object or array, compare recursively
        if (['[object Array]', '[object Object]'].indexOf(itemType) >= 0) {
            if (!isEqual(item1, item2)) return false;
        }

        // Otherwise, do a simple comparison
        else {

            // If the two items are not the same type, return false
            if (itemType !== Object.prototype.toString.call(item2)) return false;

            // Else if it's a function, convert to a string and compare
            // Otherwise, just compare
            if (itemType === '[object Function]') {
                if (item1.toString() !== item2.toString()) return false;
            } else {
                if (item1 !== item2) return false;
            }

        }
    };

    // Compare properties
    if (type === '[object Array]') {
        for (let i = 0; i < valueLen; i++) {
            if (compare(value[i], other[i]) === false) return false;
        }
    } else {
        for (let key in value) {
            if (value.hasOwnProperty(key)) {
                if (compare(value[key], other[key]) === false) return false;
            }
        }
    }

    // If nothing failed, return true
    return true;

};

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
            isLoading: false,
            isSaving: false,
            isEmptyQuery: false,
            options: [],
            removedColumns: [],
            hiddenColumns: [],
            setTableModalActive: false,
            idRow: null,
            selectedRowInfo: [],
            TableImgModalActive: false,
            columnImg: '',
            limitWarning: null,
            rowsPerPage: 10,
            isOpenHiddenColumnsPopup: false
        };

        this.handleChangeFilterValue1 = this.handleChangeFilterValue1.bind(this);
        this.handleChangeFilterValue2 = this.handleChangeFilterValue2.bind(this);
        this.handleChangeSearchValue = this.handleChangeSearchValue.bind(this);
    }

    async componentDidMount() {
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

        await this.loadTable();
    }

    saveResult(connectionName, result, loadingOptions, removedColumns, subPlan) {
        let reportsNum = 0;
        if (!localStorage.getItem("reportsPerMonth")) {
            localStorage.setItem("reportsPerMonth", JSON.stringify(reportsNum));
            reportsNum += 1;
        } else {
            console.log("number", Number(JSON.parse(localStorage.getItem("reportsPerMonth"))));
            reportsNum = Number(JSON.parse(localStorage.getItem("reportsPerMonth")));
            reportsNum += 1;
            console.log("result", reportsNum);
        }

        let limit = 0;
        if (subPlan === "Startup Plan") {
            limit = 100 - reportsNum;
        } else if (subPlan === "Pro Plan") {
            limit = 300 - reportsNum;
        } else { // Personal
            limit = 15 - reportsNum;
        }

        console.log("limit", limit);
        console.log("reportsNum", reportsNum);

        if (limit >= 0) {
            saveTableResult(connectionName, result, loadingOptions).then(async data => {
                if (data) {
                    const db_rows = await Promise.all(data.rows);
                    const rows = db_rows.length !== 0 ? Object.values(db_rows) : [];

                    removedColumns.forEach(removedColumn => {
                        rows.forEach(row => {
                            delete row[removedColumn];
                        });
                    });

                    let binaryWS = XLSX.utils.json_to_sheet(rows);
                    let wb = XLSX.utils.book_new();

                    XLSX.utils.book_append_sheet(wb, binaryWS, `${result}`);
                    XLSX.writeFile(wb, `report.xlsx`, {bookSST: true, compression: true});

                    console.log("reportsPerMonth", reportsNum);
                    localStorage.setItem("reportsPerMonth", JSON.stringify(reportsNum));

                    this.setState({
                        isLoading: false,
                        isSaving: false
                    });
                } else {
                    this.setState({
                        errorMessage: "Table is not valid.",
                        isLoading: false,
                        isSaving: false
                    });
                }
            });
        } else {
            console.log("limited!");
            this.setState({
                limitWarning: "You have exceeded the monthly limit.",
                isLoading: false,
                isSaving: false
            })
        }
    }

    async componentDidUpdate(prevProps, prevState, snapshot) {
        const { pageNumber, isSaving, limitWarning, options, removedColumns } = this.state;

        if (prevState.pageNumber !== pageNumber) {
            setTimeout(() => {
                this.reloadTable();
            }, 500);
        }

        if (prevState.limitWarning !== limitWarning) {
            setTimeout(() => {
                this.setState({ limitWarning: null })
            }, 5000);
        }

        if (isSaving) {
            const result = localStorage.getItem('current_result');
            const connectionName = JSON.parse(localStorage.getItem('current_connection')).name;
            const connectionInfo = JSON.parse(localStorage.getItem('current_connection'));
            const tableColumns = connectionInfo.queries.filter(query => !!query.table).map(query => query.table);
            const tableSize = localStorage.getItem('tableSize');

            const loadingOptions = {
                page: 0,
                pageSize: 80,
                columns: tableColumns,
                numberOfRecords: tableSize,
                operationsOptions: options.length ? options : null
            };

            const subPlan = localStorage.getItem("employeePlan");
            const countSubFrom = localStorage.getItem("employeeCountSubFrom");

            const timeOfUseInMs = Date.now() - Number(countSubFrom);
            const timeOfUseInDays = timeOfUseInMs / (1000 * 60 * 60 * 24);

            console.log("days", timeOfUseInDays);

            if (!localStorage.getItem("timeOfUseInDays")) {
                localStorage.setItem("timeOfUseInDays", JSON.stringify(timeOfUseInDays));
            } else {
                const storedTimeOfUseInDays = Number(JSON.parse(localStorage.getItem("timeOfUseInDays")));
                if ((timeOfUseInDays - storedTimeOfUseInDays) <= 30) {
                    this.saveResult(connectionName, result, loadingOptions, removedColumns, subPlan);
                } else {
                    localStorage.setItem("timeOfUseInDays", JSON.stringify(timeOfUseInDays));
                    this.saveResult(connectionName, result, loadingOptions, removedColumns, subPlan);
                }
            }
        }

        if (window.location.href.split('/')[window.location.href.split('/').length - 1] != localStorage.getItem("current_result")) {
            localStorage.setItem("current_result", window.location.href.split('/')[window.location.href.split('/').length - 1]);

            setTimeout(() => {
                this.loadTable();
            }, 500);
        }
    }

    loadTable = async () => {
        const {pageNumber, rowsPerPage} = this.state;
        const result = localStorage.getItem("current_result");
        const connectionName = JSON.parse(localStorage.getItem('current_connection')).name;
        const connectionInfo = JSON.parse(localStorage.getItem('current_connection'));
        const tableColumns = connectionInfo.queries.filter(query => !!query.table).map(query => query.table);
        const tableSize = await getTableSize(connectionName, result);

        const loadingOptions = {
            page: pageNumber,
            pageSize: rowsPerPage,
            columns: tableColumns,
            numberOfRecords: tableSize
        };

        localStorage.setItem('tableSize', tableSize);
        localStorage.setItem('isChangedPicker1', false);
        localStorage.setItem('isChangedPicker2', false);

        loadTableResult(connectionName, result, loadingOptions).then(async data => {
            if (data) {
                if (data.records === 0) {
                    this.setState({
                        isNullResults: true,
                        isEmptyQuery: true
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
                        isLoading: false,
                        records: data.records,
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
        const {pageNumber, options, rowsPerPage} = this.state;
        const result = localStorage.getItem("current_result");
        const connectionName = JSON.parse(localStorage.getItem('current_connection')).name;
        const connectionInfo = JSON.parse(localStorage.getItem('current_connection'));
        const tableColumns = connectionInfo.queries.filter(query => !!query.table).map(query => query.table);
        const tableSize = localStorage.getItem('tableSize');

        const loadingOptions = {
            page: pageNumber,
            pageSize: rowsPerPage,
            operationsOptions: options.length ? options : null,
            columns: tableColumns,
            numberOfRecords: tableSize
        };

        loadTableResult(connectionName, result, loadingOptions).then(async data => {
            if (data) {
                if (data.records == 0) {

                    this.setState({
                        headers: data.fields.map(field => field.name),
                        isNullResults: true
                    });
                } else {
                    const db_rows = await Promise.all(data.rows);
                    if (db_rows.length) {
                        let headers = Object.keys(db_rows[0]);
                        const selectedValue = Object.keys(db_rows[0])[0];
                        const rows = Object.values(db_rows);

                        this.setState({
                            pages: data.pages,
                            selectedItem: selectedValue,
                            isNullResults: false,
                            isLoading: false,
                            headers,
                            rows,
                            records: data.records
                        });
                    } else {
                        this.setState({
                            isNullResults: true
                        });
                    }
                }
            } else {
                console.error("ERROR, loadTableResult: ", data);
            }
        });
    };

    removeColumn = (column) => {
        const { removedColumns, hiddenColumns } = this.state;

        removedColumns.push(column);
        hiddenColumns.push(column);

        this.setState({
            removedColumns,
            hiddenColumns
        });

        this.reloadTable();
    };

    hideColumn = (column) => {
        const { hiddenColumns } = this.state;

        hiddenColumns.push(column);

        this.setState({ hiddenColumns });
    };

    closeHiddenColumnsPopup = () => {
        const { hiddenColumns } = this.state;

        this.setState({
            removedColumns: hiddenColumns,
            isOpenHiddenColumnsPopup: false
        });

        this.reloadTable();
    };

    openHiddenColumnsPopup = () => {
        const { isOpenHiddenColumnsPopup } = this.state;

        if (isOpenHiddenColumnsPopup) {
            this.setState({ isOpenHiddenColumnsPopup: false });
        } else {
            this.setState({ isOpenHiddenColumnsPopup: true });
        }
    };

    unhideColumn = (column) => {
        let { hiddenColumns } = this.state;

        hiddenColumns = hiddenColumns.filter(e => e !== column);

        this.setState({
            hiddenColumns
        });
    };

    unhideAllColumns = () => {
        this.setState({
            hiddenColumns: []
        });
    };

    changePage = (operation) => {
        console.log(operation);
        this.setState({isLoading: true});
        let n = this.state.pageNumber + operation;

        if (n === 0) n += 1;
        if (n > 0 && n < this.state.pages) {
            this.setState({
                pageNumber: this.state.pageNumber + operation
            });
        }
    };

    save() {
        this.setState({isLoading: false, isSaving: true});
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

        setTimeout(() => {
            this.reloadTable();
        }, 500);
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

        setTimeout(() => {
            this.reloadTable();
        }, 500);
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

        setTimeout(() => {
            this.reloadTable();
        }, 500);
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

        setTimeout(() => {
            this.reloadTable();
        }, 500);
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

            setTimeout(() => {
                this.reloadTable();
            }, 500);
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

            setTimeout(() => {
                this.reloadTable();
            }, 500);
        }
    }

    handlePageChange = (event) => {
        this.setState({
            rowsPerPage: event.target.value
        });

        setTimeout(() => {
            this.reloadTable();
        }, 500);
    };

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

        setTimeout(() => {
            this.reloadTable();
        }, 500);
    }


    setTableModal(active) {
        this.setState({
            setTableModalActive: active
        })
    }

    handleCancel = () => {
        this.setState({setTableModalActive: false});
    };

    handleImgCancel = () => {
        this.setState({TableImgModalActive: false});
    };


    setTableImgModal() {
        let active = this.state.TableImgModalActive
        this.setState({TableImgModalActive: !active})
    }


    ImgCheck(renderItem) {
        if (String(renderItem).indexOf(".png") > -1) {
            console.log(renderItem)
            return (
                <img src={renderItem} alt={'img'} className={'result-table-td-img'}
                     onClick={() => this.setTableImgModal()}/>
            )

        } else {
            return (
                <input value={renderItem}/>)
        }
    }


    render() {
        let {
            isEmptyQuery,
            options,
            headers,
            rows,
            isNullResults,
            isSaving,
            removedColumns,
            hiddenColumns,
            isLoading,
            selectedRowInfo,
            idRow,
            setTableModalActive,
            TableImgModalActive,
            columnImg,
            limitWarning,
            isOpenHiddenColumnsPopup,
            rowsPerPage,
            pageNumber,
            records
        } = this.state;

        const tableName = localStorage.getItem("current_result");
        const paginationFrom = (1 + rowsPerPage * (pageNumber + 1)) - rowsPerPage;
        const paginationTo = rowsPerPage * (pageNumber + 1);

        removedColumns.forEach(removedColumn => {
            headers = headers.filter((header) => header !== removedColumn);
            rows.forEach(row => {
                delete row[removedColumn];
            });
        });

        if (isEmptyQuery) {
            return (
                <div className={"loading"}>
                    <img src={xxx}/>
                    Nothing to load..
                </div>
            );
        } else if (!headers || isSaving || isLoading) {
            return (
                <div className={"loading"}>
                    <img src={xxx}/>
                    {(!headers || isLoading) && "Loading..."}
                    {isSaving && "Saving..."}
                </div>
            );
        } else {
            return (
                /* ------------------------------------------ RESULT PAGE ------------------------------------------- */

                <div className="result-page">

                    {/* ------------------------------------- RESULT PAGE HEADER ----------------------------------- */}

                    <div className='result-page-header'>
                        <span>{tableName}</span>

                        <button className='result-page-header-show-hidden-btn' onClick={() => this.openHiddenColumnsPopup()}>Show hidden</button>

                        <HiddenColumnsPopup unhide={this.unhideColumn} showAll={this.unhideAllColumns} hide={this.hideColumn} selectedColumns={hiddenColumns} columns={headers} isOpen={isOpenHiddenColumnsPopup} done={this.closeHiddenColumnsPopup}/>
                    </div>

                    {/* ------------------------------------- RESULT PAGE BODY ------------------------------------- */}

                    <div className="result-page-body">
                        <table>

                            {/* ------------------------------------ TABLE HEADER ---------------------------------- */}

                            <tr className={'table-header'}>
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
                                                            currentHeaderIsDate = /^\d{4}(\-|\/)(((0)[0-9])|((1)[0-2]))(\-|\/)([0-2][0-9]|(3)[0-1])$/.test(dateFormat);

                                                        } else {
                                                            currentHeaderIsNumber = /^-?\d+$/.test(value);
                                                        }
                                                    }
                                                }
                                            }
                                        }

                                        const FORMAT = 'MM/dd/yyyy';

                                        return (

                                            /* ------------------------- TABLE HEADER ITEMS ------------------------- */

                                            <th key={header}>
                                                <div className="table-header-items">

                                                    {/* ---------------- NAME, SORTING ARROW, SEARCH --------------- */}

                                                    <div className={'column-name-and-search'}>
                                                        {/*<img src={deleteForeverIcon} className="delete-forever-icon" onClick={() => this.removeColumn(header)}/>*/}
                                                        <span id="header-title">{header}</span>

                                                        <svg
                                                            className={currentOption.order === ASC ? "arrow-up" : "arrow-down"}
                                                            id="header-order"
                                                            onClick={() => this.handleChangeOrder(header)} width="8"
                                                            height="6" viewBox="0 0 8 6"
                                                            xmlns="http://www.w3.org/2000/svg">
                                                            <path
                                                                d="M3.29485 5.64314L0.191029 1.51048C0.0874326 1.37276 0.0230023 1.20734 0.00510605 1.03315C-0.0127902 0.858956 0.0165701 0.683014 0.0898297 0.525442C0.163089 0.36787 0.277291 0.235028 0.419375 0.142109C0.561459 0.0491897 0.725691 -5.71337e-05 0.89329 4.97427e-08H7.10671C7.27431 -5.71337e-05 7.43854 0.0491897 7.58063 0.142109C7.72271 0.235028 7.83691 0.36787 7.91017 0.525442C7.98343 0.683014 8.01279 0.858956 7.99489 1.03315C7.977 1.20734 7.91257 1.37276 7.80897 1.51048L4.69937 5.64314C4.61582 5.75434 4.50918 5.84424 4.38753 5.90606C4.26588 5.96788 4.13238 6 3.99711 6C3.86184 6 3.72834 5.96788 3.60669 5.90606C3.48503 5.84424 3.3784 5.75434 3.29485 5.64314Z"
                                                                fill="#A7A9AC"/>
                                                        </svg>

                                                        {!currentOption.isFilterOpened &&
                                                            <input id="header-search"
                                                                   type="search"
                                                                   placeholder={"Search"}
                                                                   value={currentOption.search}
                                                                   onChange={(e) => this.handleChangeSearchValue(e, header)}
                                                            />
                                                        }
                                                    </div>

                                                    {/* -------------------------- FILTERS ------------------------- */}

                                                    <div className="column-filters">
                                                        <svg className="hide-icon" width="13" height="11"
                                                             onClick={() => this.removeColumn(header)}
                                                             viewBox="0 0 13 11" xmlns="http://www.w3.org/2000/svg">
                                                            <path
                                                                d="M6.50002 7.98322C7.88942 7.98322 9.01956 6.86926 9.01956 5.49976C9.01956 5.07387 8.90002 4.67873 8.7075 4.3276L12.0797 1.0037L11.0614 0L9.67969 1.36193C8.72574 0.861734 7.64361 0.578275 6.50002 0.578275C3.5071 0.578275 0.907861 2.47305 0.0316863 5.29202C-0.0105621 5.42783 -0.0105621 5.57217 0.0316863 5.70798C0.421044 6.96012 1.15271 8.02581 2.10618 8.82745L0.920344 9.9963L1.93863 11L5.31082 7.6761C5.66705 7.86492 6.06793 7.98322 6.50002 7.98322ZM5.42076 5.49976C5.42076 4.91344 5.9047 4.43597 6.50002 4.43597C6.51922 4.43597 6.53651 4.4407 6.55523 4.44164L5.42652 5.55466C5.42556 5.53573 5.42076 5.51822 5.42076 5.49976ZM7.57927 5.49976C7.57927 6.08608 7.09534 6.56356 6.50002 6.56356C6.48082 6.56356 6.46353 6.55883 6.44481 6.55788L7.57351 5.44487C7.57447 5.4638 7.57927 5.48131 7.57927 5.49976ZM1.47822 5.49976C2.22765 3.3963 4.2186 1.99794 6.50002 1.99794C7.24369 1.99794 7.95471 2.14937 8.60284 2.42336L7.68922 3.3239C7.33347 3.13461 6.93259 3.0163 6.50002 3.0163C5.11062 3.0163 3.98048 4.13026 3.98048 5.49976C3.98048 5.92566 4.10002 6.3208 4.29254 6.67193L3.13167 7.81618C2.3928 7.22181 1.81044 6.43343 1.47822 5.49976Z"/>
                                                            <path
                                                                d="M12.9683 5.29202C12.7139 4.47335 12.3101 3.7356 11.7974 3.09581L10.7714 4.10708C11.0849 4.52399 11.3403 4.99058 11.5218 5.49977C10.7719 7.60323 8.78139 9.0016 6.49998 9.0016C6.27961 9.0016 6.06309 8.98503 5.84897 8.95901L4.63 10.1605C5.22676 10.328 5.85329 10.4213 6.49998 10.4213C9.4929 10.4213 12.0921 8.52696 12.9683 5.70751C13.0106 5.5717 13.0106 5.42784 12.9683 5.29202Z"/>
                                                        </svg>
                                                        {
                                                            ((!currentHeaderIsDate && currentHeaderIsNumber)) &&
                                                            <img id="header-filter" src={filterIcon} className="filter"
                                                                 onClick={() => this.handleOpenFilter(header)}/>
                                                        }
                                                        {
                                                            (currentHeaderIsDate && !currentHeaderIsNumber) &&
                                                            <img id="header-calendar" src={filterIcon} className="filter"
                                                                 onClick={() => this.handleOpenFilter(header)}/>
                                                        }
                                                    </div>
                                                </div>
                                                    <div className="header-data-operations">
                                                        {
                                                            (((!currentHeaderIsDate && currentHeaderIsNumber)) && currentOption.isFilterOpened) &&
                                                                <TableFilter style={{marginLeft: 200}} isOpen={true} children={
                                                                    <div className="header-filters" key={header}>

                                                                        <div className="header-filters-title">Filter by</div>

                                                                        <div className="header-filters-inputs">
                                                                            <input className="filter-field1"
                                                                                   type="search"
                                                                                   placeholder={"From"}
                                                                                   value={currentOption.filter1}
                                                                                   onChange={(e) => this.handleChangeFilterValue1(e, header)}/>
                                                                            <div className="filter-fields-line">-</div>
                                                                            <input className="filter-field2"
                                                                                   type="search"
                                                                                   placeholder={"To"}
                                                                                   value={currentOption.filter2}
                                                                                   onChange={(e) => this.handleChangeFilterValue2(e, header)}/>
                                                                        </div>

                                                                        <div className="filters-buttons">
                                                                            <btn id="reset-filters-btn" onClick={() => this.clearFilters(header)}>Reset</btn>
                                                                            <btn id="apply-filters-btn" onClick={() => this.clearFilters(header)}>Apply</btn>
                                                                        </div>
                                                                    </div>
                                                                }/>
                                                        }
                                                        {
                                                            ((currentHeaderIsDate && !currentHeaderIsNumber) && currentOption.isFilterOpened) &&
                                                                <TableFilter isOpen={true} children={
                                                                    <div className="header-filters" key={header}>

                                                                        <div className="header-filters-inputs">
                                                                            <div className="filter-field1">
                                                                                <DayPickerInput
                                                                                    style={{color: "#3E3E3E"}}
                                                                                    formatDate={this.formatDate}
                                                                                    format={FORMAT}
                                                                                    value={currentOption.filter1}
                                                                                    parseDate={(date) => this.handleDatePicker1(date, header)}
                                                                                    placeholder={`Start`}
                                                                                />
                                                                            </div>
                                                                            <div className="filter-field2">
                                                                                <DayPickerInput
                                                                                    style={{color: "#3E3E3E"}}
                                                                                    formatDate={this.formatDate}
                                                                                    format={FORMAT}
                                                                                    value={currentOption.filter2}
                                                                                    parseDate={(date) => this.handleDatePicker2(date, header)}
                                                                                    placeholder={`End`}
                                                                                />
                                                                            </div>
                                                                        </div>

                                                                        <btn id="clear-filters-btn" onClick={() => this.clearFilters(header)}>clear date</btn>

                                                                    </div>
                                                                }/>
                                                        }
                                                    </div>
                                            </th>
                                        );
                                    }) : null
                                }
                            </tr>

                            {/* ------------------------------------------ POPUPS ----------------------------------------- */}
                            <TableRowPopup isOpen={setTableModalActive} onCancel={this.handleCancel} tableInfo={selectedRowInfo}/>
                            <TableImgPopup isOpen={TableImgModalActive} onCancel={this.handleImgCancel} columnImg={columnImg}/>

                            {/* -------------------------------------- TABLE BODY ---------------------------------- */}
                            { // Rows

                                ( rows && !isNullResults ) ? rows.map((item, rowKey) => {
                                        return (

                                            /* ------------------------------ TABLE LINE ---------------------------- */

                                            <tr key={rowKey} className={'table-line'}>
                                                { Object.values(item).map((get_item, key) => {

                                                    let renderItem;

                                                    if (typeof get_item === 'object') {

                                                        if (get_item === null) {
                                                            renderItem = "";
                                                        } else {
                                                            renderItem = JSON.stringify(get_item);
                                                        }

                                                    } else {
                                                        renderItem = get_item;
                                                    }

                                                    return (

                                                        /* ---------------------- TABLE COLUMN ---------------------- */

                                                        <td key={key}
                                                            className={rowKey === idRow ? 'table-active-line' : ''}
                                                            onClick={() => {
                                                                this.setState({
                                                                    idRow: rowKey,
                                                                    selectedRowInfo: Object.entries(item),
                                                                    columnImg: get_item
                                                                })
                                                            }
                                                            }

                                                            onDoubleClick={() => {
                                                                this.setTableModal(!setTableModalActive);
                                                                console.log(setTableModalActive)
                                                            }}>
                                                            {this.ImgCheck(renderItem)}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })
                                : null
                            }
                        </table>
                    </div>

                    {/* ------------------------------------- RESULT PAGE FOOTER ----------------------------------- */}

                    <div className="result-page-footer">

                        {/* ----------------------------------- FOOTER SAVE BUTTON --------------------------------- */}

                        <div className="result-page-footer-save-button">
                            { limitWarning ?
                                <div className="warning">{limitWarning}</div> :
                                <div></div>
                            }
                            <div className="save-table-button">
                                <svg>
                                    <path d="M11.3876 7.78938H2.61183C2.4579 7.78938 2.31027 7.85052 2.20142 7.95937C2.09257 8.06822 2.03142 8.21585 2.03142 8.36978V13.3032C2.03142 13.4572 2.09257 13.6048 2.20142 13.7136C2.31027 13.8225 2.4579 13.8836 2.61183 13.8836H11.3876C11.5415 13.8836 11.6891 13.8225 11.798 13.7136C11.9068 13.6048 11.968 13.4572 11.968 13.3032V8.36978C11.968 8.21585 11.9068 8.06822 11.798 7.95937C11.6891 7.85052 11.5415 7.78938 11.3876 7.78938ZM10.8072 10.2532H7.58011V8.95019H10.8072V10.2532ZM6.4193 8.95019V10.2532H3.19224V8.95019H6.4193ZM3.19224 11.414H6.4193V12.7228H3.19224V11.414ZM7.58011 12.7228V11.4169H10.8072V12.7228H7.58011ZM13.9646 4.34466C13.9608 4.3363 13.9559 4.32849 13.9501 4.32144C13.9383 4.29539 13.9247 4.27018 13.9094 4.24599L13.8804 4.21117L13.834 4.15893L9.58542 0.151222L9.54769 0.1193L9.50706 0.0873772L9.45483 0.0583568L9.40839 0.0351406L9.34745 0.0177284L9.30102 0.00321822C9.26341 -0.00107274 9.22544 -0.00107274 9.18784 0.00321822H2.32163C1.70589 0.00321822 1.11538 0.247818 0.679989 0.683207C0.244599 1.1186 0 1.70911 0 2.32485V14.4263C0 15.0421 0.244599 15.6326 0.679989 16.068C1.11538 16.5034 1.70589 16.748 2.32163 16.748H11.6778C12.2935 16.748 12.884 16.5034 13.3194 16.068C13.7548 15.6326 13.9994 15.0421 13.9994 14.4263V4.57392C14.0029 4.49596 13.991 4.41808 13.9646 4.34466ZM9.76824 1.91856L11.9593 3.99351H9.76824V1.91856ZM11.6778 15.5871H2.32163C2.01376 15.5871 1.7185 15.4648 1.50081 15.2471C1.28311 15.0295 1.16081 14.7342 1.16081 14.4263V2.31324C1.16081 2.00537 1.28311 1.71011 1.50081 1.49242C1.7185 1.27472 2.01376 1.15242 2.32163 1.15242H8.60743V4.57392C8.60743 4.72786 8.66858 4.87548 8.77743 4.98433C8.88628 5.09318 9.03391 5.15433 9.18784 5.15433H12.8386V14.4263C12.8386 14.7342 12.7163 15.0295 12.4986 15.2471C12.2809 15.4648 11.9856 15.5871 11.6778 15.5871Z"/>
                                </svg>
                                <button onClick={() => this.save()}>Export excel</button>
                            </div>
                        </div>

                        {/* --------------------------------- FOOTER INFO AND BUTTONS ------------------------------ */}

                        <div className="result-page-footer-page-buttons">
                            <div className="table-lines-on-page">
                                <span className="result-page-footer-text">Rows per page:
                                    <select value={rowsPerPage} onChange={this.handlePageChange} className="result-page-footer-select">
                                      <option value={10}>10</option>
                                      <option value={20}>20</option>
                                      <option value={50}>50</option>
                                      <option value={60}>60</option>
                                    </select>
                                </span>
                            </div>
                            <div className={'table-lines-amount'}>
                                <span className={'result-page-footer-text'}>{paginationFrom}-{paginationTo} of {records}</span>
                            </div>

                            {/* --------------------------------- FOOTER PAGE BUTTONS ------------------------------ */}

                            <div className={'result-table-pages'}>
                                <button id="select-page-btn" onClick={() => this.changePage(-1)}
                                        disabled={this.state.pageNumber == 0}>
                                    <img className={'result-table-pages-arrow-left'} src={footer_arrow_left} alt={'arrow left'}/>
                                </button>
                                <button id="select-page-btn" onClick={() => this.changePage(1)}
                                        disabled={this.state.pageNumber == this.state.pages - 1}>
                                    <img className={'result-table-pages-arrow-right'} src={footer_arrow_right} alt={'arrow right'}/>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    }
}