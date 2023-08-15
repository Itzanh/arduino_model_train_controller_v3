/*
This file is part of Arduino Model Train Controller V3 (https://github.com/Itzanh/arduino_model_train_controller_v3).

Arduino Model Train Controller V3 is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3 of the License.

Model Train Controller is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with Model Train Controller. If not, see <https://www.gnu.org/licenses/>.
*/

import ReactDOM from 'react-dom';
import i18next from 'i18next';

import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import AboutModal from './AboutModal';



class MenuProps {
    public controlsTab: () => void;
    public trainsTab: () => void;
    public stretchesTab: () => void;
    public signalsTab: () => void;
}

function Menu(props: MenuProps) {
    const onControlsTab = () => {
        props.controlsTab();
    }

    const onTrainsTab = () => {
        props.trainsTab();
    }

    const onStrechesTab = () => {
        props.stretchesTab();
    }

    const onSignalsTab = () => {
        props.signalsTab();
    }

    const onAboutModal = () => {
        ReactDOM.unmountComponentAtNode(document.getElementById('renderAboutModal'));
        ReactDOM.render(
            <AboutModal

            />,
            document.getElementById('renderAboutModal'));
    }

    return <div>
        <Navbar bg="dark" variant="dark">
            <Container>
                <Navbar.Brand href="#home">Model Train Controller</Navbar.Brand>
                <Nav className="me-auto">
                    <Nav.Link onClick={onControlsTab}>{i18next.t('controls')}</Nav.Link>
                    <Nav.Link onClick={onTrainsTab}>{i18next.t('trains')}</Nav.Link>
                    <Nav.Link onClick={onStrechesTab}>{i18next.t('stretches')}</Nav.Link>
                    <Nav.Link onClick={onSignalsTab}>{i18next.t('signals')}</Nav.Link>
                    <Nav.Link onClick={onAboutModal}>{i18next.t('about')}</Nav.Link>
                </Nav>
            </Container>
        </Navbar>
        <div id="renderAboutModal" className="p-1"></div>
        <div id="renderTab" className="p-1"></div>
    </div>
}



export default Menu;
