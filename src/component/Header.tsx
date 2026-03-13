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
import { useAuth, useUser, SignInButton, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';


export default function Header() {
    const [showNav, setShowNav] = React.useState(false);
    const { isSignedIn, isLoaded } = useAuth();
    const { user } = useUser();
    const router = useRouter();
    const chatbotName = process.env.NEXT_PUBLIC_CHATBOT_NAME || 'JadeAIBot';

    // Redirect to home if there's an auth error
    React.useEffect(() => {
        if (isLoaded && !isSignedIn) {
            // Only redirect if we're on a protected route
            const currentPath = window.location.pathname;
            if (currentPath !== '/' && !currentPath.startsWith('/oauth-') && !currentPath.startsWith('/auth/')) {
                router.push('/');
            }
        }
    }, [isLoaded, isSignedIn, router]);

    return (
        <MDBNavbar expand='lg' light bgColor='light'>
            <MDBContainer fluid>
                <MDBNavbarBrand href='/'>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img 
                            src="/favicon.png" 
                            alt={chatbotName} 
                            style={{ width: '24px', height: '24px' }}
                        />
                        <span>{chatbotName} AI</span>
                    </div>
                </MDBNavbarBrand>
                <MDBNavbarToggler
                    aria-controls='navbarNav'
                    aria-expanded='false'
                    aria-label='Toggle navigation'
                    onClick={() => setShowNav(!showNav)}
                >
                    <MDBIcon icon='bars' fas/>
                </MDBNavbarToggler>
                <MDBCollapse navbar>
                    <MDBNavbarNav>
                        <MDBNavbarItem>
                            <MDBNavbarLink active aria-current='page' href='/'>
                                Home
                            </MDBNavbarLink>
                        </MDBNavbarItem>
                        <MDBNavbarItem>
                            <MDBNavbarLink href='#about'>About</MDBNavbarLink>
                        </MDBNavbarItem>
                        <MDBNavbarItem>
                            <MDBNavbarLink href='/projects/list'>Projects</MDBNavbarLink>
                        </MDBNavbarItem>
                        <MDBNavbarItem>
                            <MDBNavbarLink href='#contact'>Contact</MDBNavbarLink>
                        </MDBNavbarItem>
                        {isLoaded && isSignedIn && user && (
                            <MDBNavbarItem>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px' }}>
                                    <span style={{ marginRight: '8px' }}>{user.fullName || user.firstName || 'User'}</span>
                                    <UserButton afterSignOutUrl="/" />
                                </div>
                            </MDBNavbarItem>
                        )}
                        {isLoaded && !isSignedIn && (
                            <MDBNavbarItem>
                                <SignInButton mode="modal" redirectUrl="/dashboard">
                                    <MDBNavbarLink href='#' onClick={(e) => e.preventDefault()}>
                                        Sign In
                                    </MDBNavbarLink>
                                </SignInButton>
                            </MDBNavbarItem>
                        )}
                    </MDBNavbarNav>
                </MDBCollapse>
            </MDBContainer>
        </MDBNavbar>
    );
}
