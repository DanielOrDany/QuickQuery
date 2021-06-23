import React from 'react';
import './App.css';
import Menu from './components/Menu';
import 'bootstrap/dist/css/bootstrap.min.css';

class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isSignedIn: true
        };
    };

    async componentDidMount() {
      let body = document.getElementsByTagName("body");
      const theme = localStorage.getItem("theme");
      const currentConnection = JSON.parse(localStorage.getItem("current_connection"));

      if (currentConnection) {
          if (!navigator.onLine) {
              const hostname = currentConnection.URI.others.host;
              if (hostname && !hostname.includes("localhost") &&
                  !hostname.includes("127.0.0.1")) {
                  window.location.pathname = '/connections';
                  localStorage.removeItem("current_connection");
              }
          }
      }

      if (theme) {
          body[0].style.color = "#FFFFFF";
          body[0].style.background = "#363740";
      } else {
          body[0].style.color = "#363740";
          body[0].style.background = "#FFFFFF";
      }
    }


    render() {
        return (
            <div className="App">
               <Menu />
            </div>
        );
    }
}

export default App;
