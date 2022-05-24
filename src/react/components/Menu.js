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
      const employeeId = localStorage.getItem("employeeId");
      mixpanel.track('Import config', { employeeId: employeeId});
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

      const employeeId = localStorage.getItem("employeeId");
      mixpanel.track('Export config', { employeeId: employeeId});
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
    const employeeId = localStorage.getItem("employeeId");
    mixpanel.track('Logout', { employeeId: employeeId});
  }

  openConnections() {
    const employeeId = localStorage.getItem("employeeId");
    mixpanel.track('Open connections page', { employeeId: employeeId});
    this.setState({toTables: true});
    window.location.hash = '#/connections';
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

  render() {
    return (
        <>
          { !this.state.isSignedIn &&
            <AuthPopup onLogin={this.login} onRegister={this.register}/>
          }
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
            <div id="main-content-body">
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