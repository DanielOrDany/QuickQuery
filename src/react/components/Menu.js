import React from 'react';
import {
    HashRouter as Router,
    Route,
    Switch
} from 'react-router-dom';
import Tables from './Tables';
import Connections from './Connections';
import Settings from './Settings';
import '../styles/Menu.scss';
import arrow_back from "../icons/arrow_back.svg";
import tables_icon from "../icons/tables.png";
import logo_icon from "../icons/logo.png";
import { importConfig, exportConfig } from "../methods";

import Modal from './Modal';

class Menu extends React.Component {

    state = {
        theme: false,
        toTables: true
    };

    componentDidMount() {
        if(localStorage.getItem("theme")){
            this.setState({
                theme: true,
                isOpen: false,
                message: "",
                error: true
            });
        }

        if(!(window.location.hash == "" || window.location.hash == "#connections")) {
            this.setState({toTables: false});
        }

        window.onhashchange = () => {
            if(!(window.location.hash == "" || window.location.hash == "#connections") && this.state.toTables) {
                this.setState({toTables: false});
            }
        }
    }

    handleSubmit = () => {
        this.setState({message: "", isOpen: false });
    };
    
    handleCancel = () => {
        this.setState({message: "", isOpen: false });
    };

    share = () => {
        exportConfig().then((data) => {
            this.exportConfig("config.txt", data);
        });
    };

    importConfig = (event) => {
        const input = event.target;

        const reader = new FileReader();
        reader.onload = () => {
            const content = reader.result;
            importConfig(content).then(data => {
                if (data === true) {
                    this.setState({error: true, message: "Successfully uploaded.", isOpen: true});
                }
                else {
                    this.setState({error: true, message: "Wrong file!", isOpen: true});
                }
            });
        };
        reader.readAsText(input.files[0]);
    };

    exportConfig(filename, text) {
        try {
            const pom = document.createElement('a');
            pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
            pom.setAttribute('download', filename);

            if (document.createEvent) {
                let event = document.createEvent('MouseEvents');
                event.initEvent('click', true, true);
                pom.dispatchEvent(event);
            }
            else {
                pom.click();
            }
        }
        catch (e) {
            this.setState({error: true, message: "FAIL", isOpen: true});
        }
    }

    openConnections() {
        this.setState({toTables: true});
        window.location.hash = '#/connections';
    }

    openTables() {
        if(localStorage.getItem("current_connection")) {
            this.setState({toTables: false});
        }
        window.location.hash = '#/tables';
    }

    render() {
        return (
            <>
                {
                    this.state.error &&
                    <Modal
                        title="Error"
                        isOpen={this.state.isOpen}
                        onCancel={this.handleCancel}
                        onSubmit={this.handleSubmit}
                        submitTitle="OK"
                    >
                        <div>
                            <strong>{this.state.message}</strong>
                        </div>
                    </Modal>
                }
                {
                    !this.state.error &&
                    <Modal
                        title="Settings"
                        isOpen={this.state.isOpen}
                        onCancel={this.handleCancel}
                        onSubmit={this.handleCancel}
                        submitTitle="Close"
                    >
                        <div className="sharing-buttons">
                            <div id="import-div">
                                <input id="import-button" type="file" onChange={(event) => this.importConfig(event)}/>
                                <p>Import settings from file</p>
                            </div>
                            <div id="export-div">
                                <span id="export-button" onClick={() => this.share()}>Export</span>
                                <p>Export app settings into file</p>
                            </div>
                        </div>
                    </Modal>
                }
                <Router hashType="noslash">
                    <div className="menu-header" expand="md">
                        <div className="logo-box">
                            <img src={logo_icon} id="l-icon" onClick={() => this.openConnections()} />
                            {!this.state.toTables &&
                                <>
                                    <img src={arrow_back} id="arrow-back" onClick={() => this.openConnections()} />
                                    <div id="connection-name"><div>{window.location.hash.split('/')[1]}</div></div>
                                </>
                            }
                        </div>
                        <div className="menu-box">
                            <div className="settings-buttons">
                                <span id="settings-button" onClick={() => this.setState({error: false, isOpen: true})}>Settings</span>
                            </div>
                        </div>
                    </div>
                    <Switch>
                        <Route path="/tables" component={Tables} />
                        <Route path="/connections" component={Connections} />
                        <Route path="/settings" component={Settings} />
                        <Route path="/" component={Connections} />
                    </Switch>
                </Router>
            </>
        );
    }
}

export default Menu;