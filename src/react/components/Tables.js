import React from 'react';
import '../styles/Tables.scss';
import {
    Route
} from 'react-router-dom';
import CreateTable from "./CreateTable";
import Result from "./Result";
import { getAllTables, getTable} from "../methods";
import { ReactComponent as MiniMenuIcon } from "../icons/open-menu.svg";
import xxx from "../icons/Gear-0.2s-200px (1).svg";
import MiniMenu from "./MiniMenu";

export default class Tables extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            tables: [],
            searchedTables: []
        };
    }

    componentDidMount() {
        if (!localStorage.getItem('current_connection')) {
            alert('pl, choose table');
            window.location.hash = '#/connections';
        }

        if (!localStorage.getItem('current_tables')) {
            const database = JSON.parse(localStorage.getItem("data"));
            const connections = database.connections;
            const connectionName = JSON.parse(localStorage.getItem('current_connection')).name;
            const result = connections.filter(connection => connection.name === connectionName);

            // Verify if connection is not deleted!
            if (result.length !== 0) {
                this.loadTables(connectionName);
            } else {
                //return to connections
                alert('pl, choose connection');
                window.location.hash = '#/connections';
            }
        } else {
            const tables = JSON.parse(localStorage.getItem('current_tables'));
            localStorage.removeItem('current_tables');
            this.setState({
                tables: tables,
                searchedTables: tables
            });
        }
    }

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
        if(localStorage.getItem("current_result_info")){
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

        this.setState({ searchedTables: searchedTables });
    };

    render() {
        if (!this.state.tables){
            return (
                <div className={"loading"}>
                    <img src={xxx}/>
                    Loading...
                </div>
            );
        } else return(
                <div className="all-page-tables">

                    <div className="left-side">
                        <div id="mini-menu">

                            <button type="button" className="add-button" onClick={() => this.createTable()}>
                                Add
                            </button>

                            <div className="search">
                                <input id="search-field"/>
                                <button type="button" className="search-button" onClick={() => this.search()}>Search</button>
                            </div>

                        </div>

                        <div id="tables">
                            {this.state.searchedTables
                                .map(table => {
                                    return(
                                        <div className="table" key={table.name}>
                                            <div className="container">
                                                <div id="table-name" onClick={() => this.openTable(table.alias)}>
                                                    <span>&#11044;</span>
                                                    <div id="name">
                                                        <p id="table-n">{table.alias}</p>
                                                    </div>
                                                </div>
                                                <MiniMenu icon={<MiniMenuIcon />} table={table}/>
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    </div>


                    <div className="line-tables-page"></div>


                    <div className="right-side-tables-page">
                        <Route path="/tables/create-table" component={CreateTable} />
                        <Route path={`/tables/result/:tableAlias`} component={Result}/>
                    </div>
                </div>
        );
    }
}
