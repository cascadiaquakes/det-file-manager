import React from 'react';
import { Navbar, Container, Nav } from 'react-bootstrap';

function Header() {
    return (
        <Navbar expand="lg" style={{ backgroundColor: '#26505A' }} >
            <Container>
                <Navbar.Brand href="https://cascadiaquakes.org/">
                     <img
                        src="https://cascadiaquakes.org/wp-content/uploads/2023/10/Crescent-Logos-Horizontal-White-230x62.png"
                        alt="Cascadia Quakes Logo"
                        style={{ maxWidth: '100%', height: 'auto' }}
                    />
                </Navbar.Brand>
                <Nav className="mx-auto d-flex align-items-center">
                    <h1 style={{ color: 'white', margin: '0' }}>DET Benchmark Uploader</h1>
                </Nav>
                    <Nav.Link href="https://www.nsf.gov">
                        <img
                            src="https://new.nsf.gov/themes/custom/nsf_theme/components/sdc-components/molecules/logo/logo-desktop.svg"
                            alt="NSF Logo"
                            style={{ width: '40%', height: 'auto' }}
                        />
                    </Nav.Link>
            </Container>
        </Navbar>
    );
}

export default Header;
