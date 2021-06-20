import React from 'react';
import Portal from "../../components/Portal";
import './SettingsPopup.scss';
import cross_icon from "../../icons/pop-up-cross.svg";
import import_icon from "./icons/settings-import-btn.svg";
import export_icon from "./icons/settings-export-btn.svg";
import Button from "../../components/Button";

const SettingsPopup = ({
                                    isOpen,
                                    onCancel,
                                    onSubmit,
                                    exportBtn
                                }) => {
    return (
        <>
            {isOpen &&
            <Portal>

                <div className='settings-popup-BG'>
                    <div className='settings-popup-window'>

                        <img className='settings-popup-cross' src={cross_icon} onClick={onCancel} alt={'cross'}/>


                        <div className='settings-popup-title'>
                            <span>Settings</span>
                        </div>


                        <div className='settings-buttons'>
                            <div className='import-div'>
                                <img src={import_icon} alt='import'/>
                                <span>Import settings</span>

                                <input id="import-button" src={import_icon} type='file'
                                       onChange={(event) => this.importConfigFile(event)}/>
                            </div>


                            <div id="export-div" onClick={exportBtn}>
                                <img src={export_icon} alt='export'/>
                                <span>Export settings</span>

                            </div>

                        </div>

                        <div className='settings-popup-btn'>
                            <Button id='settings-popup-cancel-btn' className='settings-popup-cancel-btn' onClick={onCancel} invert>Cancel</Button>
                            <Button id='settings-popup-create-btn' className='settings-popup-create-btn' onClick={onSubmit}>Create</Button>
                        </div>

                    </div>
                </div>

            </Portal>
            }
        </>
    )

}


export default SettingsPopup;