import React from 'react';
import {
    getDataFromDatabase,
    deleteConnection,
    addConnection
} from "../methods";

import Button from './Button';
import Modal from './Modal';

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
            urlInput: '',
            errorMessage: '',
            isOpen: false,
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
        let uriInput = this.state.uriInput;

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

        function inputVirify(args) {
            if (args.replace(/^\s+|\s+$/gm, '').length === 0) {
                this.setState({
                    badQuery: 1,
                    errorMessage: "Please, fill in all the fields."
                });
            }
        }

        // Check valid inputs
        if (this.state.bigInput) {
            inputVirify(nameInput);
            inputVirify(hostInput);
            inputVirify(portInput);
            inputVirify(userInput);
            inputVirify(passwordInput);
            inputVirify(databaseInput);
            inputVirify(schemaInput);
            inputVirify(dtypeInput);
        } else {
            inputVirify(nameInput);
            inputVirify(uriInput);
            inputVirify(schemaInput);
        }

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
                    badQuery: 0,
                    errorMessage: "",
                    isOpen: false
                });

            } else {
                this.setState({
                    badQuery: 1,
                    errorMessage: "Bad URI."
                });
            }
        });

    };

    deleteConnection(name) {
        deleteConnection(name).then(connections => {
            document.getElementById(name).remove();

            if (connections) {
                this.setState({ connections: connections });
            }

            if(JSON.parse(localStorage.getItem("current_connection")).name == name) {
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
                    <span id="input-title">Name:</span>
                    <input id="input-field-name" ref="name" className="form-control" type="text" placeholder="Yoda"
                        onChange={this.nameOnChange} onKeyPress={this.nameKeyPress}/>
                </div>

                <div className="information-field">
                    <span id="input-title">Host:</span>
                    <input id="input-field-host" ref="host" className="form-control" type="text" placeholder="127.0.0.1"
                        onChange={this.hostOnChange} onKeyPress={this.hostKeyPress}/>
                </div>


                <div className="information-field">
                    <span id="input-title">Port:</span>
                    <input id="input-field-port" ref="port" className="form-control" type="text" placeholder="5432"
                        onChange={this.portOnChange} onKeyPress={this.portKeyPress}/>
                </div>

                <div className="information-field">
                    <span id="input-title">User:</span>
                    <input id="input-field-user" ref="user" className="form-control" type="text" placeholder="user name"
                        onChange={this.userOnChange} onKeyPress={this.userKeyPress}/>
                </div>

                <div className="information-field">
                    <span id="input-title">Password:</span>
                    <input id="input-field-password" ref="password" className="form-control" type="text"
                        placeholder="password"
                        onChange={this.passwordOnChange} onKeyPress={this.passwordKeyPress}/>
                </div>

                <div className="information-field">
                    <span id="input-title">Database:</span>
                    <input id="input-field-database" ref="database" className="form-control" type="text"
                        placeholder="database name"
                        onChange={this.databaseOnChange} onKeyPress={this.databaseKeyPress}/>
                </div>

                <div className="information-field">
                    <span id="input-title">Schema:</span>
                    <input id="input-field-schema" ref="schema" className="form-control" type="text"
                        placeholder="schema name"
                        onChange={this.schemaOnChange} onKeyPress={this.schemaKeyPress}/>
                </div>

                <div className="choose-db-field">
                    <span id="choose-db-title">Choose database: </span>
                    <select
                        id="choose-db"
                        value={this.state.dtypeInput}
                        onChange={this.dtypeOnChange}
                    >
                        <option value="mysql">mysql</option>
                        <option value="postgres">postgres</option>
                    </select>
                </div>

                <Button id="simplified-connection-btn" onClick={()=>this.setState({bigInput: false})} invert>Simplified connection</Button>
            </div>
        );
    };

    smallInput = () => {
        return(
            <div>
                <div className="information-field">
                    <span id="input-title">Name:</span>
                    <input id="input-field-name" ref="name" className="form-control" type="text" placeholder="Yoda"
                           onChange={this.nameOnChange} onKeyPress={this.nameKeyPress}/>
                </div>

                <div className="information-field">
                    <span id="input-title">URI:</span>
                    <input id="input-field-uri" ref="uri" className="form-control" type="text"
                           placeholder="databaseType://username:password@host:port/databaseName"
                           onChange={this.uriOnChange} onKeyPress={this.uriKeyPress}
                    />
                </div>

                <div className="information-field">
                    <span id="input-title">Schema:</span>
                    <input id="input-field-schema" ref="schema" className="form-control" type="text"
                        placeholder="schema name"
                        onChange={this.schemaOnChange} onKeyPress={this.schemaKeyPress}/>
                </div>

                <Button id="configure-manually-btn" onClick={()=>this.setState({bigInput: true})} invert>Configure manually</Button>
            </div>
        );
    };

    render() {
        return (
            <div className="connections-page">
                <Modal
                    title="Creating a connection"
                    isOpen={this.state.isOpen}
                    onCancel={this.handleCancel}
                    onSubmit={this.handleSubmit}
                >
                    {this.state.bigInput && this.bigInput()}
                    {!this.state.bigInput && this.smallInput()}
                    {this.state.badQuery > 0 &&
                        <div id="errorMessage" className="alert">
                            <strong>Message!</strong> {this.state.errorMessage}
                        </div>
                    }
                </Modal>

                <div id="menu">
                    <button type="button" style={localStorage.getItem("theme") ? {color: "white"} : {color: "white"}}
                            className="add-button" onClick={() => this.openModal()}>Add connection
                    </button>
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