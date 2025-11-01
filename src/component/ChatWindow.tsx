"use client";

import React, {useEffect, useRef, useState} from "react";
import {MDBCard, MDBCardBody, MDBCol, MDBRow} from "mdb-react-ui-kit";
import ChatHeader from "@/component/ChatHeader";
import MessageRow from "@/component/MessageRow";
import ChatTextAreaBox from "@/component/ChatTextAreaBox";
import Fab from "@mui/material/Fab";
import {ChatMessage, User} from "@/constants/Cosntants";
import {useStompClient, useSubscription} from "react-stomp-hooks";
import {useSession} from "next-auth/react";
import axios from "axios";
import Linkify from 'linkify-react';


interface ChatWindowProps {
    chatWithUser: User,
    projectId: string,
    onCloseChat: (user: User) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({chatWithUser, projectId, onCloseChat}) => {
    const {data: session} = useSession();
    const selfEmail = session?.user?.email;
    const token = session?.access_token;
    const myPicture = session?.picture;

    const [state, setState] = useState<{

        chatMaximized: boolean,
        chatBotResponding: boolean,
        showUserList: boolean,
        fetchedData: boolean;
        messages: ChatMessage[],
        text: string

    }>({
        chatMaximized: false,
        showUserList: false,
        chatBotResponding: false,
        fetchedData: false,
        messages: [],
        text: ''
    });

    const stompClient = useStompClient();
    const cardRef = useRef(null);

    // Function to scroll the card to the bottom
    const scrollToBottom = () => {
        if (cardRef.current) {
            // todo:: Need to add auto scroll
            // cardRef.current.scrollTop = cardRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        // Scroll to the bottom when component mounts or when messages change
        scrollToBottom();
    }, [state.messages]);


    useEffect(() => {
        const fetchData = async () => {

            const messageFetchUrl = !projectId
                ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/api/get-recent-messages/${chatWithUser.email}`
                : `${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/api/get-recent-messages/${chatWithUser.email}/${projectId}`

            try {
                const response = await axios.get(messageFetchUrl, {
                    headers: {
                        'Authorization': `Bearer ${session?.access_token}`
                    }
                });

                setState((prevState) => ({...prevState, fetchedData: true, messages: response.data}));

            } catch (error) {
                console.error('Fetching messages failed:', error);
            }
        };

        fetchData();

    }, [chatWithUser.email]);

    const sendMessage = (msg: any) => {
        if (stompClient && msg.toString().trim().length > 1) {
            let chatMessageString = `{
                "content": "${msg.replace(/\n/g, '\\n')}",
                "senderEmail": "${selfEmail}",
                "type": "CHAT",
                "token": "${token}"
            }`;

            setState((prevState) => ({...prevState, text: ''}));

            stompClient.publish({
                destination: '/app/user-message-' + chatWithUser.email + '-' + projectId, body: chatMessageString
            })

            if (chatWithUser.email.startsWith('chatbot')) {
                setState((prevState) => ({...prevState, chatBotResponding: true}));
            }
        }
    }

    useSubscription('/queue/reply-' + selfEmail,
        (message) => {

            let chatMessage: ChatMessage = JSON.parse(message.body);

            setState((prevState) => ({...prevState, messages: [...prevState.messages, chatMessage]}));

            if (chatMessage.senderEmail.startsWith("chatbot")) {
                setState((prevState) => ({...prevState, chatBotResponding: false}));
            }

            scrollToBottom();
        }
    );

    return (
        <MDBRow className="d-flex justify-content-center">
            <MDBCol md="10" lg="10" xl="10" style={{minWidth: "300px"}}>
                <MDBCard id="chat1" style={{borderRadius: "15px", maxWidth: "600px"}}>
                    <ChatHeader
                        title={`${chatWithUser.userName} (${chatWithUser.email})`}
                        handleClick={(event) => {
                            onCloseChat(chatWithUser);
                        }}/>


                    <MDBCardBody>
                        <div ref={cardRef} className="overflow-y-scroll"
                             style={{maxHeight: "300px", minHeight: "300px"}}>
                            {
                                state.messages
                                &&
                                state.messages.map((message, index) => {
                                    return <MessageRow key={`message ${index}`}
                                                       avatarLink={message.senderEmail == selfEmail ? myPicture
                                                           : message.senderEmail.startsWith("chatbot")
                                                               ? "https://cdn-icons-png.flaticon.com/512/11306/11306137.png"
                                                               : chatWithUser.picture}
                                                       message={message.content}
                                                       isMe={message.senderEmail == selfEmail}/>;
                                })
                            }
                        </div>

                        {
                            state.chatBotResponding &&
                            <div className="flex justify-start items-center">
                                <div className="typing-bubble px-3 py-2 bg-gray-200 rounded-xl flex space-x-1">

                                    <span className="text-gray-500 text-sm">Agent is responding </span>
                                    <span className="dot"/>
                                    <span className="dot delay-1"/>
                                    <span className="dot delay-2"/>

                                </div>
                            </div>
                        }

                        {
                            !state.fetchedData
                                ? (
                                    <>
                                        <div>
                                            <span className="spinner-border spinner-border-sm" role="status"
                                                  aria-hidden="true"></span>
                                            &nbsp; Loading...
                                        </div>
                                    </>
                                )
                                : (
                                    <>
                                        <ChatTextAreaBox
                                            text={state.text}
                                            handleTextChange={(e) => {
                                                setState({...state, text: e.target.value})
                                            }}/>
                                        <MDBRow className="d-flex justify-content-end" style={{marginTop: "12px"}}>
                                            <Fab variant="extended" color="primary" onClick={(event) => {
                                                sendMessage(state.text)
                                            }}>
                                                Send
                                            </Fab>
                                        </MDBRow>
                                    </>
                                )
                        }
                    </MDBCardBody>
                </MDBCard>
            </MDBCol>

            <style jsx>{`
                .dot {
                    width: 8px;
                    height: 8px;
                    background-color: #555;
                    border-radius: 50%;
                    display: inline-block;
                    animation: bounce 1.4s infinite ease-in-out both;
                }

                .delay-1 {
                    animation-delay: 0.2s;
                }

                .delay-2 {
                    animation-delay: 0.4s;
                }

                @keyframes bounce {
                    0%, 80%, 100% {
                        transform: translateY(0);
                    }
                    40% {
                        transform: translateY(-6px);
                    }
                }
            `}</style>
        </MDBRow>
    );
};

export default ChatWindow;