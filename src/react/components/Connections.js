import React from 'react';
import {
    getDataFromDatabase,
    deleteConnection,
    addConnection
} from "../methods";

import database_icon from "../icons/software.png";
import delete_icon from "../icons/delete_icon.png";
import '../styles/Connections.scss';


export default class Connections extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            connections: [],
            searchedConnections: [],
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

    componentDidMount() {
        getDataFromDatabase()
            .then(data => {
                console.log("DATA", data);
                this.setState({
                    connections: data.connections,
                    searchedConnections: data.connections
                });
                localStorage.setItem("connections", JSON.stringify(data.connections));
                localStorage.setItem("data", JSON.stringify(data));
            });
    };

    addConnection() {
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
                console.log('connection', connection);
                if (connection) {
                    const connections = JSON.parse(localStorage.getItem("connections"));
                    connections.push(connection);
                    localStorage.setItem("connections", JSON.stringify(connections));
                    this.setState({
                        connections: JSON.parse(localStorage.getItem("connections")),
                        searchedConnections: JSON.parse(localStorage.getItem("connections")),
                        badQuery: 0,
                        errorMessage: ""
                    });

                    document.getElementById("input-field-name").value = "";
                    document.getElementById("input-field-host").value = "";
                    document.getElementById("input-field-port").value = "";
                    document.getElementById("input-field-user").value = "";
                    document.getElementById("input-field-password").value = "";
                    document.getElementById("input-field-database").value = "";
                    document.getElementById("input-field-schema").value = "";

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

    deleteConnection(name) {
        deleteConnection(name).then(data => {
            console.log('deleted data:', data);
            const connections = data.connections;
            document.getElementById(name).remove();
            if (connections) {
                this.setState({ connections: connections });
            }
        });
    };

    getConnectionData(connectionName) {
        return this.state.connections.find(connection => connection.name === connectionName);
    };

    openConnection(name) {
        const currentConnection = this.getConnectionData(name);
        localStorage.setItem('current_connection', JSON.stringify(currentConnection));

        window.location.hash = '#/tables';
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
        if (e.key === "Enter") {
            if (this.state.urlInput) {
                this.addConnection();
            } else {
                this.refs.url.focus();
            }
        }
    };

    search = () => {
      const searchValue = document.getElementById('search-field').value;
      let searchedConnections = [];

      this.state.connections.forEach(connection => {
          console.log(connection);
          if (connection.name.includes(searchValue)) {
              searchedConnections.push(connection);
          }
      });

      this.setState({ searchedConnections: searchedConnections });
    };

    // showURI (URI) {
    //     console.log(URI);
    //     alert (URI);
    // };

    render() {
        return (
            <div className="all-page">

                <div className="left-menu">

                    <div className="information-field">
                        <span id="input-title">Name:</span>
                        <input id="input-field-name" ref="name" className="form-control" type="text" placeholder="Yoda"
                               defaultValue={this.state.nameInput} onChange={this.nameOnChange}
                               onKeyPress={this.nameKeyPress}/>
                    </div>

                    <div className="information-field">
                        <span id="input-title">Host:</span>
                        <input id="input-field-host" ref="host" className="form-control" type="text" placeholder="127.0.0.1"
                               defaultValue={this.state.hostInput} onChange={this.hostOnChange}
                               onKeyPress={this.hostKeyPress}/>
                    </div>


                    <div className="information-field">
                        <span id="input-title">Port:</span>
                        <input id="input-field-port" ref="port" className="form-control" type="text" placeholder="5432"
                               defaultValue={this.state.portInput} onChange={this.portOnChange}
                               onKeyPress={this.portKeyPress}/>
                    </div>

                    <div className="information-field">
                        <span id="input-title">User:</span>
                        <input id="input-field-user" ref="user" className="form-control" type="text" placeholder="user name"
                               defaultValue={this.state.userInput} onChange={this.userOnChange}
                               onKeyPress={this.userKeyPress}/>
                    </div>

                    <div className="information-field">
                        <span id="input-title">Password:</span>
                        <input id="input-field-password" ref="password" className="form-control" type="text"
                               placeholder="password"
                               defaultValue={this.state.passwordInput} onChange={this.passwordOnChange}
                               onKeyPress={this.passwordKeyPress}/>
                    </div>

                    <div className="information-field">
                        <span id="input-title">Database:</span>
                        <input id="input-field-database" ref="database" className="form-control" type="text"
                               placeholder="database name"
                               defaultValue={this.state.databaseInput} onChange={this.databaseOnChange}
                               onKeyPress={this.databaseKeyPress}/>
                    </div>

                    <div className="information-field">
                        <span id="input-title">Schema:</span>
                        <input id="input-field-schema" ref="schema" className="form-control" type="text"
                               placeholder="schema name"
                               defaultValue={this.state.schemaInput} onChange={this.schemaOnChange}
                               onKeyPress={this.schemaKeyPress}/>
                    </div>

                    <div className="choose-db-field">
                        <span id="choose-db-title">Choose d-base type:</span>
                        <select
                            id="choose-db"
                            value={this.state.dtypeInput}
                            onChange={this.dtypeOnChange}
                        >
                            <option value="mysql">mysql</option>
                            <option value="postgres">postgres</option>
                        </select>
                    </div>

                    <button type="button" style={localStorage.getItem("theme") ? {color: "white"} : {color: "white"}}
                            className="add-button" onClick={() => this.addConnection()}>Add
                    </button>

                    {this.state.badQuery > 0 &&
                    <div id="errorMessage" className="alert">
                        <strong>Message!</strong> {this.state.errorMessage}
                    </div>
                    }
                </div>

                <div className="line"></div>


                <div className="right-side">

                    <div id="menu">
                        {/*<div id="sort">*/}
                        {/*    Sorted by:*/}
                        {/*    <select id="choose-sort">*/}
                        {/*        <option value="name">name</option>*/}
                        {/*    </select>*/}
                        {/*</div>*/}
                        <div className="search">
                            <input id="search-field"/>
                            <button type="button" className="search-button" onClick={() => this.search()}>Search</button>
                        </div>
                    </div>

                    <div id="folders">
                        {this.state.searchedConnections ? this.state.searchedConnections.map(conn => {
                                return (
                                    <div id={conn.name} className="connection-folder" key={conn.name}>
                                            <div className="link-container"
                                                 onDoubleClick={() => this.openConnection(conn.name)}>
                                                <div id="folders-name">
                                                    <img alt={"icon database"} src={database_icon} id="database-icon"/>
                                                    <div id="link">
                                                        <p id="folders-n">{conn.name}</p>
                                                    </div>
                                                </div>

                                                <div id="functional">
                                                    {/*<div id="time">*/}
                                                    {/*    10.08.2020*/}
                                                    {/*</div>*/}
                                                    {/*<div*/}
                                                    {/*    onClick={() => alert("PIN поки що не працює - " + conn.name)}>*/}
                                                    {/*    <img alt={"pin icon"} src={pin_icon} id="pin-icon"/>*/}
                                                    {/*</div>*/}
                                                    <div
                                                        onClick={() => this.deleteConnection(conn.name)}>
                                                        <img alt={"delete icon"} src={delete_icon} id="delete-icon"/>
                                                    </div>
                                                </div>
                                            </div>
                                    </div>
                                )
                            }
                        ) : null}
                    </div>
                </div>
            </div>
        );
    }
}