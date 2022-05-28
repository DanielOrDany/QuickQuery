import React from 'react';
import { Offline } from "react-detect-offline";

import footer_arrow_left from "../../icons/connections-page-footer-arrow-left.svg";
import footer_arrow_right from "../../icons/connections-page-footer-arrow-right.svg";
import filters_arrow from "../../icons/connections-page-filter-arrow.svg";
import add_icon from "../../icons/add-icon.svg";
import empty_connections_page_icon from "../../icons/database.png";
import firestore from "../../icons/firestore.svg";
import postgresql from "../../icons/postgresql.svg";
import mysql from "../../icons/mysql.svg";
import userIcon from "../../icons/user.png";
import hostIcon from "../../icons/host.png";

import './Connections.scss';
import Modal from '../../popups/Modal';
import Button from '../../components/Button';
import ConfigureManuallyPopup from "./popups/ConfigureManuallyPopup";
import SimplifiedConnectionPopup from "./popups/SimplifiedConnectionPopup";
import SSHConnectionPopup from "./popups/SSHConnectionsPopup";
import DatabaseMiniMenuPopup from "./popups/DatabaseMiniMenu";
import DeleteConnectionPopup from "./popups/DeleteConnectionPopup";
import ConnectionErrorModal from '../../popups/MessagePopup';
import ConnectionPopup from "./popups/ConnectionPopup";
import FirebasePopup from "./popups/FirebasePopup";

import {
    getDataFromDatabase,
    deleteConnection,
    addConnection,
    authVerifyToken,
    renameConnection
} from "../../methods";
import mixpanel from "mixpanel-browser";


