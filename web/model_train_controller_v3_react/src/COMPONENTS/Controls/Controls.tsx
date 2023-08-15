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
import OkAndErrorCodeReturn from '../../NETWORKING/OkAndErrorCodeReturn';
import ManuallyJumpStartTrain from '../../MODELS/ManuallyJumpStartTrain';
import ManuallyStopTrainAtSignal from '../../MODELS/ManuallyStopTrainAtSignal';
import JumpStrartModal from './JumpStrartModal';
import { DataGrid } from '@mui/x-data-grid';
import Button from '@mui/material/Button';
import ErrorModal from '../ErrorModal';
import SelectSignal from '../Signals/SelectSignal';
import Signal from '../../MODELS/Signals/Signal';
import { store } from './../../redux/store';
import { Provider } from 'react-redux';
import Train from '../../MODELS/Trains/Train';
import SignalId from '../../MODELS/Signals/SignalId';
import SignalView from '../../MODELS/Signals/SignalView';



class ControlsProps {
    public manuallyJumpStartTrain: (manuallyJumpStartTrain: ManuallyJumpStartTrain) => Promise<OkAndErrorCodeReturn>;
    public manuallyStopTrain: (trainID: number) => Promise<OkAndErrorCodeReturn>;
    public manuallyStopTrainAtSignal: (manuallyStopTrainAtSignal: ManuallyStopTrainAtSignal) => Promise<OkAndErrorCodeReturn>;
    public cancelManuallyStopTrainAtSignal: (trainID: number) => Promise<OkAndErrorCodeReturn>;
    public switchPassthrough: (signalId: SignalId) => Promise<OkAndErrorCodeReturn>;
    public switchDetour: (signalId: SignalId) => Promise<OkAndErrorCodeReturn>;
    public forceRed: (signalId: SignalId) => Promise<OkAndErrorCodeReturn>;
    public unforceRed: (signalId: SignalId) => Promise<OkAndErrorCodeReturn>;
}

