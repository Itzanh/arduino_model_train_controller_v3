/*
This file is part of Arduino Model Train Controller V3 (https://github.com/Itzanh/arduino_model_train_controller_v3).

Arduino Model Train Controller V3 is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3 of the License.

Model Train Controller is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with Model Train Controller. If not, see <https://www.gnu.org/licenses/>.
*/

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import i18next from 'i18next';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import Signal from '../../MODELS/Signals/Signal';
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
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { store } from './../../redux/store';
import { Provider } from 'react-redux';
import SignalView from '../../MODELS/Signals/SignalView';



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



class SignalsProps {
    public insertSignal: (signal: Signal) => Promise<OkAndErrorCodeReturn>;
    public updateSignal: (signal: Signal) => Promise<OkAndErrorCodeReturn>;
    public deleteSignal: (signal: Signal) => Promise<OkAndErrorCodeReturn>;
}

function Signals(props: SignalsProps) {
    const originalSignals = useSelector((state: RootState) => state.signals);
    console.log(originalSignals);
    // Copy
    const signals = originalSignals.map((signal) => {
        const newSignal = new SignalView(signal);
        return newSignal;
    });
    const stretches = useSelector((state: RootState) => state.stretches);

    const onAdd = () => {
        ReactDOM.unmountComponentAtNode(document.getElementById('renderModal'));
        ReactDOM.render(
            <Provider store={store}>
                <SignalsModal
                    signal={undefined}
                    insertSignal={props.insertSignal}
                    updateSignal={props.updateSignal}
                    deleteSignal={props.deleteSignal}
                />
            </Provider>,
            document.getElementById('renderModal'));
    }

    const onEdit = (signal: Signal) => {
        ReactDOM.unmountComponentAtNode(document.getElementById('renderModal'));
        ReactDOM.render(
            <Provider store={store}>
                <SignalsModal
                    signal={signal}
                    insertSignal={props.insertSignal}
                    updateSignal={props.updateSignal}
                    deleteSignal={props.deleteSignal}
                />
            </Provider>,
            document.getElementById('renderModal'));
    }

    return <div id="signalsTab">
        <h4>{i18next.t('signals')}</h4>
        <div id="renderModal"></div>
        <Button onClick={onAdd} color="primary" variant="contained">{i18next.t('add')}</Button>
        <DataGrid
            autoHeight
            rows={signals}
            columns={[
                { field: 'onlyId', headerName: i18next.t('id'), width: 150 },
                {
                    field: '', headerName: i18next.t('stretch'), width: 150, valueGetter: (e) =>
                        stretches.filter((stretch) => {
                            return stretch.id === e.row.stretchId;
                        })[0].name
                },
                { field: 'name', headerName: i18next.t('name'), width: 500, flex: 1 },
                { field: 'aspect', headerName: i18next.t('aspect'), width: 300, valueGetter: (e) => i18next.t(e.row.aspectToString()) },
                {
                    field: 'speedLimit', headerName: i18next.t('speed-limit'), width: 150, valueGetter: (e) => {
                        switch (e.row.speedLimit) {
                            case 0: {
                                return i18next.t('slow');
                            }
                            case 1: {
                                return i18next.t('half');
                            }
                            case 2: {
                                return i18next.t('fast');
                            }
                        }
                    }
                },
                { field: 'switch', headerName: i18next.t('switch'), width: 100, type: 'boolean' },
                { field: 'loopsBack', headerName: i18next.t('loops-back'), width: 100, type: 'boolean' },
            ]}
            onRowClick={(params) => {
                onEdit(originalSignals.filter((originalSignal) => {
                    return (originalSignal.stretchId === params.row.stretchId) && (originalSignal.id === params.row.onlyId);
                })[0]);
            }}
        />
    </div>
}

class SignalsModalProps {
    public signal: Signal | undefined;
    public insertSignal: (signal: Signal) => Promise<OkAndErrorCodeReturn>;
    public updateSignal: (signal: Signal) => Promise<OkAndErrorCodeReturn>;
    public deleteSignal: (signal: Signal) => Promise<OkAndErrorCodeReturn>;
}

