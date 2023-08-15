/*
This file is part of Arduino Model Train Controller V3 (https://github.com/Itzanh/arduino_model_train_controller_v3).

Arduino Model Train Controller V3 is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3 of the License.

Model Train Controller is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with Model Train Controller. If not, see <https://www.gnu.org/licenses/>.
*/

import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Paper, { PaperProps } from '@mui/material/Paper';
import Draggable from 'react-draggable';
import i18next from 'i18next';



function PaperComponent(props: PaperProps) {
    return (
        <Draggable
            handle="#draggable-dialog-title"
            cancel={'[class*="MuiDialogContent-root"]'}
        >
            <Paper {...props} />
        </Draggable>
    );
}



function AboutModal() {
    const [open, setOpen] = React.useState(true);

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <div>
            <Dialog
                open={open}
                onClose={handleClose}
                PaperComponent={PaperComponent}
                aria-labelledby="draggable-dialog-title"
            >
                <DialogTitle style={{ cursor: 'move' }} id="draggable-dialog-title">
                    Arduino Model Train Cotroller v3
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        <p>Arduino Model Train Controller is a program that controls model trains and adds full remote train traffic control: zone blocking, control of the switches, and manual control of the trains. This program focuses on controlling basic model trains modified by adding an Arduino Nano or similar flashed with this software to give the Arduino full control of the model train. This would allow the user to have the full functionality of a remote-controller rail-powered model train in a basic battery-powered model train with no remote control capabilities built-in that has been modified with this software.</p>
                        <p>You can find this software in its official <a href="https://github.com/Itzanh/arduino_model_train_controller_v3">GitHub repository</a>.</p>

                        <h5>{i18next.t('license')}</h5>
                        <p>This software is distributed under the GNU AGPL license <a href="https://spdx.org/licenses/AGPL-3.0-only.html">GNU AGPL v3.0-only</a>.</p>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>{i18next.t('close')}</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}



export default AboutModal;
