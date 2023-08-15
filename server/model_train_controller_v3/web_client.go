/*
This file is part of Arduino Model Train Controller V3 (https://github.com/Itzanh/arduino_model_train_controller_v3).

Arduino Model Train Controller V3 is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3 of the License.

Model Train Controller is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with Model Train Controller. If not, see <https://www.gnu.org/licenses/>.
*/

package main

import (
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/gorilla/websocket"
)

// WS = WebSocket
// CS = Client -> Server
// SC = Server -> Client
const (
	// Client -> Server commands
	WS_CS_TRAIN                                = "TRAIN"
	WS_CS_STRETCH                              = "STRETCH"
	WS_CS_SIGNAL                               = "SIGNAL"
	WS_CS_EVENT_LOG                            = "EVENT_LOG"
	WS_CS_MANUALLY_JUMP_START_TRAIN            = "MANUALLY_JUMP_START_TRAIN"
	WS_CS_MANUALLY_STOP_TRAIN                  = "MANUALLY_STOP_TRAIN"
	WS_CS_MANUALLY_STOP_TRAIN_AT_SIGNAL        = "MANUALLY_STOP_TRAIN_AT_SIGNAL"
	WS_CS_MANUALLY_CANCEL_STOP_TRAIN_AT_SIGNAL = "MANUALLY_CANCEL_STOP_TRAIN_AT_SIGNAL"
	WS_CS_MOVE_SIGNAL_UP                       = "MOVE_SIGNAL_UP"
	WS_CS_MOVE_SIGNAL_DOWN                     = "MOVE_SIGNAL_DOWN"
	WS_CS_SWITCH_PASSTHROUGH                   = "SWITCH_PASSTHROUGH"
	WS_CS_SWITCH_DETOUR                        = "SWITCH_DETOUR"
	WS_CS_FORCE_RED                            = "FORCE_RED"
	WS_CS_UNFORCE_RED                          = "UNFORCE_RED"

// Server -> Client commands
)

// Server -> Client verbs
const (
	WS_SC_COMMAND_SET           = "SET"
	WS_SC_COMMAND_SERVER_INSERT = "SERVER_INSERT"
	WS_SC_COMMAND_SERVER_UPDATE = "SERVER_UPDATE"
	WS_SC_COMMAND_SERVER_DELETE = "SERVER_DELETE"
)

func (c *Connection) commandProcessor(verb string, resource string, message []byte, mt int, ws *websocket.Conn) {
	switch verb {
	case "GET":
		instructionGet(verb, resource, string(message), mt, ws)
	case "INSERT":
		instructionInsert(verb, resource, string(message), mt, ws)
	case "UPDATE":
		instructionUpdate(verb, resource, string(message), mt, ws)
	case "DELETE":
		instructionDelete(verb, resource, string(message), mt, ws)
	case "NAME":
		// instructionName(command, string(message), mt, ws, enterpriseId)
	case "GETNAME":
		// instructionGetName(command, string(message), mt, ws, enterpriseId)
	case "DEFAULTS":
		// instructionDefaults(command, string(message), mt, ws, permissions, enterpriseId)
	case "LOCATE":
		// instructionLocate(command, string(message), mt, ws, permissions, enterpriseId)
	case "ACTION":
		c.instructionAction(verb, resource, string(message), mt, ws)
	case "SEARCH":
		// instructionSearch(command, string(message), mt, ws, permissions, enterpriseId)
	}
}

func instructionGet(verb string, resource string, message string, mt int, ws *websocket.Conn) {
	var data []byte
	// var err error

	switch resource {
	case WS_CS_TRAIN:
		var err error
		data, err = json.Marshal(trainsToArray())
		if err != nil {
			log("JSON", err.Error())
		}
	case WS_CS_STRETCH:
		var err error
		data, err = json.Marshal(stretchesToArray())
		if err != nil {
			log("JSON", err.Error())
		}
	case WS_CS_SIGNAL:
		var err error
		data, err = json.Marshal(signals)
		if err != nil {
			log("JSON", err.Error())
		}
	case WS_CS_EVENT_LOG:
		var q EventLogQuery
		err := json.Unmarshal([]byte(message), &q)
		if err != nil {
			log("JSON", err.Error())
			return
		}
		data, err = json.Marshal(q.getEventLog())
		if err != nil {
			log("JSON", err.Error())
		}
	}

	ws.WriteMessage(mt, []byte(verb+":"+resource+"$"+string(data)))
}

func instructionInsert(verb string, resource string, message string, mt int, ws *websocket.Conn) {
	var data []byte
	// var err error

	switch resource {
	case WS_CS_TRAIN:
		var train Train
		err := json.Unmarshal([]byte(message), &train)
		if err != nil {
			log("JSON", err.Error())
			return
		}
		data, err = json.Marshal(train.insert())
		if err != nil {
			log("JSON", err.Error())
		}
	case WS_CS_STRETCH:
		var stretch Stretch
		err := json.Unmarshal([]byte(message), &stretch)
		if err != nil {
			log("JSON", err.Error())
			return
		}
		data, err = json.Marshal(stretch.insert())
		if err != nil {
			log("JSON", err.Error())
		}
	case WS_CS_SIGNAL:
		var signal Signal
		err := json.Unmarshal([]byte(message), &signal)
		if err != nil {
			log("JSON", err.Error())
			return
		}
		data, err = json.Marshal(signal.insert())
		if err != nil {
			log("JSON", err.Error())
		}
	}

	ws.WriteMessage(mt, []byte(verb+":"+resource+"$"+string(data)))
}

