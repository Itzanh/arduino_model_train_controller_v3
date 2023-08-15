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
import Train from '../../MODELS/Trains/Train';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Paper, { PaperProps } from '@mui/material/Paper';
import Draggable from 'react-draggable';
import Form from 'react-bootstrap/Form';
import Grid from '@mui/material/Grid';
import InputGroup from 'react-bootstrap/InputGroup';
import OkAndErrorCodeReturn from '../../NETWORKING/OkAndErrorCodeReturn';
import AlertModal from '../AlertModal';
import { DataGrid } from '@mui/x-data-grid';
import ErrorModal from '../ErrorModal';



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



class TrainsProps {
    public insertTrain: (train: Train) => Promise<OkAndErrorCodeReturn>;
    public updateTrain: (train: Train) => Promise<OkAndErrorCodeReturn>;
    public deleteTrain: (train: Train) => Promise<OkAndErrorCodeReturn>;
}

function Trains(props: TrainsProps) {
    const trains = useSelector((state: RootState) => state.trains);

    const onAdd = () => {
        ReactDOM.unmountComponentAtNode(document.getElementById('renderModal'));
        ReactDOM.render(
            <TrainModal
                train={undefined}
                insertTrain={props.insertTrain}
                updateTrain={props.updateTrain}
                deleteTrain={props.deleteTrain}
            />,
            document.getElementById('renderModal'));
    }

    const onEdit = (train: Train) => {
        ReactDOM.unmountComponentAtNode(document.getElementById('renderModal'));
        ReactDOM.render(
            <TrainModal
                train={train}
                insertTrain={props.insertTrain}
                updateTrain={props.updateTrain}
                deleteTrain={props.deleteTrain}
            />,
            document.getElementById('renderModal'));
    }

    return <div id="trainsTab">
        <h4>{i18next.t('trains')}</h4>
        <div id="renderModal"></div>
        <Button onClick={onAdd} color="primary" variant="contained">{i18next.t('add')}</Button>
        <DataGrid
            autoHeight
            rows={trains}
            columns={[
                { field: 'id', headerName: i18next.t('id'), width: 150 },
                { field: 'name', headerName: i18next.t('name'), width: 500, flex: 1 },
                { field: 'speedSlow', headerName: i18next.t('speed-slow'), width: 150 },
                { field: 'speedHalf', headerName: i18next.t('speed-half'), width: 150 },
                { field: 'speedFast', headerName: i18next.t('speed-fast'), width: 150 },
                { field: 'online', headerName: i18next.t('online'), width: 100, type: 'boolean' },
            ]}
            onRowClick={(params) => {
                onEdit(params.row);
            }}
        />
    </div>
}

class TrainModalProps {
    public train: Train | undefined;
    public insertTrain: (train: Train) => Promise<OkAndErrorCodeReturn>;
    public updateTrain: (train: Train) => Promise<OkAndErrorCodeReturn>;
    public deleteTrain: (train: Train) => Promise<OkAndErrorCodeReturn>;
}

