import React from 'react';
import {MDBBtn, MDBCardHeader} from "mdb-react-ui-kit";


type ChatHeaderProps = {
    title?: string;
    handleClick: (event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;

};


const ChatHeader: React.FC<ChatHeaderProps> = ({
                                                   title = "Live Chat",
                                                   handleClick
                                               }) => {

    const onClick = (event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
        handleClick(event);
    }

    return (
        <MDBCardHeader
            className="d-flex justify-content-between align-items-center p-3 bg-info text-white border-bottom-0"
            style={{
                borderTopLeftRadius: "15px",
                borderTopRightRadius: "15px",
            }}>
            <p className="mb-0 fw-bold">{title}</p>

            <MDBBtn className="fas fa-times bg-transparent shadow-0 btn-group-lg"
                    onClick={onClick}/>
        </MDBCardHeader>
    )
};

export default ChatHeader;
