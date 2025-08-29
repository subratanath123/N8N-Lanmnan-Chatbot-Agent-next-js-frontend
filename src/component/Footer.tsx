import React from 'react';
import {MDBFooter, MDBContainer, MDBRow, MDBCol, MDBIcon} from 'mdb-react-ui-kit';

export default function Footer() {
    return (
        <div className="d-flex flex-column min-vh-100">
            <MDBFooter bgColor='light' className='text-center text-lg-start text-muted'>
                <section className='d-flex justify-content-center justify-content-lg-between p-4 border-bottom'>
                    <div className='me-5 d-none d-lg-block'>
                        <span>Stay connected with us on social platforms:</span>
                    </div>

                    <div>
                        <a href='https://facebook.com/yourpage' className='me-4 text-reset'>
                            <MDBIcon fab icon="facebook-f"/>
                        </a>
                        <a href='https://twitter.com/yourhandle' className='me-4 text-reset'>
                            <MDBIcon fab icon="twitter"/>
                        </a>
                        <a href='https://github.com/yourorg' className='me-4 text-reset'>
                            <MDBIcon fab icon="github"/>
                        </a>
                        <a href='https://linkedin.com/company/yourcompany' className='me-4 text-reset'>
                            <MDBIcon fab icon="linkedin"/>
                        </a>
                    </div>
                </section>

                <section>
                    <MDBContainer className='text-center text-md-start mt-5'>
                        <MDBRow className='mt-3'>
                            <MDBCol md="3" lg="4" xl="3" className='mx-auto mb-4'>
                                <h6 className='text-uppercase fw-bold mb-4'>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <img 
                                            src="/favicon.png" 
                                            alt="Lanmnan" 
                                            style={{ width: '20px', height: '20px' }}
                                        />
                                        <span>Lanmnan</span>
                                    </div>
                                </h6>
                                <p>
                                    We specialize in advanced software and protocol research with scalable real-time
                                    solutions for AI, IoT, and healthcare platforms.
                                </p>
                            </MDBCol>

                            <MDBCol md="2" lg="2" xl="2" className='mx-auto mb-4'>
                                <h6 className='text-uppercase fw-bold mb-4'>Technologies</h6>
                                <p><a href='#!' className='text-reset'>Java</a></p>
                                <p><a href='#!' className='text-reset'>Spring</a></p>
                                <p><a href='#!' className='text-reset'>React</a></p>
                                <p><a href='#!' className='text-reset'>Unity</a></p>
                            </MDBCol>

                            <MDBCol md="3" lg="2" xl="2" className='mx-auto mb-4'>
                                <h6 className='text-uppercase fw-bold mb-4'>Resources</h6>
                                <p><a href='#!' className='text-reset'>Blog</a></p>
                                <p><a href='#!' className='text-reset'>Publications</a></p>
                                <p><a href='#!' className='text-reset'>GitHub</a></p>
                                <p><a href='#!' className='text-reset'>Careers</a></p>
                            </MDBCol>

                            <MDBCol md="4" lg="3" xl="3" className='mx-auto mb-md-0 mb-4'>
                                <h6 className='text-uppercase fw-bold mb-4'>Contact</h6>
                                <p><MDBIcon icon="home" className="me-2"/> Dhaka, Bangladesh</p>
                                <p><MDBIcon icon="envelope" className="me-3"/> shuvra.dev9@gmail.com</p>
                                <p><MDBIcon icon="phone" className="me-3"/> +880 1829660540</p>
                            </MDBCol>
                        </MDBRow>
                    </MDBContainer>
                </section>

                <div className='text-center p-4' style={{backgroundColor: 'rgba(0, 0, 0, 0.05)'}}>
                    © {new Date().getFullYear()} Copyright:
                    <a className='text-reset fw-bold' href='https://yourwebsite.com/'>
                        Lanmnan AI
                    </a>
                </div>
            </MDBFooter>
        </div>
    );
}
