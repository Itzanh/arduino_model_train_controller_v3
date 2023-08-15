/*
This file is part of Arduino Model Train Controller V3 (https://github.com/Itzanh/arduino_model_train_controller_v3).

Arduino Model Train Controller V3 is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3 of the License.

Model Train Controller is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with Model Train Controller. If not, see <https://www.gnu.org/licenses/>.
*/

package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	gorm_log "log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/websocket"
	_ "github.com/lib/pq"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Basic, static, server settings such as the DB password or the port.
var settings BackendSettings

// Http object for the websocket clients to conenect to.
var upgrader = websocket.Upgrader{}

// Database connection to PostgreSQL.
var db *sql.DB

// ORM - Database connection to PostgreSQL.
var dbOrm *gorm.DB

func main() {
	// read settings
	var ok bool
	settings, ok = getBackendSettings()
	if !ok {
		fmt.Println("ERROR READING SETTINGS FILE")
		return
	}

	// connect to PostgreSQL
	fmt.Println("Connecting to PostgreSQL...")
	var err error
	psqlInfo := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable", settings.Db.Host, settings.Db.Port, settings.Db.User, settings.Db.Password, settings.Db.Dbname)
	db, err = sql.Open("postgres", psqlInfo) // control error
	if err != nil {
		fmt.Println(err)
		return
	}
	err = db.Ping()
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
	dbOrm, err = gorm.Open(postgres.Open(psqlInfo), &gorm.Config{
		Logger: logger.New(
			gorm_log.New(os.Stdout, "\r\n", gorm_log.LstdFlags), // io writer
			logger.Config{
				SlowThreshold: time.Second, // Slow SQL threshold
			},
		),
	})
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	// installation
	if !addORMModels() {
		os.Exit(4)
	}

	// initialization
	initializeMemoryData()

	// listen to requests
	fmt.Println("Server ready! :D")
	logEvent(EVENT_LOG_TYPE_START)
	go acceptSignalBoxConnections()
	upgrader.CheckOrigin = func(r *http.Request) bool { return true }
	http.HandleFunc("/", reverse)
	addRestApiHttpHandlers()

	server := http.Server{
		Addr:           ":" + strconv.Itoa(int(settings.Server.PortWebSocket)),
		ReadTimeout:    time.Duration(int64(settings.Server.WebSecurity.ReadTimeoutSeconds) * int64(time.Second)),
		WriteTimeout:   time.Duration(int64(settings.Server.WebSecurity.WriteTimeoutSeconds) * int64(time.Second)),
		MaxHeaderBytes: settings.Server.WebSecurity.MaxHeaderBytes,
	}
	if settings.Server.TLS.UseTLS {
		server.ListenAndServeTLS(settings.Server.TLS.CrtPath, settings.Server.TLS.KeyPath)
	} else {
		server.ListenAndServe()
	}
}

func initializeMemoryData() {
	loadTrains()
	loadStretches()
	loadSignals()
}

func reverse(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Client connected! " + r.RemoteAddr)
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer ws.Close()
	ws.SetReadLimit(settings.Server.WebSecurity.MaxLengthWebSocketMessage)

	// AUTHENTICATION
	ok := authentication(ws)
	if !ok {
		ws.Close()
		return
	}
	// END AUTHENTICATION
	c := &Connection{ws: ws}
	c.addConnection()

	for {
		// Receive message
		mt, message, err := ws.ReadMessage()
		if err != nil {
			c.deleteConnection()
			return
		}

		msg := string(message)
		separatorIndex := strings.Index(msg, "$")
		if separatorIndex < 0 {
			break
		}

		command := msg[0:separatorIndex]
		commandSeparatorIndex := strings.Index(command, ":")
		if commandSeparatorIndex < 0 {
			break
		}

		c.commandProcessor(command[0:commandSeparatorIndex], command[commandSeparatorIndex+1:], message[separatorIndex+1:], mt, ws)
	}
}

func isAuthenticationReady() bool {
	return true // TODO!!!
}

func authentication(ws *websocket.Conn) bool {
	isAuthenticationReadyJson, _ := json.Marshal(isAuthenticationReady())
	err := ws.WriteMessage(websocket.TextMessage, isAuthenticationReadyJson)
	if err != nil {
		return false
	}

	// AUTHENTICATION
	for i := int16(0); i < settings.Server.MaxLoginAttemps; i++ {
		// Receive message
		/*mt, message, err := ws.ReadMessage()
		if err != nil {
			return false, 0
		}*/
	}

	return true // TODO!!!
}
