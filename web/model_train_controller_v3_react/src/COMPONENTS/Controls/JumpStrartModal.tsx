/*
This file is part of Arduino Model Train Controller V3 (https://github.com/Itzanh/arduino_model_train_controller_v3).

Arduino Model Train Controller V3 is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3 of the License.

Model Train Controller is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with Model Train Controller. If not, see <https://www.gnu.org/licenses/>.
*/

import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Paper, { PaperProps } from '@mui/material/Paper';
import Draggable from 'react-draggable';
import i18next from 'i18next';
import { Form } from 'react-bootstrap';
import Train from '../../MODELS/Trains/Train';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';



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



class JumpStrartModalProps {
    public train: Train;
    public onAccept: (stretchId: number, signalId: number) => void;
}

function JumpStrartModal(props: JumpStrartModalProps) {
    const [open, setOpen] = React.useState(true);

    const stretchId = React.createRef() as React.RefObject<HTMLInputElement>;
    const signalId = React.createRef() as React.RefObject<HTMLInputElement>;

    const handleClose = () => {
        setOpen(false);
    };

    const handleAccept = () => {
        props.onAccept(parseInt(stretchId.current.value), parseInt(signalId.current.value));
        handleClose();
    }

    return <Dialog
        open={open}
        onClose={handleClose}
        PaperComponent={PaperComponent}
        aria-labelledby="draggable-dialog-title"
        fullWidth
        maxWidth="sm"
    >
        <DialogTitle style={{ cursor: 'move' }} id="draggable-dialog-title">
            {i18next.t('set-train-speed')}
        </DialogTitle>
        <DialogContent>
            <Form.Group className="mb-3">
                <Form.Label>{i18next.t('stretch')}</Form.Label>
                <Form.Control type="number" placeholder={i18next.t('stretch')} ref={stretchId} />
            </Form.Group>
            <Form.Group className="mb-3">
                <Form.Label>{i18next.t('signal')}</Form.Label>
                <Form.Control type="number" placeholder={i18next.t('signal')} ref={signalId} />
            </Form.Group>
        </DialogContent>
        <DialogActions>
            <Button onClick={handleClose}>{i18next.t('close')}</Button>
            <Button onClick={handleAccept} color="primary" variant="contained">{i18next.t('ok')}</Button>
        </DialogActions>
    </Dialog>
}



export default JumpStrartModal;
