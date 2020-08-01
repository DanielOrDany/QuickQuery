import React from 'react';
import {
    HashRouter as Router,
    Route,
    Switch,
    Link
} from 'react-router-dom';
import Tables from './Tables';
import Connections from './Connections';
import Settings from './Settings';
import '../styles/Menu.scss';
import {
    Navbar,
    Nav,
    NavItem,
    NavLink
  } from 'reactstrap';
import Result from "./Result";
import CreateTable from "./CreateTable";
import menu_icon from "../icons/menu.svg";
import logo_icon from "../icons/logo.png";

class Menu extends React.Component {

    state = {
        btnActive: '',
        theme: false
    };

    componentDidMount() {
        this.changeItem();
        if(localStorage.getItem("theme")){
            this.setState({
                theme: true
            });
        }
    }

    changeItem = () => {
        let url = window.location.href;
        let lastUrl = url.split('/').reverse()[0];
        if(lastUrl === "settings"){
            this.setState({
                btnActive: 3
            })
        } else if(lastUrl === "connections"){
            this.setState({
                btnActive: 2
            })
        } else if(lastUrl === "tables"){
            this.setState({
                btnActive: 1
            })
        }
    };

    render() {
        return (
            <div>
                <Router hashType="noslash">
                    <div className="menu-header" expand="md">
                        <div className="logo-box">
                            <img src={logo_icon} id="l-icon"></img>
                            <span id="l-title">QuickQuery</span>
                        </div>
                        <div className="menu-box">
                            <div className="sharing-buttons">
                                <span id="select-button">Select</span>
                                <span id="export-button">Export</span>
                            </div>
                            <img src={menu_icon} id="open-menu-button"></img>
                        </div>
                    </div>
                    <div>
                        <Switch>
                            <Route path="/tables" component={Tables} />
                            <Route path="/connections" component={Connections} />
                            <Route path="/settings" component={Settings} />
                            <Route path="/result" component={Result} />
                            <Route path="/create-table" component={CreateTable} />
                            <Route path="/" component={Connections} />
                        </Switch>
                    </div>
                </Router>
            </div>
        );
    }
}

export default Menu;
