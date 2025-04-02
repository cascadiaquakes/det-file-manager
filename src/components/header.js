import React from 'react';
import {Navbar, Container, Nav, Button} from 'react-bootstrap';

function Header({signOut, user}) {
    const userEmail = user?.email || '';
    return (
        <Navbar expand="lg" style={{ backgroundColor: '#26505A', padding: '10px 20px' }}>
            <Container fluid>
                {/* Left: Logos */}
                <div className="d-flex align-items-center">
                    <Navbar.Brand href="https://cascadiaquakes.org/">
                        <img
                            src="/Crescent_Logo.png"
                            alt="Cascadia Quakes Logo"
                            style={{ height: '60px' }}
                        />
                    </Navbar.Brand>
                    <Nav.Link href="https://www.nsf.gov">
                        <img
                            src="/USNSF_Logo.png"
                            alt="NSF Logo"
                            style={{height: '90px'}}
                        />
                    </Nav.Link>
                </div>

                {/* Center: Title */}
                <Nav className="d-none d-lg-flex mx-auto align-items-center">
                    <h1 style={{color: 'white', margin: 0, fontSize: '1.5rem'}}>
                        DET Benchmark Uploader
                    </h1>
                </Nav>

                {/* Right: User Email and Sign out Button */}
                <div className="d-flex flex-column align-items-start">
                    {userEmail && (
                        <span style={{ color: 'white', marginBottom: '8px', fontSize: '0.9rem' }}>
                            Logged in as: {userEmail}
                        </span>
                    )}
                    <Button variant="primary" onClick={signOut}>
                        Sign out
                    </Button>
                </div>
            </Container>
        </Navbar>
    );
}

export default Header;