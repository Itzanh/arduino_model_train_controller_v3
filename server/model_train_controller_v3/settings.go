/*
This file is part of Arduino Model Train Controller V3 (https://github.com/Itzanh/arduino_model_train_controller_v3).

Arduino Model Train Controller V3 is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3 of the License.

Model Train Controller is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with Model Train Controller. If not, see <https://www.gnu.org/licenses/>.
*/

package main

import (
	"encoding/json"
	"io/ioutil"
)

// Basic, static, server settings such as the DB password or the port.
type BackendSettings struct {
	Db     DatabaseSettings `json:"db"`
	Server ServerSettings   `json:"server"`
}

// Credentials for connecting to PostgreSQL.
type DatabaseSettings struct {
	Host     string `json:"host"`
	Port     uint16 `json:"port"`
	User     string `json:"user"`
	Password string `json:"password"`
	Dbname   string `json:"dbname"`
}

// Basic info for the app.
type ServerSettings struct {
	PortControllers          uint16                    `json:"portControllers"`
	PortWebSocket            uint16                    `json:"portWebSocket"`
	HashIterations           int32                     `json:"hashIterations"`
	TokenExpirationHours     int16                     `json:"tokenExpirationHours"`
	MaxLoginAttemps          int16                     `json:"maxLoginAttemps"`
	SwitchingMaximumAttempts uint8                     `json:"switchingMaximumAttempts"`
	WebSecurity              ServerSettingsWebSecurity `json:"webSecurity"`
	TLS                      ServerSettingsTLS         `json:"tls"`
}

type ServerSettingsWebSecurity struct {
	ReadTimeoutSeconds        uint8 `json:"readTimeoutSeconds"`
	WriteTimeoutSeconds       uint8 `json:"writeTimeoutSeconds"`
	MaxLimitApiQueries        int64 `json:"maxLimitApiQueries"`
	MaxHeaderBytes            int   `json:"maxHeaderBytes"`
	MaxRequestBodyLength      int64 `json:"maxRequestBodyLength"`
	MaxLengthWebSocketMessage int64 `json:"maxLengthWebSocketMessage"`
}

// SSL settings for the web server.
type ServerSettingsTLS struct {
	UseTLS  bool   `json:"useTLS"`
	CrtPath string `json:"crtPath"`
	KeyPath string `json:"keyPath"`
}

func getBackendSettings() (BackendSettings, bool) {
	content, err := ioutil.ReadFile("./config.json")
	if err != nil {
		return BackendSettings{}, false
	}

	var settings BackendSettings
	err = json.Unmarshal(content, &settings)
	if err != nil {
		return BackendSettings{}, false
	}

	return settings, true
}
