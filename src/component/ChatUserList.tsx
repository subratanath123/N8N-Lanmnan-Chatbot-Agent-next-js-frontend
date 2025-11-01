import React, {useEffect, useState} from 'react';
import {Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText} from "@mui/material";
import {User} from "@/constants/Cosntants";
import ChatWindow from "@/component/ChatWindow";
import axios from "axios";
import {Session} from "next-auth";

type ChatUserListProps = {
    projectId: string;
    showUserList: boolean;
    onClick: (newOpen: boolean) => void;
    onDrawerClose: () => void;
    onChatMaximized: () => void;
    onChatMinimized: () => void;
    session: Session
};

const style:React.CSSProperties = {
    position: 'absolute',
    bottom: 16,
    right: 16,
    zIndex: 1000, // Adjust the z-index as neede
    display: "flex",
};

const ChatUserList: React.FC<ChatUserListProps> = ({
                                                       projectId,
                                                       showUserList,
                                                       onChatMaximized,
                                                       onChatMinimized,
                                                       onDrawerClose,
                                                       onClick,
                                                       session
                                                   }) => {

    const [state, setState] = useState<{
        userList: User[],
        chatUserWindowList: User[]

    }>({
        userList: [],
        chatUserWindowList: []
    });

    const handleUserChatInitiate = (e: React.MouseEvent<HTMLDivElement>, chatWithUser: User) => {

        console.log(chatWithUser);

        setState(prevState => ({...state, chatUserWindowList: [...prevState.chatUserWindowList, chatWithUser]}));
        onChatMaximized();
    };

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    useEffect(() => {
        axios
            .get(`${backendUrl}/v1/api/supportUserList`, {
            headers: {
                'Authorization': 'Bearer ' + session?.access_token
            }
        })
            .then((response) => {

                setState({
                    ...state,
                    userList: response.data
                })

            })
            .catch((error) => {
                console.error('Chat UserList Fetching failed:', error);
            });
    }, []);

    function handleCloseChat(user: User) {
        let chatUserWindowList = state.chatUserWindowList.filter(u => u.email != user.email);

        setState({...state, chatUserWindowList: chatUserWindowList,});

        if (chatUserWindowList && chatUserWindowList.length == 0) {
            onChatMinimized();
        }
    }

    return (
        <>
            <Drawer
                anchor="right"
                open={showUserList}
                onClose={onDrawerClose}>

                <Box sx={{width: 250}} role="presentation" onClick={(e) => {
                    onClick(false)
                }}>
                    <div style={{
                        padding: '16px',
                        borderBottom: '1px solid #e0e0e0',
                        backgroundColor: '#f8f9fa'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#333'
                        }}>
                            <img 
                                src="/favicon.png" 
                                alt="Lanmnan" 
                                style={{ width: '20px', height: '20px' }}
                            />
                            <span>Chat Users</span>
                        </div>
                    </div>
                    <List>
                        {
                            !!state.userList
                            &&
                            state.userList
                                .filter((user) => {
                                    return user.email !== session?.user?.email
                                })
                                .map((user, index) => (
                                    <ListItem key={`userList-${user.email}`} disablePadding>
                                        <ListItemButton onClick={(e) => handleUserChatInitiate(e, user)}>
                                            <ListItemIcon>
                                                <img
                                                    src={user.userName.startsWith("chatbot")
                                                        ? "https://cdn-icons-png.flaticon.com/512/11306/11306137.png"
                                                        : user.picture}
                                                    alt="avatar 1"
                                                    style={{width: "45px", height: "100%"}}
                                                />
                                            </ListItemIcon>
                                            <ListItemText primary={`${user.userName}(${user.email})`}/>
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                    </List>
                </Box>
            </Drawer>

            <div style={style}>
                {
                    state.chatUserWindowList.map(chatUser => {
                        return (
                            <ChatWindow
                                key={`chatWindowList-${chatUser.email}`}
                                projectId={projectId}
                                chatWithUser={chatUser}
                                onCloseChat={user => {
                                    handleCloseChat(user)
                                }}

                            />
                        )
                    })
                }
            </div>
        </>
    );
}

export default ChatUserList;
