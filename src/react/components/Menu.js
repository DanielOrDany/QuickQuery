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
import connections_icon from "../icons/connections.svg";
import tables_icon from "../icons/tables.png";
import logo_icon from "../icons/logo.png";
import { importConfig, exportConfig } from "../methods";

import Modal from './Modal';

class Menu extends React.Component {

    state = {
        theme: false
    };

    componentDidMount() {
        if(localStorage.getItem("theme")){
            this.setState({
                theme: true,
                isOpen: false,
                message: ""
            });
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
                    this.setState({message: "Successfully uploaded.", isOpen: true});
                }
                else {
                    this.setState({message: "Wrong file!", isOpen: true});
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
            this.setState({message: "FAIL", isOpen: true});
        }
    }

    openConnections() {
        window.location.hash = '#/connections';
    }

    openTables() {
        window.location.hash = '#/tables';
    }

    render() {
        return (
            <div>
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
                <Router hashType="noslash">
                    <div className="menu-header" expand="md">
                        <div className="logo-box">
                            <img src={logo_icon} id="l-icon" onClick={() => this.openConnections()}></img>

                        </div>
                        <div className="menu-box">
                            <div className="sharing-buttons">
                                <span id="export-button" onClick={() => this.share()}>Export</span>
                                <input id="import-button" type="file" onChange={(event) => this.importConfig(event)}/>
                            </div>

                            <img src={tables_icon} id="open-tables" onClick={() => this.openTables()}></img>
                            <img src={connections_icon} id="open-connections" onClick={() => this.openConnections()}></img>
                        </div>
                    </div>
                    <div>
                        <Switch>
                            <Route path="/tables" component={Tables} />
                            <Route path="/connections" component={Connections} />
                            <Route path="/settings" component={Settings} />
                            <Route path="/" component={Connections} />
                        </Switch>
                    </div>
                </Router>
            </div>
        );
    }
}

export default Menu;