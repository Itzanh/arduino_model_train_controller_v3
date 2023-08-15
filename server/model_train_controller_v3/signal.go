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
	"sync"

	"gorm.io/gorm"
)

type SignalAspect uint8

const (
	SIGNAL_CLEAR               SignalAspect = iota
	SIGNAL_PRELIMINARY_CAUTION SignalAspect = iota
	SIGNAL_CAUTION             SignalAspect = iota
	SIGNAL_DANGER              SignalAspect = iota
)

var signals []*Signal = make([]*Signal, 0)

type Signal struct {
	StretchId              uint8        `json:"stretchId" gorm:"primaryKey;column:stretch;type:smallint;not null:true"`
	Stretch                *Stretch     `json:"-" gorm:"foreignKey:StretchId;references:Id"`
	Id                     uint8        `json:"id" gorm:"primaryKey;column:id;type:smallint;not null:true"`
	Name                   string       `json:"name" gorm:"column:name;type:character varying(50);not null:true"`
	SpeedLimit             uint8        `json:"speedLimit" gorm:"column:speed_limit;type:smallint;not null:true"` // 0 = slow, 1 = half, 2 = fast
	Switch                 bool         `json:"switch" gorm:"column:switch;type:boolean;not null:true"`
	Splitter               *bool        `json:"splitter" gorm:"column:splitter;type:boolean"` // Null: not switch, True: splitter, False: merger
	StretchDetourId        *uint8       `json:"stretchDetourId" gorm:"column:stretch_detour;type:smallint"`
	SignalDetourId         *uint8       `json:"signalDetourId" gorm:"column:signal_detour;type:smallint"`
	SignalDetour           *Signal      `json:"-" gorm:"foreignKey:StretchDetourId,SignalDetourId;references:StretchId,Id"`
	LoopsBack              bool         `json:"loopsBack" gorm:"column:loops_back;type:boolean;not null:true"`
	StretchLoopBackId      *uint8       `json:"stretchLoopBackId" gorm:"column:stretch_loop_back;type:smallint"`
	SignalLoopBackId       *uint8       `json:"signalLoopBackId" gorm:"column:signal_loop_back;type:smallint"`
	SignalLoopBack         *Signal      `json:"-" gorm:"foreignKey:StretchLoopBackId,SignalLoopBackId;references:StretchId,Id"`
	Passthrough            bool         `json:"passthrough" gorm:"-"` // true = passthrough, false = detour
	QueuedForSwitching     bool         `json:"queuedForSwitching" gorm:"-"`
	CurrentlySwitching     bool         `json:"currentlySwitching" gorm:"-"`
	SwitchFailure          bool         `json:"switchFailure" gorm:"-"`
	SwitchMUTEX            *sync.Mutex  `json:"-" gorm:"-"`
	PreviousSignal         *Signal      `json:"-" gorm:"-"`
	NextSignal             *Signal      `json:"-" gorm:"-"`
	ZoneOccupiedCheckMUTEX *sync.Mutex  `json:"-" gorm:"-"`
	ZoneOccupiedMUTEX      *sync.Mutex  `json:"-" gorm:"-"`
	ZoneOccupied           bool         `json:"-" gorm:"-"`
	ZoneOccupiedBy         *Train       `json:"-" gorm:"-"`
	ForceRed               bool         `json:"forceRed" gorm:"-"`
	Aspect                 SignalAspect `json:"aspect" gorm:"-"`
}

func (Signal) TableName() string {
	return "signal"
}

func (Signal) WebSocketCommandName() string {
	return WS_CS_SIGNAL
}

func getSignalsByStretchId(stretchId uint8) []*Signal {
	var signals []*Signal = make([]*Signal, 0)
	result := dbOrm.Model(&Signal{}).Where("stretch = ?", stretchId).Order("stretch ASC, id ASC").Find(&signals)
	if result.Error != nil {
		log("DB", result.Error.Error())
	}

	return signals
}

