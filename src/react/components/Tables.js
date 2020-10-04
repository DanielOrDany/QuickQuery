import React from 'react';
import '../styles/Tables.scss';
import { Route } from 'react-router-dom';
import CreateTable from "./CreateTable";
import Result from "./Result";
import { getAllTables, getTable } from "../methods";
import { ReactComponent as MiniMenuIcon } from "../icons/open-menu.svg";
import xxx from "../icons/Gear-0.2s-200px (1).svg";
import plus from "../icons/plus.svg";
import emptyBox from "../icons/empty-box-open.svg";
import table from "../icons/table.svg";
import add from "../icons/add.svg";

import MiniMenu from "./MiniMenu";
import Modal from './Modal';

export default class Tables extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            tables: [],
            searchedTables: [],
            isOpen: false,
            currentConnection: ""
        };
    }

    componentDidMount() {
        if (
            !localStorage.getItem('current_connection')
        ) {
            this.openModal();
            return;
        }

        const connectionName = JSON.parse(localStorage.getItem('current_connection')).name;
        this.loadTables(connectionName);
    }

    componentDidUpdate() {
        if (localStorage.getItem("need_update")) {
            localStorage.removeItem("need_update");
            this.loadTables(JSON.parse(localStorage.getItem('current_connection')).name);
        }

        if (localStorage.getItem("new_table")) {
            localStorage.removeItem("new_table");
            this.loadTables(JSON.parse(localStorage.getItem('current_connection')).name);
        }
    }

    openModal = () => {
        this.setState({isOpen: true});
    };

    handleSubmit = () => {
        this.setState({isOpen: false});
        window.location.hash = '#/connections';
    };

    handleCancel = () => {
        this.setState({isOpen: false});
        window.location.hash = '#/connections';
    };

    loadTables(connectionName) {
        getAllTables(connectionName).then(tables => {
            this.setState({
                tables: tables,
                searchedTables: tables
            });
        });
    }

    openTable(alias) {
        const connectionName = JSON.parse(localStorage.getItem('current_connection')).name;
        getTable(connectionName, alias).then(result => {
            localStorage.setItem("current_result_info", JSON.stringify(result));
            const results = JSON.parse(localStorage.getItem("results"));

            if (results) {
                results.push(result);
                localStorage.setItem("results", JSON.stringify(results));
            } else {
                localStorage.setItem("results", JSON.stringify([result]));
            }

            return `#/tables/${window.location.hash.split('/')[1]}/result/${alias}`;
        }).then(url => {
            window.location.hash = url;
            localStorage.removeItem("openedTable");
            this.setState({
                currentOpenedTable: alias
            });
        });
    }

    createTable() {
        if (localStorage.getItem("current_result_info")) {
            localStorage.removeItem("current_result_info");
        }

        if(localStorage.getItem("openedTable")) {
            localStorage.removeItem("openedTable");
        }

        if(this.state.currentOpenedTable != "") {
            this.setState({
                currentOpenedTable: ""
            });
        }

        window.location.hash = `#/tables/${window.location.hash.split('/')[1]}/create-table`;
    }

    search = () => {
        const searchValue = document.getElementById('search-field').value;
        let searchedTables = [];

        this.state.tables.forEach(table => {
            if (table.alias.includes(searchValue)) {
                searchedTables.push(table);
            }
        });

        this.setState({searchedTables: searchedTables});
    };

    render() {
        const { currentOpenedTable, tables, isOpen, searchedTables } = this.state;

        if (!tables) {
            return (
                <div className={"loading"}>
                    <img src={xxx}/>
                    Loading...
                </div>
            );
        } else return (
            <div className="all-page-tables">
                <Modal
                    title="Error"
                    isOpen={isOpen}
                    onCancel={this.handleCancel}
                    onSubmit={this.handleSubmit}
                    submitTitle="OK"
                >
                    <div>
                        <strong>Choose the connection. If you don't have any connection, please add a new one.</strong>
                    </div>
                </Modal>

                <div className="left-side">
                    <div id="mini-menu">
                        <div className="search">
                            <input id="search-field" type="search" placeholder={"search.."}/>
                            <button type="button" className="search-button" onClick={() => this.search()}>Search
                            </button>
                        </div>
                    </div>
                    
                    <div id="list">List of queries:</div>
                    <div id="lineUp"></div>

                    <div id="tables">
                        <div className="table">
                            <div className="btn-container" onClick={() => this.createTable()}>
                                <div id="add-btn-field">
                                    <img className="add-button" src={plus}/>
                                    <div className="button-text">Add new query</div>
                                </div>
                            </div>
                        </div>
                        {
                            searchedTables.map(table => {
                                return (
                                    <div id={table.alias} className="table" key={table.alias}>
                                        <div className="container">
                                            <div id="table-name" onClick={() => this.openTable(table.alias)}>
                                                <span style={localStorage.getItem("openedTable") ? table.alias === localStorage.getItem("openedTable") ? {color: "#eb6e3b"} : null : table.alias === currentOpenedTable ? {color: "#eb6e3b"} : null}>&#11044;</span>
                                                <div id="name">{}
                                                    <p id="table-n">{table.alias}</p>
                                                </div>
                                            </div>
                                            <MiniMenu icon={<MiniMenuIcon/>} table={table}/>
                                        </div>
                                    </div>
                                );
                            }
                        )}
                    </div>
                </div>

                <div className="line-tables-page"></div>

                <div className="right-side-tables-page">
                    {
                        (!window.location.hash.includes("edit-table") &&
                            !window.location.hash.includes("result") &&
                            !window.location.hash.includes("create-table")) &&
                            <div className="empty-result-row">
                                <div className="empty-result-column">
                                    <img className="empty-result-box" src={emptyBox}/>
                                    <span>Query is not selected.</span>
                                    <span>Please select a query from queries list.</span>
                                </div>
                            </div>
                    }
                    <Route path={`/tables/:connectionAlias/create-table`} component={CreateTable}/>
                    <Route path={`/tables/:connectionAlias/edit-table/:tableAlias`} component={CreateTable}/>
                    <Route path={`/tables/:connectionAlias/result/:tableAlias`} component={Result}/>
                </div>
            </div>
        );
    }
}
