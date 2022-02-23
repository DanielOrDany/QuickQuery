import React from "react";
import "./Tables.scss";
import { Route } from "react-router-dom";
import CreateTable from "./CreateTable";
import Result from "./ResultTable";
import {
  authVerifyToken,
  getAllTables,
  getTable
} from "../../methods";
import { ReactComponent as MiniMenuIcon } from "../../icons/tables-page-left-menu-table-menu.svg";
import xxx from "../../icons/loop.svg";
import empty_result_page from "../../icons/empry-result-page.svg";
import MiniMenu from "../../components/MiniMenu";
import Modal from "../../popups/Modal";
import MessagePopup from "../../popups/MessagePopup";

const utf8 = require('utf8');
const base64 = require('base-64');
const base64RE = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/g;
const engRE = /^[a-zA-Z]+$/g;

export default class Tables extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      tables: [],
      searchedTables: [],
      isOpen: false,
      currentConnection: "",
      warning: null
    };
  }

  async componentDidMount() {
    if (!localStorage.getItem("current_connection")) {
      this.openModal();
      return;
    }

    const connectionName = JSON.parse(
        localStorage.getItem("current_connection")
    ).name;

    await this.loadTables(connectionName);
  }

  async componentDidUpdate(prevProps, prevState, snapshot) {
    if (localStorage.getItem("need_update")) {
      localStorage.removeItem("need_update");
      await this.loadTables(
          JSON.parse(localStorage.getItem("current_connection")).name
      );
    }

    if (localStorage.getItem("new_table")) {
      localStorage.removeItem("new_table");
      await this.loadTables(
          JSON.parse(localStorage.getItem("current_connection")).name
      );
    }
  }

  closeWarning = () => {
    this.setState({warning: null});
  };

  openModal = () => {
    this.setState({isOpen: true});
  };

  handleSubmit = () => {
    this.setState({isOpen: false});
    window.location.hash = "#/connections";
  };

  handleCancel = () => {
    this.setState({isOpen: false});
    window.location.hash = "#/connections";
  };

  async loadTables(connectionName) {
    await getAllTables(connectionName).then(tables => {
      this.setState({
        tables: tables,
        searchedTables: tables
      });
    });
  }

  async openTable(alias) {
    const connectionName = JSON.parse(
        localStorage.getItem("current_connection")
    ).name;

    await this.verifyEmployee();

    getTable(connectionName, alias)
        .then(result => {
          localStorage.setItem("current_result_info", JSON.stringify(result));
          const results = JSON.parse(localStorage.getItem("results"));

          if (results) {
            results.push(result);
            localStorage.setItem("results", JSON.stringify(results));
          } else {
            localStorage.setItem("results", JSON.stringify([result]));
          }

          return `#/tables/${window.location.hash.split("/")[1]}/result/${alias}`;
        })
        .then(async url => {
          window.location.hash = url;
          localStorage.removeItem("openedTable");
          this.setState({
            currentOpenedTable: alias
          });
        });
  }

  async verifyEmployee() {
    const id = localStorage.getItem("employeeId");
    const token = localStorage.getItem("employeeToken");

    if (id && token) {
      const verified = await authVerifyToken(id, token);

      console.log('verified user', verified);

      if (verified && verified.data) {
        localStorage.setItem("deleteAccess", verified.data.employee.dataValues.delete_access);
        localStorage.setItem("updateAccess", verified.data.employee.dataValues.update_access);
        localStorage.setItem("employeePlan", verified.data.subscription.plan_name);
        localStorage.setItem("employeeCountSubFrom", verified.data.subscription.count_from);
        await this.props.changeSignedStatus(true);
      } else {
        await this.props.changeSignedStatus(false);
      }
    } else {
      await this.props.changeSignedStatus(false);
    }
  }

  async createTable() {
    //await this.verifyEmployee();
    const subPlan = localStorage.getItem("employeePlan");
    const tablesNum = JSON.parse(localStorage.getItem("current_connection")).native_tables.length;

    console.log(subPlan, tablesNum);

    let limit = 0;
    if (subPlan === "Startup Plan") {
      limit = tablesNum + 5;
    } else if (subPlan === "Pro Plan") {
      limit = tablesNum + 25;
    } else { // Personal
      limit = tablesNum + 2;
    }

    console.log(limit);

    if (this.state.tables.length >= limit) {
      console.log('set limit');
      this.setState({
        warning: `Your limit for ${subPlan} is ${limit} report schemas. Please upgrade your plan.`
      });
    } else {
      if (localStorage.getItem("current_result_info")) {
        localStorage.removeItem("current_result_info");
      }

      if (localStorage.getItem("openedTable")) {
        localStorage.removeItem("openedTable");
      }

      if (this.state.currentOpenedTable !== "") {
        this.setState({
          currentOpenedTable: ""
        });
      }

      window.location.hash = `#/tables/${
          window.location.hash.split("/")[1]
      }/create-table`;
    }
  }

  search = () => {
    const searchValue = document.getElementById("search-field").value;
    let searchedTables = [];

    if (this.state.tables.length != 0) {
      this.state.tables.forEach(table => {
        if (table.alias.includes(searchValue)) {
          searchedTables.push(table);
        }
      });

      this.setState({searchedTables: searchedTables});
    }
  };

  render() {
    const { currentOpenedTable, tables, isOpen, searchedTables, warning } = this.state;

    if (!tables || !searchedTables) {
      return (
          <div className={"loading"}>
            <img src={xxx}/>
            Loading...
          </div>
      );
    } else
      return (


          /* --------------------------------------------- TABLES PAGE ---------------------------------------------- */
          <div className="tables-page">

            { warning &&
              <MessagePopup title={"Plan limits"} isOpen={true} text={warning} onSubmit={() => this.closeWarning()}/>
            }

            <Modal
                title="Error"
                isOpen={isOpen}
                onCancel={this.handleCancel}
                onSubmit={this.handleSubmit}
                submitTitle="OK"
            >
              <div>
                <strong>
                  Choose the connection. If you don't have any connection, please
                  add a new one.
                </strong>
              </div>
            </Modal>


            {/* --------------------------------------- TABLES PAGE LEFT MENU ---------------------------------------- */}
            <div className='tables-page-left-menu' id="left-tables-menu">


              {/* ----------------------------------- TABLES PAGE LEFT MENU BUTTON ----------------------------------- */}
              <div className='left-menu-button' onClick={() => this.createTable()}>
                {/*<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">*/}
                {/*  <path*/}
                {/*      d="M6.39373 6.10322L11.0138 6.10322C11.3007 6.10334 11.5334 5.88125 11.5333 5.60737C11.5333 5.33338 11.3008 5.11152 11.0138 5.11152L6.39373 5.11152L6.39361 0.701345C6.39361 0.427353 6.16118 0.205494 5.87415 0.205494C5.58723 0.205377 5.35456 0.42747 5.35468 0.701345L5.3548 5.11152L0.73462 5.11141C0.447704 5.11129 0.215035 5.33338 0.215157 5.60726C0.21528 5.74414 0.273447 5.86816 0.367372 5.95781C0.461296 6.04747 0.591224 6.10299 0.734743 6.10299L5.35493 6.10311L5.35493 10.5132C5.35493 10.6502 5.41309 10.7742 5.50702 10.8638C5.60094 10.9535 5.73087 11.009 5.87439 11.009C6.16131 11.0091 6.39398 10.787 6.39385 10.5132L6.39373 6.10322Z"*/}
                {/*      fill="white"/>*/}
                {/*</svg>*/}
                <span>New Spreadsheet</span>

              </div>

                <div className="new-tab">
                    <span>Default db tables</span>
                    <div className="left-menu-line"></div>
                </div>

              {/* --------------------------------- TABLES PAGE LEFT MENU ALL TABLES ------------------------------- */}
              <div className='left-menu-all-tables'>
                {searchedTables.length ? (
                        searchedTables.map((table, i) => {
                          let evenConn = searchedTables.indexOf(table) % 2 === 0;
                          return (

                              /* ---------------------------------- LEFT MENU TABLE --------------------------------- */
                              <div className='table-page-left-menu-table'>
                                <div className='left-menu-table' id={table.alias} key={table.alias}>

                                  {/* --------------------------------- TABLE ICON ----------------------------------- */}
                                  <div className='table-icon' onClick={() => this.openTable(table.alias)}>
                                    <svg width="24" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={
                                      localStorage.getItem("openedTable")
                                          ? table.alias ===
                                          localStorage.getItem("openedTable")
                                          ? {fill: "#2A7C50"}
                                          : null
                                          : table.alias === currentOpenedTable
                                          ? {fill: "#2A7C50"}
                                          : null
                                    }>
                                      <path d="M0 0h24v24H0V0z" fill="none"/><path d="M10 10.02h5V21h-5zM17 21h3c1.1 0 2-.9 2-2v-9h-5v11zm3-18H5c-1.1 0-2 .9-2 2v3h19V5c0-1.1-.9-2-2-2zM3 19c0 1.1.9 2 2 2h3V10H3v9z"/>
                                    </svg>
                                  </div>

                                  {/* --------------------------------- TABLE NAME ----------------------------------- */}
                                  <div className='table-name' title={table.alias} onClick={() => this.openTable(table.alias)}>
                                    {
                                      table.alias.match(engRE) ?
                                          <span id="table-n" style={
                                            localStorage.getItem("openedTable")
                                                ? table.alias ===
                                                localStorage.getItem("openedTable")
                                                ? {color: "#2A7C50",
                                                  fontWeight: 500}
                                                : null
                                                : table.alias === currentOpenedTable
                                                ? {color: "#2A7C50",
                                                  fontWeight: 500}
                                                : null
                                          }>{(table.type === 'default_query' ? 'db ' : '') + table.alias}</span>
                                          :
                                          <span id="table-n" style={
                                            localStorage.getItem("openedTable")
                                                ? table.alias ===
                                                localStorage.getItem("openedTable")
                                                ? {color: "#2A7C50",
                                                fontWeight: 500}
                                                : null
                                                : table.alias === currentOpenedTable
                                                ? {color: "#2A7C50",
                                                  fontWeight: 500}
                                                : null
                                          }> {(table.type === 'default_query' ? 'db ' : '')}{
                                             (table.alias.length === 24 && table.alias.match(base64RE)) ? utf8.decode(base64.decode(table.alias)) : table.alias
                                          }</span>
                                    }
                                  </div>

                                  {/* --------------------------------- TABLE MENU ----------------------------------- */}

                                  { table.type === 'new' &&
                                    <div className='table-menu'>
                                      <MiniMenu icon={<MiniMenuIcon/>} table={table}/>
                                    </div>
                                  }
                                </div>
                                  {
                                      table.type === 'default_query' && searchedTables.length > i + 1 && searchedTables[i + 1].type !== 'default_query' &&
                                      <div className="new-tab">
                                          <span>Created spreadsheets</span>
                                          <div className="left-menu-line"></div>
                                      </div>
                                  }
                              </div>
                          );
                        })
                    )
                    :
                    (
                        /* ------------------------------------ EMPTY LEFT MENU TABLES ------------------------------ */
                        <div className="empty-rows">

                        </div>
                    )
                }
              </div>
            </div>


            <div className="right-side-tables-page">
              {!window.location.hash.includes("edit-table") &&
              !window.location.hash.includes("result") &&
              !window.location.hash.includes("create-table") && (
                  <div className="empty-result-row">

                    <div className="empty-result-column">
                      <img className="empty-result-box" src={empty_result_page} alt={'empty page'}/>

                      <span>Table is not selected. <br/>
                      Please select it from the list on left.</span>

                      <div className='empty-right-side-tables-page-btn'>
                        <span>OR</span> <button onClick={() => this.createTable()}>Create New Spreadsheet</button>
                      </div>

                    </div>

                  </div>
              )}
              <Route
                  path={`/tables/:connectionAlias/create-table`}
                  component={CreateTable}
              />
              <Route
                  path={`/tables/:connectionAlias/edit-table/:tableAlias`}
                  component={CreateTable}
              />
              <Route
                  path={`/tables/:connectionAlias/result/:tableAlias`}
                  component={Result}
              />
            </div>
          </div>
      );
  }
}
