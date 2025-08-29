import 'mdb-react-ui-kit/dist/css/mdb.min.css'
import "@fortawesome/fontawesome-free/css/all.min.css"
import {Roboto} from "next/font/google";
import Providers from "@/component/Providers";
import React from 'react';
import {MDBCol, MDBContainer, MDBFooter, MDBIcon, MDBRow} from "mdb-react-ui-kit";

const roboto = Roboto({weight: "400", subsets: ["latin"]});

export const metadata = {
    title: "Lanmnan AI",
    description: "Lanmnan AI",
    icons: {
        icon: [
            { url: '/favicon.png', type: 'image/svg+xml' },
            { url: '/favicon.png', type: 'image/png' }
        ]
    }
};

export default function RootLayout({children}: {
    children: React.ReactNode;
}) {

    return (

        <Providers>
            <html lang="en">
            <body className={roboto.className}>
            <div className="page-wrapper">
                {children}
            </div>

            </body>
            </html>
        </Providers>
    );
}