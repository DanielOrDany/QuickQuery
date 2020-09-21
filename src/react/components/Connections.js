import React from 'react';
import {
    getDataFromDatabase,
    deleteConnection,
    addConnection
} from "../methods";
import { Offline, Online } from "react-detect-offline"

import Button from './Button';
import Modal from './Modal';

import database_icon from "../icons/software.png";
import delete_icon from "../icons/delete_icon.png";
import wifi_on from "../icons/wifi_on-48dp.svg";
import wifi_off from "../icons/wifi_off-48dp.svg";
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
            uriInput: '',
            errorMessage: '',
            isOpen: false,
            isErrorOpen: false,
            bigInput: false
        };
    };

    openModal = () => {
        this.setState({ isOpen: true });
    };
    
    handleSubmit = () => {
        this.addConnection();
    };
    
    handleCancel = () => {
        this.setState({ isOpen: false });
    };

    openErrorModal = () => {
        this.setState({ isErrorOpen: true });
    };
    
    handleErrorCancel = () => {
        this.setState({ isErrorOpen: false });
    };

    componentDidMount() {
        getDataFromDatabase()
            .then(data => {
                console.log("DATA", data);
                this.setState({
                    connections: data.connections,
                    searchedConnections: data.connections,
                    isOpen: data.connections.length ? false : true //show popup without any conns
                });
                localStorage.setItem("connections", JSON.stringify(data.connections));
                localStorage.setItem("data", JSON.stringify(data));
            });
    };

    inputVirify(args) {
        if (args.replace(/^\s+|\s+$/gm, '').length === 0) {
            this.setState({
                errorMessage: "Please, fill in all the fields.",
                isErrorOpen: true
            });
            return false;
        }
        return true;
    }

    addConnection() {
        let nameInput = this.state.nameInput;
        let hostInput = this.state.hostInput;
        let portInput = this.state.portInput;
        let userInput = this.state.userInput;
        let passwordInput = this.state.passwordInput;
        let databaseInput = this.state.databaseInput;
        let schemaInput = this.state.schemaInput;
        let dtypeInput = this.state.dtypeInput;
        let uriInput = this.state.uriInput;
        
        let successfullVerify = false;

        console.log({
            nameInput,
            hostInput,
            portInput,
            userInput,
            passwordInput,
            databaseInput,
            schemaInput,
            dtypeInput,
            uriInput
        });

        // Check valid inputs
        if (this.state.bigInput) {
            successfullVerify = 
                this.inputVirify(nameInput) &&
                this.inputVirify(hostInput) &&
                this.inputVirify(portInput) &&
                this.inputVirify(userInput) &&
                this.inputVirify(passwordInput) &&
                this.inputVirify(databaseInput) &&
                this.inputVirify(schemaInput) &&
                this.inputVirify(dtypeInput);
        } else {
            successfullVerify = 
                this.inputVirify(nameInput) &&
                this.inputVirify(uriInput) &&
                this.inputVirify(schemaInput);
        }

        if(successfullVerify) {
            addConnection(this.state.bigInput ? {
                name: nameInput,
                host: hostInput,
                port: portInput,
                user: userInput,
                password: passwordInput,
                database: databaseInput,
                schema: schemaInput,
                dtype: dtypeInput
            } : {
                schema: schemaInput,
                uri: uriInput,
                name: nameInput
            }).then(connection => {
                if (connection) {
                    const connections = JSON.parse(localStorage.getItem("connections"));
                    connections.push(connection);

                    localStorage.setItem("connections", JSON.stringify(connections));

                    this.setState({
                        connections: JSON.parse(localStorage.getItem("connections")),
                        searchedConnections: JSON.parse(localStorage.getItem("connections")),
                        isErrorOpen: false,
                        errorMessage: "",
                        isOpen: false
                    });

                } else {
                    this.setState({
                        errorMessage: "Bad URI.",
                        isErrorOpen: true
                    });
                }
            });
        }
    };

    deleteConnection(name) {
        deleteConnection(name).then(connections => {
            document.getElementById(name).remove();

            if (connections) {
                this.setState({ connections: connections });
            }

            if(localStorage.getItem("current_connection") && JSON.parse(localStorage.getItem("current_connection")).name == name) {
                localStorage.removeItem("current_connection");
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
    uriOnChange = (e) => {
        this.setState({uriInput: e.target.value})
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

    bigInput = () => {
        return(
            <div>
                <div className="information-field">
                    <span className="input-title">Name:</span>
                    <input id="input-field-name" ref="name" className="form-control" type="text" placeholder="Yoda"
                        onChange={this.nameOnChange} onKeyPress={this.nameKeyPress}/>
                </div>
                <div className="information-field">
                    <span className="input-title">Host:</span>
                    <input id="input-field-host" ref="host" className="form-control" type="text" placeholder="127.0.0.1"
                        onChange={this.hostOnChange} onKeyPress={this.hostKeyPress}/>
                </div>
                <div className="information-field">
                    <span className="input-title">Port:</span>
                    <input id="input-field-port" ref="port" className="form-control" type="text" placeholder="5432"
                        onChange={this.portOnChange} onKeyPress={this.portKeyPress}/>
                </div>
                <div className="information-field">
                    <span className="input-title">User name:</span>
                    <input id="input-field-user" ref="user" className="form-control" type="text" placeholder="root"
                        onChange={this.userOnChange} onKeyPress={this.userKeyPress}/>
                </div>
                <div className="information-field">
                    <span className="input-title">Password:</span>
                    <input id="input-field-password" ref="password" className="form-control" type="text"
                        placeholder="pass1234"
                        onChange={this.passwordOnChange} onKeyPress={this.passwordKeyPress}/>
                </div>
                <div className="information-field">
                    <span className="input-title">Database:</span>
                    <input id="input-field-database" ref="database" className="form-control" type="text"
                        placeholder="flightradar24"
                        onChange={this.databaseOnChange} onKeyPress={this.databaseKeyPress}/>
                </div>
                <div className="information-field">
                    <span className="input-title">Schema name:
                        <div className="help-tip" id="schema-tip">
                            <p>A schema is a collection of database objects associated with one particular database username.</p>
                        </div>
                    </span>
                    <input id="input-field-schema" ref="schema" className="form-control" type="text"
                        placeholder="public"
                        onChange={this.schemaOnChange} onKeyPress={this.schemaKeyPress}/>
                </div>
                <div className="choose-db-field">
                    <span id="choose-db-title">Choose database: </span>
                    <select
                        className="selector"
                        id="choose-db"
                        value={this.state.dtypeInput}
                        onChange={this.dtypeOnChange}
                    >
                        <option value="mysql">mysql</option>
                        <option value="postgres">postgres</option>
                    </select>
                </div>
                <hr/>
                <Button id="simplified-connection-btn" 
                    onClick={()=>this.setState({
                                    bigInput: false,
                                    nameInput: '',
                                    hostInput: '',
                                    portInput: '',
                                    userInput: '',
                                    passwordInput: '',
                                    databaseInput: '',
                                    schemaInput: '',
                                    dtypeInput: 'mysql'
                                })} invert>
                    Simplified connection
                </Button>
            </div>
        );
    };

    smallInput = () => {
        return(
            <div>
                <div className="information-field">
                    <span className="input-title">Name:</span>
                    <input id="input-field-name" ref="name" className="form-control" type="text" placeholder="Yoda"
                           onChange={this.nameOnChange} onKeyPress={this.nameKeyPress}/>
                </div>
                <div className="information-field">
                    <span className="input-title">URI:</span>
                    <input id="input-field-uri" ref="uri" className="form-control" type="text"
                           placeholder="databaseType://username:password@host:port/databaseName"
                           onChange={this.uriOnChange} onKeyPress={this.uriKeyPress}
                    />
                </div>
                <div className="information-field">
                    <span className="input-title">Schema name:
                        <div className="help-tip" id="schema-tip">
                            <p>A schema is a collection of database objects associated with one particular database username.</p>
                        </div>
                    </span>
                    <input id="input-field-schema" ref="schema" className="form-control" type="text"
                        placeholder="public"
                        onChange={this.schemaOnChange} onKeyPress={this.schemaKeyPress}/>
                </div>
                <hr/>
                <Button id="configure-manually-btn" 
                    onClick={()=>this.setState({
                                    bigInput: true,
                                    nameInput: '',
                                    uriInput: '',
                                    schemaInput: ''
                                })} invert>
                    Configure manually
                </Button>
            </div>
        );
    };

    databaseHost(conn) {
        let host = "";

        if(typeof(conn.URI)=="string") {
            host = conn.URI.split("@")[1].split(":")[0];
        } else if(typeof(conn.URI)=="object") {
            host = conn.URI["others"]["host"];
        }
        
        if(host == "localhost" || host == "127.0.0.1") {
            return(
                <>
                    <img alt={"internet on"} src={wifi_on} id="wifi-icon"/>
                    <p className="tip-info">Connection with local database established.</p>
                </>
            );
        } else {
            return(
                <>
                    <Online>
                        <img alt={"internet on"} src={wifi_on} id="wifi-icon"/>
                        <p className="tip-info">Connection with remote database established.</p>
                    </Online>
                    <Offline>
                        <img alt={"internet off"} src={wifi_off} id="wifi-icon"/>
                        <p className="tip-info">Connection with remote database lost.</p>
                    </Offline>
                </>
            );
        }
    }

    render() {
        return (
            <div className="connections-page">
                <Modal
                    title="Creating a connection"
                    isOpen={this.state.isOpen}
                    onCancel={this.handleCancel}
                    onSubmit={this.handleSubmit}
                    cancelButton={true}
                >
                    {this.state.bigInput && this.bigInput()}
                    {!this.state.bigInput && this.smallInput()}
                </Modal>

                <Modal
                    title="Error"
                    isOpen={this.state.isErrorOpen}
                    onCancel={this.handleErrorCancel}
                    onSubmit={this.handleErrorCancel}
                    submitTitle="Ok"
                >
                    <strong>Message!</strong> {this.state.errorMessage}
                </Modal>

                <div className="menu">
                    <button type="button" id="add-button" onClick={() => this.openModal()}>Add connection
                    </button>
                    <div className="search">
                        <input id="search-field"/>
                        <button type="button" id="search-button" onClick={() => this.search()}>Search</button>
                    </div>
                </div>

                <div className="folders">
                    {this.state.searchedConnections ? this.state.searchedConnections.map(conn => {
                            return (
                                <div id={conn.name} className="connection-folder" key={conn.name}>
                                        <div className="link-container"
                                             onDoubleClick={() => this.openConnection(conn.name)}>
                                            <div id="folders-name">
                                                <img alt={"icon database"} src={database_icon} id="database-icon"/>
                                                <div id="link">
                                                    <p id="folders-n" className="network-tip">{conn.name}{this.databaseHost(conn)}</p>
                                                </div>
                                            </div>

                                            <div id="functional">
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
        );
    }
}