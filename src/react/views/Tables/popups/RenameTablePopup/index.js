import React from 'react';
import './index.scss';
import cross_icon from "../../../../icons/pop-up-cross.svg";
import Button from "../../../../components/Button";

const RenameTablePopup = ({
    oldAlias,
    isOpen,
    onClose,
    onSave
}) => {
    let textInput = React.createRef();

    return (
        <>
            {isOpen &&

            <div className='rename-table-popup-BG'>

                <div className='rename-table-popup-window'>

                    <img className='rename-table-popup-cross' src={cross_icon} onClick={onClose} alt={'cross'}/>

                    <div className='rename-table-popup-title'>
                        <span>Rename table</span>
                    </div>


                    <div className='rename-table-popup-body'>

                        <div className='rename-table-popup-body-items'>
                            <span>Name</span>
                            <input ref={textInput} placeholder={'Enter name'}/>
                        </div>
                    </div>

                    <div className='rename-table-popup-btn'>
                        <Button className='rename-table-popup-cancel-btn' onClick={onClose}>Cancel</Button>
                        <Button className='rename-table-popup-save-btn' onClick={() => onSave(oldAlias, textInput.current.value)}>Save</Button>
                    </div>


                </div>

            </div>

            }
        </>
    )

}


export default RenameTablePopup;