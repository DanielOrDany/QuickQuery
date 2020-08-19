import React from 'react';
import '../styles/Tables.scss';
import {
    Route
} from 'react-router-dom';
import CreateTable from "./CreateTable";
import Result from "./Result";
import { ContextMenu, ContextMenuTrigger } from "react-contextmenu";
import { getAllTables, getTable, deleteTable} from "../methods";
import xxx from "../icons/Gear-0.2s-200px (1).svg";


export default class Tables extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            tables: []
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
            this.setState({tables: tables});
        }
    }

    loadTables(connectionName) {
        getAllTables(connectionName).then(tables => {
            this.setState({tables: tables});
        });
    }

    openTable(alias) {
        const connectionName = JSON.parse(localStorage.getItem('current_connection')).name;
        getTable(connectionName, alias).then(result => {
            localStorage.setItem("current_result", JSON.stringify(result));
            const results = JSON.parse(localStorage.getItem("results"));
            if (results) {
                results.push(result);
                localStorage.setItem("results", JSON.stringify(results));
            } else {
                localStorage.setItem("results", JSON.stringify([result]));
            }

            return '#tables/result';
        }).then(url => window.location.hash = url);
    }

    editTable(table) {
        localStorage.setItem("current_result", JSON.stringify(table));
        window.location.hash = "#/create-table";
    }

    deleteTable(alias) {
        const connectionName = JSON.parse(localStorage.getItem('current_connection')).name;
        deleteTable(connectionName, alias).then(tables => {
            if(tables)  {
                this.setState({tables: tables});
            }
        });
    }

    createTable() {
        if(localStorage.getItem("current_result")){
            localStorage.removeItem("current_result");
        }
        window.location.hash = "#/create-table"
    }


    render() {
        if (!this.state.tables){
            return (
                <div className={"loading"}>
                    <img src={xxx}/>
                    Loading...
                </div>
            );
        } else return(
                <div className="all-page">

                    <div className="left-side">
                        <div id="mini-menu">

                            <button type="button" className="add-button" onClick={() => {window.location.hash = "#tables/create-table"}}>
                                Add
                            </button>

                            <div className="search">
                                <input id="search-field"/>
                            </div>

                        </div>

                        <div id="tables">
                            {this.state.tables
                                .map(table => {
                                    return(
                                        <div className="table" key={table.name}>
                                            <div className="container" onDoubleClick={() => this.openTable(table.alias)}>
                                                <div id="table-name">
                                                    <span>&#11044;</span>
                                                    <div id="name">
                                                        <p id="table-n">{table.alias}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    </div>


                    <div className="line"></div>


                    <div className="right-side">
                        <Route path="/tables/create-table" component={CreateTable} />
                        <Route path="/tables/result" component={Result}/>
                    </div>
                </div>
            // <div className="tables">
            //     <div className="folders-list">
            //         <div className="folder" onClick={() => this.createTable()}>
            //             <svg className={"svg_icon"} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#d99900" width="60px" height="60px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-8-2h2v-4h4v-2h-4V7h-2v4H7v2h4z"/></svg>
            //             <p className="folder__title" style={localStorage.getItem("theme") ? {color: "white"} :  {color: "#363740"}}>
            //                 create new
            //             </p>
            //         </div>
            //         {this.state.tables
            //             .map((table) => (
            //                 <div key={table.alias} className="folder" onDoubleClick={() => this.openTable(table.alias)}>
            //                     <ContextMenuTrigger id={table.alias}>
            //                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1EB7B7" width="60px" height="60px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/></svg>
            //                     </ContextMenuTrigger>
            //                     <p className="folder__title" style={localStorage.getItem("theme") ? {color: "white"} :  {color: "#363740"}}>
            //                         {table.alias}
            //                     </p>
            //                     <ContextMenu id={table.alias} className="folder__menu">
            //                         <div className="folder__menu">
            //                             <span className="folder__menu__item" onClick={() => this.openTable(table.alias)}>
            //                                 open
            //                             </span>
            //                             <span className="folder__menu__item" onClick={() => this.editTable(table)}>
            //                                 edit query
            //                             </span>
            //                             <span className="folder__menu__item" onClick={() => this.deleteTable(table.alias)}>
            //                                 delete
            //                             </span>
            //                         </div>
            //                         <span className="folder__menu__line"/>
            //                     </ContextMenu>
            //                 </div>
            //             ))}
            //     </div>
            // </div>
        );
    }

}
