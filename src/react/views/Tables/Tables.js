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
import expand_more_black_24dp from "../../icons/expand_more_black_24dp.svg";
import chevron_right_black_24dp from "../../icons/chevron_right_black_24dp.svg";
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
      dtype: null,
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

    const connection = JSON.parse(
        localStorage.getItem("current_connection")
    );

    await this.loadTables(connection.name, connection.dtype);
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

  async loadTables(connectionName, dtype) {
    if (dtype === "firestore") {
      let topMenu = document.getElementById('top-menu');
      topMenu.style.height = '100%';
    }

    await getAllTables(connectionName).then(tables => {
      this.setState({
        dtype,
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
    const subPlan = localStorage.getItem("employeePlan");
    const tablesNum = JSON.parse(localStorage.getItem("current_connection")).native_tables.length;

    let limit = 0;
    if (subPlan === "Startup Plan") {
      limit = tablesNum + 5;
    } else if (subPlan === "Pro Plan") {
      limit = tablesNum + 25;
    } else { // Personal
      limit = tablesNum + 2;
    }

    if (this.state.tables.length >= limit) {
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

  hideDatabaseTablesMenu() {
    let less_icon = document.getElementById('expand_less_top');
    let more_icon = document.getElementById('expand_more_top');

    const dtype = this.state.dtype;

    if (dtype === 'firestore') {
      let topMenu = document.getElementById('top-menu');
      let topTablesMenu = document.getElementById('top-menu-tables');

      if (topTablesMenu.style.display === 'none') {
        topTablesMenu.style.display = 'block';
        less_icon.style.display = 'none';
        more_icon.style.display = 'block';
        topMenu.style.height = '100%';
      } else {
        less_icon.style.display = 'block';
        more_icon.style.display = 'none';
        topTablesMenu.style.display = 'none';
        topMenu.style.height = '0%';
        topMenu.style.minHeight = '35px';
      }
    } else {
      let topMenu = document.getElementById('bottom-menu');
      let bottomMenu = document.getElementById('top-menu');
      let bottomTablesMenu = document.getElementById('top-menu-tables');

      if (bottomTablesMenu.style.display === 'none') {
        bottomTablesMenu.style.display = 'block';
        less_icon.style.display = 'none';
        more_icon.style.display = 'block';
        bottomMenu.style.height = '50%';
        topMenu.style.height = '50%';

      } else {
        less_icon.style.display = 'block';
        more_icon.style.display = 'none';
        bottomTablesMenu.style.display = 'none';
        bottomMenu.style.height = '0%';
        bottomMenu.style.minHeight = '35px';
        topMenu.style.height = '100%';
      }
    }
  }

  hideJoinedTablesMenu() {
    let less_icon = document.getElementById('expand_less_bottom');
    let more_icon = document.getElementById('expand_more_bottom');
    let bottomMenu = document.getElementById('bottom-menu');
    let bottomTablesMenu = document.getElementById('bottom-menu-tables');

    if (bottomTablesMenu.style.display === 'none') {
      less_icon.style.display = 'none';
      more_icon.style.display = 'block';
      bottomTablesMenu.style.display = 'block';
      bottomMenu.style.height = '100%';

    } else {
      less_icon.style.display = 'block';
      more_icon.style.display = 'none';
      bottomTablesMenu.style.display = 'none';
      bottomMenu.style.height = '0%';
      bottomMenu.style.minHeight = '35px';
    }
  }

  render() {
    const { currentOpenedTable, tables, isOpen, searchedTables, warning, dtype } = this.state;

    if (!tables || !searchedTables) {
      return (
          <div className="loading">
            <div className='body'>
                  <span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
              <div className='base'>
                <span></span>
                <div className='face'></div>
              </div>
            </div>
            <div className='longfazers'>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <h1>Loading..</h1>
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
              <div className="top-menu-part" id="top-menu">
                <div className="new-tab" onClick={() => this.hideDatabaseTablesMenu()}>
                  <div className="new-tab-title"><img id="expand_more_top" src={expand_more_black_24dp}/><img id="expand_less_top" src={chevron_right_black_24dp}/> Database tables</div>
                  <div className="left-menu-line"></div>
                </div>

                {/* --------------------------------- TABLES PAGE LEFT MENU ALL TABLES ------------------------------- */}
                <div className='left-menu-all-tables' id="top-menu-tables">
                  { searchedTables.length ? (
                          searchedTables.filter(st => st.type === 'default_query').map((table, i) => {
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
                                            }>{
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

              { dtype !== "firestore" &&
                  <div className="bottom-menu-part" id="bottom-menu">
                    <div className="new-tab">
                      <div className="new-tab-title"><img id="expand_more_bottom" src={expand_more_black_24dp} onClick={() => this.hideJoinedTablesMenu()}/><img id="expand_less_bottom" src={chevron_right_black_24dp} onClick={() => this.hideJoinedTablesMenu()}/> <div onClick={() => this.hideJoinedTablesMenu()}>Joined tables</div> <div className='create-new-table-btn' onClick={() => this.createTable()}>+</div></div>
                      <div className="left-menu-line"></div>
                    </div>
                    <div className='left-menu-all-tables' id="bottom-menu-tables">
                      { searchedTables.length ? (
                              searchedTables.filter(st => st.type !== 'default_query').map((table, i) => {
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
                                                }>{
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
              }

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