function SignalsModal(props: SignalsModalProps) {
    const [open, setOpen] = React.useState(true);
    const [isSwitch, setSwitch] = React.useState(props.signal === undefined ? false : props.signal.switch);
    const [splitter, setSplitter] = React.useState(props.signal === undefined ? false : (props.signal.splitter === null ? false : props.signal.splitter));
    const [loopsBack, setLoopsBack] = React.useState(props.signal === undefined ? false : props.signal.loopsBack);
    const stretches = useSelector((state: RootState) => state.stretches);

    const handleClose = () => {
        setOpen(false);
    };

    const stretchId = React.createRef() as React.RefObject<HTMLInputElement>;
    const name = React.createRef() as React.RefObject<HTMLInputElement>;
    const speedLimit = React.createRef() as React.RefObject<HTMLInputElement>;
    const stretchDetourId = React.createRef() as React.RefObject<HTMLInputElement>;
    const signalDetourId = React.createRef() as React.RefObject<HTMLInputElement>;
    const stretchLoopBackId = React.createRef() as React.RefObject<HTMLInputElement>;
    const signalLoopBackId = React.createRef() as React.RefObject<HTMLInputElement>;

    const isValid = (signal: Signal): boolean => {
        if (signal.name.length == 0) {
            ReactDOM.unmountComponentAtNode(document.getElementById('renderErrorModal'));
            ReactDOM.render(
                <AlertModal
                    title={i18next.t('invalid-data')}
                    description={i18next.t('you-must-enter-the-name-of-the-signal')}
                />,
                document.getElementById('renderErrorModal'));
            return false;
        } else if (signal.name.length > 50) {
            ReactDOM.unmountComponentAtNode(document.getElementById('renderErrorModal'));
            ReactDOM.render(
                <AlertModal
                    title={i18next.t('invalid-data')}
                    description={i18next.t('the-name-of-the-signal-cant-be-longer-than-50-characters')}
                />,
                document.getElementById('renderErrorModal'));
            return false;
        }
        return true;
    }

    const getsignalFromForm = (): Signal => {
        const signal = new Signal({
            stretchId: stretchId.current.value,
            name: name.current.value,
            speedLimit: parseInt(speedLimit.current.value),
            switch: isSwitch,
            loopsBack: loopsBack,
        });
        if (props.signal !== undefined) {
            signal.stretchId = props.signal.stretchId;
            signal.id = props.signal.id;
        }
        if (isSwitch) {
            signal.splitter = splitter;
            signal.stretchDetourId = parseInt(stretchDetourId.current.value);
            signal.signalDetourId = parseInt(signalDetourId.current.value);
        }
        if (loopsBack) {
            signal.stretchLoopBackId = parseInt(stretchLoopBackId.current.value);
            signal.signalLoopBackId = parseInt(signalLoopBackId.current.value);
        }
        return signal;
    }

    const add = () => {
        const signal = getsignalFromForm();
        if (!isValid(signal)) {
            return;
        }

        props.insertSignal(signal).then((result) => {
            if (result.ok) {
                handleClose();
            } else {
                showError(result);
            }
        });
    }

    const update = () => {
        const signal = getsignalFromForm();
        if (!isValid(signal)) {
            return;
        }

        props.updateSignal(signal).then((result) => {
            if (result.ok) {
                handleClose();
            } else {
                showError(result);
            }
        });
    }

    const remove = () => {
        const signal = new Signal({
            id: props.signal.id,
        });

        props.deleteSignal(signal).then((result) => {
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
                {i18next.t('signal')}
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {props.signal === undefined ? null :
                        <Form.Group className="mb-3">
                            <Form.Label>{i18next.t('id')}</Form.Label>
                            <InputGroup className="mb-3">
                                <Form.Control type="text" placeholder={i18next.t('id')} defaultValue={props.signal.id} disabled={true} />
                            </InputGroup>
                        </Form.Group>
                    }

                    <FormControl fullWidth>
                        <InputLabel>{i18next.t('stretch')}</InputLabel>
                        <Select
                            inputRef={stretchId}
                            defaultValue={props.signal === undefined ? 0 : props.signal.stretchId}
                            label={i18next.t('stretch')}
                            disabled={props.signal !== undefined}
                        >
                            {stretches.map((element, i) => {
                                return <MenuItem value={element.id} key={i}>{element.name}</MenuItem>
                            })}
                        </Select>
                    </FormControl>

                    <Form.Group className="mb-3">
                        <Form.Label>{i18next.t('name')}</Form.Label>
                        <Form.Control type="text" placeholder={i18next.t('name')} ref={name} maxLength={50}
                            defaultValue={props.signal === undefined ? '' : props.signal.name} />
                    </Form.Group>

                    <FormControl fullWidth>
                        <InputLabel>{i18next.t('speed-limit')}</InputLabel>
                        <Select
                            inputRef={speedLimit}
                            defaultValue={props.signal === undefined ? 2 : props.signal.speedLimit}
                            label={i18next.t('speed-limit')}
                        >
                            <MenuItem value={0} key={0}>{i18next.t('speed-slow')}</MenuItem>
                            <MenuItem value={1} key={1}>{i18next.t('speed-half')}</MenuItem>
                            <MenuItem value={2} key={2}>{i18next.t('speed-fast')}</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControlLabel control={
                        <Checkbox checked={isSwitch} onChange={(e) => {
                            setSwitch(e.target.checked);
                        }} />
                    } label={i18next.t('switch')} />

                    {!isSwitch ? null :
                        <div>
                            <FormControlLabel control={
                                <Checkbox checked={splitter} onChange={(e) => {
                                    setSplitter(e.target.checked);
                                }} />
                            } label={i18next.t('splitter')} />

                            <Form.Group className="mb-3">
                                <Form.Label>{i18next.t('stretch')}</Form.Label>
                                <Form.Control type="number" placeholder={i18next.t('stretch')} ref={stretchDetourId}
                                    defaultValue={props.signal === undefined ? '' : props.signal.stretchDetourId} />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>{i18next.t('signal')}</Form.Label>
                                <Form.Control type="number" placeholder={i18next.t('signal')} ref={signalDetourId}
                                    defaultValue={props.signal === undefined ? '' : props.signal.signalDetourId} />
                            </Form.Group>
                        </div>
                    }

                    <FormControlLabel control={
                        <Checkbox checked={loopsBack} onChange={(e) => {
                            setLoopsBack(e.target.checked);
                        }} />
                    } label={i18next.t('loops-back')} />

                    {!loopsBack ? null :
                        <div>
                            <Form.Group className="mb-3">
                                <Form.Label>{i18next.t('stretch')}</Form.Label>
                                <Form.Control type="number" placeholder={i18next.t('stretch')} ref={stretchLoopBackId}
                                    defaultValue={props.signal === undefined ? '' : props.signal.stretchLoopBackId} />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>{i18next.t('signal')}</Form.Label>
                                <Form.Control type="number" placeholder={i18next.t('signal')} ref={signalLoopBackId}
                                    defaultValue={props.signal === undefined ? '' : props.signal.signalLoopBackId} />
                            </Form.Group>
                        </div>
                    }
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>{i18next.t('close')}</Button>
                {props.signal === undefined ? <Button color="primary" variant="contained" onClick={add}>{i18next.t('add')}</Button> : null}
                {props.signal === undefined ? null : <Button color="success" variant="contained" onClick={update}>{i18next.t('update')}</Button>}
                {props.signal === undefined ? null : <Button color="error" variant="contained" onClick={remove}>{i18next.t('delete')}</Button>}
            </DialogActions>
        </Dialog>
    </div>
}



export default Signals;
