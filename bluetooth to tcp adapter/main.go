/*
This file is part of Model Train Controller.

Model Train Controller is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3 of the License.

Model Train Controller is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with Model Train Controller. If not, see <https://www.gnu.org/licenses/>.
*/

package main

import (
	"fmt"
	"io"
	"log"
	"net"
	"os"
	"strconv"
	"sync"

	"github.com/tarm/serial"
)

var settings Settings

const TOKEN_SIZE = 4

func main() {
	var ok bool
	settings, ok = loadSettings()
	if !ok {
		log.Fatalln("Could not read the config.json file from disk")
		os.Exit(1)
	}

	for i := 0; i < len(settings.Serial); i++ {
		if settings.Serial[i].Enabled {
			go adapterThread(settings.Serial[i])
		}
	}

	// Idle wait
	mutex := sync.Mutex{}
	mutex.Lock()
	mutex.Lock()
}

func adapterThread(serialSettings SerialSettings) {
	stream, err := serial.OpenPort(&serial.Config{
		Name:        serialSettings.SerialPort,
		Baud:        serialSettings.Baud,
		ReadTimeout: 1,
		Size:        8,
	})
	if err != nil {
		log.Fatal(err, serialSettings.SerialPort)
		os.Exit(2)
	}
	conn, err := net.Dial("tcp", settings.Server.Host+":"+strconv.Itoa(int(settings.Server.Port)))
	if err != nil {
		fmt.Println(err)
		os.Exit(3)
	}
	authSerialClient(stream, conn)

	go sendFromTcpToUsb(stream, conn)
	for {
		var buffer []byte = make([]byte, 1)
		read, err := stream.Read(buffer)
		if err != nil {
			fmt.Println(err)
			continue
		}
		if read == 0 {
			continue
		}

		var readData int = 0
		var data []byte = make([]byte, 0)
		for readData < int(buffer[0]) {
			var dataBuffer []byte = make([]byte, buffer[0])
			read, err = stream.Read(dataBuffer)
			if err != nil {
				fmt.Println(err)
				continue
			}
			if read == 0 {
				fmt.Println("read", read)
				continue
			}
			readData += read
			data = append(data, dataBuffer[:read]...)
		}

		fmt.Println("message!", buffer[0], data)
		conn.Write(buffer)
		conn.Write(data)
	}
}

func authSerialClient(stream *serial.Port, conn net.Conn) {
	stream.Write([]byte{255})

	var readData int = 0
	var data []byte = make([]byte, 0)
	for readData < int(TOKEN_SIZE) {
		var dataBuffer []byte = make([]byte, TOKEN_SIZE)
		read, err := stream.Read(dataBuffer)
		if err != nil {
			fmt.Println(err)
			continue
		}
		if read == 0 {
			continue
		}
		readData += read
		data = append(data, dataBuffer[:read]...)
	}
	fmt.Println("token", data)
	conn.Write(data)
}

func sendFromTcpToUsb(stream *serial.Port, conn net.Conn) {
	for {
		sizeBuffer := make([]byte, 1)
		_, err := io.ReadFull(conn, sizeBuffer)
		if err != nil || sizeBuffer[0] == 0 {
			conn.Close()
			return
		}

		buffer := make([]byte, sizeBuffer[0])
		io.ReadFull(conn, buffer)

		var messageAndSize []byte = make([]byte, 1)
		messageAndSize[0] = byte(len(buffer))
		messageAndSize = append(messageAndSize, buffer...)

		fmt.Println("sending message!", messageAndSize)

		stream.Write(messageAndSize)
	}
}
