/*
This file is part of Arduino Model Train Controller V3 (https://github.com/Itzanh/arduino_model_train_controller_v3).

Arduino Model Train Controller V3 is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3 of the License.

Model Train Controller is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with Model Train Controller. If not, see <https://www.gnu.org/licenses/>.
*/

package main

import (
	"encoding/binary"
	"fmt"
	"io"
	"net"
	"strconv"
)

// Train (TI) -> Ground Control (GC)
const (
	TI_GC_REED_SWITCH_TRIGGERED = 1
	TI_GC_SWITCH_SUCCESS        = 2
	TI_GC_SWITCH_FAILURE        = 3
)

// Ground Control (GC) -> Train (TI)
const (
	GC_TI_FORWARD            = 1
	GC_TI_BACKWARD           = 2
	GC_TI_FAST_STOP          = 3
	GC_TI_SWITCH_PASSTHROUGH = 4
	GC_TI_SWITCH_DETOUR      = 5
)

func acceptSignalBoxConnections() {
	// Listen for incoming connections.
	l, err := net.Listen("tcp", ":"+strconv.Itoa(int(settings.Server.PortControllers)))
	if err != nil {
		fmt.Println("Error listening:", err.Error())
		return
	}
	// Close the listener when the application closes.
	defer l.Close()
	for {
		// Listen for an incoming connection.
		conn, err := l.Accept()
		fmt.Println("New connection!")
		if err != nil {
			fmt.Println("Error accepting: ", err.Error())
			continue
		}
		// Handle connections in a new goroutine.
		go onNewSignalBoxConnection(conn)
	}
}

func onNewSignalBoxConnection(conn net.Conn) {
	// Attempt to authenticate the connection
	train := authenticateTrain(conn)
	if train == nil || train.Online {
		conn.Close()
		return
	}

	// On train connected
	train.Conn = conn
	train.Online = true
	sendUpdateToAppWebClients(WS_SC_COMMAND_SERVER_UPDATE, train)

	train.handleTrainMessages()

	// On train disconnected
	train.Online = false
	train.Conn = nil
	if train.LastSignal != nil {
		train.LastSignal.unOccupyZone()
	}
	train.LastSignal = nil
	train.LastSignalPassedAspect = nil
	train.Started = false
	sendUpdateToAppWebClients(WS_SC_COMMAND_SERVER_UPDATE, train)
}

func authenticateTrain(conn net.Conn) *Train {
	var readData int = 0
	buffer := make([]byte, 0)
	for readData < int(4) {
		var dataBuffer []byte = make([]byte, 4)
		read, err := io.ReadFull(conn, dataBuffer)
		if err != nil {
			log("Train", err.Error())
			return nil
		}
		fmt.Println("dataBuffer", dataBuffer)
		if read == 0 {
			continue
		}
		readData += read
		buffer = append(buffer, dataBuffer[:read]...)
	}
	fmt.Println("buffer", buffer)

	accessKey := binary.LittleEndian.Uint32(buffer)
	train := getTrainByAccessKey(accessKey)

	if train == nil {
		log("Train", "Train not found in authentication. Train ID "+string(buffer))
		return nil
	}
	return train
}

func (t *Train) handleTrainMessages() {
	fmt.Println("Train connected!")
	// Listen for new messages
	for {
		sizeBuffer := make([]byte, 1)
		_, err := io.ReadFull(t.Conn, sizeBuffer)
		if err != nil {
			fmt.Println("Train disconnected!")
			t.Conn.Close()
			return
		}
		fmt.Println("sizeBuffer", sizeBuffer)
		if sizeBuffer[0] == 0 {
			continue
		}

		buffer := make([]byte, sizeBuffer[0])
		_, err = io.ReadFull(t.Conn, buffer)
		if err != nil {
			fmt.Println("Controls disconnected!")
			t.Conn.Close()
			return
		}

		go t.onMicrocontrollerMessage(buffer)
	}
}

func (t *Train) onMicrocontrollerMessage(buffer []byte) {
	fmt.Println("onMicrocontrollerMessage buffer", buffer)
	if len(buffer) == 0 {
		return
	}

	switch buffer[0] {
	case TI_GC_REED_SWITCH_TRIGGERED:
		{
			t.trainReedSwitchTriggered(buffer[1:])
		}
	case TI_GC_SWITCH_SUCCESS:
		{
			t.onPositionSwitchedSuccessfully()
		}
	case TI_GC_SWITCH_FAILURE:
		{
			t.onPositionSwitchedFailure()
		}
	}
}

func (t *Train) trainReedSwitchTriggered(buffer []byte) {
	fmt.Println("trainReedSwitchTriggered")
	if t.Started && t.LastSignal != nil {
		t.enterZone(t.LastSignal.getNextSignal())
	}
}