func loadSignals() {
	for _, v := range signals {
		fmt.Println(v.Id, v.Name)
		if v.Id > 1 {
			v.PreviousSignal = stretches[v.StretchId].Signals[v.Id-1]
		}
		if v.NextSignal == nil {
			v.NextSignal = stretches[v.StretchId].Signals[v.Id+1]
		}
		if v.Switch {
			v.SignalDetour = stretches[*v.StretchDetourId].Signals[*v.SignalDetourId]
			if *v.Splitter {
				v.SignalDetour.PreviousSignal = v
			} else { // Merger
				v.SignalDetour.NextSignal = v
			}
		}
		if v.LoopsBack {
			v.NextSignal = stretches[*v.StretchLoopBackId].Signals[*v.SignalLoopBackId]
			v.NextSignal.PreviousSignal = v
		}
		v.Stretch = stretches[v.StretchId]
	}
	for _, v := range signals {
		if v.NextSignal == nil {
			v.Aspect = SIGNAL_DANGER
		} else {
			v.Aspect = SIGNAL_CLEAR
		}
	}
}

func (s *Signal) initialize() {
	s.ZoneOccupiedCheckMUTEX = &sync.Mutex{}
	s.ZoneOccupiedMUTEX = &sync.Mutex{}
	s.ZoneOccupied = false
	s.ZoneOccupiedBy = nil
	s.Passthrough = true
	if s.Switch {
		s.SwitchMUTEX = &sync.Mutex{}
		s.SwitchMUTEX.Lock() // The mutex starts locked, and only gets unlocked once switched
		s.QueuedForSwitching = false
		s.Passthrough = true
	}
	if s.NextSignal == nil {
		s.Aspect = SIGNAL_DANGER
	}
}

func (s *Signal) BeforeCreate(tx *gorm.DB) (err error) {
	var count int64
	result := tx.Model(&Signal{}).Where("stretch = ?", s.StretchId).Count(&count)
	if result.Error != nil {
		log("DB", result.Error.Error())
		return result.Error
	}
	if count == 0 {
		s.Id = 1
		return nil
	}

	var lastSignal *Signal
	result = tx.Model(&Signal{}).Where("stretch = ?", s.StretchId).Order("\"id\" DESC").First(&lastSignal)
	if result.Error != nil {
		log("DB", result.Error.Error())
		return result.Error
	}
	if lastSignal == nil {
		s.Id = 1
	} else {
		s.Id = lastSignal.Id + 1
	}
	return nil
}

func (s *Signal) getNextSignal() *Signal {
	if s.Switch && *s.Splitter {
		if s.QueuedForSwitching {
			if s.Passthrough { // Passthrough is what it is now (the inverse of what it will be when the train shifts it)
				return s.SignalDetour
			}
		} else if !s.Passthrough {
			return s.SignalDetour
		}
	}
	return s.NextSignal
}

