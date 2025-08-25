import NextAuth from "next-auth/next"
import GoogleProvider from "next-auth/providers/google"
import axios from "axios";
// import { cookies } from 'next/headers'

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET
        })
    ],
    callbacks: {
        async jwt({token, account}) {
            if (account) {
                token = Object.assign({}, token, {access_token: account.id_token});
            }


            return token
        },
        async session({session, token}) {
            if (session) {
                session = Object.assign({}, session, {access_token: token.access_token, picture: token.picture})

                // console.log(token);
            }

            const response = await axios.get(`http://143.198.58.6:8080/v1/api/user/authenticated`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });

            if (response.status >= 400) {
                console.log("error on api call");
            } else {
                console.log("success api call");
            }

            return session
        }
    }
});

export {
    handler as GET, handler as POST
}