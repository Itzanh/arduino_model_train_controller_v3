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
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { DataGrid } from '@mui/x-data-grid';
import Signal from '../../MODELS/Signals/Signal';



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




class SelectSignalProps {
    public handleSelect: (signal: Signal) => void;
}

function SelectSignal(props: SelectSignalProps) {
    const allSignals = useSelector((state: RootState) => state.signals);
    const [signals, setSignals] = React.useState(allSignals);
    const [open, setOpen] = React.useState(true);
    const searchField = React.createRef() as React.RefObject<HTMLInputElement>;

    const handleClose = () => {
        setOpen(false);
    };

    const search = () => {
        setSignals(allSignals.filter((element: Signal) => {
            return element.id.toString().indexOf(searchField.current.value) > -1;
        }));
    };

    const select = () => {
        if (signals.length === 0) {
            return;
        }
        props.handleSelect(signals[0]);
        handleClose();
    };

    const selectRow = (signal: Signal) => {
        props.handleSelect(signal);
        handleClose();
    };

    return <div>
        <div id="renderErrorModal"></div>
        <Dialog
            open={open}
            onClose={handleClose}
            PaperComponent={PaperComponent}
            aria-labelledby="draggable-dialog-title"
            fullWidth
            maxWidth="sm"
        >
            <DialogTitle style={{ cursor: 'move' }} id="draggable-dialog-title">
                {i18next.t('signal')}
            </DialogTitle>
            <DialogContent>
                <Form.Group className="mb-3">
                    <Form.Label>{i18next.t('name')}</Form.Label>
                    <Form.Control type="text" placeholder={i18next.t('name')} ref={searchField} maxLength={50} onChange={search} autoFocus={true} />
                </Form.Group>

                <DataGrid
                    autoHeight
                    rows={signals}
                    columns={[
                        { field: 'id', headerName: i18next.t('id'), width: 360 },
                        { field: 'name', headerName: i18next.t('name'), width: 500, flex: 1 },
                    ]}
                    onRowClick={(params) => {
                        selectRow(params.row);
                    }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>{i18next.t('close')}</Button>
                <Button color="primary" variant="contained" onClick={select}>{i18next.t('select')}</Button>
            </DialogActions>
        </Dialog>
    </div>
}



export default SelectSignal;