// Returns: The aspect of the signal that the train is about to pass, the speed limit of the zone (0 = slow, 1 = half, 2 = fast), and if the signal needs to be switched.
// If the signal is at Danger, the speed will always be null.
// Regardless of the aspect of the signal, the speed will be null is the zone doesn't have a specific speed limit set, and the speed limit will never be zero.
func (s *Signal) trainAttemptToEnterZone(train *Train) (SignalAspect, uint8, bool) {
	nextSignal := s.getNextSignal()

	// fmt.Println("trainAttemptToEnterZone*1", s.Name)
	nextSignal.ZoneOccupiedCheckMUTEX.Lock()
	// fmt.Println("trainAttemptToEnterZone*2")
	defer nextSignal.ZoneOccupiedCheckMUTEX.Unlock()

	if s.ZoneOccupied {
		if s.ZoneOccupiedBy != nil && (*s.ZoneOccupiedBy).Id == (*train).Id { // !!!
			if s.Switch && !s.Passthrough {
				return SIGNAL_CAUTION, 0, false // 0 = Slow
			}
			return SIGNAL_CLEAR, s.SpeedLimit, false
		} else {
			return SIGNAL_DANGER, 0, false
		}
	} else if nextSignal.ZoneOccupied {
		if s.ZoneOccupiedBy != nil && (*nextSignal.ZoneOccupiedBy).Id == (*train).Id { // !!!
			return SIGNAL_CLEAR, s.SpeedLimit, false
		} else {
			// fmt.Println("trainAttemptToEnterZone**3", s.Name)
			s.ZoneOccupiedMUTEX.Lock()
			// fmt.Println("trainAttemptToEnterZone**4")
			train.Started = true
			s.ZoneOccupied = true
			s.ZoneOccupiedBy = train
			if train.LastSignal != nil {
				train.LastSignal.unOccupyZone()
			}
			train.LastSignal = s
			s.signalAspectChangedCalculate()
			return SIGNAL_DANGER, 0, false
		}
	} else {
		// fmt.Println("trainAttemptToEnterZone*3", s.Name)
		s.ZoneOccupiedMUTEX.Lock()
		// fmt.Println("trainAttemptToEnterZone*4")
		train.Started = true
		s.ZoneOccupied = true
		s.ZoneOccupiedBy = train
		if train.LastSignal != nil {
			train.LastSignal.unOccupyZone()
		}
		lastSignal := train.LastSignal
		train.LastSignal = s
		// Are we about to enter a splitter that we need to switch?
		if s.Switch { // && s.QueuedForSwitching
			if s.QueuedForSwitching {
				return SIGNAL_DANGER, 0, true // The train should stop to switch the signal
			} else if !*s.Splitter && ((s.Passthrough && lastSignal == s.SignalDetour) || (!s.Passthrough && lastSignal != s.SignalDetour)) {
				// The train can't pass because the merger is not in the correct position.
				fmt.Println("The train can't pass because the merger is not in the correct position.", s.QueuedForSwitching, s.Name, lastSignal.Name)
				s.QueuedForSwitching = true
				return SIGNAL_DANGER, 0, true // The train should stop to switch the signal
			}
			// return SIGNAL_DANGER, 0, true // The train should stop to switch the signal
		}
		lastAspect := s.Aspect
		s.signalAspectChangedCalculate()
		return lastAspect, s.SpeedLimit, false
	}
}

func (s *Signal) trainAwaitForZoneToFree(train *Train) {
	if s.Switch && s.QueuedForSwitching {
		fmt.Println("Waiting for switching")
		s.SwitchMUTEX.Lock()
		fmt.Println("DONE Waiting for switching")
	} else if s.NextSignal.Switch && !*s.NextSignal.Splitter {
		fmt.Println("Waiting for switching")
		s.NextSignal.SwitchMUTEX.Lock()
		fmt.Println("DONE Waiting for switching")
	} else {
		s.getNextSignal().ZoneOccupiedMUTEX.Lock()
		defer s.getNextSignal().ZoneOccupiedMUTEX.Unlock()
	}
}

func (s *Signal) unOccupyZone() {
	s.ZoneOccupiedMUTEX.Unlock()
	s.ZoneOccupied = false
	s.ZoneOccupiedBy = nil
	s.signalAspectChangedCalculate()
}

func (s *Signal) signalAspectChangedCalculate() {
	s.calculateSignalAspect()
	if s.PreviousSignal != nil {
		s.PreviousSignal.calculateSignalAspect()
		if s.PreviousSignal.PreviousSignal != nil {
			s.PreviousSignal.PreviousSignal.calculateSignalAspect()
		}
	}
}

