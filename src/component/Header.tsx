import React from 'react';
import {
    MDBNavbar,
    MDBContainer,
    MDBNavbarBrand,
    MDBNavbarToggler,
    MDBIcon,
    MDBCollapse,
    MDBNavbarNav,
    MDBNavbarItem,
    MDBNavbarLink
} from 'mdb-react-ui-kit';
import {signIn, signOut, useSession} from "next-auth/react";


export default function Header() {
    const [showNav, setShowNav] = React.useState(false);
    const {data: session} = useSession();


    return (
        <MDBNavbar expand='lg' light bgColor='light'>
            <MDBContainer fluid>
                <MDBNavbarBrand href='#'>Jade AI Bot</MDBNavbarBrand>
                <MDBNavbarToggler
                    aria-controls='navbarNav'
                    aria-expanded='false'
                    aria-label='Toggle navigation'
                    onClick={() => setShowNav(!showNav)}
                >
                    <MDBIcon icon='bars' fas/>
                </MDBNavbarToggler>
                <MDBCollapse navbar show={showNav}>
                    <MDBNavbarNav>
                        <MDBNavbarItem>
                            <MDBNavbarLink active aria-current='page' href='#'>
                                Home
                            </MDBNavbarLink>
                        </MDBNavbarItem>
                        <MDBNavbarItem>
                            <MDBNavbarLink href='#about'>About</MDBNavbarLink>
                        </MDBNavbarItem>
                        <MDBNavbarItem>
                            <MDBNavbarLink href='#projects'>Projects</MDBNavbarLink>
                        </MDBNavbarItem>
                        <MDBNavbarItem>
                            <MDBNavbarLink href='#contact'>Contact</MDBNavbarLink>
                        </MDBNavbarItem>
                        {
                            session && session.user &&
                            <>
                                <MDBNavbarItem>
                                    <MDBNavbarLink href='#contact' onClick={() => {
                                        signOut()
                                    }}>
                                        Sign Out ({session.user.name})
                                    </MDBNavbarLink>
                                </MDBNavbarItem>
                            </>

                        }
                        {
                            !session?.user &&
                            <>
                                <MDBNavbarItem>
                                    <MDBNavbarLink href='#contact' onClick={()=>{signIn('google')}}>
                                            Sign In
                                    </MDBNavbarLink>
                                </MDBNavbarItem>
                            </>
                        }
                    </MDBNavbarNav>
                </MDBCollapse>
            </MDBContainer>
        </MDBNavbar>
    );
}
