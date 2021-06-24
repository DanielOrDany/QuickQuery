import React from 'react';
import {
    getDataFromDatabase,
    deleteConnection,
    addConnection,
    authVerifyToken,
    renameConnection
} from "../../methods";
import './Connections.scss';
import Modal from '../../popups/Modal';
import Button from '../../components/Button';
import { Offline } from "react-detect-offline";
import footer_arrow_left from "../../icons/connections-page-footer-arrow-left.svg";
import footer_arrow_right from "../../icons/connections-page-footer-arrow-right.svg";
import filters_arrow from "../../icons/connections-page-filter-arrow.svg";
import empty_connections_page_icon from "./icons/empty-connections-page.svg";
import ConfigureManuallyPopup from "./popups/ConfigureManuallyPopup";
import SimplifiedConnectionPopup from "./popups/SimplifiedConnectionPopup";
import SSHConnectionPopup from "./popups/SSHConnectionsPopup";
import DatabaseMiniMenuPopup from "./popups/DatabaseMiniMenu";
import DeleteConnectionPopup from "./popups/DeleteConnectionPopup";
import ConnectionErrorModal from '../../popups/MessagePopup';

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
            isDeleteOpen: false,
            ConfigureManuallyPopup: false,
            choosedConnetion: '',
            isSimplifiedConnectionPopup: false,
            isConfigureManuallyPopup: false,
            isSSHConnectionPopup: false,
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
    };

    saveDeleteConnectionName = (name) => {
        this.setState({deleteConnectionName: name});
    };

    handleCancel = () => {
        this.setState({
            isSimplifiedConnectionPopup: false,
            isConfigureManuallyPopup: false,
            isSSHConnectionPopup: false,
            isDBMiniMenu: false,
            editConnection: null
        });
    };

    openDelete = (alias) => {
        this.setState({ choosedConnetion: alias});
        this.setState({ isDeleteOpen: true, isDBMiniMenu: false });
    };

    handleDeleteSubmit = () => {
        this.deleteConnection(this.state.choosedConnetion);
        this.setState({ choosedConnetion: ''});
        this.setState({ isDeleteOpen: false, isDBMiniMenu: false });
    };

    handleDeleteCancel = () => {
        this.setState({ choosedConnetion: ''});
        this.setState({ isDeleteOpen: false, isDBMiniMenu: false });
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
        console.log(this.state);
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
                        isDBMiniMenu: false,
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
        } else {
            successfullVerify =
                this.inputVerify(nameInput) &&
                this.inputVerify(uriInput) &&
                this.inputVerify(schemaInput);
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
                    localStorage.setItem("connections", connections);

                    this.setState({
                        connections: connections,
                        searchedConnections: connections,
                        isErrorOpen: false,
                        errorMessage: "",
                        isConfigureManuallyPopup: false,
                        isSimplifiedConnectionPopup: false,
                        isSSHConnectionPopup: false,
                        isDBMiniMenu: false
                    });

                } else {
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
            } else {
                this.setState({errorMessage: "Try to reload private key", sshPrivateKeyInput: ""})
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
                            <span className="big-input-title">Name connection</span>
                            <input id="input-field-name" ref="name" className="big-form-control" type="text" placeholder="Database" type="search"
                                   defaultValue={editConnection && editConnection.name}
                                   onChange={this.nameOnChange} onKeyPress={this.nameKeyPress}/>
                        </div>
                        <div className="big-information-field">
                            <span className="big-input-title">Port</span>
                            <input id="input-field-port" ref="port" className="big-form-control" type="text" placeholder="5432" type="search"
                                   defaultValue={editConnection && editConnection.URI.port}
                                   disabled={!!editConnection}
                                   onChange={this.portOnChange} onKeyPress={this.portKeyPress}/>
                        </div>
                        <div className="big-information-field">
                            <span className="big-input-title">Password</span>
                            <input id="input-field-password" ref="password" className="big-form-control" type="text"
                                   placeholder="Password" type="search"
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
                                   placeholder="public" type="search"
                                   disabled={!!editConnection}
                                   defaultValue={editConnection && editConnection.schema}
                                   onChange={this.schemaOnChange} onKeyPress={this.schemaKeyPress}
                            />
                        </div>
                    </div>
                    <div className="big-input-second-column">
                        <div className="big-information-field">
                            <span className="big-input-title">Host</span>
                            <input id="input-field-host" ref="host" className="big-form-control" type="text" placeholder="127.0.0.1" type="search"
                                   defaultValue={editConnection && editConnection.URI.host}
                                   disabled={!!editConnection}
                                   onChange={this.hostOnChange} onKeyPress={this.hostKeyPress}/>
                        </div>
                        <div className="big-information-field">
                            <span className="big-input-title">User name</span>
                            <input id="input-field-user" ref="user" className="big-form-control" type="text" placeholder="root" type="search"
                                   defaultValue={editConnection && editConnection.URI.user}
                                   disabled={!!editConnection}
                                   onChange={this.userOnChange} onKeyPress={this.userKeyPress}/>
                        </div>
                        <div className="big-information-field">
                            <span className="big-input-title">Database name</span>
                            <input id="input-field-database" ref="database" className="big-form-control" type="text"
                                   placeholder="Database" type="search"
                                   defaultValue={editConnection && editConnection.URI.database}
                                   disabled={!!editConnection}
                                   onChange={this.databaseOnChange} onKeyPress={this.databaseKeyPress}/>
                        </div>
                        <div className="choose-db-field">
                            <span id="choose-db-title">Database</span>
                            <select
                                className="selector"
                                id="choose-db"
                                value={this.state.dtypeInput}
                                defaultValue={editConnection && editConnection.URI.others && editConnection.URI.others.dialect}
                                onChange={this.dtypeOnChange}
                                disabled={!!editConnection}
                            >
                                <option value="mysql">MySQL</option>
                                <option value="mysql">MariaDB</option>
                                <option value="postgres">Postgres</option>
                            </select>
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

    smallInput = (editConnection) => {
        return(
            <div>
                <div className="small-information-field">
                    <span className="small-input-title">Name connection</span>
                    <input id="input-field-name" ref="name" className="small-form-control" type="text" type="search"
                           defaultValue={editConnection && editConnection.name}
                           onChange={this.nameOnChange} onKeyPress={this.nameKeyPress}/>
                </div>
                <div className="small-information-field">
                    <span className="small-input-title">Database URL</span>
                    <input id="input-field-uri" ref="uri" className="small-form-control" type="text" type="search"
                           defaultValue={editConnection && typeof editConnection.URI === "string" && editConnection.URI}
                           disabled={!!editConnection}
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
                           disabled={!!editConnection}
                           defaultValue={editConnection && editConnection.schema}
                           onChange={this.schemaOnChange} onKeyPress={this.schemaKeyPress}/>
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
                                <span className="ssh-input-title">Name connection</span>
                                <input id="input-field-name" ref="name" className="ssh-form-control" defaultValue={editConnection && editConnection.name} type="text" placeholder="Database" type="search"
                                       onChange={this.nameOnChange} onKeyPress={this.nameKeyPress}/>
                            </div>
                            <div className="ssh-information-field">
                                <span className="ssh-input-title">Database Port</span>
                                <input id="input-field-port" ref="port" className="ssh-form-control" defaultValue={editConnection && editConnection.sshHost && editConnection.URI.port} type="text" placeholder="5432" type="search"
                                       disabled={!!editConnection}
                                       onChange={this.portOnChange} onKeyPress={this.portKeyPress}/>
                            </div>
                            <div className="ssh-information-field">
                                <span className="ssh-input-title">Database Password</span>
                                <input id="input-field-password" ref="password" className="ssh-form-control" type="text"
                                       disabled={!!editConnection}
                                       placeholder="Password" type="password" defaultValue={editConnection && editConnection.sshHost && editConnection.URI.password}
                                       onChange={this.passwordOnChange} onKeyPress={this.passwordKeyPress}/>
                            </div>
                            <div className="information-field">
                            <span className="ssh-input-title-and-hint">Database Schema name
                                <div className="help-tip" id="schema-tip">
                                    <p>A schema is a collection of database objects associated with one particular database username.</p>
                                </div>
                            </span>
                                <input id="input-field-schema" ref="schema" className="ssh-form-control" type="text"
                                       disabled={!!editConnection}
                                       placeholder="public" type="search" defaultValue={editConnection && editConnection.sshHost && editConnection.schema}
                                       onChange={this.schemaOnChange} onKeyPress={this.schemaKeyPress}/>
                            </div>

                        </div>


                        <div className="ssh-body-first-block-right-column">

                            <div className="ssh-information-field">
                                <span className="ssh-input-title">Database User</span>
                                <input id="input-field-user" ref="user" className="ssh-form-control" type="text" placeholder="root" type="search"
                                       disabled={!!editConnection}
                                       defaultValue={editConnection && editConnection.sshHost && editConnection.URI.user}
                                       onChange={this.userOnChange} onKeyPress={this.userKeyPress}/>
                            </div>
                            <div className="ssh-information-field">
                                <span className="ssh-input-title">Database Name</span>
                                <input id="input-field-database" ref="database" className="ssh-form-control" type="text"
                                       placeholder="Database" type="search"
                                       disabled={!!editConnection}
                                       defaultValue={editConnection && editConnection.sshHost && editConnection.URI.database}
                                       onChange={this.databaseOnChange} onKeyPress={this.databaseKeyPress}/>
                            </div>
                            <div className="ssh-choose-db-field">
                                <span id="choose-db-title" className="ssh-choose-db-title">Database Type</span>
                                <select
                                    className="selector"
                                    id="choose-db"
                                    disabled={!!editConnection}
                                    defaultValue={editConnection && editConnection.sshHost && editConnection.URI.others.dialect}
                                    onChange={this.dtypeOnChange}
                                >
                                    <option value="mysql">mysql</option>
                                    <option value="postgres">postgres</option>
                                </select>
                            </div>

                        </div>
                    </div>


                    <div className="ssh-block-line"/>

                    <div className="ssh-body-second-block">

                        <div className="ssh-body-second-block-left-column">

                            <div className="ssh-information-field">
                                <span className="ssh-input-title">SSH Host</span>
                                <input id="input-field-port" ref="port" className="ssh-form-control" type="text" placeholder="127.0.0.1" type="search"
                                       defaultValue={editConnection && editConnection.sshHost}
                                       disabled={!!editConnection}
                                       onChange={this.sshHostOnChange}/>
                            </div>
                            <div className="ssh-information-field">
                                <span className="ssh-input-title">Private Key</span>
                                <input id="input-field-host" className="ssh-form-control-file" type="file"
                                       disabled={!!editConnection}
                                       onChange={this.sshPrivateKeyOnChange}/>
                            </div>
                        </div>


                        <div className="ssh-body-second-block-right-column">

                            <div className="ssh-information-field">
                                <span className="ssh-input-title">SSH User</span>
                                <input id="input-field-user" ref="user" className="ssh-form-control" type="text" placeholder="ubuntu" type="search"
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

    search = () => {
        const searchNameValue = document.getElementById('connection-name-search').value;
        const searchSchemaValue = document.getElementById('connection-schema-search').value;
        const searchDateValue = document.getElementById('connection-date-search').value;
        let searchedConnections = [];

        if (this.state.connections.length !== 0) {
            this.state.connections.forEach(connection => {
                if (connection.name.includes(searchNameValue) &&
                    connection.schema.includes(searchSchemaValue) &&
                    connection.createdAt.includes(searchDateValue)) {
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
        const { pageNumber, rowsPerPage, searchedConnections } = this.state;
        const l = searchedConnections.length;

        if (l > pageNumber * rowsPerPage) {
            this.setState({pageNumber: pageNumber + 1});
        }
    };

    moveBack = () => {
        const { pageNumber } = this.state;

        if (pageNumber !== 1) {
            this.setState({pageNumber: pageNumber - 1});
        }
    };

    changeOrder = (byColumn) => {
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
            isSSHConnectionPopup,
            isConfigureManuallyPopup,
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

        return (
            /* ------------------------------------------ CONNECTION PAGE ------------------------------------------- */

            <div className="connections-page">

                {/* ------------------------------------ CONNECTION PAGE HEADER ------------------------------------ */}
                <div className='connections-page-header'>
                    <span className="connections-page-name">Databases</span>
                    <button className="add-database-button" type="button" id="add-button"
                            onClick={() => this.openSimplifiedConnectionPopup()}>Add database
                    </button>
                </div>

                <div>
                    { connections.length !== 0 ?

                            /* -------------------------- FILLED CONNECTIONS PAGE --------------------------- */
                            <div className="filled-connections-page">

                                {/* ------------------------------- FILTERS -------------------------------- */}
                                <div className="connections-page-filters">

                                    {/* --------------------------- FILTER NAME ---------------------------- */}
                                    <div className="connections-page-filter-NAME">
                                        <span className="connections-page-filters-title">Name</span>
                                        { orderByName ?
                                            <img className="connections-page-filters-arrow" src={filters_arrow}
                                                 alt="arrow" onClick={() => this.changeOrder("name")}/>
                                            :
                                            <img className="connections-page-filters-arrow-down" src={filters_arrow}
                                                 alt="arrow" onClick={() => this.changeOrder("name")}/>
                                        }
                                        <input className="connections-page-filters-search"
                                               id="connection-name-search"
                                               placeholder="Search" onChange={() => this.search()}/>
                                    </div>

                                    {/* ------------------------ FILTER SCHEMA NAME ------------------------ */}
                                    <div className="connections-page-filter-SCHEMA-NAME">
                                        <span className="connections-page-filters-title">Schema Name</span>
                                        { orderBySchema ?
                                            <img className="connections-page-filters-arrow" src={filters_arrow}
                                                 alt="arrow" onClick={() => this.changeOrder("schema")}/>
                                            :
                                            <img className="connections-page-filters-arrow-down" src={filters_arrow}
                                                 alt="arrow" onClick={() => this.changeOrder("schema")}/>
                                        }
                                        <input className="connections-page-filters-search"
                                               id="connection-schema-search"
                                               placeholder="Search" onChange={() => this.search()}/>
                                    </div>

                                    {/* ------------------------ FILTER DATE CREATED ----------------------- */}
                                    <div className="connections-page-filter-DATE-CREATED">

                                        <div className="DATE-CREATED-search-div">
                                            <span className="connections-page-filters-title">Date Created</span>
                                            { orderByDate ?
                                                <img className="connections-page-filters-arrow" src={filters_arrow}
                                                     alt="arrow" onClick={() => this.changeOrder("date")}/>
                                                :
                                                <img className="connections-page-filters-arrow-down" src={filters_arrow}
                                                     alt="arrow" onClick={() => this.changeOrder("date")}/>
                                            }
                                            <input className="connections-page-filters-search"
                                                   id="connection-date-search"
                                                   placeholder="Search" onChange={() => this.search()}/>
                                        </div>
                                    </div>
                                </div>

                                {/* ------------------------------ DATABASES ------------------------------- */}
                                <div className='connections-page-databases-block'>
                                    <div className='connections-page-all-databases'>
                                        {searchedConnections.map(conn => {
                                            return (
                                                <div className='database' id={conn.name} key={conn.name} >

                                                    {/* ----------------- DATABASES ICON ------------------- */}
                                                    <div className='database-icon' onDoubleClick={() => this.openConnection(conn.name)}>
                                                        <svg>
                                                            <path
                                                                d="M20 6.36C20 4.1552 15.9744 3 12 3C8.0256 3 4 4.1552 4 6.36C4 6.3984 4 6.4368 4 6.4784C4 6.52 4 6.52 4 6.52V17.08C4.0006 17.1589 4.01579 17.237 4.0448 17.3104C4.4864 19.2624 8.2656 20.28 12 20.28C15.7344 20.28 19.5136 19.2624 19.9552 17.3104C19.9842 17.237 19.9994 17.1589 20 17.08V6.52C20 6.504 20 6.4912 20 6.4784C20 6.4656 20 6.3984 20 6.36ZM18.72 11.7776V13.4C18.72 13.6784 18.3616 14.136 17.3504 14.5744C16.0288 15.16 14.08 15.48 12 15.48C9.92 15.48 7.9712 15.16 6.6496 14.5744C5.6384 14.136 5.28 13.6784 5.28 13.4V11.7776H5.2992C5.3632 11.8192 5.4336 11.8608 5.5072 11.9024L5.6 11.96L5.7824 12.0528L5.8688 12.0976C5.9584 12.1392 6.0512 12.184 6.1504 12.2256C7.616 12.872 9.76 13.24 12 13.24C14.24 13.24 16.384 12.872 17.8624 12.2256C17.9616 12.184 18.0544 12.1392 18.1472 12.0944L18.224 12.056L18.416 11.9568L18.4864 11.9152C18.5632 11.8736 18.6368 11.832 18.704 11.7872L18.72 11.7776ZM18.72 9.88C18.72 10.1584 18.3616 10.616 17.3504 11.0544C16.0288 11.64 14.08 11.96 12 11.96C9.92 11.96 7.9712 11.64 6.6496 11.0544C5.6384 10.616 5.28 10.1584 5.28 9.88V8.2576C5.55345 8.42959 5.84023 8.5794 6.1376 8.7056C7.616 9.352 9.76 9.72 12 9.72C12.2816 9.72 12.56 9.72 12.8384 9.704C13.4784 9.6752 14.1184 9.6144 14.7264 9.528C15.1488 9.4672 15.5616 9.3968 15.952 9.3104C16.6098 9.1704 17.2527 8.96788 17.872 8.7056C18.1662 8.57913 18.4497 8.42932 18.72 8.2576V9.88ZM12 4.28C16.1024 4.28 18.72 5.512 18.72 6.36C18.72 6.6384 18.3616 7.096 17.3504 7.5344C16.0288 8.12 14.08 8.44 12 8.44C11.7408 8.44 11.4816 8.44 11.2288 8.424C10.976 8.408 10.6592 8.3952 10.3808 8.3696C9.75073 8.31761 9.12447 8.22677 8.5056 8.0976C8.29227 8.0528 8.08747 8.0048 7.8912 7.9536L7.7504 7.9184C7.37509 7.8158 7.00729 7.68749 6.6496 7.5344C5.6384 7.096 5.28 6.6384 5.28 6.36C5.28 5.512 7.8976 4.28 12 4.28ZM12 19C7.8976 19 5.28 17.768 5.28 16.92V15.2976H5.2992C5.3632 15.3392 5.4336 15.3808 5.5072 15.4224L5.6 15.48L5.7824 15.5728L5.8688 15.6176C5.9584 15.6592 6.0512 15.704 6.1504 15.7456C7.616 16.392 9.76 16.76 12 16.76C14.24 16.76 16.384 16.392 17.8624 15.7456C17.9616 15.704 18.0544 15.6592 18.1472 15.6144L18.224 15.576L18.416 15.4768L18.4864 15.4352C18.5632 15.3936 18.6368 15.352 18.704 15.3072V16.92C18.72 17.768 16.1024 19 12 19Z"/>
                                                        </svg>
                                                    </div>

                                                    {/* ----------------- DATABASES NAME ------------------- */}

                                                    <div className="database-name"
                                                         onClick={() => this.closeMiniMenu(conn.name)}
                                                         onDoubleClick={() => this.openConnection(conn.name)}>
                                                        <span className="database-text"

                                                              id="folders-n">{conn.name} {this.databaseHost(conn)}</span>
                                                    </div>

                                                    {/* -------------- DATABASES SCHEMA NAME --------------- */}

                                                    <div className="database-schema-name"
                                                         onClick={() => this.closeMiniMenu(conn.name)}
                                                         onDoubleClick={() => this.openConnection(conn.name)}>
                                                        <span className="database-text"

                                                              id="folders-schema-n">{conn.schema}</span>
                                                    </div>

                                                    {/* -------------- DATABASES DATE CREATED -------------- */}

                                                    <div className="database-date-created"
                                                         onClick={() => this.closeMiniMenu(conn.name)}
                                                         onDoubleClick={() => this.openConnection(conn.name)}>
                                                        <span className="database-text"
                                                              id="folders-date-created">{conn.createdAt}</span>
                                                    </div>

                                                    <div className="database-mini-menu"
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
                                                        connectionName={conn.name}
                                                        openDeleteConnectionPopup={this.openDeleteConnectionPopup}
                                                        openEditConnectionPopup={this.openEditConnectionPopup}
                                                    >
                                                    </DatabaseMiniMenuPopup>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* ----------------------- CONNECTIONS PAGE FOOTER ------------------------ */}
                                <div className='connections-page-footer'>
                                    <div className="databases-on-page">
                                        <span className="connections-page-footer-text">Rows per page: {rowsPerPage}</span>
                                    </div>

                                    <div className="databases-amount">
                                        <span className="connections-page-footer-text">{paginationFrom}-{paginationTo} of {searchedResults}</span>
                                    </div>

                                    <div className="database-pages">
                                        <img className="database-pages-arrow-left" onClick={this.moveBack} src={footer_arrow_left}
                                             alt="arrow left"/>

                                        <img className="database-pages-arrow-right" onClick={this.moveNext} src={footer_arrow_right}
                                             alt="arrow right"/>
                                    </div>
                                </div>

                            </div>

                            : // Else

                            /* ------------------------------ EMPTY CONNECTIONS PAGE -------------------------------- */
                            <div className="empty-connections-page">
                                <div className="empty-connections-page-block">
                                    <img src={empty_connections_page_icon} alt="empty page"/>
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
                    onSave={this.handleSave}
                    onSubmit={this.handleSubmit}
                    closeFirstModalHints={this.closeFirstModalHint}
                    closeSecondModalHints={this.closeSecondModalHint}
                    firstModalHint={firstModalHint}
                    secondModalHint={secondModalHint}
                    isEdit={!!editConnection}
                >
                    {this.smallInput(editConnection)}
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
                    {this.sshInput(editConnection)}
                </SSHConnectionPopup>

                <ConfigureManuallyPopup
                    isOpen={isConfigureManuallyPopup}
                    onCancel={this.handleCancel}
                    onSubmit={this.handleSubmit}
                    onSave={this.handleSave}
                    isEdit={!!editConnection}
                >
                    {this.bigInput(editConnection)}
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