func (s *Signal) calculateSignalAspect() {
	if s.ZoneOccupied { // If the zone is currently being occupied by a train, set the aspect to danger
		s.Aspect = SIGNAL_DANGER
	} else if s.NextSignal != nil && s.NextSignal.ZoneOccupied { // If there is a next zone, and it is occupied, set the aspect to caution
		s.Aspect = SIGNAL_CAUTION
	} else if s.NextSignal != nil && s.NextSignal.NextSignal != nil && s.NextSignal.NextSignal.ZoneOccupied { // If there is a next zone to the next zone, and it is occupied, set the aspect to preliminary caution
		s.Aspect = SIGNAL_PRELIMINARY_CAUTION
	} else { // Otherwise (no next-to-next signal, or that signal clear) set the aspect to clear
		s.Aspect = SIGNAL_CLEAR
	}
	go sendUpdateToAppWebClients(WS_SC_COMMAND_SERVER_UPDATE, s)
}

type SignalId struct {
	StretchId uint8 `json:"stretchId"`
	Id        uint8 `json:"id"`
}

func (s *SignalId) isValid() bool {
	return !(s.StretchId == 0 || s.Id == 0)
}

func (s *SignalId) getSignal() *Signal {
	stretch, ok := stretches[s.StretchId]
	if !ok {
		return nil
	}
	signal, ok := stretch.Signals[s.Id]
	if !ok {
		return nil
	}
	return signal
}

func (s *Signal) switchPassthrough() bool {
	fmt.Println("switchPassthrough")

	s.ZoneOccupiedCheckMUTEX.Lock()
	if s.ZoneOccupied {
		fmt.Println("CAN'T SWITCH ZONE OCCUPIED!")
		s.ZoneOccupiedCheckMUTEX.Unlock()
		return false
	}
	s.ZoneOccupiedCheckMUTEX.Unlock()

	if s.Passthrough || s.QueuedForSwitching {
		return false
	}
	s.QueuedForSwitching = true
	s.Aspect = SIGNAL_DANGER
	// s.ZoneOccupied = true

	// s.Passthrough = !s.Passthrough

	go sendUpdateToAppWebClients(WS_SC_COMMAND_SERVER_UPDATE, s)

	fmt.Println("switchPassthrough END")
	return true
}

func (s *Signal) switchDetour() bool {
	fmt.Println("switchDetour", s.StretchId, s.Id, s.Name)

	s.ZoneOccupiedCheckMUTEX.Lock()
	if s.ZoneOccupied {
		fmt.Println("CAN'T SWITCH ZONE OCCUPIED!")
		s.ZoneOccupiedCheckMUTEX.Unlock()
		return false
	}
	s.ZoneOccupiedCheckMUTEX.Unlock()

	if !s.Passthrough || s.QueuedForSwitching {
		return false
	}
	s.QueuedForSwitching = true
	s.Aspect = SIGNAL_DANGER

	go sendUpdateToAppWebClients(WS_SC_COMMAND_SERVER_UPDATE, s)

	fmt.Println("switchDetour END")
	return true
}

func (s *Signal) isValid() bool {
	return !(s.StretchId == 0 || len(s.Name) == 0 || len(s.Name) > 50 || s.SpeedLimit > 2 || (s.Switch && s.LoopsBack) || (s.Switch && (s.Splitter == nil || s.StretchDetourId == nil || s.SignalDetourId == nil) || (s.LoopsBack && (s.StretchLoopBackId == nil || s.SignalLoopBackId == nil || (s.StretchId == *s.StretchLoopBackId && s.Id == *s.SignalLoopBackId)))))
}

func (s *Signal) insert() OkAndErrorCodeReturn {
	if !s.isValid() {
		sJson, _ := json.Marshal(s)
		return OkAndErrorCodeReturn{
			Ok:        false,
			ErrorCode: ERROR_CODE_DATA_NOT_VALID,
			ExtraData: []string{string(sJson)},
		}
	}
	s.initialize()

	result := dbOrm.Create(&s)
	if result.Error != nil {
		log("DB", result.Error.Error())
		return OkAndErrorCodeReturn{
			Ok:           false,
			ErrorCode:    ERROR_CODE_INTERNAL_DATABASE_ERROR,
			ErrorMessage: result.Error.Error(),
		}
	}
	signals = append(signals, s)
	sendUpdateToAppWebClients(WS_SC_COMMAND_SERVER_INSERT, s)
	return OkAndErrorCodeReturn{
		Ok: true,
	}
}

