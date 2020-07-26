import React from 'react';
import '../styles/Connections.scss';
import { getDataFromDatabase, deleteConnection, addConnection } from "../methods";
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import database_icon from "../icons/software.svg"


export default class Connections extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            connections: [],
            nameInput: '',
            hostInput: '',
            portInput: '',
            userInput: '',
            passwordInput: '',
            databaseInput: '',
            schemaInput: '',
            dtypeInput: 'mysql',
            errorMessage: ""
        };
    };

    componentDidMount () {
        getDataFromDatabase()
            .then(data => {
                console.log("DATA", data);
                this.setState({
                    connections: data.connections
                });
                localStorage.setItem("connections", JSON.stringify(data.connections));
                localStorage.setItem("data", JSON.stringify(data));
            });
    };

    addConnection () {
        let nameInput = this.state.nameInput;
        let hostInput = this.state.hostInput;
        let portInput = this.state.portInput;
        let userInput = this.state.userInput;
        let passwordInput = this.state.passwordInput;
        let databaseInput = this.state.databaseInput;
        let schemaInput = this.state.schemaInput;
        let dtypeInput = this.state.dtypeInput;

        function inputVirify(args) {
            return args.replace(/^\s+|\s+$/gm, '').length;
        }

        if (inputVirify(nameInput) > 0 &&
            inputVirify(hostInput) > 0 &&
            inputVirify(portInput) > 0 &&
            inputVirify(userInput) > 0 &&
            inputVirify(passwordInput) > 0 &&
            inputVirify(databaseInput) > 0 &&
            inputVirify(schemaInput) > 0 &&
            inputVirify(dtypeInput) > 0
        ) {
            addConnection(
                nameInput,
                hostInput,
                portInput,
                userInput,
                passwordInput,
                databaseInput,
                schemaInput,
                dtypeInput
            ).then(connection => {
                if (connection) {
                    const connections = JSON.parse(localStorage.getItem("connections"));
                    connections.push(connection);
                    localStorage.setItem("connections", JSON.stringify(connections));
                    this.setState({
                        connections: JSON.parse(localStorage.getItem("connections")),
                        badQuery: 0,
                        errorMessage: ""
                    });
                    document.getElementById("db-name").value = "";
                    document.getElementById("db-host").value = "";
                    document.getElementById("db-port").value = "";
                    document.getElementById("db-user").value = "";
                    document.getElementById("db-password").value = "";
                    document.getElementById("db-database").value = "";
                    document.getElementById("db-schema").value = "";
                } else {
                    this.setState({
                        badQuery: 1,
                        errorMessage: "Bad URI."
                    });
                }
            });
        } else {
            this.setState({
                badQuery: 1,
                errorMessage: "Please, fill in all the fields."
            });
        }
    };

    deleteConnection (name) {
        deleteConnection(name).then(connections => {
            if (connections) {
                this.setState({connections: connections});
            }
        });
    };

    getConnectionData (connectionName) {
        return this.state.connections.find(connection => connection.name === connectionName);
    };

    openConnection (name) {
        const currentConnection = this.getConnectionData(name);
        localStorage.setItem('current_connection', JSON.stringify(currentConnection));

        window.location.pathname = '/tables';
    };

    nameOnChange = (e) => {
        this.setState({nameInput: e.target.value})
    };
    hostOnChange = (e) => {
        this.setState({hostInput: e.target.value})
    };
    portOnChange = (e) => {
        this.setState({portInput: e.target.value})
    };
    userOnChange = (e) => {
        this.setState({userInput: e.target.value})
    };
    passwordOnChange = (e) => {
        this.setState({passwordInput: e.target.value})
    };
    databaseOnChange = (e) => {
        this.setState({databaseInput: e.target.value})
    };
    schemaOnChange = (e) => {
        this.setState({schemaInput: e.target.value})
    };
    dtypeOnChange = (e) => {
        this.setState({dtypeInput: e.target.value})
    };

    nameKeyPress = (e) => {
        if(e.key === "Enter"){
            if (this.state.urlInput) {
                this.addConnection();
            } else {
                this.refs.url.focus();
            }
        }
    };

    showURI (URI) {
        alert (URI);
    };

    render() {
        return (
            <div className="container">
                <div className="column left">
                    <div className="db_field">
                        <b>Connection</b>
                    </div>

                    <div className="db_field">
                        <span>Name</span>
                        <input id="db-name" ref="name" className="form-control" type="text" placeholder="Yoda"
                               defaultValue={this.state.nameInput} onChange={this.nameOnChange}
                               onKeyPress={this.nameKeyPress}/>
                    </div>

                    <div className="db_field">
                        <span>Host</span>
                        <input id="db-host" ref="host" className="form-control" type="text" placeholder="127.0.0.1"
                               defaultValue={this.state.hostInput} onChange={this.hostOnChange}
                               onKeyPress={this.hostKeyPress}/>
                    </div>


                    <div className="db_field">
                        <span>Port</span>
                        <input id="db-port" ref="port" className="form-control" type="text" placeholder="5432"
                               defaultValue={this.state.portInput} onChange={this.portOnChange}
                               onKeyPress={this.portKeyPress}/>
                    </div>

                    <div className="db_field">
                        <span>User</span>
                        <input id="db-user" ref="user" className="form-control" type="text" placeholder="user name"
                               defaultValue={this.state.userInput} onChange={this.userOnChange}
                               onKeyPress={this.userKeyPress}/>
                    </div>

                    <div className="db_field">
                        <span>Password</span>
                        <input id="db-password" ref="password" className="form-control" type="text" placeholder="password"
                               defaultValue={this.state.passwordInput} onChange={this.passwordOnChange}
                               onKeyPress={this.passwordKeyPress}/>
                    </div>

                    <div className="db_field">
                        <span>Database</span>
                        <input id="db-database" ref="database" className="form-control" type="text" placeholder="database name"
                               defaultValue={this.state.databaseInput} onChange={this.databaseOnChange}
                               onKeyPress={this.databaseKeyPress}/>
                    </div>

                    <div className="db_field">
                        <span>Schema</span>
                        <input id="db-schema" ref="schema" className="form-control" type="text" placeholder="schema name"
                               defaultValue={this.state.schemaInput} onChange={this.schemaOnChange}
                               onKeyPress={this.schemaKeyPress}/>
                    </div>

                    <div className="db_field">
                        <span>Choose d-base type</span>
                        <select
                            value={this.state.dtypeInput}
                            onChange={this.dtypeOnChange}
                        >
                            <option value="mysql">mysql</option>
                            <option value="postgres">postgres</option>
                        </select>
                    </div>

                    <button type="button" style={localStorage.getItem("theme") ? {color: "white"} :  {color: "#363740"}}  className="btn add-btn" onClick={() => this.addConnection()}>Add</button>

                    {this.state.badQuery > 0 &&
                        <div id="errorMessage" className="alert">
                            <strong>Message!</strong> {this.state.errorMessage}
                        </div>
                    }
                </div>

                <hr/>

                <div className="right">
                    {this.state.connections ? this.state.connections.map(conn => {
                            return (
                                <div className="connection-folder" key={conn.name}>

                                    <ContextMenuTrigger id={conn.name}>

                                        <div className="link-container" onDoubleClick={() => this.openConnection(conn.name)}>
                                            <img alt={"icon database"} src={database_icon}/>
                                            <div className="link">
                                                <p>{conn.name}</p>
                                            </div>

                                        </div>

                                    </ContextMenuTrigger>

                                    <ContextMenu id={conn.name} className="url-menu">

                                        <span className="url-menu-title">
                                            Connection menu:
                                        </span>

                                        <span className="url-menu-line"/>

                                        <div className="url-menu-item" onClick={() => this.showURI(conn.URI)}>
                                            <MenuItem>Show URI</MenuItem>
                                        </div>

                                        <div className="url-menu-item" onClick={() => this.deleteConnection(conn.name)}>
                                            <MenuItem>Delete URI</MenuItem>
                                        </div>

                                    </ContextMenu>

                                </div>
                            )
                        }
                    ): null}
                </div>
            </div>
        );
    }
}
