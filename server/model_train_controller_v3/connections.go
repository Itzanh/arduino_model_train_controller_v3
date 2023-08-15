/*
This file is part of Arduino Model Train Controller V3 (https://github.com/Itzanh/arduino_model_train_controller_v3).

Arduino Model Train Controller V3 is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3 of the License.

Model Train Controller is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with Model Train Controller. If not, see <https://www.gnu.org/licenses/>.
*/

package main

import (
	"encoding/json"
	"sync"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

// List of all the concurrent websocket connections to the server.
var connections []Connection

// MUTEX FOR var connections []Connection: List of all the concurrent websocket connections to the server.
var connectionsMutex sync.Mutex

type Connection struct {
	Id    uuid.UUID `json:"id"`
	ws    *websocket.Conn
	Mutex *sync.Mutex
}

func (c *Connection) addConnection() {
	connectionsMutex.Lock()
	c.Id = uuid.New()
	c.Mutex = &sync.Mutex{}

	connections = append(connections, *c)
	connectionsMutex.Unlock()
}

func (c *Connection) deleteConnection() {
	connectionsMutex.Lock()
	for i := 0; i < len(connections); i++ {
		if connections[i].Id == c.Id {
			connections = append(connections[:i], connections[i+1:]...)
			break
		}
	}
	connectionsMutex.Unlock()
}

func sendMessageToAllWebClients(message string) {
	for i := 0; i < len(connections); i++ {
		connections[i].Mutex.Lock()
		connections[i].ws.WriteMessage(websocket.TextMessage, []byte(message))
		connections[i].Mutex.Unlock()
	}
}

type WebClientObject interface {
	WebSocketCommandName() string
}

func sendUpdateToAppWebClients(verb string, v WebClientObject) {
	objectJson, err := json.Marshal(v)
	if err != nil {
		log("JSON", err.Error())
	}
	sendMessageToAllWebClients(verb + ":" + (WebClientObject(v)).WebSocketCommandName() + "$" + string(objectJson))
}