func (s *Signal) update() OkAndErrorCodeReturn {
	if s.StretchId == 0 || s.Id == 0 || !s.isValid() {
		tJson, _ := json.Marshal(s)
		return OkAndErrorCodeReturn{
			Ok:        false,
			ErrorCode: ERROR_CODE_DATA_NOT_VALID,
			ExtraData: []string{string(tJson)},
		}
	}

	stretch, ok := stretches[s.StretchId]
	if !ok {
		return OkAndErrorCodeReturn{
			Ok:        false,
			ErrorCode: ERROR_CODE_COULD_NOT_FIND_RECORD,
			ExtraData: []string{string(s.Id)},
		}
	}
	signal, ok := stretch.Signals[s.Id]
	if !ok {
		return OkAndErrorCodeReturn{
			Ok:        false,
			ErrorCode: ERROR_CODE_COULD_NOT_FIND_RECORD,
			ExtraData: []string{string(s.Id)},
		}
	}

	if s.Switch {
		_, ok := stretches[*s.StretchDetourId]
		if !ok {
			return OkAndErrorCodeReturn{
				Ok:        false,
				ErrorCode: ERROR_CODE_COULD_NOT_FIND_RECORD,
				ExtraData: []string{string(s.Id)},
			}
		}
		_, ok = stretch.Signals[*s.SignalDetourId]
		if !ok {
			return OkAndErrorCodeReturn{
				Ok:        false,
				ErrorCode: ERROR_CODE_COULD_NOT_FIND_RECORD,
				ExtraData: []string{string(s.Id)},
			}
		}
	} // if s.Switch

	if s.LoopsBack {
		_, ok := stretches[*s.StretchLoopBackId]
		if !ok {
			return OkAndErrorCodeReturn{
				Ok:        false,
				ErrorCode: ERROR_CODE_COULD_NOT_FIND_RECORD,
				ExtraData: []string{string(s.Id)},
			}
		}
		_, ok = stretch.Signals[*s.SignalLoopBackId]
		if !ok {
			return OkAndErrorCodeReturn{
				Ok:        false,
				ErrorCode: ERROR_CODE_COULD_NOT_FIND_RECORD,
				ExtraData: []string{string(s.Id)},
			}
		}
	} // if s.LoopsBack

	signal.Name = s.Name
	signal.SpeedLimit = s.SpeedLimit
	signal.Switch = s.Switch
	signal.LoopsBack = s.LoopsBack

	if s.Switch {
		signal.Splitter = s.Splitter
		signal.StretchDetourId = s.StretchDetourId
		signal.SignalDetourId = s.SignalDetourId
		signal.SignalDetour = stretches[*s.StretchDetourId].Signals[*signal.SignalDetourId]
	} else {
		signal.Splitter = nil
		signal.StretchDetourId = nil
		signal.SignalDetourId = nil
		signal.SignalDetour = nil
	}

	if s.LoopsBack {
		signal.StretchLoopBackId = s.StretchLoopBackId
		signal.SignalLoopBackId = s.SignalLoopBackId
		signal.SignalLoopBack = stretches[*s.StretchLoopBackId].Signals[*signal.SignalLoopBackId]
	} else {
		signal.StretchLoopBackId = nil
		signal.SignalLoopBackId = nil
		signal.SignalLoopBack = nil
	}

	result := dbOrm.Model(&Signal{}).Where("stretch = ? AND id = ?", s.StretchId, s.Id).Limit(1).Updates(map[string]interface{}{
		"name":              signal.Name,
		"speed_limit":       signal.SpeedLimit,
		"switch":            signal.Switch,
		"splitter":          signal.Splitter,
		"stretch_detour":    signal.StretchDetourId,
		"signal_detour":     signal.SignalDetourId,
		"loops_back":        signal.LoopsBack,
		"stretch_loop_back": signal.StretchLoopBackId,
		"signal_loop_back":  signal.SignalLoopBackId,
	})
	if result.Error != nil {
		log("DB", result.Error.Error())
		return OkAndErrorCodeReturn{
			Ok:           false,
			ErrorCode:    ERROR_CODE_INTERNAL_DATABASE_ERROR,
			ErrorMessage: result.Error.Error(),
		}
	}

	sendUpdateToAppWebClients(WS_SC_COMMAND_SERVER_UPDATE, signal)

	return OkAndErrorCodeReturn{
		Ok: true,
	}
}