function Controls(props: ControlsProps) {
    const trains = useSelector((state: RootState) => state.trains);
    const signals = useSelector((state: RootState) => state.signals);
    const stretches = useSelector((state: RootState) => state.stretches);

    const manuallyStart = (train: Train) => {
        ReactDOM.unmountComponentAtNode(document.getElementById('renderModal'));
        ReactDOM.render(
            <JumpStrartModal
                train={train}
                onAccept={(stretchId: number, signalId: number) => {
                    props.manuallyJumpStartTrain(new ManuallyJumpStartTrain(train.id, stretchId, signalId)).then((okOrErr) => {
                        if (!okOrErr.ok) {
                            ReactDOM.unmountComponentAtNode(document.getElementById('renderModal'));
                            ReactDOM.render(
                                <ErrorModal
                                    okAndErrorCodeReturn={okOrErr}
                                />,
                                document.getElementById('renderModal'));
                        }
                    });
                }}
            />,
            document.getElementById('renderModal'));
    };

    const manuallyStop = (trainID: number) => {
        props.manuallyStopTrain(trainID).then((okOrErr) => {
            if (!okOrErr.ok) {
                ReactDOM.unmountComponentAtNode(document.getElementById('renderModal'));
                ReactDOM.render(
                    <ErrorModal
                        okAndErrorCodeReturn={okOrErr}
                    />,
                    document.getElementById('renderModal'));
            }
        });
    };

    const manuallyStopAtSignal = (trainID: number) => {
        ReactDOM.unmountComponentAtNode(document.getElementById('renderModal'));
        ReactDOM.render(
            <Provider store={store}>
                <SelectSignal
                    handleSelect={(signal: Signal) => {
                        props.manuallyStopTrainAtSignal(new ManuallyStopTrainAtSignal(trainID, signal.stretchId, signal.id)).then((okOrErr) => {
                            if (!okOrErr.ok) {
                                ReactDOM.unmountComponentAtNode(document.getElementById('renderModal'));
                                ReactDOM.render(
                                    <ErrorModal
                                        okAndErrorCodeReturn={okOrErr}
                                    />,
                                    document.getElementById('renderModal'));
                            }
                        });
                    }}
                />
            </Provider>,
            document.getElementById('renderModal'));
    }

    return <div id="controlsTab">
        <div id="renderModal"></div>
        <h4>{i18next.t('trains')}</h4>
        <DataGrid
            autoHeight
            rows={trains}
            columns={[
                { field: 'id', headerName: i18next.t('id'), width: 100 },
                { field: 'name', headerName: i18next.t('name'), width: 500, flex: 1 },
                { field: 'online', headerName: i18next.t('online'), width: 100, type: 'boolean' },
                {
                    field: 'lastSignal', headerName: i18next.t('last-signal'), width: 200,
                    valueGetter: (params) => params.row.lastSignal === null ? '' : params.row.lastSignal.name
                },
                {
                    field: 'lastSignalPassedAspect', headerName: i18next.t('last-signal-aspect'), width: 200,
                    valueGetter: (params) => params.row.lastSignalPassedAspect === null ? '' : params.row.aspectToString()
                },
                { field: 'started', headerName: i18next.t('started'), width: 100, type: 'boolean' },
                {
                    field: '#1', headerName: i18next.t('manual'), width: 200, renderCell: (params) => {
                        if (params.row.started) {
                            return <Button variant="contained" onClick={() => {
                                manuallyStop(params.row.id);
                            }}>{i18next.t('manually-stop')}</Button>
                        } else {
                            return <Button variant="contained" onClick={() => {
                                manuallyStart(params.row);
                            }}>{i18next.t('manually-start')}</Button>
                        }
                    }
                },
                {
                    field: '#2', headerName: i18next.t('manual'), width: 260, renderCell: (params) => {
                        if (params.row.started) {
                            if (params.row.signalToStopAt !== null) {
                                return <div>
                                    <p style={{ 'display': 'inline', 'marginRight': '20px' }}>{params.row.signalToStopAt.id}</p>
                                    <Button variant="contained" onClick={() => {
                                        props.cancelManuallyStopTrainAtSignal(params.row.id);
                                    }}>{i18next.t('cancel')}</Button>
                                </div>;
                            }
                            return <Button variant="contained" onClick={() => {
                                manuallyStopAtSignal(params.row.id);
                            }}>{i18next.t('manually-stop-at-signal')}</Button>
                        } else {
                            return null;
                        }
                    }
                },
            ]}
        />
        <h4>{i18next.t('signals')}</h4>
        <DataGrid
            autoHeight
            rows={signals.map((element) => {
                const signal = new SignalView(element);
                return signal;
            })}
            columns={[
                { field: 'onlyId', headerName: i18next.t('id'), width: 100 },
                {
                    field: 'stretch-name', headerName: i18next.t('stretch'), width: 150, valueGetter: (e) =>
                        stretches.filter((stretch) => {
                            return stretch.id === e.row.stretchId;
                        })[0].name
                },
                { field: 'name', headerName: i18next.t('name'), width: 500, flex: 1 },
                { field: 'aspect', headerName: i18next.t('aspect'), width: 200, valueGetter: (e) => i18next.t(e.row.aspectToString()) },
                {
                    field: 'direction', headerName: i18next.t('direction'), width: 200,
                    valueGetter: (e) =>  e.row.forceRed ? i18next.t('forced-red') : (e.row.switch ? (e.row.switchFailure ? i18next.t('failure') : (e.row.currentlySwitching ? i18next.t('switching') : (e.row.queuedForSwitching ? i18next.t('queued-for-switching') : (e.row.passthrough ? i18next.t('passthrough') : i18next.t('detour'))))) : '')
                },
                {
                    field: 'change-direction', headerName: i18next.t('change-direction'), width: 250, renderCell: (params) => {
                        if (!params.row.switch) {
                            if (params.row.forceRed) {
                                return <Button variant="contained" onClick={() => {
                                    props.unforceRed(params.row.getSignalId());
                                }}>{i18next.t('unforce-red')}</Button>
                            } else {
                                return <Button variant="contained" onClick={() => {
                                    props.forceRed(params.row.getSignalId());
                                }}>{i18next.t('force-red')}</Button>
                            }
                        } else if (params.row.queuedForSwitching) {
                            if (params.row.passthrough) {
                                return i18next.t('switching-passthrough-detour');
                            } else {
                                return i18next.t('switching-detour-passthrough');
                            }
                        } else if (params.row.passthrough) {
                            return <Button variant="contained" onClick={() => {
                                props.switchDetour(params.row.getSignalId());
                            }}>{i18next.t('detour')}</Button>
                        } else {
                            return <Button variant="contained" onClick={() => {
                                props.switchPassthrough(params.row.getSignalId());
                            }}>{i18next.t('passthrough')}</Button>
                        }
                    }
                },
            ]}
        />
    </div>
}



export default Controls;
