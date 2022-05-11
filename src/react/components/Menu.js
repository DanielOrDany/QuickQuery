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
            <div className="menu-header" expand="md">
              <div className="logo-box">
                <div className='logo'>
                  <div className='logo-text'>Quick</div>
                  <div className='logo-emoji'>⚡️</div>
                  <div className='logo-text'>Query</div>
                </div>
                { (window.location.hash !== "#connections" && window.location.hash !== "#/connections") && 
                  <svg class="go-back-btn" version="1.0" xmlns="http://www.w3.org/2000/svg"
                    width="512.000000pt" height="512.000000pt" viewBox="0 0 512.000000 512.000000"
                    preserveAspectRatio="xMidYMid meet" fill="#fff" onClick={() => this.openConnections()}>

                    <g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)" stroke="none">
                    <path d="M935 4075 c-181 -96 -338 -184 -347 -196 -23 -27 -23 -74 0 -96 34
                    -35 669 -363 701 -363 68 0 94 75 44 129 -16 16 -100 67 -188 113 l-160 83
                    1460 3 c995 1 1476 -1 1511 -8 128 -27 270 -123 347 -237 60 -87 87 -166 94
                    -273 16 -250 -130 -471 -373 -563 l-59 -22 -1395 -5 -1395 -6 -75 -22 c-129
                    -40 -226 -97 -315 -187 -89 -89 -135 -159 -170 -262 -67 -192 -56 -381 31
                    -561 73 -151 213 -283 370 -346 134 -55 157 -56 892 -56 672 0 680 0 706 21
                    34 27 37 86 5 115 -20 18 -51 19 -733 24 -783 6 -739 3 -867 71 -169 90 -276
                    260 -287 455 -6 109 7 171 55 272 62 131 200 248 353 298 52 18 136 19 1450
                    24 l1395 5 80 28 c307 109 486 359 488 682 0 131 -17 207 -73 320 -87 177
                    -230 298 -435 367 l-70 23 -1500 5 -1499 5 187 99 c195 103 207 113 198 171
                    -4 31 -42 65 -70 65 -14 -1 -174 -79 -356 -175z"/>
                    <path d="M2836 1339 c-35 -27 -36 -86 -3 -117 23 -22 26 -22 429 -22 224 0
                    414 3 423 6 24 10 46 60 39 89 -3 14 -18 34 -31 45 -25 19 -42 20 -428 20
                    -392 0 -403 -1 -429 -21z"/>
                    <path d="M3969 1331 c-36 -36 -37 -60 -3 -100 l26 -31 259 0 260 0 24 25 c33
                    33 32 70 -4 106 l-29 29 -252 0 -252 0 -29 -29z"/>
                    </g>
                  </svg>
                }
              </div>
              <div className="menu-box">
                <div className="feedback" onClick={() => this.giveFeedback()}>
                  <div className="feedback-text">Feedback</div>
                  <img className="feedback-icon" src={praise}/>
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