export default class Connections extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            connections: null,
            searchedConnections: [],
            nameInput: '',
            hostInput: '',
            portInput: '',
            userInput: '',
            passwordInput: '',
            databaseInput: '',
            schemaInput: 'public',
            dtypeInput: 'mysql',
            uriInput: '',
            sshHostInput: '',
            sshUserInput: '',
            sshPortInput: '',
            sshPrivateKeyInput: '',
            keyInput: '',
            errorMessage: '',
            databaseType: '',
            /*isOpen: false,*/
            isDeleteOpen: false,
            ConfigureManuallyPopup: false,
            choosedConnetion: '',
            firebaseConfigInput: '',
            isFirebaseConnectionPopup: false,
            isSimplifiedConnectionPopup: false,
            isConfigureManuallyPopup: false,
            isSSHConnectionPopup: false,
            isConnectionPopup: false,
            firstModalHint: true,
            secondModalHint: true,
            isDBMiniMenu: null,
            editConnection: null,
            isDeleteConnection: false,
            deleteConnectionName: "",
            rowsPerPage: 10,
            pageNumber: 1,
            orderByName: false,
            orderBySchema: false,
            orderByDate: false,
            isErrorOpen: false
        };
    };

    openConnectionPopup = () => {
        const employeeId = localStorage.getItem("employeeId");
        mixpanel.track(`openConnectionPopup`, { employeeId: employeeId});

        this.setState({ isConnectionPopup: true });
    };

    closeConnectionPopup = () => {
        const employeeId = localStorage.getItem("employeeId");
        mixpanel.track(`closeConnectionPopup`, { employeeId: employeeId});

        this.setState({ 
            isConnectionPopup: false,
            editConnection: null
        });
    };

    closeFirebasePopup = () => {
        const employeeId = localStorage.getItem("employeeId");
        mixpanel.track(`closeFirebasePopup`, { employeeId: employeeId});

        this.setState({
            isFirebaseConnectionPopup: false,
            editConnection: null,
            isDBMiniMenu: null,
        });
    };

    isDBMiniMenuOpen = (connectionName) => {
        const employeeId = localStorage.getItem("employeeId");
        mixpanel.track(`isDBMiniMenuOpen`, { employeeId: employeeId});
        console.log('open context menu')
        this.setState({
            isDBMiniMenu: connectionName,
        })
    };

    changeInputsModal = (modal) => {
        const employeeId = localStorage.getItem("employeeId");
        mixpanel.track(`changeInputsModal ${modal}`, { employeeId: employeeId});

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

    handleSave = () => {
        this.editConnection();
    };

    closeFirstModalHint = () => {
        this.setState({firstModalHint: false});
    };

    closeSecondModalHint = () => {
        this.setState({secondModalHint: false});
    };

    closeDeleteConnectionPopup = () => {
        this.setState({isDeleteConnection: false});
    };

    openDeleteConnectionPopup = () => {
        this.setState({isDeleteConnection: true});
    };

    openEditConnectionPopup = (name) => {
        const { connections } = this.state;
        const editConnection = connections.find((connection) => connection.name === name);

        if (editConnection.dtype === "firestore") {
            this.setState({
                editConnection,
                isFirebaseConnectionPopup: true
            })
        } else {
            if (typeof editConnection.URI === "string") {
                this.setState({
                    editConnection,
                    isSimplifiedConnectionPopup: true
                })
            } else if (editConnection.sshHost) {
                this.setState({
                    editConnection,
                    isSSHConnectionPopup: true
                })
            } else {
                this.setState({
                    editConnection,
                    isConfigureManuallyPopup: true
                })
            }
        }
    };

    saveDeleteConnectionName = (name) => {
        this.setState({deleteConnectionName: name});
    };

    handleCancel = () => {
        this.setState({
            isSimplifiedConnectionPopup: false,
            isConfigureManuallyPopup: false,
            isSSHConnectionPopup: false,
            isFirebaseConnectionPopup: false,
            isDBMiniMenu: null,
            editConnection: null
        });
    };

    handleDeleteSubmit = () => {
        this.deleteConnection(this.state.choosedConnetion);
        this.setState({ choosedConnetion: '', isDeleteOpen: false, isDBMiniMenu: null});
    };

    handleDeleteCancel = () => {
        this.setState({ choosedConnetion: '', isDeleteOpen: false, isDBMiniMenu: ""});
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

    inputVerify(args) {
        if (args.replace(/^\s+|\s+$/gm, '').length === 0) {
            this.setState({
                errorMessage: "Please, fill in all the fields.",
                isErrorOpen: true
            });
            return false;
        }
        return true;
    }

    editConnection = () => {
        const { nameInput, editConnection } = this.state;

        if (nameInput.replace(/^\s+|\s+$/gm, '').length === 0) {
            this.setState({
                errorMessage: "Sorry, we cannot save it. You should change the connection name or click on the 'close' button.",
                isErrorOpen: true
            });
        } else {
            renameConnection(editConnection.name, nameInput).then(connections => {
                if (connections) {
                    localStorage.setItem("connections", connections);

                    this.setState({
                        connections: connections,
                        searchedConnections: connections,
                        isErrorOpen: false,
                        errorMessage: "",
                        isConfigureManuallyPopup: false,
                        isSimplifiedConnectionPopup: false,
                        isSSHConnectionPopup: false,
                        isFirebaseConnectionPopup: false,
                        isDBMiniMenu: null,
                        editConnection: null
                    });

                } else {
                    this.setState({
                        errorMessage: "Seems like such a name already exists, please rename it and click on the 'save' button.",
                        isErrorOpen: true
                    });
                }
            });
        }
    };

    addConnection = () => {
        let nameInput = this.state.nameInput;
        let hostInput = this.state.hostInput;
        let portInput = this.state.portInput;
        let userInput = this.state.userInput;
        let passwordInput = this.state.passwordInput;
        let databaseInput = this.state.databaseInput;
        let schemaInput = this.state.schemaInput;
        let dtypeInput = this.state.databaseType; //this.state.dtypeInput;
        let uriInput = this.state.uriInput;
        let sshHostInput = this.state.sshHostInput;
        let sshUserInput = this.state.sshUserInput;
        let sshPortInput = this.state.sshPortInput;
        let sshPrivateKeyInput = this.state.sshPrivateKeyInput;
        let firebaseConfigInput = this.state.firebaseConfigInput;
        let successfullVerify = false;

        // Check valid inputs
        if (this.state.isConfigureManuallyPopup) {
            successfullVerify =
                this.inputVerify(nameInput) &&
                this.inputVerify(hostInput) &&
                this.inputVerify(portInput) &&
                this.inputVerify(userInput) &&
                this.inputVerify(passwordInput) &&
                this.inputVerify(databaseInput) &&
                this.inputVerify(schemaInput) &&
                this.inputVerify(dtypeInput);
        } else if (this.state.isSSHConnectionPopup) {
            successfullVerify =
                this.inputVerify(nameInput) &&
                this.inputVerify(portInput) &&
                this.inputVerify(userInput) &&
                this.inputVerify(passwordInput) &&
                this.inputVerify(databaseInput) &&
                this.inputVerify(schemaInput) &&
                this.inputVerify(dtypeInput) &&
                this.inputVerify(sshHostInput) &&
                this.inputVerify(sshPortInput) &&
                this.inputVerify(sshUserInput) &&
                this.inputVerify(sshPrivateKeyInput);
        } else if (this.state.isFirebaseConnectionPopup) {
            successfullVerify =
                this.inputVerify(nameInput) &&
                this.inputVerify(firebaseConfigInput)
        } else if (this.state.isSimplifiedConnectionPopup){
            successfullVerify =
                this.inputVerify(nameInput) &&
                this.inputVerify(uriInput) // &&
                // this.inputVerify(schemaInput);
        }

        if (successfullVerify) {
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
            } else if (this.state.isFirebaseConnectionPopup) {
                connectionBody = {
                    firebaseConfig: firebaseConfigInput,
                    dtype: dtypeInput,
                    name: nameInput
                };
            } else if (this.state.isSimplifiedConnectionPopup){
                connectionBody = {
                    dtype: dtypeInput,
                    schema: 'public',
                    uri: uriInput,
                    name: nameInput
                };
            }

            addConnection(connectionBody).then(connection => {
                if (connection) {
                    const connections = JSON.parse(localStorage.getItem("connections"));

                    connections.push(connection);
                    localStorage.setItem("connections", connections);

                    this.setState({
                        connections: connections,
                        searchedConnections: connections,
                        isErrorOpen: false,
                        errorMessage: "",
                        isConfigureManuallyPopup: false,
                        isSimplifiedConnectionPopup: false,
                        isFirebaseConnectionPopup: false,
                        isSSHConnectionPopup: false,
                        isDBMiniMenu: false
                    });

                    const employeeId = localStorage.getItem("employeeId");
                    mixpanel.track(`Added new connection`, { employeeId: employeeId});
                } else {
                    const employeeId = localStorage.getItem("employeeId");
                    mixpanel.track(`Cannot add new connection`, { employeeId: employeeId});

                    this.setState({
                        errorMessage: "Seems like such a name already exists or you fill in the wrong data, please fix this and click on the 'create' button.",
                        isErrorOpen: true
                    });
                }
            });
        }
    };

    deleteConnection = (name) => {
        deleteConnection(name).then(connections => {
            if (connections) {
                const employeeId = localStorage.getItem("employeeId");
                mixpanel.track(`Delete connection`, { employeeId: employeeId});

                this.setState({
                    connections: connections,
                    searchedConnections: connections,
                    isDeleteConnection: false,
                    isDBMiniMenu: false
                });
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

            if (verified && verified.data) {
                localStorage.setItem("deleteAccess", verified.data.employee.dataValues.delete_access);
                localStorage.setItem("updateAccess", verified.data.employee.dataValues.update_access);
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
        if (this.state.isDBMiniMenu) {
            // do nothing
        } else {
            await this.verifyEmployee();
            const employeeId = localStorage.getItem("employeeId");
            mixpanel.track(`openConnection`, { employeeId: employeeId});
            const currentConnection = this.getConnectionData(name);
            localStorage.setItem('current_connection', JSON.stringify(currentConnection));
            window.location.hash = `#/tables/${name}`;
        }
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
                document.getElementById('ssh-file-upload-wrapper').setAttribute('data-text', e.target.files[0].path.replace(/.*(\/|\\)/, ''));
            } else {
                this.setState({errorMessage: "Try to reload private key", sshPrivateKeyInput: ""})
            }
        }
    };
    firebaseConfigOnChange = (e) => {
        if (e) {
            if (e.target && e.target.files[0]) {
                this.setState({ firebaseConfigInput: e.target.files[0].path })
                document.getElementById('file-upload-wrapper').setAttribute('data-text', e.target.files[0].path.replace(/.*(\/|\\)/, ''));
            } else {
                this.setState({errorMessage: "Try to reload private key", firebaseConfigInput: ""})
            }
        }
    };

    handleErrorCancel = () => {
        this.setState({
            isErrorOpen: false
        });
    };

    bigInput = (editConnection) => {
        return(
            <div className="big-input-modal">
                <div className="big-input-modal-body">
                    <div className="big-input-first-column">
                        <div className="big-information-field">
                            <span className="big-input-title">Database name</span>
                            <input id="input-field-name" ref="name" className="big-form-control" type="text" placeholder="My db" 
                                   defaultValue={editConnection && editConnection.name}
                                   onChange={this.nameOnChange} onKeyPress={this.nameKeyPress}/>
                        </div>
                        <div className="big-information-field">
                            <span className="big-input-title">Port</span>
                            <input id="input-field-port" ref="port" className="big-form-control" type="text" placeholder="5432" 
                                   defaultValue={editConnection && editConnection.URI.port}
                                   disabled={!!editConnection}
                                   onChange={this.portOnChange} onKeyPress={this.portKeyPress}/>
                        </div>
                        <div className="big-information-field">
                            <span className="big-input-title">Password</span>
                            <input id="input-field-password" ref="password" className="big-form-control"
                                   placeholder="Password" type="password"
                                   disabled={!!editConnection}
                                   defaultValue={editConnection && editConnection.URI.password}
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
                                   placeholder="public" 
                                   disabled={!!editConnection}
                                   defaultValue={editConnection && editConnection.schema}
                                   onChange={this.schemaOnChange} onKeyPress={this.schemaKeyPress}
                            />
                        </div>
                    </div>
                    <div className="big-input-second-column">
                        <div className="big-information-field">
                            <span className="big-input-title">Host</span>
                            <input id="input-field-host" ref="host" className="big-form-control" type="text" placeholder="127.0.0.1"
                                   defaultValue={editConnection && editConnection.URI.host}
                                   disabled={!!editConnection}
                                   onChange={this.hostOnChange} onKeyPress={this.hostKeyPress}/>
                        </div>
                        <div className="big-information-field">
                            <span className="big-input-title">User name</span>
                            <input id="input-field-user" ref="user" className="big-form-control" type="text" placeholder="root" 
                                   defaultValue={editConnection && editConnection.URI.user}
                                   disabled={!!editConnection}
                                   onChange={this.userOnChange} onKeyPress={this.userKeyPress}/>
                        </div>
                        <div className="big-information-field">
                            <span className="big-input-title">
                                Database
                                <div className="help-tip" id="database-manual-tip">
                                    <p>
                                    A database means the same name when you create your database - like in this example: "CREATE DATABASE manager"
                                    </p>
                                </div>
                            </span>
                            <input id="input-field-database" ref="database" className="big-form-control" type="text"
                                   placeholder="menager - like CREATE DATABASE manager"
                                   defaultValue={editConnection && editConnection.URI.database}
                                   disabled={!!editConnection}
                                   onChange={this.databaseOnChange} onKeyPress={this.databaseKeyPress}/>
                        </div>
                    </div>
                </div>
                <div className="big-input-buttons">
                    <Button id="simplified-connection-btn"
                            disabled={!!editConnection}
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
                            disabled={!!editConnection}
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

    chooseDatabase = (type) => {
        if (type === "mysql" || type === "postgres") {
            this.setState({
                isSimplifiedConnectionPopup: true,
                isConnectionPopup: false,
                databaseType: type
            });
        } else if (type === "firestore") {
            this.setState({
                isFirebaseConnectionPopup: true,
                isConnectionPopup: false,
                databaseType: type
            });
        }
    };

    databaseList = () => {
        return(
            <div className="choose-database-popup">
                <div className="database-list">
                    <img src={firestore} onClick={() => this.chooseDatabase("firestore")}/>
                    <img src={mysql} onClick={() => this.chooseDatabase("mysql")}/>
                    <img src={postgresql} onClick={() => this.chooseDatabase("postgres")}/>
                </div>
            </div>
        );
    };

    firebaseInput = (editConnection) => {
        console.log("editConnection", editConnection)
        return(
            <div>
                <div className="firebase-information-field">
                    <span className="firebase-input-title">Database name</span>
                    <input id="input-field-name" ref="name" className="firebase-form-control" type="text"
                           defaultValue={editConnection && editConnection.name}
                           onChange={this.nameOnChange} onKeyPress={this.nameKeyPress}/>
                </div>
                <div className="firebase-information-field" hidden={!!editConnection}>
                    <span className="firebase-input-title">Firebase config</span>
                    <div id="file-upload-wrapper" className="file-upload-wrapper" data-text="Select your file!">
                        <input id="input-field-host" name="file-upload-field" type="file" className="file-upload-field" value="" disabled={!!editConnection} onChange={this.firebaseConfigOnChange}/>
                    </div>
                </div>
            </div>
        );
    };

    smallInput = (editConnection) => {
        return(
            <div>
                <div className="small-information-field">
                    <span className="small-input-title">Database name</span>
                    <input id="input-field-name" ref="name" className="small-form-control" type="text"
                           defaultValue={editConnection && editConnection.name}
                           onChange={this.nameOnChange} onKeyPress={this.nameKeyPress}/>
                </div>
                <div className="small-information-field">
                    <span className="small-input-title">Database URL</span>
                    <input id="input-field-uri" ref="uri" className="small-form-control" type="text"
                           defaultValue={editConnection && typeof editConnection.URI === "string" && editConnection.URI}
                           disabled={!!editConnection}
                           onChange={this.uriOnChange} onKeyPress={this.uriKeyPress}
                    />
                </div>
                <div className="small-information-buttons">
                    <Button id="configure-manually-btn"
                            disabled={!!editConnection}
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
                            disabled={!!editConnection}
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

    sshInput = (editConnection) => {
        return(

            <div className="ssh-input-modal">
                <div className="ssh-input-modal-body">
                    <div className="ssh-body-first-block">
                        <div className="ssh-body-first-block-left-column">
                            <div className="ssh-information-field">
                                <span className="ssh-input-title">Database name</span>
                                <input id="input-field-name" ref="name" className="ssh-form-control" defaultValue={editConnection && editConnection.name} type="text" placeholder="Database"
                                       onChange={this.nameOnChange} onKeyPress={this.nameKeyPress}/>
                            </div>
                            <div className="ssh-information-field">
                                <span className="ssh-input-title">Database Port</span>
                                <input id="input-field-port" ref="port" className="ssh-form-control" defaultValue={editConnection && editConnection.sshHost && editConnection.URI.port} type="text" placeholder="5432" 
                                       disabled={!!editConnection}
                                       onChange={this.portOnChange} onKeyPress={this.portKeyPress}/>
                            </div>
                            <div className="ssh-information-field">
                                <span className="ssh-input-title">Database Password</span>
                                <input id="input-field-password" ref="password" className="ssh-form-control"
                                       disabled={!!editConnection}
                                       placeholder="Password" type="password" defaultValue={editConnection && editConnection.sshHost && editConnection.URI.password}
                                       onChange={this.passwordOnChange} onKeyPress={this.passwordKeyPress}/>
                            </div>
                        </div>
                        <div className="ssh-body-first-block-right-column">
                            <div className="ssh-information-field">
                                <span className="ssh-input-title">Database User</span>
                                <input id="input-field-user" ref="user" className="ssh-form-control" type="text" placeholder="root"
                                       disabled={!!editConnection}
                                       defaultValue={editConnection && editConnection.sshHost && editConnection.URI.user}
                                       onChange={this.userOnChange} onKeyPress={this.userKeyPress}/>
                            </div>
                            <div className="ssh-information-field">
                                <span className="ssh-input-title">
                                    Database
                                    <div className="help-tip" id="database-ssh-tip">
                                        <p>
                                        A database means the same name when you create your database - like in this example: "CREATE DATABASE manager"
                                        </p>
                                    </div>
                                </span>
                                <input id="input-field-database" ref="database" className="ssh-form-control" type="text"
                                       placeholder="manager"
                                       disabled={!!editConnection}
                                       defaultValue={editConnection && editConnection.sshHost && editConnection.URI.database}
                                       onChange={this.databaseOnChange} onKeyPress={this.databaseKeyPress}/>
                            </div>
                            <div className="information-field">
                                <span className="ssh-input-title-and-hint">Schema name
                                    <div className="help-tip" id="schema-tip">
                                        <p>A schema is a collection of database objects associated with one particular database username.</p>
                                    </div>
                                </span>
                                <input id="input-field-schema" ref="schema" className="ssh-form-control" type="text"
                                       disabled={!!editConnection}
                                       placeholder="public" defaultValue={editConnection && editConnection.sshHost && editConnection.schema}
                                       onChange={this.schemaOnChange} onKeyPress={this.schemaKeyPress}/>
                            </div>
                        </div>
                    </div>

                    <div className="ssh-block-line"/>

                    <div className="ssh-body-second-block">

                        <div className="ssh-body-second-block-left-column">

                            <div className="ssh-information-field">
                                <span className="ssh-input-title">SSH Host</span>
                                <input id="input-field-port" ref="port" className="ssh-form-control" type="text" placeholder="127.0.0.1"
                                       defaultValue={editConnection && editConnection.sshHost}
                                       disabled={!!editConnection}
                                       onChange={this.sshHostOnChange}/>
                            </div>
                            <div className="ssh-information-field">
                                <span className="ssh-input-title">Private Key</span>
                                <div id="ssh-file-upload-wrapper" className="file-upload-wrapper" data-text="Select your file!">
                                    <input id="ssh-input-field-host" name="file-upload-field" disabled={!!editConnection} type="file" className="file-upload-field" value="" onChange={this.sshPrivateKeyOnChange}/>
                                </div>
                            </div>
                        </div>


                        <div className="ssh-body-second-block-right-column">

                            <div className="ssh-information-field">
                                <span className="ssh-input-title">SSH User</span>
                                <input id="input-field-user" ref="user" className="ssh-form-control" type="text" placeholder="ubuntu"
                                       defaultValue={editConnection && editConnection.sshUser}
                                       disabled={!!editConnection}
                                       onChange={this.sshUserOnChange}/>
                            </div>
                            <div className="ssh-information-field">
                                <span className="ssh-input-title">SSH Port</span>
                                <input id="input-field-host" ref="host" className="ssh-form-control" type="text" placeholder="22" type="search"
                                       defaultValue={editConnection && editConnection.sshPort}
                                       disabled={!!editConnection}
                                       onChange={this.sshPortOnChange}/>
                            </div>
                        </div>
                    </div>
                </div>


                <div className="ssh-input-modal-buttons">
                    <Button id="configure-manually-btn"
                            disabled={!!editConnection}
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
                            disabled={!!editConnection}
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

    closeMiniMenu = () => {
        const employeeId = localStorage.getItem("employeeId");
        mixpanel.track(`closeMiniMenu`, { employeeId: employeeId});

        const { isDBMiniMenu } = this.state;

        if (isDBMiniMenu) {
            this.setState({isDBMiniMenu: null});
        }
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

    getDatabaseUser(conn) {
        let user = "";

        if (typeof(conn.URI)=="string") {
            user = conn.URI.split("//")[1].split(":")[0];
        } else if(typeof(conn.URI)=="object") {
            user = conn.URI["user"];
        } else {
            user = conn.firebaseConfig.client_id
        }

        return user;
    }

    getDatabaseHost(conn) {
        let host = "";

        if (typeof(conn.URI)=="string") {
            host = conn.URI.split("@")[1].split(":")[0];
        } else if(typeof(conn.URI)=="object") {
            host = conn.URI["others"]["host"];
        } else {
            host = conn.firebaseConfig.project_id
        }

        return host;
    }

    search = () => {
        const employeeId = localStorage.getItem("employeeId");
        mixpanel.track(`search connection`, { employeeId: employeeId});

        const searchNameValue = document.getElementById('connection-name-search').value;
        let searchedConnections = [];

        if (this.state.connections.length !== 0) {
            this.state.connections.forEach(connection => {
                if (connection.name.includes(searchNameValue)) {
                        searchedConnections.push(connection);
                }
            });

            this.setState({
                searchedConnections: searchedConnections,
                pageNumber: 1
            });
        }
    };

    moveNext = () => {
        const employeeId = localStorage.getItem("employeeId");
        mixpanel.track(`move next connection`, { employeeId: employeeId});

        const { pageNumber, rowsPerPage, searchedConnections } = this.state;
        const l = searchedConnections.length;

        if (l > pageNumber * rowsPerPage) {
            this.setState({pageNumber: pageNumber + 1});
        }
    };

    moveBack = () => {
        const employeeId = localStorage.getItem("employeeId");
        mixpanel.track(`move back connection`, { employeeId: employeeId});

        const { pageNumber } = this.state;

        if (pageNumber !== 1) {
            this.setState({pageNumber: pageNumber - 1});
        }
    };

    changeOrder = (byColumn) => {
        const employeeId = localStorage.getItem("employeeId");
        mixpanel.track(`change connection order`, { employeeId: employeeId});

        const {
            orderByName,
            orderBySchema,
            orderByDate,
            searchedConnections
        } = this.state;

        if (searchedConnections.length !== 0) {
            if (byColumn === "name") {

                if (!orderByName) {
                    searchedConnections.sort(function(a, b) {
                        return a.name.localeCompare(b.name)
                    });
                } else {
                    searchedConnections.reverse();
                }

                this.setState({
                    orderByName: !orderByName,
                    searchedConnections: searchedConnections
                });
            } else if (byColumn === "date") {
                if (!orderByDate) {
                    searchedConnections.sort(function(a, b) {
                        return a.createdAt.localeCompare(b.createdAt)
                    });
                } else {
                    searchedConnections.reverse();
                }

                this.setState({
                    orderByDate: !orderByDate,
                    searchedConnections: searchedConnections
                });
            } else if (byColumn === "schema") {
                if (!orderBySchema) {
                    searchedConnections.sort(function(a, b) {
                        return a.schema.localeCompare(b.schema)
                    });
                } else {
                    searchedConnections.reverse();
                }

                this.setState({
                    orderBySchema: !orderBySchema,
                    searchedConnections: searchedConnections
                });
            }
        }
    };

    render() {
        let {
            searchedConnections,
            isSimplifiedConnectionPopup,
            isFirebaseConnectionPopup,
            isSSHConnectionPopup,
            isConfigureManuallyPopup,
            isConnectionPopup,
            isErrorOpen,
            isDeleteOpen,
            errorMessage,
            firstModalHint,
            secondModalHint,
            isDeleteConnection,
            deleteConnectionName,
            rowsPerPage,
            connections,
            pageNumber,
            orderByName,
            orderBySchema,
            orderByDate,
            editConnection
        } = this.state;

        const paginationFrom = 1 + rowsPerPage * pageNumber - rowsPerPage;
        const paginationTo = rowsPerPage * pageNumber;
        const searchedResults = searchedConnections.length;
        searchedConnections = searchedConnections.slice(paginationFrom - 1, paginationTo);

        console.log("connections", connections)
        return (
            /* ------------------------------------------ CONNECTION PAGE ------------------------------------------- */

            <div className="connections-page">
                <div>
                    { connections && connections.length !== 0 ?

                            /* -------------------------- FILLED CONNECTIONS PAGE --------------------------- */
                            <div className="filled-connections-page">

                                <div className='filled-connections-page-body'>
                                    <div className="connections-page-header">
                                        {/* ------------------------------- TITLE -------------------------------- */}
                                        <div className="connections-page-title">
                                            Connections
                                            <img 
                                                onClick={() => this.openConnectionPopup()}
                                                src={add_icon}
                                            />
                                        </div>

                                        {/* ------------------------------- FILTERS -------------------------------- */}
                                        <div className="connections-page-filters" onClick={() => this.closeMiniMenu()}>
                                            <input className="connections-page-filters-search"
                                                id="connection-name-search"
                                                placeholder="Search connections" onChange={() => this.search()}/>
                                        </div>
                                    </div>
                                    
                                    {/* ------------------------------ DATABASES ------------------------------- */}
                                    <div className='connections-page-databases-block' onClick={() => this.closeMiniMenu()}>
                                    {
                                        searchedConnections.map(conn => {
                                            return (
                                                <div className='database' id={conn.name} key={conn.name}
                                                    onClick={() => this.openConnection(conn.name)}
                                                    onContextMenu={() => (this.isDBMiniMenuOpen(conn.name),
                                                    this.saveDeleteConnectionName(conn.name))} 
                                                >

                                                    {/* ----------------- DATABASES ICON ------------------- */}
                                                    <div className='database-icon'>
                                                        <img src={conn.dtype === 'postgres' ? postgresql : conn.dtype === 'mysql' ? mysql : firestore }/>
                                                    </div>

                                                    <div className='database-info'>
                                                        {/* ----------------- DATABASES NAME ------------------- */}

                                                        <div className="database-name">
                                                            <span className="database-text"
                                                                id="folders-n">{conn.name}</span>
                                                        </div>
                                                        <div className="database-user">
                                                            <img src={userIcon}/>
                                                            <span className="database-text"
                                                                id="folders-n">{this.getDatabaseUser(conn)}</span>
                                                        </div>
                                                        <div className="database-host">
                                                            <img src={hostIcon}/>
                                                            <span className="database-text"
                                                                id="folders-n">{this.getDatabaseHost(conn)}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <DatabaseMiniMenuPopup
                                                        isOpen={this.state.isDBMiniMenu === conn.name}
                                                        connectionName={conn.name}
                                                        onClose={this.closeMiniMenu}
                                                        openDeleteConnectionPopup={this.openDeleteConnectionPopup}
                                                        openEditConnectionPopup={this.openEditConnectionPopup}
                                                    >
                                                    </DatabaseMiniMenuPopup>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>

                            : connections && connections.length !== 0 && // Else

                            /* ------------------------------ EMPTY CONNECTIONS PAGE -------------------------------- */
                            <div className="empty-connections-page">
                                <div className="empty-connections-page-block">
                                    <img src={empty_connections_page_icon} alt="empty page"/>
                                    <div>
                                        <button 
                                            className="add-database-button" 
                                            type="button" 
                                            id="add-button"
                                            onClick={() => this.openConnectionPopup()}
                                                >Let's connect to database
                                        </button>
                                    </div>
                                </div>
                            </div>
                    }
                </div>

                {/* ----------------------------------------CONNECTION POPUPS----------------------------------------- */}
                <ConnectionPopup
                    isOpen={isConnectionPopup}
                    onCancel={() => this.closeConnectionPopup()}
                >
                    {isConnectionPopup && this.databaseList()}
                </ConnectionPopup>

                <FirebasePopup
                    isOpen={isFirebaseConnectionPopup}
                    onCancel={() => this.closeFirebasePopup()}
                    onSubmit={this.handleSubmit}
                    onSave={this.handleSave}
                    isEdit={!!editConnection}
                >
                    {isFirebaseConnectionPopup && this.firebaseInput(editConnection)}
                </FirebasePopup>

                <SimplifiedConnectionPopup
                    isOpen={isSimplifiedConnectionPopup}
                    onCancel={this.handleCancel}
                    onSave={this.handleSave}
                    onSubmit={this.handleSubmit}
                    closeFirstModalHints={this.closeFirstModalHint}
                    closeSecondModalHints={this.closeSecondModalHint}
                    firstModalHint={firstModalHint}
                    secondModalHint={secondModalHint}
                    isEdit={!!editConnection}
                >
                    {isSimplifiedConnectionPopup && this.smallInput(editConnection)}
                </SimplifiedConnectionPopup>

                <SSHConnectionPopup
                    isOpen={isSSHConnectionPopup}
                    onCancel={this.handleCancel}
                    onSubmit={this.handleSubmit}
                    onSave={this.handleSave}
                    isEdit={!!editConnection}
                    closeFirstModalHints={this.closeFirstModalHint}
                    closeSecondModalHints={this.closeSecondModalHint}
                    firstModalHint={firstModalHint}
                    secondModalHint={secondModalHint}
                >
                    {isSSHConnectionPopup && this.sshInput(editConnection)}
                </SSHConnectionPopup>

                <ConfigureManuallyPopup
                    isOpen={isConfigureManuallyPopup}
                    onCancel={this.handleCancel}
                    onSubmit={this.handleSubmit}
                    onSave={this.handleSave}
                    isEdit={!!editConnection}
                >
                    {isConfigureManuallyPopup && this.bigInput(editConnection)}
                </ConfigureManuallyPopup>

                <DeleteConnectionPopup
                    isOpen={isDeleteConnection}
                    onCancel={this.closeDeleteConnectionPopup}
                    deleteConnectionName={deleteConnectionName}
                    deleteConnection={this.deleteConnection}
                />

                <ConnectionErrorModal
                    title="Create/edit connection error"
                    isOpen={isErrorOpen}
                    isError={isErrorOpen}
                    onCancel={this.handleErrorCancel}
                    onSubmit={this.handleErrorCancel}
                    noCross={true}
                    submitTitle="Ok"
                    text={errorMessage}
                />

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