/*
This file is part of Arduino Model Train Controller V3 (https://github.com/Itzanh/arduino_model_train_controller_v3).

Arduino Model Train Controller V3 is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3 of the License.

Model Train Controller is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with Model Train Controller. If not, see <https://www.gnu.org/licenses/>.
*/

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import i18next from 'i18next';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Paper, { PaperProps } from '@mui/material/Paper';
import Draggable from 'react-draggable';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import OkAndErrorCodeReturn from '../../NETWORKING/OkAndErrorCodeReturn';
import AlertModal from '../AlertModal';
import { DataGrid } from '@mui/x-data-grid';
import ErrorModal from '../ErrorModal';
import Stretch from '../../MODELS/Stretches/Stretch';
import StretchType from '../../MODELS/Stretches/StretchType';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';



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



class StretchesProps {
    public insertStretch: (stretch: Stretch) => Promise<OkAndErrorCodeReturn>;
    public updateStretch: (stretch: Stretch) => Promise<OkAndErrorCodeReturn>;
    public deleteStretch: (stretch: Stretch) => Promise<OkAndErrorCodeReturn>;
}

function Stretches(props: StretchesProps) {
    const stretches = useSelector((state: RootState) => state.stretches);

    const onAdd = () => {
        ReactDOM.unmountComponentAtNode(document.getElementById('renderModal'));
        ReactDOM.render(
            <StretchesModal
                stretch={undefined}
                insertStretch={props.insertStretch}
                updateStretch={props.updateStretch}
                deleteStretch={props.deleteStretch}
            />,
            document.getElementById('renderModal'));
    }

    const onEdit = (stretch: Stretch) => {
        ReactDOM.unmountComponentAtNode(document.getElementById('renderModal'));
        ReactDOM.render(
            <StretchesModal
                stretch={stretch}
                insertStretch={props.insertStretch}
                updateStretch={props.updateStretch}
                deleteStretch={props.deleteStretch}
            />,
            document.getElementById('renderModal'));
    }

    return <div id="stretchesTab">
        <h4>{i18next.t('stretches')}</h4>
        <div id="renderModal"></div>
        <Button onClick={onAdd} color="primary" variant="contained">{i18next.t('add')}</Button>
        <DataGrid
            autoHeight
            rows={stretches}
            columns={[
                { field: 'id', headerName: i18next.t('id'), width: 150 },
                { field: 'name', headerName: i18next.t('name'), width: 500, flex: 1 },
                { field: 'type', headerName: i18next.t('type'), width: 300, valueGetter: (e) => i18next.t(e.row.typeToString()) },
            ]}
            onRowClick={(params) => {
                onEdit(params.row);
            }}
        />
    </div>
}

class StretchesModalProps {
    public stretch: Stretch | undefined;
    public insertStretch: (stretch: Stretch) => Promise<OkAndErrorCodeReturn>;
    public updateStretch: (stretch: Stretch) => Promise<OkAndErrorCodeReturn>;
    public deleteStretch: (stretch: Stretch) => Promise<OkAndErrorCodeReturn>;
}

function StretchesModal(props: StretchesModalProps) {
    const [open, setOpen] = React.useState(true);

    const handleClose = () => {
        setOpen(false);
    };

    const name = React.createRef() as React.RefObject<HTMLInputElement>;
    const type = React.createRef() as React.RefObject<HTMLSelectElement>;

    const isValid = (stretch: Stretch): boolean => {
        if (stretch.name.length == 0) {
            ReactDOM.unmountComponentAtNode(document.getElementById('renderErrorModal'));
            ReactDOM.render(
                <AlertModal
                    title={i18next.t('invalid-data')}
                    description={i18next.t('you-must-enter-the-name-of-the-stretch')}
                />,
                document.getElementById('renderErrorModal'));
            return false;
        } else if (stretch.name.length > 50) {
            ReactDOM.unmountComponentAtNode(document.getElementById('renderErrorModal'));
            ReactDOM.render(
                <AlertModal
                    title={i18next.t('invalid-data')}
                    description={i18next.t('the-name-of-the-stretch-cant-be-longer-than-50-characters')}
                />,
                document.getElementById('renderErrorModal'));
            return false;
        }
        return true;
    }

    const getStretchFromForm = (): Stretch => {
        const stretch = new Stretch({
            name: name.current.value,
            type: parseInt(type.current.value)
        });
        if (props.stretch !== undefined) {
            stretch.id = props.stretch.id;
        }
        return stretch;
    }

    const add = () => {
        const stretch = getStretchFromForm();
        if (!isValid(stretch)) {
            return;
        }

        props.insertStretch(stretch).then((result) => {
            if (result.ok) {
                handleClose();
            } else {
                showError(result);
            }
        });
    }

    const update = () => {
        const stretch = getStretchFromForm();
        if (!isValid(stretch)) {
            return;
        }

        props.updateStretch(stretch).then((result) => {
            if (result.ok) {
                handleClose();
            } else {
                showError(result);
            }
        });
    }

    const remove = () => {
        const stretch = new Stretch({
            id: props.stretch.id,
        });

        props.deleteStretch(stretch).then((result) => {
            if (result.ok) {
                handleClose();
            } else {
                showError(result);
            }
        });
    }

    const showError = (result: OkAndErrorCodeReturn) => {
        ReactDOM.unmountComponentAtNode(document.getElementById('renderErrorModal'));
        ReactDOM.render(
            <ErrorModal
                okAndErrorCodeReturn={result}
            />,
            document.getElementById('renderErrorModal'));
    }

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
                {i18next.t('stretch')}
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {props.stretch === undefined ? null :
                        <Form.Group className="mb-3">
                            <Form.Label>{i18next.t('id')}</Form.Label>
                            <InputGroup className="mb-3">
                                <Form.Control type="text" placeholder={i18next.t('id')} defaultValue={props.stretch.id} disabled={true} />
                            </InputGroup>
                        </Form.Group>
                    }

                    <Form.Group className="mb-3">
                        <Form.Label>{i18next.t('name')}</Form.Label>
                        <Form.Control type="text" placeholder={i18next.t('name')} ref={name} maxLength={50}
                            defaultValue={props.stretch === undefined ? '' : props.stretch.name} />
                    </Form.Group>

                    <FormControl fullWidth>
                        <InputLabel>{i18next.t('type')}</InputLabel>
                        <Select
                            inputRef={type}
                            value={props.stretch === undefined ? StretchType.OneWaySingleTrack : props.stretch.type}
                            label={i18next.t('type')}
                        >
                            <MenuItem value={StretchType.OneWaySingleTrack}>{i18next.t('one-way-single-track')}</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>{i18next.t('close')}</Button>
                {props.stretch === undefined ? <Button color="primary" variant="contained" onClick={add}>{i18next.t('add')}</Button> : null}
                {props.stretch === undefined ? null : <Button color="success" variant="contained" onClick={update}>{i18next.t('update')}</Button>}
                {props.stretch === undefined ? null : <Button color="error" variant="contained" onClick={remove}>{i18next.t('delete')}</Button>}
            </DialogActions>
        </Dialog>
    </div>
}



export default Stretches;
