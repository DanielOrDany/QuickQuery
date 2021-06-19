import React from 'react';

import './Connections.scss';

import footer_arrow_left from "../../icons/connections-page-footer-arrow-left.svg";
import footer_arrow_right from "../../icons/connections-page-footer-arrow-right.svg";
import footer_arrow_down from "../../icons/connections-page-footer-arrow.svg";
import filters_icon from "../../icons/connections-page-filters-icon.svg";
import filters_arrow from "../../icons/connections-page-filter-arrow.svg";
import empty_connections_page_icon from "./icons/empty-connections-page.svg";

import ConfigureManuallyPopup from "./popups/ConfigureManuallyPopup";
import SimplifiedConnectionPopup from "./popups/SimplifiedConnectionPopup";
import SSHConnectionPopup from "./popups/SSHConnectionsPopup";

import {
    getDataFromDatabase,
    deleteConnection,
    addConnection,
    updateKey,
    checkLicense, authVerifyToken

} from "../../methods";
import { Offline } from "react-detect-offline"

import Button from '../../components/Button';
import Modal from '../../popups/Modal';


import DatabaseMiniMenuPopup from "./popups/DatabaseMiniMenu";
import DeleteConnectionPopup from "./popups/DeleteConnectionPopup";


const base64 = require('base-64');
const utf8 = require('utf8');

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
            sshHostInput: '',
            sshUserInput: '',
            sshPortInput: '',
            sshPrivateKeyInput: '',
            keyInput: '',
            errorMessage: '',
            /*isOpen: false,*/
            isKeyOpen: false,
            isErrorOpen: false,
            isDeleteOpen: false,
            ConfigureManuallyPopup: false,
            choosedConnetion: '',
            trialWindow: false,
            trialAvailable: false,
            trialError: false,
            licenseError: false,
            isSimplifiedConnectionPopup: false,
            isConfigureManuallyPopup: false,
            isSSHConnectionPopup: false,
            firstModalHint: true,
            secondModalHint: true,
            isDBMiniMenu: null,
            isDeleteConnection: false,
            deleteConnectionName: ''
        };
    };

    openSimplifiedConnectionPopup = () => {
        this.setState({ isSimplifiedConnectionPopup: true });
    };



    isDBMiniMenuOpen = (connectionName) => {
        this.setState({
            isDBMiniMenu: connectionName,
        })
    };

    changeInputsModal = (modal) => {
        if (modal === "ssh") {
            this.setState({
                isConfigureManuallyPopup: false,
                isSimplifiedConnectionPopup: false,
                isSSHConnectionPopup: true
            })
        } else if (modal === "configure_manually") {
            this.setState({
                isConfigureManuallyPopup: true,
                isSimplifiedConnectionPopup: false,
                isSSHConnectionPopup: false
            })
        } else {
            this.setState({
                isConfigureManuallyPopup: false,
                isSimplifiedConnectionPopup: true,
                isSSHConnectionPopup: false
            })
        }
    };


    handleSubmit = () => {
        this.addConnection();
    };

    closeFirstModalHint = () => {
        this.setState({firstModalHint: false})
    };

    closeSecondModalHint = () => {
        this.setState({secondModalHint: false})
    };


    closeDeleteConnectionPopup = () => {
        this.setState({isDeleteConnection: false})
    };

    openDeleteConnectionPopup = () => {
        this.setState({isDeleteConnection: true})
    };

    saveDeleteConnectionName = (name) => {
        this.setState({deleteConnectionName: name})
    }


    handleKeySubmit = () => {
        updateKey(this.state.keyInput)
            .then((data) => {
                if(data === "key-updated") {
                    checkLicense()
                    .then(data => {
                        if(data === "good-license") {
                            this.setState({
                                isKeyOpen: false,
                                isOpen: this.state.connections.length ? false : true // show popup if none connections in the app
                             });
                        } else if(data === "update-license") {
                            this.setState({
                                errorMessage: "Key is not valid. Please check it and try again.",
                                licenseError: true,
                                isErrorOpen: true,
                                isKeyOpen: false
                            });
                        }
                    })
                } else if (data === "key-error") {
                    this.setState({
                        errorMessage: "Key saver error occured. Please try again later.",
                        licenseError: true,
                        isErrorOpen: true,
                        isKeyOpen: false
                    });
                } else if (data === "key-outdated") {
                    this.setState({
                        errorMessage: "Key activation period expired. Please try another key.",
                        licenseError: true,
                        isErrorOpen: true,
                        isKeyOpen: false
                    });
                }

            });
    };

    handleCancel = () => {
        this.setState({ isSimplifiedConnectionPopup: false, isConfigureManuallyPopup: false, isSSHConnectionPopup: false });
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
        } else {
            this.setState({
                isErrorOpen: false
            })
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

    async componentDidMount() {
        getDataFromDatabase()
            .then(data => {
                this.setState({
                    connections: data.connections,
                    searchedConnections: data.connections
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

    addConnection = () => {
        console.log(this.state);
        let nameInput = this.state.nameInput;
        let hostInput = this.state.hostInput;
        let portInput = this.state.portInput;
        let userInput = this.state.userInput;
        let passwordInput = this.state.passwordInput;
        let databaseInput = this.state.databaseInput;
        let schemaInput = this.state.schemaInput;
        let dtypeInput = this.state.dtypeInput;
        let uriInput = this.state.uriInput;
        let sshHostInput = this.state.sshHostInput;
        let sshUserInput = this.state.sshUserInput;
        let sshPortInput = this.state.sshPortInput;
        let sshPrivateKeyInput = this.state.sshPrivateKeyInput;
        let successfullVerify = false;

        // Check valid inputs
        if (this.state.isConfigureManuallyPopup) {
            successfullVerify =
                this.inputVirify(nameInput) &&
                this.inputVirify(hostInput) &&
                this.inputVirify(portInput) &&
                this.inputVirify(userInput) &&
                this.inputVirify(passwordInput) &&
                this.inputVirify(databaseInput) &&
                this.inputVirify(schemaInput) &&
                this.inputVirify(dtypeInput);
        } else if (this.state.isSSHConnectionPopup) {
            successfullVerify =
                this.inputVirify(nameInput) &&
                this.inputVirify(portInput) &&
                this.inputVirify(userInput) &&
                this.inputVirify(passwordInput) &&
                this.inputVirify(databaseInput) &&
                this.inputVirify(schemaInput) &&
                this.inputVirify(dtypeInput) &&
                this.inputVirify(sshHostInput) &&
                this.inputVirify(sshPortInput) &&
                this.inputVirify(sshUserInput) &&
                this.inputVirify(sshPrivateKeyInput);
        } else {
            successfullVerify =
                this.inputVirify(nameInput) &&
                this.inputVirify(uriInput) &&
                this.inputVirify(schemaInput);
        }

        if(successfullVerify) {
            let connectionBody = {};

            if (this.state.isConfigureManuallyPopup) {
                connectionBody = {
                    name: nameInput,
                    host: hostInput,
                    port: portInput,
                    user: userInput,
                    password: passwordInput,
                    database: databaseInput,
                    schema: schemaInput,
                    dtype: dtypeInput
                };
            } else if (this.state.isSSHConnectionPopup) {
                connectionBody = {
                    name: nameInput,
                    port: portInput,
                    user: userInput,
                    password: passwordInput,
                    database: databaseInput,
                    schema: schemaInput,
                    dtype: dtypeInput,
                    sshHost: sshHostInput,
                    sshPort: sshPortInput,
                    sshUser: sshUserInput,
                    sshPrivateKey: sshPrivateKeyInput
                };
            } else {
                connectionBody = {
                    schema: schemaInput,
                    uri: uriInput,
                    name: nameInput
                };
            }

            addConnection(connectionBody).then(connection => {
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

            // if (connections) {
            //     this.setState({ connections: connections });
            // }

            if(localStorage.getItem("current_connection") && JSON.parse(localStorage.getItem("current_connection")).name === name) {
                localStorage.removeItem("current_connection");
            }
        });
    };

    getConnectionData(connectionName) {
        return this.state.connections.find(connection => connection.name === connectionName);
    };


    async verifyEmployee() {
        const id = localStorage.getItem("employeeId");
        const token = localStorage.getItem("employeeToken");

        if (id && token) {
            const verified = await authVerifyToken(id, token);

            console.log('verified user', verified);

            if (verified && verified.data) {
                localStorage.setItem("employeePlan", verified.data.subscription.plan_name);
                localStorage.setItem("employeeCountSubFrom", verified.data.subscription.count_from);
                await this.props.changeSignedStatus(true);
            } else {
                await this.props.changeSignedStatus(false);
            }
        } else {
            await this.props.changeSignedStatus(false);
        }
    }

    async openConnection(name) {
        await this.verifyEmployee();
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
    sshHostOnChange = (e) => {
        this.setState({sshHostInput: e.target.value})
    };
    sshPortOnChange = (e) => {
        this.setState({sshPortInput: e.target.value})
    };
    sshUserOnChange = (e) => {
        this.setState({sshUserInput: e.target.value})
    };
    sshPrivateKeyOnChange = (e) => {
        if (e) {
            if (e.target && e.target.files[0]) {
                this.setState({sshPrivateKeyInput: e.target.files[0].path})
            } else {
                this.setState({errorMessage: "Try to reload private key", sshPrivateKeyInput: ""})
            }
        }
    };
    keyOnChange = (e) => {
        this.setState({keyInput: e.target.value})
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

        if (this.state.connections.length != 0) {
            this.state.connections.forEach(connection => {
                if (connection.name.includes(searchValue)) {
                    searchedConnections.push(connection);
                }
            });

            this.setState({ searchedConnections: searchedConnections.length > 0 ? searchedConnections : [] });
        }
    };

    bigInput = () => {
        return(
            <div className={"big-input-modal"}>
                <div className={'big-input-modal-body'}>
                    <div className={"big-input-first-column"}>



                        <div className="big-information-field">
                            <span className="big-input-title">Name connection</span>
                            <input id="input-field-name" ref="name" className="big-form-control" type="text" placeholder="Database" type="search"
                                   onChange={this.nameOnChange} onKeyPress={this.nameKeyPress}/>
                        </div>


                        <div className="big-information-field">
                            <span className="big-input-title">Port</span>
                            <input id="input-field-port" ref="port" className="big-form-control" type="text" placeholder="5432" type="search"
                                   onChange={this.portOnChange} onKeyPress={this.portKeyPress}/>
                        </div>

                        <div className="big-information-field">
                            <span className="big-input-title">Password</span>
                            <input id="input-field-password" ref="password" className="big-form-control" type="text"
                                   placeholder="Password" type="search"
                                   onChange={this.passwordOnChange} onKeyPress={this.passwordKeyPress}/>
                        </div>

                        <div className="information-field">
                            <span className="big-input-title">Schema name
                                    <div className="help-tip" id="schema-tip">
                                        <p>
                                            A schema is a collection of database objects associated with one particular database username.
                                        </p>
                                    </div>
                            </span>
                            <input id="input-field-schema" ref="schema" className="big-form-control" type="text"
                                   placeholder="public" type="search"
                                   onChange={this.schemaOnChange} onKeyPress={this.schemaKeyPress}
                            />
                        </div>
                    </div>





                    <div className={"big-input-second-column"}>

                        <div className="big-information-field">
                            <span className="big-input-title">Host</span>
                            <input id="input-field-host" ref="host" className="big-form-control" type="text" placeholder="127.0.0.1" type="search"
                                   onChange={this.hostOnChange} onKeyPress={this.hostKeyPress}/>
                        </div>


                        <div className="big-information-field">
                            <span className="big-input-title">User name</span>
                            <input id="input-field-user" ref="user" className="big-form-control" type="text" placeholder="root" type="search"
                                   onChange={this.userOnChange} onKeyPress={this.userKeyPress}/>
                        </div>


                        <div className="big-information-field">
                            <span className="big-input-title">Database name</span>
                            <input id="input-field-database" ref="database" className="big-form-control" type="text"
                                   placeholder="Database" type="search"
                                   onChange={this.databaseOnChange} onKeyPress={this.databaseKeyPress}/>
                        </div>






                        <div className="choose-db-field">
                            <span id="choose-db-title">Database</span>
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
                    </div>
                </div>

                <div className="big-input-buttons">
                    <Button id="simplified-connection-btn"
                            onClick={()=>{

                                this.setState({
                                    bigInput: false,
                                    nameInput: '',
                                    hostInput: '',
                                    portInput: '',
                                    userInput: '',
                                    passwordInput: '',
                                    databaseInput: '',
                                    schemaInput: '',
                                    dtypeInput: 'mysql'
                                });

                                this.changeInputsModal("simple");
                            }} invert>
                        Simplified connection
                    </Button>
                    <Button className="ssh-btn"
                            onClick={()=>{
                                this.setState({
                                    nameInput: '',
                                    uriInput: '',
                                    schemaInput: ''
                                });
                                this.changeInputsModal("ssh");
                            }} invert>
                        SSH connection
                    </Button>
                </div>
            </div>
        );
    };

    smallInput = () => {
        return(
            <div>
                <div className="small-information-field">
                    <span className="small-input-title">Name connection</span>
                    <input id="input-field-name" ref="name" className="small-form-control" type="text" type="search"
                           onChange={this.nameOnChange} onKeyPress={this.nameKeyPress}/>
                </div>
                <div className="small-information-field">
                    <span className="small-input-title">Database URL</span>
                    <input id="input-field-uri" ref="uri" className="small-form-control" type="text" type="search"
                           onChange={this.uriOnChange} onKeyPress={this.uriKeyPress}
                    />
                </div>
                <div className="small-information-field">
                    <span className="small-input-title">Schema name
                        {/*<div className="help-tip" id="schema-tip">
                            <p>A schema is a collection of database objects associated with one particular database username.</p>
                        </div>*/}
                    </span>
                    <input id="input-field-schema" ref="schema" className="small-form-control" type="text"
                           type="search"
                           onChange={this.schemaOnChange} onKeyPress={this.schemaKeyPress}/>
                </div>

                <div className="small-information-buttons">
                    <Button id="configure-manually-btn"
                            onClick={()=>{
                                this.setState({
                                    nameInput: '',
                                    uriInput: '',
                                    schemaInput: ''
                                });
                                this.changeInputsModal("configure_manually");
                            }} invert>
                        Configure manually
                    </Button>
                    <Button className="ssh-btn"
                            onClick={()=>{
                                this.setState({
                                    nameInput: '',
                                    uriInput: '',
                                    schemaInput: ''
                                });
                                this.changeInputsModal("ssh");
                            }} invert>
                        SSH connection
                    </Button>
                </div>
            </div>
        );
    };

    sshInput = () => {
        return(
            <div className="big-input-modal">
                <div className="scroll-body">
                    <div className="big-input-modal-body">
                        <div className="big-input-first-column">

                            <div className="big-information-field">
                                <span className="big-input-title">Name connection</span>
                                <input id="input-field-name" ref="name" className="big-form-control" type="text" placeholder="Database" type="search"
                                       onChange={this.nameOnChange} onKeyPress={this.nameKeyPress}/>
                            </div>

                            <div className="big-information-field">
                                <span className="big-input-title">Database Port</span>
                                <input id="input-field-port" ref="port" className="big-form-control" type="text" placeholder="5432" type="search"
                                       onChange={this.portOnChange} onKeyPress={this.portKeyPress}/>
                            </div>

                            <div className="big-information-field">
                                <span className="big-input-title">Database Password</span>
                                <input id="input-field-password" ref="password" className="big-form-control" type="text"
                                       placeholder="Password" type="search"
                                       onChange={this.passwordOnChange} onKeyPress={this.passwordKeyPress}/>
                            </div>

                            <div className="information-field">
                                <span className="big-input-title">Database Schema name

                                        <div className="help-tip" id="schema-tip">
                                            <p>A schema is a collection of database objects associated with one particular database username.</p>
                                        </div>

                                </span>
                                <input id="input-field-schema" ref="schema" className="big-form-control" type="text"
                                       placeholder="public" type="search"
                                       onChange={this.schemaOnChange} onKeyPress={this.schemaKeyPress}/>
                            </div>

                        </div>

                        <div className="big-input-second-column">
                            <div className="big-information-field">
                                <span className="big-input-title">Database User</span>
                                <input id="input-field-user" ref="user" className="big-form-control" type="text" placeholder="root" type="search"
                                       onChange={this.userOnChange} onKeyPress={this.userKeyPress}/>
                            </div>

                            <div className="big-information-field">
                                <span className="big-input-title">Database Name</span>
                                <input id="input-field-database" ref="database" className="big-form-control" type="text"
                                       placeholder="Database" type="search"
                                       onChange={this.databaseOnChange} onKeyPress={this.databaseKeyPress}/>
                            </div>

                            <div className="choose-db-field">
                                <span id="choose-db-title">Database Type</span>
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
                        </div>
                    </div>

                    <div className="big-input-modal-body">
                        <div className="big-input-first-column">
                            <div className="big-information-field">
                                <span className="big-input-title">SSH Host</span>
                                <input id="input-field-port" ref="port" className="big-form-control" type="text" placeholder="127.0.0.1" type="search"
                                       onChange={this.sshHostOnChange}/>
                            </div>

                            <div className="big-information-field">
                                <span className="big-input-title">Private Key</span>
                                <input id="input-field-host" className="big-form-control" type="file"
                                       onChange={this.sshPrivateKeyOnChange}/>
                            </div>
                        </div>

                        <div className="big-input-second-column">
                            <div className="big-information-field">
                                <span className="big-input-title">SSH User</span>
                                <input id="input-field-user" ref="user" className="big-form-control" type="text" placeholder="ubuntu" type="search"
                                       onChange={this.sshUserOnChange}/>
                            </div>

                            <div className="big-information-field">
                                <span className="big-input-title">SSH Port</span>
                                <input id="input-field-host" ref="host" className="big-form-control" type="text" placeholder="22" type="search"
                                       onChange={this.sshPortOnChange}/>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="ssh-input-buttons">
                    <Button id="configure-manually-btn"
                            onClick={()=>{
                                this.setState({
                                    nameInput: '',
                                    uriInput: '',
                                    schemaInput: ''
                                });
                                this.changeInputsModal("configure_manually");
                            }} invert>
                        Configure manually
                    </Button>
                    <Button id="simplified-connection-btn"
                            onClick={()=>{

                                this.setState({
                                    bigInput: false,
                                    nameInput: '',
                                    hostInput: '',
                                    portInput: '',
                                    userInput: '',
                                    passwordInput: '',
                                    databaseInput: '',
                                    schemaInput: '',
                                    dtypeInput: 'mysql'
                                });

                                this.changeInputsModal("simple");
                            }} invert>
                        Simplified connection
                    </Button>
                </div>
            </div>
        );
    };

    addFreeTrial = () => {
        let first = "604800000~";
        let second = Date.now().toString();
        let bytes = utf8.encode(first + second);
        let encr = base64.encode(bytes);
        updateKey(encr)
            .then(() => {
                    this.setState({
                        isKeyOpen: false,
                        isOpen: this.state.connections.length ? false : true // show popup if none connections in the app
                     });
            });
    }

    keyInput = () => {
        return(
            <div>
                <div className="license-key-text">Enter license key:</div>
                <input placeholder="00000000-00000000-00000000-00000000" className="form-control"
                        onChange={this.keyOnChange}/>

                {this.state.trialAvailable && <Button id="free-trial-btn" onClick={() => this.setState({ trialWindow: true })} invert>
                    Get a free trial!
                </Button>}
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

    search = () => {
        const searchNameValue = document.getElementById('connection-name-search').value;
        const searchSchemaValue = document.getElementById('connection-schema-search').value;
        const searchDateValue = document.getElementById('connection-date-search').value;
        let searchedConnections = [];

        if(this.state.connections.length != 0) {
            this.state.connections.forEach(connection => {
                if(connection.name.includes(searchNameValue) &&
                    connection.schema.includes(searchSchemaValue) &&
                    connection.createdAt.includes(searchDateValue)) {
                        searchedConnections.push(connection);
                }
            });

            this.setState({searchedConnections: searchedConnections});
        }
    }

    render() {
        const {
            searchedConnections,
            isSimplifiedConnectionPopup,
            isSSHConnectionPopup,
            isConfigureManuallyPopup,
            isKeyOpen,
            bigInput,
            isErrorOpen,
            isDeleteOpen,
            errorMessage,
            trialWindow,
            trialAvailable,
            isBigInputs,
            firstModalHint,
            secondModalHint,
            isDeleteConnection,
            deleteConnectionName
        } = this.state;

        return (

            /* ------------------------------------------ CONNECTION PAGE ------------------------------------------- */
            <div className='connections-page'>


                {/* ------------------------------------ CONNECTION PAGE HEADER ------------------------------------ */}
                <div className='connections-page-header'>
                    <span className={'connections-page-name'}>Databases</span>
                    <button className={'add-database-button'} type="button" id="add-button"
                            onClick={() => this.openSimplifiedConnectionPopup()}>Add database
                    </button>
                </div>


                <div>
                    {
                        searchedConnections.length !== 0 ?

                            /* -------------------------- FILLED CONNECTIONS PAGE --------------------------- */
                            <div className={'filled-connections-page'}>


                                {/* ------------------------------- FILTERS -------------------------------- */}
                                <div className={'connections-page-filters'}>


                                    {/* --------------------------- FILTER NAME ---------------------------- */}
                                    <div className={'connections-page-filter-NAME'}>
                                        <span className={'connections-page-filters-title'}>Name</span>
                                        <img className={'connections-page-filters-arrow'} src={filters_arrow}
                                             alt={'arrow'}/>
                                        <input className={'connections-page-filters-search'}
                                               id={'connection-name-search'}
                                               placeholder={'Search'} onChange={() => this.search()}/>
                                    </div>


                                    {/* ------------------------ FILTER SCHEMA NAME ------------------------ */}
                                    <div className={'connections-page-filter-SCHEMA-NAME'}>
                                        <span className={'connections-page-filters-title'}>Schema Name</span>
                                        <img className={'connections-page-filters-arrow'} src={filters_arrow}
                                             alt={'arrow'}/>
                                        <input className={'connections-page-filters-search'}
                                               id={'connection-schema-search'}
                                               placeholder={'Search'} onChange={() => this.search()}/>
                                    </div>


                                    {/* ------------------------ FILTER DATE CREATED ----------------------- */}
                                    <div className={'connections-page-filter-DATE-CREATED'}>

                                        <div className={'DATE-CREATED-search-div'}>
                                            <span className={'connections-page-filters-title'}>Date Created</span>
                                            <img className={'connections-page-filters-arrow'} src={filters_arrow}
                                                 alt={'arrow'}/>
                                            <input className={'connections-page-filters-search'}
                                                   id={'connection-date-search'}
                                                   placeholder={'Search'} onChange={() => this.search()}/>
                                        </div>


                                        <div className={'DATE-CREATED-filter-div'}>
                                            <img className={'connections-page-filters-filter-icon'}
                                                 src={filters_icon} alt={'filter'}/>
                                        </div>
                                    </div>


                                </div>


                                {/* ------------------------------ DATABASES ------------------------------- */}
                                <div className='connections-page-databases-block'>
                                    <div className='connections-page-all-databases'>
                                        {searchedConnections.map(conn => {
                                            return (
                                                <div className='database' id={conn.name} key={conn.name}>

                                                    {/* ----------------- DATABASES ICON ------------------- */}
                                                    <div className='database-icon' onDoubleClick={() => this.openConnection(conn.name)}>
                                                        <svg>
                                                            <path
                                                                d="M20 6.36C20 4.1552 15.9744 3 12 3C8.0256 3 4 4.1552 4 6.36C4 6.3984 4 6.4368 4 6.4784C4 6.52 4 6.52 4 6.52V17.08C4.0006 17.1589 4.01579 17.237 4.0448 17.3104C4.4864 19.2624 8.2656 20.28 12 20.28C15.7344 20.28 19.5136 19.2624 19.9552 17.3104C19.9842 17.237 19.9994 17.1589 20 17.08V6.52C20 6.504 20 6.4912 20 6.4784C20 6.4656 20 6.3984 20 6.36ZM18.72 11.7776V13.4C18.72 13.6784 18.3616 14.136 17.3504 14.5744C16.0288 15.16 14.08 15.48 12 15.48C9.92 15.48 7.9712 15.16 6.6496 14.5744C5.6384 14.136 5.28 13.6784 5.28 13.4V11.7776H5.2992C5.3632 11.8192 5.4336 11.8608 5.5072 11.9024L5.6 11.96L5.7824 12.0528L5.8688 12.0976C5.9584 12.1392 6.0512 12.184 6.1504 12.2256C7.616 12.872 9.76 13.24 12 13.24C14.24 13.24 16.384 12.872 17.8624 12.2256C17.9616 12.184 18.0544 12.1392 18.1472 12.0944L18.224 12.056L18.416 11.9568L18.4864 11.9152C18.5632 11.8736 18.6368 11.832 18.704 11.7872L18.72 11.7776ZM18.72 9.88C18.72 10.1584 18.3616 10.616 17.3504 11.0544C16.0288 11.64 14.08 11.96 12 11.96C9.92 11.96 7.9712 11.64 6.6496 11.0544C5.6384 10.616 5.28 10.1584 5.28 9.88V8.2576C5.55345 8.42959 5.84023 8.5794 6.1376 8.7056C7.616 9.352 9.76 9.72 12 9.72C12.2816 9.72 12.56 9.72 12.8384 9.704C13.4784 9.6752 14.1184 9.6144 14.7264 9.528C15.1488 9.4672 15.5616 9.3968 15.952 9.3104C16.6098 9.1704 17.2527 8.96788 17.872 8.7056C18.1662 8.57913 18.4497 8.42932 18.72 8.2576V9.88ZM12 4.28C16.1024 4.28 18.72 5.512 18.72 6.36C18.72 6.6384 18.3616 7.096 17.3504 7.5344C16.0288 8.12 14.08 8.44 12 8.44C11.7408 8.44 11.4816 8.44 11.2288 8.424C10.976 8.408 10.6592 8.3952 10.3808 8.3696C9.75073 8.31761 9.12447 8.22677 8.5056 8.0976C8.29227 8.0528 8.08747 8.0048 7.8912 7.9536L7.7504 7.9184C7.37509 7.8158 7.00729 7.68749 6.6496 7.5344C5.6384 7.096 5.28 6.6384 5.28 6.36C5.28 5.512 7.8976 4.28 12 4.28ZM12 19C7.8976 19 5.28 17.768 5.28 16.92V15.2976H5.2992C5.3632 15.3392 5.4336 15.3808 5.5072 15.4224L5.6 15.48L5.7824 15.5728L5.8688 15.6176C5.9584 15.6592 6.0512 15.704 6.1504 15.7456C7.616 16.392 9.76 16.76 12 16.76C14.24 16.76 16.384 16.392 17.8624 15.7456C17.9616 15.704 18.0544 15.6592 18.1472 15.6144L18.224 15.576L18.416 15.4768L18.4864 15.4352C18.5632 15.3936 18.6368 15.352 18.704 15.3072V16.92C18.72 17.768 16.1024 19 12 19Z"/>
                                                        </svg>
                                                    </div>

                                                    {/* ----------------- DATABASES NAME ------------------- */}
                                                    <div className={'database-name'} onDoubleClick={() => this.openConnection(conn.name)}>
                                                        <span className={'database-text'}
                                                              id="folders-n">{conn.name} {this.databaseHost(conn)}</span>
                                                    </div>

                                                    {/* -------------- DATABASES SCHEMA NAME --------------- */}
                                                    <div className={'database-schema-name'} onDoubleClick={() => this.openConnection(conn.name)}>
                                                        <span className={'database-text'}
                                                              id="folders-schema-n">{conn.schema}</span>
                                                    </div>

                                                    {/* -------------- DATABASES DATE CREATED -------------- */}
                                                    <div className={'database-date-created'} onDoubleClick={() => this.openConnection(conn.name)}>
                                                        <span className={'database-text'}
                                                              id="folders-date-created">{conn.date}</span>
                                                    </div>

                                                    <div className={'database-mini-menu'}
                                                         onClick={() => (this.isDBMiniMenuOpen(conn.name),
                                                         this.saveDeleteConnectionName(conn.name))}>
                                                        <svg>
                                                            <path
                                                                d="M2.14286 7.80488C3.33333 7.80488 4.28571 8.78049 4.28571 10C4.28571 11.2195 3.33333 12.1951 2.14286 12.1951C0.952381 12.1951 0 11.2195 0 10C0 8.78049 0.952381 7.80488 2.14286 7.80488ZM0 2.19512C0 3.41463 0.952381 4.39024 2.14286 4.39024C3.33333 4.39024 4.28571 3.41463 4.28571 2.19512C4.28571 0.97561 3.33333 0 2.14286 0C0.952381 0 0 0.97561 0 2.19512ZM0 17.8049C0 19.0244 0.952381 20 2.14286 20C3.33333 20 4.28571 19.0244 4.28571 17.8049C4.28571 16.5854 3.33333 15.6098 2.14286 15.6098C0.952381 15.6098 0 16.5854 0 17.8049Z"
                                                                fill="#5C5D6F"/>
                                                        </svg>


                                                    </div>

                                                    <DatabaseMiniMenuPopup
                                                        isOpen={this.state.isDBMiniMenu === conn.name}
                                                        openDeleteConnectionPopup={this.openDeleteConnectionPopup}
                                                    >
                                                    </DatabaseMiniMenuPopup>


                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* ----------------------- CONNECTIONS PAGE FOOTER ------------------------ */}
                                <div className='connections-page-footer'>

                                    <div className={'databases-on-page'}>
                                        <span className={'connections-page-footer-text'}>Rows per page: 10</span>
                                        <img src={footer_arrow_down} alt={'arrow'}/>
                                    </div>

                                    <div className={'databases-amount'}>
                                        <span className={'connections-page-footer-text'}>1-10 of 10</span>
                                    </div>

                                    <div className={'database-pages'}>
                                        <img className={'database-pages-arrow-left'} src={footer_arrow_left}
                                             alt={'arrow left'}/>

                                        <img className={'database-pages-arrow-right'} src={footer_arrow_right}
                                             alt={'arrow right'}/>
                                    </div>
                                </div>

                            </div>

                            :

                            /* ------------------------------ EMPTY CONNECTIONS PAGE -------------------------------- */
                            <div className={'empty-connections-page'}>

                                <div className={'empty-connections-page-block'}>
                                    <img src={empty_connections_page_icon} alt={'empty page'}/>

                                    <span>Not added any connection.<br/>Please add database connection to list.</span>

                                    <button type="button" id="add-button"
                                            onClick={() => this.openSimplifiedConnectionPopup()}>Add connection
                                    </button>
                                </div>

                            </div>
                    }
                </div>

                {/* ----------------------------------------CONNECTION POPUPS----------------------------------------- */}
                <SimplifiedConnectionPopup
                    isOpen={isSimplifiedConnectionPopup}
                    onCancel={this.handleCancel}
                    onSubmit={this.handleSubmit}
                    closeFirstModalHints={this.closeFirstModalHint}
                    closeSecondModalHints={this.closeSecondModalHint}
                    firstModalHint={firstModalHint}
                    secondModalHint={secondModalHint}
                    errorMessage={errorMessage}
                    isError={isErrorOpen}
                >
                    {this.smallInput()}
                </SimplifiedConnectionPopup>


                <SSHConnectionPopup
                    isOpen={isSSHConnectionPopup}
                    onCancel={this.handleCancel}
                    onSubmit={this.handleSubmit}
                    closeFirstModalHints={this.closeFirstModalHint}
                    closeSecondModalHints={this.closeSecondModalHint}
                    firstModalHint={firstModalHint}
                    secondModalHint={secondModalHint}
                >
                    {this.sshInput()}
                </SSHConnectionPopup>

                <ConfigureManuallyPopup
                    isOpen={isConfigureManuallyPopup}
                    onCancel={this.handleCancel}
                    onSubmit={this.handleSubmit}
                    errorMessage={errorMessage}
                    isError={isErrorOpen}
                >
                    {this.bigInput()}
                </ConfigureManuallyPopup>



                <DeleteConnectionPopup
                    isOpen={isDeleteConnection}
                    onCancel={this.closeDeleteConnectionPopup}
                    deleteConnectionName={deleteConnectionName}
                    deleteConnection={this.deleteConnection}
                />



                {/* ------------------------------------------------------------------------------------------------ */}

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

                {/*
                <Modal
                    title="Error"
                    isOpen={isErrorOpen}
                    onCancel={this.handleErrorCancel}
                    onSubmit={this.handleErrorCancel}
                    submitTitle="Ok"
                >
                    <strong>Message!</strong>{errorMessage}
                </Modal>
                */}

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


            </div>
        );
    }
}