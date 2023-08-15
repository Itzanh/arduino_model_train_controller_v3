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
	"math/rand"
	"net"
	"sort"

	"gorm.io/gorm"
)

var trains map[uint8]*Train = make(map[uint8]*Train)

type Train struct {
	Id                     uint8         `json:"id" gorm:"primaryKey;column:id;type:smallint;not null:true"`
	Name                   string        `json:"name" gorm:"column:name;type:character varying(50);not null:true"`
	SpeedSlow              uint8         `json:"speedSlow" gorm:"column:speed_slow;type:smallint;not null:true"`
	SpeedHalf              uint8         `json:"speedHalf" gorm:"column:speed_half;type:smallint;not null:true"`
	SpeedFast              uint8         `json:"speedFast" gorm:"column:speed_fast;type:smallint;not null:true"`
	AccessKey              uint32        `json:"accessKey" gorm:"column:access_key;type:integer;not null:true"`
	Conn                   net.Conn      `json:"-" gorm:"-"`
	Online                 bool          `json:"online" gorm:"-"`
	LastSignal             *Signal       `json:"lastSignal" gorm:"-"`
	LastSignalPassedAspect *SignalAspect `json:"lastSignalPassedAspect" gorm:"-"`
	Started                bool          `json:"started" gorm:"-"`
	StopAtSignal           bool          `json:"stopAtSignal" gorm:"-"`
	SignalToStopAt         *Signal       `json:"signalToStopAt" gorm:"-"`
	SwitchAttempt          uint8         `json:"-" gorm:"-"`
}

func (Train) TableName() string {
	return "train"
}

func (Train) WebSocketCommandName() string {
	return WS_CS_TRAIN
}

func getTrains() []*Train {
	var trains []*Train = make([]*Train, 0)
	result := dbOrm.Model(&Train{}).Find(&trains)
	if result.Error != nil {
		log("DB", result.Error.Error())
	}

	return trains
}

func trainsToArray() []*Train {
	var tArray []*Train = make([]*Train, 0)
	for _, v := range trains {
		tArray = append(tArray, v)
	}
	sort.Slice(tArray, func(i, j int) bool {
		return tArray[i].Id < tArray[j].Id
	})
	return tArray
}

func loadTrains() {
	var dbTrains []*Train = getTrains()

	for i := 0; i < len(dbTrains); i++ {
		train := dbTrains[i]
		trains[dbTrains[i].Id] = train
	}
}

func getTrainByAccessKey(accessKey uint32) *Train {
	for _, v := range trains {
		if v.AccessKey == accessKey {
			return v
		}
	}
	return nil
}

func (t *Train) isValid() bool {
	return !(len(t.Name) == 0 || len(t.Name) > 50 || t.SpeedSlow == 0 || t.SpeedHalf <= t.SpeedSlow || t.SpeedFast <= t.SpeedHalf)
}

func (t *Train) BeforeCreate(tx *gorm.DB) (err error) {
	var count int64
	result := tx.Model(&Train{}).Count(&count)
	if result.Error != nil {
		log("DB", result.Error.Error())
		return result.Error
	}
	if count == 0 {
		t.Id = 1
		return nil
	}

	var last *Train
	result = tx.Model(&Train{}).Order("\"id\" DESC").First(&last)
	if result.Error != nil {
		log("DB", result.Error.Error())
		return result.Error
	}
	if last == nil {
		t.Id = 1
	} else {
		t.Id = last.Id + 1
	}
	return nil
}

func (t *Train) initialize() {
	t.AccessKey = uint32(rand.Int31())
}

