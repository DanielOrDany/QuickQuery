import React from 'react';
import '../styles/Tables.scss';
import {
    Route
} from 'react-router-dom';
import CreateTable from "./CreateTable";
import Result from "./Result";
import {getAllTables, getTable} from "../methods";
import {ReactComponent as MiniMenuIcon} from "../icons/open-menu.svg";
import xxx from "../icons/Gear-0.2s-200px (1).svg";
import plus from "../icons/plus.png";

import MiniMenu from "./MiniMenu";
import Modal from './Modal';

export default class Tables extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            tables: [],
            searchedTables: [],
            isOpen: false
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

            return `#/tables/result/${alias}`;
        }).then(url => window.location.hash = url);
    }

    createTable() {
        if (localStorage.getItem("current_result_info")) {
            localStorage.removeItem("current_result_info");
        }
        window.location.hash = "#/tables/create-table"
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
        if (!this.state.tables) {
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
                    isOpen={this.state.isOpen}
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
                            <input id="search-field" type="search"/>
                            <button type="button" className="search-button" onClick={() => this.search()}>Search
                            </button>
                        </div>

                    </div>

                    <div id="list">List of queries:</div>
                    <div id="lineUp"></div>

                    <div id="tables">
                        {this.state.searchedTables
                            .map(table => {
                                    return (
                                        <div id={table.alias} className="table" key={table.alias}>
                                            <div className="container">
                                                <div id="table-name" onClick={() => this.openTable(table.alias)}>
                                                    <span>&#11044;</span>
                                                    <div id="name">
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
                    <div id="add-btn-field">

                        <img className="add-button" src={plus} onClick={() => this.createTable()}/>

                    </div>



                </div>


                <div className="line-tables-page"></div>


                <div className="right-side-tables-page">
                    <Route path="/tables/create-table" component={CreateTable}/>
                    <Route path={`/tables/edit-table/:tableAlias`} component={CreateTable}/>
                    <Route path={`/tables/result/:tableAlias`} component={Result}/>
                </div>
            </div>
        );
    }
}
