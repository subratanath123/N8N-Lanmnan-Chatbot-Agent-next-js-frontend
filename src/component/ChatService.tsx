"use client";

import React, {useState} from "react";
import Fab from "@mui/material/Fab";
import {MDBContainer} from "mdb-react-ui-kit";
import {StompSessionProvider} from "react-stomp-hooks";
import ChatUserList from "@/component/ChatUserList";
import {useSession} from "next-auth/react";

const fabStyle : React.CSSProperties = {
    position: "fixed",
    bottom: 16,
    right: 16,
    zIndex: 1000,
};

const SOCKET_URL = "http://143.198.58.6:8080/websocket";

export default function ChatService({projectId}: { projectId: string | undefined }) {
    const {data: session} = useSession();

    const [state, setState] = useState<{
        chatMaximized: boolean;
        showUserList: boolean;
        fetchUserList: boolean;
    }>({
        chatMaximized: false,
        showUserList: false,
        fetchUserList: false,
    });

    const [open, setOpen] = useState(false);

    const toggleDrawer = (newOpen: boolean) => () => setOpen(newOpen);

    return (
        <StompSessionProvider url={SOCKET_URL}>
            <MDBContainer className="py-5">
                {/*{!state.chatMaximized && !state.showUserList && session?.user && (*/}
                    <div
                        style={fabStyle}
                        onClick={() =>
                            setState({...state, showUserList: true, fetchUserList: true})
                        }
                    >
                        <Fab variant="extended">Live chat</Fab>
                    </div>
                {/*)}*/}

                {state.fetchUserList && session && (
                    <ChatUserList
                        projectId={projectId || ''}
                        session={session}
                        onClick={toggleDrawer}
                        showUserList={state.showUserList}
                        onDrawerClose={() =>
                            setState({...state, showUserList: false})
                        }
                        onChatMaximized={() =>
                            setState({...state, showUserList: false, chatMaximized: true})
                        }
                        onChatMinimized={() =>
                            setState({
                                ...state,
                                showUserList: false,
                                chatMaximized: false,
                            })
                        }
                    />
                )}
            </MDBContainer>
        </StompSessionProvider>
    );
}
