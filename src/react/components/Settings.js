import React from 'react';
import { importConfig, exportConfig, updateTheme } from "../methods";
import '../styles/Settings.scss';


export default class Settings extends React.Component {
    componentDidMount() {
        let checkbox = document.getElementById("checkbox");
        if(localStorage.getItem("theme")) {
            checkbox.checked = "checked";
        }
    }

    exportConfig(filename, text) {
        const pom = document.createElement('a');
        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        pom.setAttribute('download', filename);

        if (document.createEvent) {
            var event = document.createEvent('MouseEvents');
            event.initEvent('click', true, true);
            pom.dispatchEvent(event);
        }
        else {
            pom.click();
        }
    }

    swipeTheme = () => {
        let checkbox = document.getElementById("checkbox");
        if(checkbox.checked){
            //updateTheme("dark");
            localStorage.setItem("theme", "dark");
        } else {
            //updateTheme("white");
            localStorage.removeItem("theme");
        }
        document.location.reload();
    };

    share = () => {
        exportConfig().then((data) => {
            this.exportConfig("config.txt", data);
        });
    };

    importConfig = (event) => {
        const input = event.target;

        const reader = new FileReader();
        reader.onload = function(){
            const content = reader.result;
            importConfig(content);
        };
        reader.readAsText(input.files[0]);
    };

    render() {
        return(
            <div className="settings">
                <label className="switch" onClick={() => this.swipeTheme()}>
                    <span className="slider round">Dark Theme:</span>
                    <input type="checkbox" id="checkbox"/>
                </label>
                <hr/>
                <div className="export">
                    <span>Export Config:</span>
                    <button onClick={() => this.share()}>Export</button>
                </div>
                <div className="import">
                    <span>Select Config:</span>
                    <input type="file" accept="text/plain" onChange={(event) => this.importConfig(event)}/>
                </div>
            </div>
        );
    }
}
