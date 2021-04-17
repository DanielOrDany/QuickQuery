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
import Modal from './Modal';
import Auth from "./Auth";
import Tables from './Tables';
import Connections from './Connections';
import arrow_back from "../icons/arrow_back.svg";
import top_menu_settings from "../icons/top-menu-settings.png";
import '../styles/Menu.scss';


class Menu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      theme: false,
      toTables: true,
      isSignedIn: true
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
    this.setState({
      isSignedIn: status
    })
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
      }
      else {
        pom.click();
      }
    }
    catch (e) {
      this.setState({error: true, message: "FAIL", isOpen: true});
    }
  }

  logout() {
    localStorage.removeItem('employeeId');
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('employeePlan');
    this.setState({ isSignedIn: false, isOpen: false, message: "" });
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

  async login(email, password) {
    const result = await authLogin(email, password);

    if (result.error) {
      return { error: result.error };
    } else {
      localStorage.setItem('employeeId', result.data.id);
      localStorage.setItem('employeeToken', result.data.token);
      localStorage.setItem('employeePlan', result.data.subscription_plan);
      this.setState({ isSignedIn: true });
      return null;
    }
  }

  render() {
    const currentConnection = JSON.parse(localStorage.getItem("current_connection"));

    return (
        <>
          {
            !this.state.isSignedIn &&
            <Auth onLogin={this.login}/>
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
            <Modal
                title="Settings"
                isOpen={this.state.isOpen}
                onCancel={this.handleCancel}
                submitButton={false}
            >
              <div className="sharing-buttons">
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
              </div>
            </Modal>
          }
          <Router hashType="noslash">
            <div className="menu-header" expand="md">
              <div className="logo-box">
                {/*<img src={logo_icon} id="l-icon" onClick={() => this.openConnections()} />*/}
                {!this.state.toTables &&
                <div id="back-section">
                  <img src={arrow_back} id="arrow-back" onClick={() => this.openConnections()}/>
                  <div id="connection-name" onClick={() => this.openConnections()}>
                    <div>{currentConnection.name}</div>
                  </div>
                </div>
                }
              </div>
              <div className="menu-box">
                <div className="settings-buttons">
                  <img src={top_menu_settings} id="settings-button" onClick={() => this.setState({error: false, isOpen: true})} />
                </div>
              </div>
            </div>
            <Switch>
              <Route path="/tables" component={() => <Tables changeSignedStatus={this.changeSignedStatus} />} />
              <Route path="/connections" component={() => <Connections changeSignedStatus={this.changeSignedStatus} />} />
              <Route path="/" component={() => <Connections changeSignedStatus={this.changeSignedStatus} />} />
            </Switch>
          </Router>
        </>
    );
  }
}

export default Menu;