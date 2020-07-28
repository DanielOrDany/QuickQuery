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
                    <Navbar className="menu" expand="md">
                        <Nav className="mr-auto">
                            <NavItem>
                                <NavLink tag={Link} className='nav-item' id='table-sign' exact='true' to='/tables'>
                                    <svg xmlns="http://www.w3.org/2000/svg" height="33" viewBox="0 0 24 24" fill={this.state.btnActive === 1 ? "#1EB7B7" :(this.state.theme? "white" :"#363740")} width="33"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/><path d="M0 0h24v24H0z" fill="none"/></svg>
                                    <div style={localStorage.getItem("theme") ? {color: "white"} :  {color: "#363740"}} className="hidden">tables</div>
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink tag={Link} className='nav-item' id='connection-sign' exact='true' to='/connections'>
                                    <svg xmlns="http://www.w3.org/2000/svg" height="33" viewBox="0 0 24 24" width="33" fill={this.state.btnActive === 2 ? "#1EB7B7" :(this.state.theme? "white" :"#363740")}><path d="M0 0h24v24H0z" fill="none"/><path d="M20 13H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1zM7 19c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM20 3H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1zM7 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>
                                    <div style={localStorage.getItem("theme") ? {color: "white"} :  {color: "#363740"}} className="hidden">connections</div>
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink  tag={Link} className='nav-item' id ='setting-sign' exact='true' to='/settings'>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill={this.state.btnActive === 3 ? "#1EB7B7" :(this.state.theme? "white" :"#363740")} height="33" viewBox="0 0 24 24" width="33"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm7-7H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-1.75 9c0 .23-.02.46-.05.68l1.48 1.16c.13.11.17.3.08.45l-1.4 2.42c-.09.15-.27.21-.43.15l-1.74-.7c-.36.28-.76.51-1.18.69l-.26 1.85c-.03.17-.18.3-.35.3h-2.8c-.17 0-.32-.13-.35-.29l-.26-1.85c-.43-.18-.82-.41-1.18-.69l-1.74.7c-.16.06-.34 0-.43-.15l-1.4-2.42c-.09-.15-.05-.34.08-.45l1.48-1.16c-.03-.23-.05-.46-.05-.69 0-.23.02-.46.05-.68l-1.48-1.16c-.13-.11-.17-.3-.08-.45l1.4-2.42c.09-.15.27-.21.43-.15l1.74.7c.36-.28.76-.51 1.18-.69l.26-1.85c.03-.17.18-.3.35-.3h2.8c.17 0 .32.13.35.29l.26 1.85c.43.18.82.41 1.18.69l1.74-.7c.16-.06.34 0 .43.15l1.4 2.42c.09.15.05.34-.08.45l-1.48 1.16c.03.23.05.46.05.69z"/></svg>
                                    <div style={localStorage.getItem("theme") ? {color: "white"} :  {color: "#363740"}} className="hidden">settings</div>
                                </NavLink>
                            </NavItem>
                        </Nav>
                    </Navbar>
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
