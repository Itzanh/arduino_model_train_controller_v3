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
	"net/http"
	"strconv"
)

func addRestApiHttpHandlers() {
	http.HandleFunc("/api/train", apiTrain)
	http.HandleFunc("/api/train_jump_start", apiTrainJumpStart)
	http.HandleFunc("/api/train_stop", apiTrainStop)
}

func apiTrain(w http.ResponseWriter, r *http.Request) {
	// Headers
	w.Header().Add("Access-Control-Allow-Origin", "*")
	w.Header().Add("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE")
	w.Header().Add("Access-Control-Allow-Headers", "content-type")
	if r.Method == "OPTIONS" {
		return
	}

	// check body length
	if r.ContentLength > settings.Server.WebSecurity.MaxRequestBodyLength {
		w.WriteHeader(http.StatusRequestEntityTooLarge)
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, settings.Server.WebSecurity.MaxRequestBodyLength)
	// read body
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	switch r.Method {
	case "GET":
		response, err := json.Marshal(trains)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))
			return
		}
		w.Header().Add("Content-type", "application/json")
		w.Write(response)
	case "POST":
		var newTrain Train
		err = json.Unmarshal(body, &newTrain)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))
			return
		}
		result := newTrain.insert()
		response, _ := json.Marshal(result)
		if !result.Ok {
			w.WriteHeader(http.StatusBadRequest)
		}
		w.Header().Add("Content-type", "application/json")
		w.Write(response)
	case "PUT":
		var train Train
		err = json.Unmarshal(body, &train)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
		result := train.update()
		response, _ := json.Marshal(result)
		if !result.Ok {
			w.WriteHeader(http.StatusBadRequest)
		}
		w.Header().Add("Content-type", "application/json")
		w.Write(response)
	case "DELETE":
		id, err := strconv.Atoi(string(body))
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
		if id == 0 {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		train := &Train{Id: uint8(id)}
		result := train.delete()
		response, _ := json.Marshal(result)
		if !result.Ok {
			w.WriteHeader(http.StatusBadRequest)
		}
		w.Header().Add("Content-type", "application/json")
		w.Write(response)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func apiTrainJumpStart(w http.ResponseWriter, r *http.Request) {
	// Headers
	w.Header().Add("Access-Control-Allow-Origin", "*")
	w.Header().Add("Access-Control-Allow-Methods", "POST")
	w.Header().Add("Access-Control-Allow-Headers", "content-type")
	if r.Method == "OPTIONS" {
		return
	}

	if r.Method != "POST" {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	// check body length
	if r.ContentLength > settings.Server.WebSecurity.MaxRequestBodyLength {
		w.WriteHeader(http.StatusRequestEntityTooLarge)
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, settings.Server.WebSecurity.MaxRequestBodyLength)
	// read body
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	var manuallyJumpStartTrain ManuallyJumpStartTrain
	err = json.Unmarshal(body, &manuallyJumpStartTrain)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(err.Error()))
		return
	}
	result := manuallyJumpStartTrain.manuallyJumpStartTrain()
	response, _ := json.Marshal(result)
	if !result.Ok {
		w.WriteHeader(http.StatusBadRequest)
	}
	w.Header().Add("Content-type", "application/json")
	w.Write(response)
}

func apiTrainStop(w http.ResponseWriter, r *http.Request) {
	// Headers
	w.Header().Add("Access-Control-Allow-Origin", "*")
	w.Header().Add("Access-Control-Allow-Methods", "POST")
	w.Header().Add("Access-Control-Allow-Headers", "content-type")
	if r.Method == "OPTIONS" {
		return
	}

	if r.Method != "POST" {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	// check body length
	if r.ContentLength > settings.Server.WebSecurity.MaxRequestBodyLength {
		w.WriteHeader(http.StatusRequestEntityTooLarge)
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, settings.Server.WebSecurity.MaxRequestBodyLength)
	// read body
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	trainID, err := strconv.Atoi(string(body))
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(err.Error()))
		return
	}
	if trainID == 0 {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	train, ok := trains[uint8(trainID)]
	if !ok {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	train.requestStopTrain()
}