func (t *Train) insert() OkAndErrorCodeReturn {
	if !t.isValid() {
		sJson, _ := json.Marshal(t)
		return OkAndErrorCodeReturn{
			Ok:        false,
			ErrorCode: ERROR_CODE_DATA_NOT_VALID,
			ExtraData: []string{string(sJson)},
		}
	}
	t.initialize()

	result := dbOrm.Create(&t)
	if result.Error != nil {
		log("DB", result.Error.Error())
		return OkAndErrorCodeReturn{
			Ok:           false,
			ErrorCode:    ERROR_CODE_INTERNAL_DATABASE_ERROR,
			ErrorMessage: result.Error.Error(),
		}
	}
	trains[t.Id] = t
	sendUpdateToAppWebClients(WS_SC_COMMAND_SERVER_INSERT, t)
	return OkAndErrorCodeReturn{
		Ok: true,
	}
}

func (t *Train) update() OkAndErrorCodeReturn {
	if t.Id == 0 || !t.isValid() {
		tJson, _ := json.Marshal(t)
		return OkAndErrorCodeReturn{
			Ok:        false,
			ErrorCode: ERROR_CODE_DATA_NOT_VALID,
			ExtraData: []string{string(tJson)},
		}
	}

	train, ok := trains[t.Id]
	if !ok {
		return OkAndErrorCodeReturn{
			Ok:        false,
			ErrorCode: ERROR_CODE_COULD_NOT_FIND_RECORD,
			ExtraData: []string{string(t.Id)},
		}
	}

	train.Name = t.Name
	train.SpeedSlow = t.SpeedSlow
	train.SpeedHalf = t.SpeedHalf
	train.SpeedFast = t.SpeedFast

	result := dbOrm.Save(&train)
	if result.Error != nil {
		log("DB", result.Error.Error())
		return OkAndErrorCodeReturn{
			Ok:           false,
			ErrorCode:    ERROR_CODE_INTERNAL_DATABASE_ERROR,
			ErrorMessage: result.Error.Error(),
		}
	}

	sendUpdateToAppWebClients(WS_SC_COMMAND_SERVER_UPDATE, train)

	return OkAndErrorCodeReturn{
		Ok: true,
	}
}

func (t *Train) delete() OkAndErrorCodeReturn {
	if t.Id == 0 {
		return OkAndErrorCodeReturn{
			Ok:        false,
			ErrorCode: ERROR_CODE_DATA_NOT_VALID,
		}
	}

	_, ok := trains[t.Id]
	if !ok {
		return OkAndErrorCodeReturn{
			Ok:        false,
			ErrorCode: ERROR_CODE_COULD_NOT_FIND_RECORD,
			ExtraData: []string{string(t.Id)},
		}
	}

	delete(trains, t.Id)

	result := dbOrm.Model(&Train{}).Where("id = ?", t.Id).Delete(&Train{})
	if result.Error != nil {
		log("DB", result.Error.Error())
		return OkAndErrorCodeReturn{
			Ok:           false,
			ErrorCode:    ERROR_CODE_INTERNAL_DATABASE_ERROR,
			ErrorMessage: result.Error.Error(),
		}
	}

	sendUpdateToAppWebClients(WS_SC_COMMAND_SERVER_DELETE, t)

	return OkAndErrorCodeReturn{
		Ok: true,
	}
}

type ManuallyJumpStartTrain struct {
	TrainID   uint8 `json:"trainID"`
	StretchId uint8 `json:"stretchId"`
	SignalId  uint8 `json:"signalId"`
}

