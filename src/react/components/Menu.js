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
  authVerifyToken
} from "../methods";
import Modal from '../popups/Modal';
import AuthPopup from "../popups/Auth";
import Tables from '../views/Tables/Tables';
import Connections from '../views/Connections/Connections';
import arrow_back from "../icons/arrow_back.svg";
import header_settings from "../icons/header-settings.svg";
import logo_icon from "../icons/QuickQuery.svg";
import home_icon from "../icons/home-icon.svg";
import logout_icon from "../icons/logout.svg";
import search_conn_icon from "../icons/search-conn-icon.svg";
import '../styles/Menu.scss';

import SettingsPopup from "../popups/Settings";
import LogoutPopup from "../popups/Logout";



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
    console.log("changeSignedStatus", currentStatus, status);
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

      console.log('verified user', verified);

      if (verified && verified.data) {
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
    this.setState({isLogoutPopupOpen: true})
  }

  closeLogoutPopup = () => {
    this.setState({isLogoutPopupOpen: false})
  }

  importConfigFile = (event) => {
    try {
      const input = event.target;
      const reader = new FileReader();

      reader.onload = () => {
        const content = reader.result;
        importConfig(content).then(data => {
          if (data === true) {
            this.setState({error: true, message: "Successfully uploaded.", isOpen: true});
          } else {
            this.setState({error: true, message: "Wrong file!", isOpen: true});
          }
        });
      };
      reader.readAsText(input.files[0]);
    } catch (e) {
      console.log(e);
    }
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
      } else {
        pom.click();
      }
    } catch (e) {
      this.setState({error: true, message: "FAIL", isOpen: true});
    }
  }

  logout() {
    localStorage.removeItem('employeeId');
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('employeePlan');
    this.setState({isSignedIn: false, isOpen: false, message: ""});
    this.setState({isLogoutPopupOpen: false});
  }

  openConnections() {
    this.setState({toTables: true});
    window.location.hash = '#/connections';
  }

  openTables() {
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

  render() {
    const currentConnection = JSON.parse(localStorage.getItem("current_connection"));

    return (
        <>
          {
            !this.state.isSignedIn &&
            <AuthPopup onLogin={this.login}/>
          }
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


            <SettingsPopup
                title="Settings"
                isOpen={this.state.isOpen}
                onCancel={this.handleCancel}
                submitButton={false}
                exportBtn={this.share}
            >
              {/*<div className="sharing-buttons">
                <div id="import-div">
                  <input id="import-button" type="file" onChange={(event) => this.importConfigFile(event)}/>
                  <p>Import settings from file</p>
                </div>
                <div id="export-div">
                  <span id="export-button" onClick={() => this.share()}>Export</span>
                  <p>Export app settings into file</p>
                </div>
                <div id="logout-div">
                  <span id="logout-button" onClick={() => this.logout()}>Exit</span>
                  <p>Logout from the app</p>
                </div>
              </div>*/}
            </SettingsPopup>


          }

          <LogoutPopup
              isOpen={this.state.isLogoutPopupOpen}
              onCancel={this.closeLogoutPopup}
              logout={this.logout}
          >
          </LogoutPopup>


          <Router hashType="noslash">
            <div className="menu-header" expand="md">
              <div className="logo-box">
                <div className={'logo_bg'}></div>
                <img src={logo_icon} id="l-icon"/>
                <img src={home_icon} id="home-icon" onClick={() => this.openConnections()}/>

                { //!this.state.toTables &&
                  /*<div id="back-section">
                    <img src={arrow_back} id="arrow-back" onClick={() => this.openConnections()}/>
                    <div id="connection-name" onClick={() => this.openConnections()}>
                      <div>{currentConnection.name}</div>
                    </div>
                  </div>*/
                }
              </div>


              {/*
                <div className={'search-div'}>
                <img src={search_conn_icon} className={'search-conn-icon'} alt={'search'}/>
                <input className={'search-connection'} placeholder={'Search'}/>
              </div>
              */}


              <div className="menu-box">
                <div className="settings-buttons">

                  <img src={header_settings} id="settings-button"
                       onClick={() => this.setState({error: false, isOpen: true})}/>
                </div>
                <div className="logout-buttons">
                  <img src={logout_icon} id='logout-button' onClick={() => this.openLogoutPopup()}/>
                </div>
              </div>
            </div>
            <Switch>
              <Route path="/tables" component={() => <Tables changeSignedStatus={this.changeSignedStatus}/>}/>
              <Route path="/connections" component={() => <Connections changeSignedStatus={this.changeSignedStatus}/>}/>
              <Route path="/" component={() => <Connections changeSignedStatus={this.changeSignedStatus}/>}/>
            </Switch>
          </Router>
        </>
    );
  }
}

export default Menu;