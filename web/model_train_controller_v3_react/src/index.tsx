/*
This file is part of Arduino Model Train Controller V3 (https://github.com/Itzanh/arduino_model_train_controller_v3).

Arduino Model Train Controller V3 is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3 of the License.

Model Train Controller is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with Model Train Controller. If not, see <https://www.gnu.org/licenses/>.
*/

import React from 'react';
import ReactDOM from 'react-dom';
import global_config from './config.json';
import './index.css';
import App from './App';
import i18next from 'i18next';
import strings_en from './STRINGS/en.json';
import Menu from './COMPONENTS/Menu';
import 'bootstrap/dist/css/bootstrap.min.css';
import { store } from './redux/store';
import { Provider } from 'react-redux';
import * as trainsSlice from './redux/trainsSlice';
import * as stretchesSlice from './redux/stretchesSlice';
import * as signalsSlice from './redux/signalsSlice';
import Trains from './COMPONENTS/Trains/Trains';
import Train from './MODELS/Trains/Train';
import NetworkController from './NETWORKING/NetworkController';
import WebSocketMessages from './NETWORKING/WebSocketMessages';
import OkAndErrorCodeReturn from './NETWORKING/OkAndErrorCodeReturn';
import Controls from './COMPONENTS/Controls/Controls';
import ManuallyJumpStartTrain from './MODELS/ManuallyJumpStartTrain';
import ManuallyStopTrainAtSignal from './MODELS/ManuallyStopTrainAtSignal';
import Signal from './MODELS/Signals/Signal';
import Signals from './COMPONENTS/Signals/Signals';
import Stretches from './COMPONENTS/Stretches/Stretches';
import Stretch from './MODELS/Stretches/Stretch';
import SignalId from './MODELS/Signals/SignalId';



ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root'));

// WebSocket
var ws: WebSocket;
var networkController: NetworkController;



function main() {
  i18nextInit();
  ws = new WebSocket((window.location.protocol === 'https:' ? 'wss' : 'ws') + '://' + window.location.hostname
    + ':' + global_config.websocket.port + '/' + global_config.websocket.path);
  console.log(ws);
  ws.onopen = () => {
    renderMenu();
  }
  ws.onclose = (err) => {
    console.log(err);
  }
}

function i18nextInit() {
  var resources = strings_en;

  i18next.init({
    resources: resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false }
  });
}

function renderMenu() {
  i18nextInit();
  initNetworkController();
  initializeState();

  ReactDOM.render(

    <Menu
      controlsTab={controlsTab}
      trainsTab={trainsTab}
      stretchesTab={stretchesTab}
      signalsTab={signalsTab}
    />
    , document.getElementById('root'));
}

function initNetworkController() {
  networkController = new NetworkController(ws);
  networkController.addEventListenerHandle("SERVER_INSERT", WebSocketMessages.WS_CS_TRAIN, onTrainInserted);
  networkController.addEventListenerHandle("SERVER_UPDATE", WebSocketMessages.WS_CS_TRAIN, onTrainUpdated);
  networkController.addEventListenerHandle("SERVER_DELETE", WebSocketMessages.WS_CS_TRAIN, onTrainDeleted);
  networkController.addEventListenerHandle("SERVER_INSERT", WebSocketMessages.WS_CS_STRETCH, onStretchInserted);
  networkController.addEventListenerHandle("SERVER_UPDATE", WebSocketMessages.WS_CS_STRETCH, onStretchUpdated);
  networkController.addEventListenerHandle("SERVER_DELETE", WebSocketMessages.WS_CS_STRETCH, onStretchDeleted);
  networkController.addEventListenerHandle("SERVER_INSERT", WebSocketMessages.WS_CS_SIGNAL, onSignalInserted);
  networkController.addEventListenerHandle("SERVER_UPDATE", WebSocketMessages.WS_CS_SIGNAL, onSignalUpdated);
  networkController.addEventListenerHandle("SERVER_DELETE", WebSocketMessages.WS_CS_SIGNAL, onSignalDeleted);
}

function initializeState() {
  getTrains();
  getStretches();
  getSignals();
}

/* CONTROLS */

function controlsTab() {
  ReactDOM.render(
    <Provider store={store}>
      <Controls
        manuallyJumpStartTrain={manuallyJumpStartTrain}
        manuallyStopTrain={manuallyStopTrain}
        manuallyStopTrainAtSignal={manuallyStopTrainAtSignal}
        cancelManuallyStopTrainAtSignal={cancelManuallyStopTrainAtSignal}
        switchPassthrough={switchPassthrough}
        switchDetour={switchDetour}
        forceRed={forceRed}
        unforceRed={unforceRed}
      />
    </Provider>,
    document.getElementById('renderTab'));
}

