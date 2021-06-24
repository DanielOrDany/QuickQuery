import React from "react";
import "./Tables.scss";
import { Route } from "react-router-dom";
import CreateTable from "./CreateTable";
import Result from "./ResultTable";
import {authVerifyToken, getAllTables, getTable} from "../../methods";
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
    const {currentOpenedTable, tables, isOpen, searchedTables, warning} = this.state;
    console.log(this.state);
    console.log(warning);
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
            <div className='tables-page-left-menu'>


              {/* ----------------------------------- TABLES PAGE LEFT MENU BUTTON ----------------------------------- */}
              <div className='left-menu-button' onClick={() => this.createTable()}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                      d="M6.39373 6.10322L11.0138 6.10322C11.3007 6.10334 11.5334 5.88125 11.5333 5.60737C11.5333 5.33338 11.3008 5.11152 11.0138 5.11152L6.39373 5.11152L6.39361 0.701345C6.39361 0.427353 6.16118 0.205494 5.87415 0.205494C5.58723 0.205377 5.35456 0.42747 5.35468 0.701345L5.3548 5.11152L0.73462 5.11141C0.447704 5.11129 0.215035 5.33338 0.215157 5.60726C0.21528 5.74414 0.273447 5.86816 0.367372 5.95781C0.461296 6.04747 0.591224 6.10299 0.734743 6.10299L5.35493 6.10311L5.35493 10.5132C5.35493 10.6502 5.41309 10.7742 5.50702 10.8638C5.60094 10.9535 5.73087 11.009 5.87439 11.009C6.16131 11.0091 6.39398 10.787 6.39385 10.5132L6.39373 6.10322Z"
                      fill="white"/>
                </svg>
                <span>Create table</span>
              </div>


              {/* --------------------------------- TABLES PAGE LEFT MENU ALL TABLES ------------------------------- */}
              <div className={'left-menu-all-tables'}>

                {console.log(searchedTables)}
                {searchedTables.length ? (
                        searchedTables.map(table => {
                          let evenConn = searchedTables.indexOf(table) % 2 === 0;
                          return (

                              /* ---------------------------------- LEFT MENU TABLE --------------------------------- */
                              <div className='table-page-left-menu-table'>
                                <div className='left-menu-table' id={table.alias} key={table.alias}>

                                  {/* --------------------------------- TABLE ICON ----------------------------------- */}
                                  <div className={'table-icon'} onClick={() => this.openTable(table.alias)}>
                                    <svg width="16" height="18" viewBox="0 0 16 18" xmlns="http://www.w3.org/2000/svg" style={
                                      localStorage.getItem("openedTable")
                                          ? table.alias ===
                                          localStorage.getItem("openedTable")
                                          ? {fill: "#2A7C50"}
                                          : null
                                          : table.alias === currentOpenedTable
                                          ? {fill: "#2A7C50"}
                                          : null
                                    }>
                                      <path
                                          d="M16 3.36C16 1.1552 11.9744 0 8 0C4.0256 0 0 1.1552 0 3.36C0 3.3984 0 3.4368 0 3.4784C0 3.52 0 3.52 0 3.52V14.08C0.000602318 14.1589 0.015791 14.237 0.0448 14.3104C0.4864 16.2624 4.2656 17.28 8 17.28C11.7344 17.28 15.5136 16.2624 15.9552 14.3104C15.9842 14.237 15.9994 14.1589 16 14.08V3.52C16 3.504 16 3.4912 16 3.4784C16 3.4656 16 3.3984 16 3.36ZM14.72 8.7776V10.4C14.72 10.6784 14.3616 11.136 13.3504 11.5744C12.0288 12.16 10.08 12.48 8 12.48C5.92 12.48 3.9712 12.16 2.6496 11.5744C1.6384 11.136 1.28 10.6784 1.28 10.4V8.7776H1.2992C1.3632 8.8192 1.4336 8.8608 1.5072 8.9024L1.6 8.96L1.7824 9.0528L1.8688 9.0976C1.9584 9.1392 2.0512 9.184 2.1504 9.2256C3.616 9.872 5.76 10.24 8 10.24C10.24 10.24 12.384 9.872 13.8624 9.2256C13.9616 9.184 14.0544 9.1392 14.1472 9.0944L14.224 9.056L14.416 8.9568L14.4864 8.9152C14.5632 8.8736 14.6368 8.832 14.704 8.7872L14.72 8.7776ZM14.72 6.88C14.72 7.1584 14.3616 7.616 13.3504 8.0544C12.0288 8.64 10.08 8.96 8 8.96C5.92 8.96 3.9712 8.64 2.6496 8.0544C1.6384 7.616 1.28 7.1584 1.28 6.88V5.2576C1.55345 5.42959 1.84023 5.5794 2.1376 5.7056C3.616 6.352 5.76 6.72 8 6.72C8.2816 6.72 8.56 6.72 8.8384 6.704C9.4784 6.6752 10.1184 6.6144 10.7264 6.528C11.1488 6.4672 11.5616 6.3968 11.952 6.3104C12.6098 6.1704 13.2527 5.96788 13.872 5.7056C14.1662 5.57913 14.4497 5.42932 14.72 5.2576V6.88ZM8 1.28C12.1024 1.28 14.72 2.512 14.72 3.36C14.72 3.6384 14.3616 4.096 13.3504 4.5344C12.0288 5.12 10.08 5.44 8 5.44C7.7408 5.44 7.4816 5.44 7.2288 5.424C6.976 5.408 6.6592 5.3952 6.3808 5.3696C5.75073 5.31761 5.12447 5.22677 4.5056 5.0976C4.29227 5.0528 4.08747 5.0048 3.8912 4.9536L3.7504 4.9184C3.37509 4.8158 3.00729 4.68749 2.6496 4.5344C1.6384 4.096 1.28 3.6384 1.28 3.36C1.28 2.512 3.8976 1.28 8 1.28ZM8 16C3.8976 16 1.28 14.768 1.28 13.92V12.2976H1.2992C1.3632 12.3392 1.4336 12.3808 1.5072 12.4224L1.6 12.48L1.7824 12.5728L1.8688 12.6176C1.9584 12.6592 2.0512 12.704 2.1504 12.7456C3.616 13.392 5.76 13.76 8 13.76C10.24 13.76 12.384 13.392 13.8624 12.7456C13.9616 12.704 14.0544 12.6592 14.1472 12.6144L14.224 12.576L14.416 12.4768L14.4864 12.4352C14.5632 12.3936 14.6368 12.352 14.704 12.3072V13.92C14.72 14.768 12.1024 16 8 16Z"/>
                                    </svg>
                                  </div>

                                  {/* --------------------------------- TABLE NAME ----------------------------------- */}
                                  <div className='table-name' onClick={() => this.openTable(table.alias)}>
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
                                          }>{table.alias}</span>
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
                                          }> {
                                            (table.alias.length === 24 && table.alias.match(base64RE)) ? utf8.decode(base64.decode(table.alias)) : table.alias
                                          }</span>
                                    }
                                  </div>

                                  {/* --------------------------------- TABLE MENU ----------------------------------- */}
                                  <div className='table-menu'>
                                    <MiniMenu icon={<MiniMenuIcon/>} table={table}/>
                                  </div>

                                </div>

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


              {/* --------------------------------------------- SEARCH ---------------------------------------------------

            <div className="mini-menu">
              <input
                  className="search"
                  id="search-field"
                  type="search"
                  placeholder={"Search"}
                  onChange={() => this.search()}
              />
            </div>*/}


              {/*
            <div className="tables">
              <div className="add-container">


                <div
                  className="btn-container"
                  onClick={() => this.createTable()}
                >
                  <div id="add-btn-field">
                    <img className="add-button" src={plus} />
                    <div className="button-text">Join table</div>
                  </div>
                </div>


              </div>
              { warning &&
                <div className="warning">{warning}</div>
              }
              {searchedTables.length ? (
                searchedTables.map(table => {
                  let evenConn = searchedTables.indexOf(table) % 2 === 0;

                  return (
                    <div
                      id={table.alias}
                      className={`table ${evenConn ? "dark-row" : "white-row"}`}
                      key={table.alias}
                    >
                      <div
                        className="container"
                        onClick={() => this.openTable(table.alias)}
                      >
                        <div id="table-name">
                          <span
                            style={
                              localStorage.getItem("openedTable")
                                ? table.alias ===
                                  localStorage.getItem("openedTable")
                                  ? { color: "#9fcdb3" }
                                  : null
                                : table.alias === currentOpenedTable
                                ? { color: "#9fcdb3" }
                                : null
                            }
                          >
                            &#11044;
                          </span>
                          <div id="name">
                            {
                              table.alias.match(engRE) ?
                                  <p id="table-n">{table.alias}</p>
                                  :
                                  <p id="table-n"> {
                                    (table.alias.length === 24 && table.alias.match(base64RE)) ? utf8.decode(base64.decode(table.alias)) : table.alias
                                  }</p>
                            }
                          </div>
                        </div>
                      </div>
                      <div className="m-menu">
                        <MiniMenu icon={<MiniMenuIcon />} table={table} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-rows">
                  <div className="empty-rows-column">
                    <img className="empty-rows-box" src={upArrow} />
                    <span>You don't have a table yet.</span>
                    <span>Please create it on the "Join table" button.</span>
                  </div>
                </div>
              )}
            </div>*/}
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

                      <button className='empty-right-side-tables-page-btn' onClick={() => this.createTable()}>Create
                        table
                      </button>

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
