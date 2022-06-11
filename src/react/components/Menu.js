import React from 'react';
import {
  HashRouter as Router,
  Route,
  Switch
} from 'react-router-dom';
import {
  importConfig,
  exportConfig,
  authLogin,
  authRegister,
  authVerifyToken
} from "../methods";
import Modal from '../popups/Modal';
import AuthPopup from "../popups/Auth";
import Tables from '../views/Tables/Tables';
import Connections from '../views/Connections/Connections';
import praise from "../icons/praise.svg";
import goBack from "../icons/go-back.svg";
import databaseIcon from "../icons/database.svg";
import homeIcon from "../icons/home-icon.svg";
import '../styles/Menu.scss';

import SettingsPopup from "../popups/Settings";
import LogoutPopup from "../popups/Logout";
import mixpanel from "mixpanel-browser";

class Menu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      theme: false,
      toTables: true,
      isSignedIn: true,
      isLogoutPopupOpen: false
    };

    this.login = this.login.bind(this);
    this.register = this.register.bind(this);
    this.logout = this.logout.bind(this);
    this.verifyEmployee = this.verifyEmployee.bind(this);
    this.changeSignedStatus = this.changeSignedStatus.bind(this);
  };

  async componentDidMount() {
    if (localStorage.getItem("theme")) {
      this.setState({
        theme: true,
        isOpen: false,
        message: "",
        error: true
      });
    }

    if (!(window.location.hash == "" || window.location.hash == "#connections")) {
      this.setState({toTables: false});
    } 

    window.onhashchange = () => {
      if (!(window.location.hash == "" || window.location.hash == "#connections") && this.state.toTables) {
        this.setState({toTables: false});
      }
    };
    
    this.verifyEmployee();
  }

  changeSignedStatus(status) {
    const currentStatus = this.state.isSignedIn;

    if (currentStatus !== status) {
      this.setState({
        isSignedIn: status
      });
    }
  }

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
        this.setState({
          isSignedIn: true
        })
      } else {
        this.setState({
          isSignedIn: false
        })
      }
    } else {
      this.setState({
        isSignedIn: false
      })
    }
  }

  handleSubmit = () => {
    this.setState({message: "", isOpen: false});
  };

  handleCancel = () => {
    this.setState({message: "", isOpen: false});
  };

  share = () => {
    exportConfig().then((data) => {
      this.exportConfig("config.txt", data);
    });
  };

  openLogoutPopup = () => {
    const employeeId = localStorage.getItem("employeeId");
    mixpanel.track('Open logout popup', { employeeId: employeeId});

    this.setState({isLogoutPopupOpen: true})
  };

  closeLogoutPopup = () => {
    const employeeId = localStorage.getItem("employeeId");
    mixpanel.track('Close logout popup', { employeeId: employeeId});

    this.setState({isLogoutPopupOpen: false})
  };

  logout() {
    localStorage.removeItem('employeeId');
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('employeePlan');
    this.setState({isSignedIn: false, isOpen: false, message: ""});
    this.setState({isLogoutPopupOpen: false});
    const employeeId = localStorage.getItem("employeeId");
    mixpanel.track('Logout', { employeeId: employeeId});
  }

  openConnections() {
    if (!window.location.hash.includes('#connections')) {
      const employeeId = localStorage.getItem("employeeId");
      mixpanel.track('Open connections page', { employeeId: employeeId});
      this.setState({toTables: true});
      window.location.hash = '#/connections';
    }
  }

  openTables() {
    const employeeId = localStorage.getItem("employeeId");
    mixpanel.track('Open tables page', { employeeId: employeeId});
    if (localStorage.getItem("current_connection")) {
      this.setState({toTables: false});
    }
    window.location.hash = '#/tables';
  }

  async login(email, password) {
    const result = await authLogin(email, password);

    if (result && result.error) {
      return {error: result.error};
    } else if (result && result.data) {
      localStorage.setItem('employeeId', result.data.id);
      localStorage.setItem('employeeToken', result.data.token);
      localStorage.setItem('employeePlan', result.data.subscription_plan);
      this.setState({isSignedIn: true});
      return null;
    } else {
      return {error: "network error"};
    }
  }

  async register(email, password, fullName, companyName) {
    const result = await authRegister(email, password, fullName, companyName);

    if (result && !result.success) {
      return { error: result.message };
    } else if (result && result.data) {
      localStorage.setItem('employeeId', result.data.customer.id);
      localStorage.setItem('employeeToken', result.data.token);
      localStorage.setItem('employeePlan', "Hobby");
      this.setState({ isSignedIn: true });
      return null;
    } else {
      return { error: "network error" };
    }
  }

  async giveFeedback() {
    const shell = window.electron.shell;
    const employeeId = localStorage.getItem("employeeId");
    mixpanel.track('Open feedback', { employeeId: employeeId});
    await shell.openExternal("https://forms.gle/AxHKxtBM5KJZcDWx8");
  }

  hoverMenuItem(id) {
    const hovColor = '#ffffff';

    if (id == 'db') {
      document.getElementById(id + '-1').style.fill = hovColor;
      document.getElementById(id + '-2').style.fill = hovColor;
      document.getElementById(id + '-3').style.fill = hovColor;
    } else if (id == 'graph') {
      document.getElementById(id).style.fill = hovColor;
    }
  }

  leaveMenuItem(id, selected) {
    const defColor = '#676a6f';

    if (!selected) {
      if (id == 'db') {
        document.getElementById(id + '-1').style.fill = defColor;
        document.getElementById(id + '-2').style.fill = defColor;
        document.getElementById(id + '-3').style.fill = defColor;
      } else if (id == 'graph') {
        document.getElementById(id).style.fill = defColor;
      }
    }
  }

  render() {
    return (
        <>
          {/* { !this.state.isSignedIn &&
            <AuthPopup onLogin={this.login} onRegister={this.register}/>
          } */}
          { this.state.error &&
            <Modal
                title="Error"
                isOpen={this.state.isOpen}
                onCancel={this.handleCancel}
                onSubmit={this.handleSubmit}
                submitTitle="OK"
            ><div>
                <strong>{this.state.message}</strong>
              </div>
            </Modal>
          }

          { !this.state.error &&

            <SettingsPopup
                title="Settings"
                isOpen={this.state.isOpen}
                onCancel={this.handleCancel}
                submitButton={false}
                exportBtn={this.share}
            ></SettingsPopup>
          }

          <LogoutPopup
              isOpen={this.state.isLogoutPopupOpen}
              onCancel={this.closeLogoutPopup}
              logout={this.logout}
          >
          </LogoutPopup>


          <Router hashType="noslash">
            <div className="menu-header">
              <div className="header-tab" onClick={() => this.openConnections()}>
                <img id="home-icon" src={homeIcon}/>  
              </div>
            </div>
            <div id="main-content-body" className='main-content-body'>
              { this.state.toTables &&
                <div className='left-menu'>
                  <div className='left-menu-item'>
                    <svg version="1.1" id="db" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
                      height="50px"
                      viewBox="0 0 32 32" onMouseOver={() => this.hoverMenuItem('db')} onMouseLeave={() => this.leaveMenuItem('db', true)}>
                      <g>
                        <path fill="white" id='db-1' d="M5,12.4V16c0,3.4,4.8,6,11,6s11-2.6,11-6v-3.6c-2.2,2.2-6.2,3.6-11,3.6S7.2,14.6,5,12.4z"/>
                        <path fill="white" id='db-2' d="M5,20.4V24c0,3.4,4.8,6,11,6s11-2.6,11-6v-3.6c-2.2,2.2-6.2,3.6-11,3.6S7.2,22.6,5,20.4z"/>
                        <ellipse fill="white" id='db-3' cx="16" cy="8" rx="11" ry="6"/>
                      </g>
                    </svg>
                  </div>
                  <div className='left-menu-item'>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 0 32 32" id="graph" fill="white" onMouseOver={() => this.hoverMenuItem('graph')} onMouseLeave={() => this.leaveMenuItem('graph', false)}>
                      <rect fill="none"/>
                      <g>
                        <path d="M14.06,9.94L12,9l2.06-0.94L15,6l0.94,2.06L18,9l-2.06,0.94L15,12L14.06,9.94z M4,14l0.94-2.06L7,11l-2.06-0.94L4,8 l-0.94,2.06L1,11l2.06,0.94L4,14z M8.5,9l1.09-2.41L12,5.5L9.59,4.41L8.5,2L7.41,4.41L5,5.5l2.41,1.09L8.5,9z M4.5,20.5l6-6.01l4,4 L23,8.93l-1.41-1.41l-7.09,7.97l-4-4L3,19L4.5,20.5z"/>
                      </g>
                    </svg>
                  </div>
                </div>
              }
              <Switch>
                <Route path="/tables" component={() => <Tables changeSignedStatus={this.changeSignedStatus}/>}/>
                <Route path="/connections" component={() => <Connections changeSignedStatus={this.changeSignedStatus}/>}/>
                <Route path="/" component={() => <Connections changeSignedStatus={this.changeSignedStatus}/>}/>
              </Switch>
            </div>
          </Router>
        </>
    );
  }
}

export default Menu;