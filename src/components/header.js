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
                            src="https://cascadiaquakes.org/wp-content/uploads/2023/10/Crescent-Logos-Horizontal-White-230x62.png"
                            alt="Cascadia Quakes Logo"
                            style={{ maxWidth: '100%', height: 'auto' }}
                        />
                    </Navbar.Brand>
                    <Nav.Link href="https://www.nsf.gov">
                        <img
                            src="https://new.nsf.gov/themes/custom/nsf_theme/components/sdc-components/molecules/logo/logo-desktop.svg"
                            alt="NSF Logo"
                            style={{width: '40%', height: 'auto'}}
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