function manuallyJumpStartTrain(manuallyJumpStartTrain: ManuallyJumpStartTrain): Promise<OkAndErrorCodeReturn> {
  return networkController.executeAction(WebSocketMessages.WS_CS_MANUALLY_JUMP_START_TRAIN, JSON.stringify(manuallyJumpStartTrain)) as Promise<OkAndErrorCodeReturn>;
}

function manuallyStopTrain(trainID: number): Promise<OkAndErrorCodeReturn> {
  return networkController.executeAction(WebSocketMessages.WS_CS_MANUALLY_STOP_TRAIN, "" + trainID) as Promise<OkAndErrorCodeReturn>;
}

function manuallyStopTrainAtSignal(manuallyStopTrainAtSignal: ManuallyStopTrainAtSignal): Promise<OkAndErrorCodeReturn> {
  return networkController.executeAction(WebSocketMessages.WS_CS_MANUALLY_STOP_TRAIN_AT_SIGNAL, JSON.stringify(manuallyStopTrainAtSignal)) as Promise<OkAndErrorCodeReturn>;
}

function cancelManuallyStopTrainAtSignal(trainID: number): Promise<OkAndErrorCodeReturn> {
  return networkController.executeAction(WebSocketMessages.WS_CS_MANUALLY_CANCEL_STOP_TRAIN_AT_SIGNAL, "" + trainID) as Promise<OkAndErrorCodeReturn>;
}

function switchPassthrough(signalId: SignalId): Promise<OkAndErrorCodeReturn> {
  return networkController.executeAction(WebSocketMessages.WS_CS_SWITCH_PASSTHROUGH, JSON.stringify(signalId)) as Promise<OkAndErrorCodeReturn>;
}

function switchDetour(signalId: SignalId): Promise<OkAndErrorCodeReturn> {
  return networkController.executeAction(WebSocketMessages.WS_CS_SWITCH_DETOUR, JSON.stringify(signalId)) as Promise<OkAndErrorCodeReturn>;
}

function forceRed(signalId: SignalId): Promise<OkAndErrorCodeReturn> {
  return networkController.executeAction(WebSocketMessages.WS_CS_FORCE_RED, JSON.stringify(signalId)) as Promise<OkAndErrorCodeReturn>;
}

function unforceRed(signalId: SignalId): Promise<OkAndErrorCodeReturn> {
  return networkController.executeAction(WebSocketMessages.WS_CS_UNFORCE_RED, JSON.stringify(signalId)) as Promise<OkAndErrorCodeReturn>;
}

/* TRAINS */

function trainsTab() {
  ReactDOM.render(
    <Provider store={store}>
      <Trains
        insertTrain={insertTrain}
        updateTrain={updateTrain}
        deleteTrain={deleteTrain}
      />
    </Provider>,
    document.getElementById('renderTab'));
}

async function getTrains() {
  const unparsedTrains = await networkController.getRows(WebSocketMessages.WS_CS_TRAIN) as object[];
  const trains = unparsedTrains.map((train) => {
    return new Train(train);
  }) as Train[];
  store.dispatch(trainsSlice.addMultiple(trains));
}

function insertTrain(train: Train): Promise<OkAndErrorCodeReturn> {
  return networkController.addRows(WebSocketMessages.WS_CS_TRAIN, train) as Promise<OkAndErrorCodeReturn>;
}

function updateTrain(train: Train): Promise<OkAndErrorCodeReturn> {
  return networkController.updateRows(WebSocketMessages.WS_CS_TRAIN, train) as Promise<OkAndErrorCodeReturn>;
}

function deleteTrain(train: Train): Promise<OkAndErrorCodeReturn> {
  return networkController.deleteRows(WebSocketMessages.WS_CS_TRAIN, JSON.stringify(train)) as Promise<OkAndErrorCodeReturn>;
}

function onTrainInserted(message: string) {
  const unparsedTrain = JSON.parse(message);
  const train = new Train(unparsedTrain);
  store.dispatch(trainsSlice.add(train));
}

function onTrainUpdated(message: string) {
  const unparsedTrain = JSON.parse(message);
  const train = new Train(unparsedTrain);
  store.dispatch(trainsSlice.update(train));
}

function onTrainDeleted(message: string) {
  const unparsedTrain = JSON.parse(message);
  const train = new Train(unparsedTrain);
  store.dispatch(trainsSlice.remove(train));
}

