package main

import (
	"encoding/json"
	"io/ioutil"
)

type Settings struct {
	Server ServerSettings   `json:"server"`
	Serial []SerialSettings `json:"serial"`
}

type ServerSettings struct {
	Host string `json:"host"`
	Port uint16 `json:"port"`
}

type SerialSettings struct {
	Enabled    bool   `json:"enabled"`
	SerialPort string `json:"serialPort"` // Like "COM13 or /dev/whatever"
	Baud       int    `json:"baud"`
}

func loadSettings() (Settings, bool) {
	content, err := ioutil.ReadFile("./config.json")
	if err != nil {
		return Settings{}, false
	}

	var settings Settings
	err = json.Unmarshal(content, &settings)
	if err != nil {
		return Settings{}, false
	}

	return settings, true
}