func (m *ManuallyJumpStartTrain) manuallyJumpStartTrain() OkAndErrorCodeReturn {
	if m.TrainID == 0 {
		return OkAndErrorCodeReturn{
			Ok:        false,
			ErrorCode: ERROR_CODE_DATA_NOT_VALID,
		}
	}

	train, ok := trains[m.TrainID]
	if !ok { // train not found
		return OkAndErrorCodeReturn{
			Ok:        false,
			ErrorCode: ERROR_CODE_COULD_NOT_FIND_RECORD,
			ExtraData: []string{string(m.TrainID)},
		}
	}

	stretch, ok := stretches[m.StretchId]
	if !ok { // stretch not found
		return OkAndErrorCodeReturn{
			Ok:        false,
			ErrorCode: ERROR_CODE_COULD_NOT_FIND_RECORD,
			ExtraData: []string{string(m.StretchId)},
		}
	}

	signal, ok := stretch.Signals[m.SignalId]
	if !ok { // signal not found
		return OkAndErrorCodeReturn{
			Ok:        false,
			ErrorCode: ERROR_CODE_COULD_NOT_FIND_RECORD,
			ExtraData: []string{string(m.SignalId)},
		}
	}

	// the train must be online
	if !train.Online {
		return OkAndErrorCodeReturn{
			Ok:        false,
			ErrorCode: ERROR_CODE_TRAIN_NOT_ONLINE,
		}
	}

	// train must either not have scanned any signal yet, or have been manually stopped
	if train.LastSignal != nil || train.Started {
		return OkAndErrorCodeReturn{
			Ok:        false,
			ErrorCode: ERROR_CODE_TRAIN_NOT_STOPPED,
		}
	}

	train.Started = true
	if train.LastSignal != nil {
		train.LastSignal.unOccupyZone()
	}
	train.LastSignal = nil
	train.LastSignalPassedAspect = nil
	train.StopAtSignal = false
	train.SignalToStopAt = nil

	train.enterZone(signal)

	jsonStr, _ := json.Marshal(m)
	logEventWithDetails(EVENT_LOG_TYPE_JUMP_START_TRAIN, string(jsonStr))

	return OkAndErrorCodeReturn{
		Ok: true,
	}
}

func (t *Train) enterZone(signal *Signal) {
	// Is there a next zone? If there isn't, then don't continue
	if signal == nil || signal.NextSignal == nil {
		fmt.Println("STOP 1")
		if signal == nil {
			fmt.Println("signal is null")
		} else {
			fmt.Println(signal.Name)
			if signal.NextSignal == nil {
				fmt.Println("nextSignal is null")
			} else {
				fmt.Println(signal.NextSignal.Name)
			}
		}
		t.stopTrain()
		if t.LastSignal != nil {
			t.LastSignal.unOccupyZone()
		}
		t.LastSignal = signal
		t.Started = false
		t.StopAtSignal = false
		t.SignalToStopAt = nil
		signal.ZoneOccupiedMUTEX.Lock()
		signal.ZoneOccupied = true
		signal.ZoneOccupiedBy = t
		signal.signalAspectChangedCalculate()
		go sendUpdateToAppWebClients(WS_SC_COMMAND_SERVER_UPDATE, t)
		return
	}

	lastLastSignal := t.LastSignal
	lastLastSignalName := ""
	if lastLastSignal != nil {
		lastLastSignalName = t.LastSignal.Name
	}
	// Wait to enter the next zone
	var zoneEntered bool = false
	for !zoneEntered {
		fmt.Println("trainAttemptToEnterZone", lastLastSignalName)
		aspect, speedLimit, needsToBeSwitched := signal.trainAttemptToEnterZone(t)
		fmt.Println("trainAttemptToEnterZone", aspect, speedLimit)
		if aspect != SIGNAL_DANGER {
			if lastLastSignal != nil {
				fmt.Println(t.Name, "::", lastLastSignal.Name, "->", signal.Name)
			}
			t.LastSignalPassedAspect = &aspect
			t.startTrain(t.calcTrainSpeedOnSignal(aspect, speedLimit))
			go sendUpdateToAppWebClients(WS_SC_COMMAND_SERVER_UPDATE, t)
			zoneEntered = true
			fmt.Println("Zone entered!")
		} else {
			fmt.Println("STOP 2")
			t.stopTrain()
			if needsToBeSwitched {
				t.SwitchAttempt = 0
				if signal.Switch {
					t.switchSwitchPosition(signal)
				}
			}
			go sendUpdateToAppWebClients(WS_SC_COMMAND_SERVER_UPDATE, t)
			signal.trainAwaitForZoneToFree(t)
		}
	}
}