/* STRETCH */

function stretchesTab() {
  ReactDOM.render(
    <Provider store={store}>
      <Stretches
        insertStretch={insertStretch}
        updateStretch={updateStretch}
        deleteStretch={deleteStretch}
      />
    </Provider>,
    document.getElementById('renderTab'));
}

async function getStretches() {
  const unparsedStretches = await networkController.getRows(WebSocketMessages.WS_CS_STRETCH) as object[];
  const stretches = unparsedStretches.map((stretch) => {
    return new Stretch(stretch);
  }) as Stretch[];
  store.dispatch(stretchesSlice.addMultiple(stretches));
}

function insertStretch(stretch: Stretch): Promise<OkAndErrorCodeReturn> {
  return networkController.addRows(WebSocketMessages.WS_CS_STRETCH, stretch) as Promise<OkAndErrorCodeReturn>;
}

function updateStretch(stretch: Stretch): Promise<OkAndErrorCodeReturn> {
  return networkController.updateRows(WebSocketMessages.WS_CS_STRETCH, stretch) as Promise<OkAndErrorCodeReturn>;
}

function deleteStretch(stretch: Stretch): Promise<OkAndErrorCodeReturn> {
  return networkController.deleteRows(WebSocketMessages.WS_CS_STRETCH, JSON.stringify(stretch)) as Promise<OkAndErrorCodeReturn>;
}

function onStretchInserted(message: string) {
  const unparsedStretch = JSON.parse(message);
  const stretch = new Stretch(unparsedStretch);
  store.dispatch(stretchesSlice.add(stretch));
}

function onStretchUpdated(message: string) {
  const unparsedStretch = JSON.parse(message);
  const stretch = new Stretch(unparsedStretch);
  store.dispatch(stretchesSlice.update(stretch));
}

function onStretchDeleted(message: string) {
  const unparsedStretch = JSON.parse(message);
  const stretch = new Stretch(unparsedStretch);
  store.dispatch(stretchesSlice.remove(stretch));
}

/* SIGNALS */

function signalsTab() {
  ReactDOM.render(
    <Provider store={store}>
      <Signals
        insertSignal={insertSignal}
        updateSignal={updateSignal}
        deleteSignal={deleteSignal}
      />
    </Provider>,
    document.getElementById('renderTab'));
}

async function getSignals() {
  const unparsedSignals = await networkController.getRows(WebSocketMessages.WS_CS_SIGNAL) as object[];
  const signals = unparsedSignals.map((signal) => {
    return new Signal(signal);
  }) as Signal[];
  store.dispatch(signalsSlice.addMultiple(signals));
}

function insertSignal(signal: Signal): Promise<OkAndErrorCodeReturn> {
  return networkController.addRows(WebSocketMessages.WS_CS_SIGNAL, signal) as Promise<OkAndErrorCodeReturn>;
}

function updateSignal(signal: Signal): Promise<OkAndErrorCodeReturn> {
  return networkController.updateRows(WebSocketMessages.WS_CS_SIGNAL, signal) as Promise<OkAndErrorCodeReturn>;
}

function deleteSignal(signal: Signal): Promise<OkAndErrorCodeReturn> {
  return networkController.deleteRows(WebSocketMessages.WS_CS_SIGNAL, JSON.stringify(signal)) as Promise<OkAndErrorCodeReturn>;
}

function onSignalInserted(message: string) {
  const unparsedSignal = JSON.parse(message);
  const signal = new Signal(unparsedSignal);
  store.dispatch(signalsSlice.add(signal));
}

function onSignalUpdated(message: string) {
  const unparsedSignal = JSON.parse(message);
  const signal = new Signal(unparsedSignal);
  store.dispatch(signalsSlice.update(signal));
}

function onSignalDeleted(message: string) {
  const unparsedSignal = JSON.parse(message);
  const signal = new Signal(unparsedSignal);
  store.dispatch(signalsSlice.remove(signal));
}

/* EVENT LOG */

function eventLogTab() {
  ReactDOM.render(
    <Provider store={store}>
      <Signals
        insertSignal={insertSignal}
        updateSignal={updateSignal}
        deleteSignal={deleteSignal}
      />
    </Provider>,
    document.getElementById('renderTab'));
}

async function getEventLog() {
  const unparsedSignals = await networkController.getRows(WebSocketMessages.WS_CS_EVENT_LOG) as object[];
  const signals = unparsedSignals.map((signal) => {
    return new Signal(signal);
  }) as Signal[];
  store.dispatch(signalsSlice.addMultiple(signals));
}







main();