func (s *Signal) delete() OkAndErrorCodeReturn {
	if s.StretchId == 0 || s.Id == 0 {
		return OkAndErrorCodeReturn{
			Ok:        false,
			ErrorCode: ERROR_CODE_DATA_NOT_VALID,
		}
	}

	stretch, ok := stretches[s.StretchId]
	if !ok {
		return OkAndErrorCodeReturn{
			Ok:        false,
			ErrorCode: ERROR_CODE_COULD_NOT_FIND_RECORD,
			ExtraData: []string{string(s.Id)},
		}
	}
	_, ok = stretch.Signals[s.Id]
	if !ok {
		return OkAndErrorCodeReturn{
			Ok:        false,
			ErrorCode: ERROR_CODE_COULD_NOT_FIND_RECORD,
			ExtraData: []string{string(s.Id)},
		}
	}

	delete(stretch.Signals, s.Id)

	result := dbOrm.Model(&Signal{}).Where("stretch = ? AND id = ?", s.StretchId, s.Id).Delete(&Signal{})
	if result.Error != nil {
		log("DB", result.Error.Error())
		return OkAndErrorCodeReturn{
			Ok:           false,
			ErrorCode:    ERROR_CODE_INTERNAL_DATABASE_ERROR,
			ErrorMessage: result.Error.Error(),
		}
	}

	sendUpdateToAppWebClients(WS_SC_COMMAND_SERVER_DELETE, s)

	return OkAndErrorCodeReturn{
		Ok: true,
	}
}

func (s *Signal) forceRed() OkAndErrorCodeReturn {
	s.ZoneOccupiedCheckMUTEX.Lock()
	defer s.ZoneOccupiedCheckMUTEX.Unlock()

	if s.ForceRed || s.ZoneOccupied {
		return OkAndErrorCodeReturn{
			Ok:        false,
			ErrorCode: ERROR_CODE_DATA_NOT_VALID,
		}
	}

	s.ZoneOccupiedMUTEX.Lock()
	s.ForceRed = true
	s.ZoneOccupied = true
	s.Aspect = SIGNAL_DANGER
	s.signalAspectChangedCalculate()

	return OkAndErrorCodeReturn{
		Ok: true,
	}
}

func (s *Signal) unforceRed() OkAndErrorCodeReturn {
	s.ZoneOccupiedCheckMUTEX.Lock()
	defer s.ZoneOccupiedCheckMUTEX.Unlock()

	if !s.ForceRed {
		return OkAndErrorCodeReturn{
			Ok:        false,
			ErrorCode: ERROR_CODE_DATA_NOT_VALID,
		}
	}

	s.ForceRed = false
	s.ZoneOccupied = false
	s.Aspect = SIGNAL_CLEAR
	s.signalAspectChangedCalculate()
	s.ZoneOccupiedMUTEX.Unlock()

	return OkAndErrorCodeReturn{
		Ok: true,
	}
}