func (t *Train) calcTrainSpeed(speedLimit uint8) uint8 {
	switch speedLimit {
	case 0:
		return t.SpeedSlow
	case 1:
		return t.SpeedHalf
	case 2:
		return t.SpeedFast
	default:
		return 0
	}
}

func (t *Train) calcTrainSpeedOnSignal(signalAspect SignalAspect, speedLimit uint8) uint8 {
	absoluteTrainSpeed := t.calcTrainSpeed(speedLimit)

	switch signalAspect {
	case SIGNAL_CLEAR:
		fallthrough
	case SIGNAL_PRELIMINARY_CAUTION:
		return absoluteTrainSpeed
	case SIGNAL_CAUTION:
		return minUInt8(t.SpeedHalf, absoluteTrainSpeed)
	default:
		return 0
	}
}

func (t *Train) startTrain(speed uint8) {
	fmt.Println("startTrain", speed)
	var message []byte = make([]byte, 0)
	message = append(message, GC_TI_FORWARD)
	message = append(message, speed)
	t.sendMessageToTrain(message)

	go sendUpdateToAppWebClients(WS_SC_COMMAND_SERVER_UPDATE, t)
}

func (t *Train) requestStopTrain() {
	if t.LastSignal != nil {
		t.LastSignal.unOccupyZone()
	}
	t.LastSignal = nil
	t.LastSignalPassedAspect = nil
	t.Started = false
	t.StopAtSignal = false
	t.SignalToStopAt = nil
	t.stopTrain()

	jsonStr, _ := json.Marshal(t.Id)
	logEventWithDetails(EVENT_LOG_TYPE_REQUEST_STOP_TRAIN, string(jsonStr))
}

func (t *Train) stopTrain() {
	var message []byte = make([]byte, 0)
	message = append(message, GC_TI_FAST_STOP)
	t.sendMessageToTrain(message)

	sendUpdateToAppWebClients(WS_SC_COMMAND_SERVER_UPDATE, t)
}

func (t *Train) switchSwitchPosition(s *Signal) {
	if !s.Switch || !s.QueuedForSwitching {
		return
	}
	s.CurrentlySwitching = true
	t.SwitchAttempt++
	go sendUpdateToAppWebClients(WS_SC_COMMAND_SERVER_UPDATE, s)

	var message []byte = make([]byte, 0)
	if s.Passthrough {
		message = append(message, GC_TI_SWITCH_DETOUR)
	} else {
		message = append(message, GC_TI_SWITCH_PASSTHROUGH)
	}
	t.sendMessageToTrain(message)
}

func (t *Train) onPositionSwitchedSuccessfully() {
	fmt.Println("onPositionSwitchedSuccessfully")
	if t.LastSignal == nil || !t.LastSignal.Switch {
		return
	}
	t.LastSignal.QueuedForSwitching = false
	t.LastSignal.CurrentlySwitching = false
	t.LastSignal.Passthrough = !t.LastSignal.Passthrough
	go sendUpdateToAppWebClients(WS_SC_COMMAND_SERVER_UPDATE, t.LastSignal)
	t.LastSignal.SwitchMUTEX.Unlock()
}

func (t *Train) onPositionSwitchedFailure() {
	fmt.Println("onPositionSwitchedFailure")
	if t.LastSignal != nil && t.LastSignal.Switch && t.SwitchAttempt >= settings.Server.SwitchingMaximumAttempts {
		t.LastSignal.SwitchFailure = true
		go sendUpdateToAppWebClients(WS_SC_COMMAND_SERVER_UPDATE, t.LastSignal)
		return
	}
	t.switchSwitchPosition(t.LastSignal)
}

func (t *Train) sendMessageToTrain(message []byte) {
	if !t.Online {
		return
	}
	var size []byte = make([]byte, 1)
	size[0] = byte(len(message))
	t.Conn.Write(size)

	t.Conn.Write(message)
}