func instructionUpdate(verb string, resource string, message string, mt int, ws *websocket.Conn) {
	var data []byte
	// var err error

	switch resource {
	case WS_CS_TRAIN:
		var train Train
		err := json.Unmarshal([]byte(message), &train)
		if err != nil {
			log("JSON", err.Error())
			return
		}
		data, err = json.Marshal(train.update())
		if err != nil {
			log("JSON", err.Error())
		}
	case WS_CS_STRETCH:
		var stretch Stretch
		err := json.Unmarshal([]byte(message), &stretch)
		if err != nil {
			log("JSON", err.Error())
			return
		}
		data, err = json.Marshal(stretch.update())
		if err != nil {
			log("JSON", err.Error())
		}
	case WS_CS_SIGNAL:
		var signal Signal
		err := json.Unmarshal([]byte(message), &signal)
		if err != nil {
			log("JSON", err.Error())
			return
		}
		data, err = json.Marshal(signal.update())
		if err != nil {
			log("JSON", err.Error())
		}
	}

	ws.WriteMessage(mt, []byte(verb+":"+resource+"$"+string(data)))
}

func instructionDelete(verb string, resource string, message string, mt int, ws *websocket.Conn) {
	var data []byte
	// var err error

	switch resource {
	case WS_CS_TRAIN:
		var train Train
		err := json.Unmarshal([]byte(message), &train)
		if err != nil {
			log("JSON", err.Error())
			return
		}
		data, err = json.Marshal(train.delete())
		if err != nil {
			log("JSON", err.Error())
		}
	case WS_CS_STRETCH:
		var stretch Stretch
		err := json.Unmarshal([]byte(message), &stretch)
		if err != nil {
			log("JSON", err.Error())
			return
		}
		data, err = json.Marshal(stretch.delete())
		if err != nil {
			log("JSON", err.Error())
		}
	case WS_CS_SIGNAL:
		var signal Signal
		err := json.Unmarshal([]byte(message), &signal)
		if err != nil {
			log("JSON", err.Error())
			return
		}
		data, err = json.Marshal(signal.delete())
		if err != nil {
			log("JSON", err.Error())
		}
	}

	ws.WriteMessage(mt, []byte(verb+":"+resource+"$"+string(data)))
}

func (c *Connection) instructionAction(verb string, resource string, message string, mt int, ws *websocket.Conn) {
	var data []byte
	// var err error

	switch resource {
	case WS_CS_MANUALLY_JUMP_START_TRAIN:
		var manuallyJumpStartTrain ManuallyJumpStartTrain
		err := json.Unmarshal([]byte(message), &manuallyJumpStartTrain)
		if err != nil {
			log("JSON", err.Error())
			return
		}
		data, err = json.Marshal(manuallyJumpStartTrain.manuallyJumpStartTrain())
		if err != nil {
			log("JSON", err.Error())
		}
	case WS_CS_MANUALLY_STOP_TRAIN:
		trainID, err := strconv.Atoi(string(message))
		if err != nil {
			return
		}
		if trainID == 0 {
			return
		}

		train, ok := trains[uint8(trainID)]
		if !ok {
			return
		}

		train.requestStopTrain()
	case WS_CS_SWITCH_PASSTHROUGH:
		var signalId SignalId
		err := json.Unmarshal([]byte(message), &signalId)
		if err != nil {
			log("JSON", err.Error())
			return
		}
		if !signalId.isValid() {
			return
		}
		signal := signalId.getSignal()
		if signal == nil {
			return
		}
		data, err = json.Marshal(signal.switchPassthrough())
		if err != nil {
			log("JSON", err.Error())
		}
	case WS_CS_SWITCH_DETOUR:
		fmt.Println("WS_CS_SWITCH_DETOUR")
		var signalId SignalId
		err := json.Unmarshal([]byte(message), &signalId)
		if err != nil {
			log("JSON", err.Error())
			fmt.Println(err.Error())
			return
		}
		if !signalId.isValid() {
			fmt.Println("INVALID")
			return
		}
		signal := signalId.getSignal()
		if signal == nil {
			fmt.Println("NULL")
			return
		}
		data, err = json.Marshal(signal.switchDetour())
		if err != nil {
			log("JSON", err.Error())
			fmt.Println(err.Error())
		}
	case WS_CS_FORCE_RED:
		var signalId SignalId
		err := json.Unmarshal([]byte(message), &signalId)
		if err != nil {
			log("JSON", err.Error())
			return
		}
		if !signalId.isValid() {
			return
		}
		signal := signalId.getSignal()
		if signal == nil {
			return
		}
		data, err = json.Marshal(signal.forceRed())
		if err != nil {
			log("JSON", err.Error())
		}
	case WS_CS_UNFORCE_RED:
		var signalId SignalId
		err := json.Unmarshal([]byte(message), &signalId)
		if err != nil {
			log("JSON", err.Error())
			return
		}
		if !signalId.isValid() {
			return
		}
		signal := signalId.getSignal()
		if signal == nil {
			return
		}
		data, err = json.Marshal(signal.unforceRed())
		if err != nil {
			log("JSON", err.Error())
		}
	}

	c.Mutex.Lock()
	ws.WriteMessage(mt, []byte(verb+":"+resource+"$"+string(data)))
	c.Mutex.Unlock()
}