function TrainModal(props: TrainModalProps) {
    const [open, setOpen] = React.useState(true);

    const handleClose = () => {
        setOpen(false);
    };

    const name = React.createRef() as React.RefObject<HTMLInputElement>;
    const speedSlow = React.createRef() as React.RefObject<HTMLInputElement>;
    const speedHalf = React.createRef() as React.RefObject<HTMLInputElement>;
    const speedFast = React.createRef() as React.RefObject<HTMLInputElement>;

    const isValid = (train: Train): boolean => {
        if (train.name.length == 0) {
            ReactDOM.unmountComponentAtNode(document.getElementById('renderErrorModal'));
            ReactDOM.render(
                <AlertModal
                    title={i18next.t('invalid-data')}
                    description={i18next.t('you-must-enter-the-name-of-the-train')}
                />,
                document.getElementById('renderErrorModal'));
            return false;
        } else if (train.name.length > 50) {
            ReactDOM.unmountComponentAtNode(document.getElementById('renderErrorModal'));
            ReactDOM.render(
                <AlertModal
                    title={i18next.t('invalid-data')}
                    description={i18next.t('the-name-of-the-train-cant-be-longer-than-50-characters')}
                />,
                document.getElementById('renderErrorModal'));
            return false;
        } else if (train.speedSlow === 0 || train.speedHalf <= train.speedSlow || train.speedFast <= train.speedHalf || train.speedFast > 255) {
            ReactDOM.unmountComponentAtNode(document.getElementById('renderErrorModal'));
            ReactDOM.render(
                <AlertModal
                    title={i18next.t('invalid-data')}
                    description={i18next.t('the-speeds-of-the-train-must-match-the-following-formula')}
                />,
                document.getElementById('renderErrorModal'));
            return false;
        }
        return true;
    }

    const getTrainFromForm = (): Train => {
        const train = new Train({
            name: name.current.value,
            speedSlow: parseInt(speedSlow.current.value),
            speedHalf: parseInt(speedHalf.current.value),
            speedFast: parseInt(speedFast.current.value)
        });
        if (props.train !== undefined) {
            train.id = props.train.id;
        }
        return train;
    }

    const add = () => {
        const train = getTrainFromForm();
        if (!isValid(train)) {
            return;
        }

        props.insertTrain(train).then((result) => {
            if (result.ok) {
                handleClose();
            } else {
                showError(result);
            }
        });
    }

    const update = () => {
        const train = getTrainFromForm();
        if (!isValid(train)) {
            return;
        }

        props.updateTrain(train).then((result) => {
            if (result.ok) {
                handleClose();
            } else {
                showError(result);
            }
        });
    }

    const remove = () => {
        const train = new Train({
            id: props.train.id,
        });

        props.deleteTrain(train).then((result) => {
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
                {i18next.t('train')}
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {props.train === undefined ? null :
                        <Form.Group className="mb-3">
                            <Form.Label>{i18next.t('id')}</Form.Label>
                            <InputGroup className="mb-3">
                                <Form.Control type="number" placeholder={i18next.t('id')} defaultValue={props.train.id} disabled={true} />
                            </InputGroup>
                        </Form.Group>
                    }

                    <Form.Group className="mb-3">
                        <Form.Label>{i18next.t('name')}</Form.Label>
                        <Form.Control type="text" placeholder={i18next.t('name')} ref={name} maxLength={50}
                            defaultValue={props.train === undefined ? '' : props.train.name} />
                    </Form.Group>

                    <Grid container spacing={2}>
                        <Grid item xs={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>{i18next.t('speed-slow')}</Form.Label>
                                <Form.Control type="number" placeholder={i18next.t('speed-slow')} ref={speedSlow} min="1" max="255"
                                    defaultValue={props.train === undefined ? '1' : props.train.speedSlow} />
                            </Form.Group>
                        </Grid>
                        <Grid item xs={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>{i18next.t('speed-half')}</Form.Label>
                                <Form.Control type="number" placeholder={i18next.t('speed-half')} ref={speedHalf} min="1" max="255"
                                    defaultValue={props.train === undefined ? '128' : props.train.speedHalf} />
                            </Form.Group>
                        </Grid>
                        <Grid item xs={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>{i18next.t('speed-fast')}</Form.Label>
                                <Form.Control type="number" placeholder={i18next.t('speed-fast')} ref={speedFast} min="1" max="255"
                                    defaultValue={props.train === undefined ? '255' : props.train.speedFast} />
                            </Form.Group>
                        </Grid>
                    </Grid>

                    {props.train === undefined ? null :
                        <Form.Group className="mb-3">
                            <Form.Label>{i18next.t('access-key')}</Form.Label>
                            <InputGroup className="mb-3">
                                <Form.Control type="number" placeholder={i18next.t('access-key')} defaultValue={props.train.accessKey} disabled={true} />
                            </InputGroup>
                        </Form.Group>
                    }
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>{i18next.t('close')}</Button>
                {props.train === undefined ? <Button color="primary" variant="contained" onClick={add}>{i18next.t('add')}</Button> : null}
                {props.train === undefined ? null : <Button color="success" variant="contained" onClick={update}>{i18next.t('update')}</Button>}
                {props.train === undefined ? null : <Button color="error" variant="contained" onClick={remove}>{i18next.t('delete')}</Button>}
            </DialogActions>
        </Dialog>
    </div>
}



export default Trains;
