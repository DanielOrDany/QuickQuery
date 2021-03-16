import React from 'react';
import {
    getDataFromDatabase,
    deleteConnection,
    addConnection,
    setTrial,
    updateKey,
    checkLicense
} from "../methods";
import { Offline } from "react-detect-offline"

import Button from './Button';
import Modal from './Modal';

import empty from "../icons/empty.svg";
import database_icon from "../icons/database.svg";
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
            uriInput: '',
            keyInput: '',
            errorMessage: '',
            isOpen: false,
            isKeyOpen: false,
            isErrorOpen: false,
            isDeleteOpen: false,
            bigInput: false,
            choosedConnetion: '',
            trialWindow: true,
            trialAvailable: false,
            trialError: false,
            licenseError: false
        };
    };

    openModal = () => {
        this.setState({ isOpen: true });
    };

    handleSubmit = () => {
        this.addConnection();
    };

    handleKeySubmit = () => {
        updateKey(this.state.keyInput)
            .then(() => {
                checkLicense()
                    .then(data => {
                        if(data === "good-license") {
                            this.setState({ isKeyOpen: false });
                        } else if(data === "update-license") {
                            this.setState({
                                errorMessage: "Key is not valid. Please check it and try again.",
                                licenseError: true,
                                isErrorOpen: true,
                                isKeyOpen: false
                            });
                        }
                    })
            });
    };

    handleCancel = () => {
        this.setState({ isOpen: false });
    };

    openErrorModal = () => {
        this.setState({ isErrorOpen: true });
    };

    handleErrorCancel = () => {
        if(this.state.trialError) {
            this.setState({
                trialError: false,
                licenseError: false,
                isErrorOpen: false,
                trialWindow: true
            });
        } else if(this.state.licenseError) {
            this.setState({
                trialError: false,
                licenseError: false,
                isErrorOpen: false,
                isKeyOpen: true
            });
        }
    };

    openDelete = (alias) => {
        this.setState({ choosedConnetion: alias});
        this.setState({ isDeleteOpen: true });
    };

    handleDeleteSubmit = () => {
        this.deleteConnection(this.state.choosedConnetion);
        this.setState({ choosedConnetion: ''});
        this.setState({ isDeleteOpen: false });
    };

    handleDeleteCancel = () => {
        this.setState({ choosedConnetion: ''});
        this.setState({ isDeleteOpen: false });
    };

    componentDidMount() {
        getDataFromDatabase()
            .then(data => {
                this.setState({
                    connections: data.connections,
                    searchedConnections: data.connections
                });

                localStorage.setItem("connections", JSON.stringify(data.connections));
                localStorage.setItem("data", JSON.stringify(data));
            })
            .then(() => {
                checkLicense()
                    .then(data => {
                        if(data === "no-license") {
                            this.setState({ 
                                isKeyOpen: true,
                                trialAvailable: true,
                                trialWindow: true
                             });
                        } else if(data === "good-license") {
                            this.setState({
                                isOpen: data.connections.length ? false : true // show popup if none connections in the app
                            });
                        } else if(data === "update-license") {
                            this.setState({
                                errorMessage: "Your license has expired.",
                                licenseError: true,
                                isErrorOpen: true,
                                isKeyOpen: false
                            });
                        }
                    })
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

            if(localStorage.getItem("current_connection") && JSON.parse(localStorage.getItem("current_connection")).name === name) {
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

        window.location.hash = `#/tables/${name}`;
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
    keyOnChange = (e) => {
        this.setState({keyInput: e.target.value})
    }

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
                    <input id="input-field-name" ref="name" className="form-control" type="text" placeholder="Yoda" type="search"
                           onChange={this.nameOnChange} onKeyPress={this.nameKeyPress}/>
                </div>
                <div className="information-field">
                    <span className="input-title">Host:</span>
                    <input id="input-field-host" ref="host" className="form-control" type="text" placeholder="127.0.0.1" type="search"
                           onChange={this.hostOnChange} onKeyPress={this.hostKeyPress}/>
                </div>
                <div className="information-field">
                    <span className="input-title">Port:</span>
                    <input id="input-field-port" ref="port" className="form-control" type="text" placeholder="5432" type="search"
                           onChange={this.portOnChange} onKeyPress={this.portKeyPress}/>
                </div>
                <div className="information-field">
                    <span className="input-title">User name:</span>
                    <input id="input-field-user" ref="user" className="form-control" type="text" placeholder="root" type="search"
                           onChange={this.userOnChange} onKeyPress={this.userKeyPress}/>
                </div>
                <div className="information-field">
                    <span className="input-title">Password:</span>
                    <input id="input-field-password" ref="password" className="form-control" type="text"
                           placeholder="pass1234" type="search"
                           onChange={this.passwordOnChange} onKeyPress={this.passwordKeyPress}/>
                </div>
                <div className="information-field">
                    <span className="input-title">Database:</span>
                    <input id="input-field-database" ref="database" className="form-control" type="text"
                           placeholder="flightradar24" type="search"
                           onChange={this.databaseOnChange} onKeyPress={this.databaseKeyPress}/>
                </div>
                <div className="information-field">
                    <span className="input-title">Schema name:
                        <div className="help-tip" id="schema-tip">
                            <p>A schema is a collection of database objects associated with one particular database username.</p>
                        </div>
                    </span>
                    <input id="input-field-schema" ref="schema" className="form-control" type="text"
                           placeholder="public" type="search"
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
                    <input id="input-field-name" ref="name" className="form-control" type="text" placeholder="Yoda" type="search"
                           onChange={this.nameOnChange} onKeyPress={this.nameKeyPress}/>
                </div>
                <div className="information-field">
                    <span className="input-title">URI:</span>
                    <input id="input-field-uri" ref="uri" className="form-control" type="text" type="search"
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
                           type="search"
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

    addFreeTrial = () => {
        setTrial()
            .then(data => {
                if(data === "trial-license") {
                    this.setState({ 
                        isKeyOpen: false,
                        isOpen: data.connections.length ? false : true // show popup if none connections in the app
                     });
                } else if (data === "error-license") {
                    this.setState({
                        errorMessage: "Oops! Something gone wrong. Please try again later.",
                        trialError: true,
                        isErrorOpen: true,
                        isKeyOpen: false,
                    });
                }
                    
            });
    }

    keyInput = () => {
        return(
            <div>
                <div className="license-key-text">Enter license key:</div>
                <input placeholder="00000000-00000000-00000000-00000000" className="form-control"
                        onChange={this.keyOnChange}/>
            </div>
        );
    };

    freeTrial = () => {
        return(
            <div>
                <div className="free-trial-text">You have 7 days free trial!</div>

                <button className="free-trial-btn" onClick={() => this.addFreeTrial()}>Get free trial</button>

                <Button id="license-key-btn" onClick={() => this.setState({ trialWindow: false })} invert>
                    Enter license key
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

        if(!(host === "localhost" || host === "127.0.0.1")) {
            return(
                <Offline>
                    <>| <b>connection is lost</b></>
                </Offline>
            );
        }
    }

    render() {
        const { searchedConnections, isOpen, isKeyOpen, bigInput, isErrorOpen, isDeleteOpen, errorMessage, trialWindow, trialAvailable } = this.state;

        return (
            <div className="connections-page">
                <Modal
                    title="Creating a connection"
                    isOpen={isOpen}
                    onCancel={this.handleCancel}
                    onSubmit={this.handleSubmit}
                    cancelButton={true}
                >
                    {bigInput && this.bigInput()}
                    {!bigInput && this.smallInput()}
                </Modal>

                <Modal
                    title="License Authentication"
                    isOpen={isKeyOpen}
                    onSubmit={this.handleKeySubmit}
                    noCross={true}
                    submitButton={trialWindow ? false : true}
                >
                    {(trialWindow && trialAvailable) && this.freeTrial()}
                    {(!trialAvailable || !trialWindow) && this.keyInput()}

                </Modal>

                <Modal
                    title="Error"
                    isOpen={isErrorOpen}
                    onCancel={this.handleErrorCancel}
                    onSubmit={this.handleErrorCancel}
                    submitTitle="Ok"
                >
                    <strong>Message!</strong> {errorMessage}
                </Modal>

                <Modal
                    title="Delete connection"
                    isOpen={isDeleteOpen}
                    onCancel={this.handleDeleteCancel}
                    onSubmit={this.handleDeleteSubmit}
                    cancelButton={true}
                    cancelTitle="No"
                    submitTitle="Yes"
                    noCross={true}
                >
                    <div>
                        <strong>Are you sure?</strong>
                    </div>
                </Modal>

                <div className="menu">
                    <input className="search" id="search-field" type="search" placeholder={"Search"} onChange={() => this.search()}/>
                    <button type="button" id="add-button" onClick={() => this.openModal()}>Add Connection</button>
                </div>

                <div className="folders">
                    {
                        searchedConnections.length ? searchedConnections.map(conn => {
                                let evenConn = searchedConnections.indexOf(conn) % 2 === 0;

                                return (
                                    <div id={conn.name} className={`connection-folder ${evenConn ? "dark-row" : "white-row"}`} key={conn.name}>
                                        <div className="link-container"
                                             onDoubleClick={() => this.openConnection(conn.name)}>
                                            <div className="folders-name">
                                                <img alt={"icon database"} src={database_icon} id="database-icon"/>
                                                <div className="link">
                                                    <p id="folders-n">{conn.name} {this.databaseHost(conn)}</p>
                                                </div>
                                            </div>

                                            <div className="functional">
                                                <div onClick={() => this.openDelete(conn.name)}>
                                                    <img alt={"delete icon"} src={delete_icon} id="delete-icon"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            ) :
                            <div className="empty-result-row">
                                <div className="empty-result-column">
                                    <img className="empty-result-box" src={empty}/>
                                    <span>You don't have a connection yet.</span>
                                    <span>Please create it on the "Add Connection" button.</span>
                                </div>
                            </div>
                    }
                </div>
            </div>
        );
    }
}