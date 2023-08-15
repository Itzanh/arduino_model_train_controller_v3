/*
This file is part of Arduino Model Train Controller V3 (https://github.com/Itzanh/arduino_model_train_controller_v3).

Arduino Model Train Controller V3 is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3 of the License.

Model Train Controller is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with Model Train Controller. If not, see <https://www.gnu.org/licenses/>.
*/

package main

import (
	"encoding/json"
	"sort"

	"gorm.io/gorm"
)

type StretchType uint8

const (
	STRETCH_TYPE_UNKNOWN              StretchType = iota
	STRETCH_TYPE_ONE_WAY_SINGLE_TRACK StretchType = iota
	STRETCH_TYPE_INVALID              StretchType = iota
)

var stretches map[uint8]*Stretch = make(map[uint8]*Stretch)

type Stretch struct {
	Id      uint8             `json:"id" gorm:"primaryKey;column:id;type:smallint;not null:true"`
	Name    string            `json:"name" gorm:"column:name;type:character varying(50);not null:true"`
	Type    StretchType       `json:"type" gorm:"column:type;type:smallint;not null:true"`
	Signals map[uint8]*Signal `json:"-" gorm:"-"`
}

func (Stretch) TableName() string {
	return "stretch"
}

func (Stretch) WebSocketCommandName() string {
	return WS_CS_STRETCH
}

func getStretches() []*Stretch {
	var stretches []*Stretch = make([]*Stretch, 0)
	result := dbOrm.Model(&Stretch{}).Order("id ASC").Find(&stretches)
	if result.Error != nil {
		log("DB", result.Error.Error())
	}

	return stretches
}

func stretchesToArray() []*Stretch {
	var sArray []*Stretch = make([]*Stretch, 0)
	for _, v := range stretches {
		sArray = append(sArray, v)
	}
	sort.Slice(sArray, func(i, j int) bool {
		return sArray[i].Id < sArray[j].Id
	})
	return sArray
}

func loadStretches() {
	var dbStretches []*Stretch = getStretches()

	for i := 0; i < len(dbStretches); i++ {
		stretch := dbStretches[i]
		stretch.initialize()
		dbSignals := getSignalsByStretchId(stretch.Id)
		for _, v := range dbSignals {
			v.initialize()
			stretch.Signals[v.Id] = v
			signals = append(signals, v)
		}

		stretches[dbStretches[i].Id] = stretch
	}
}

func (s *Stretch) BeforeCreate(tx *gorm.DB) (err error) {
	var count int64
	result := tx.Model(&Stretch{}).Count(&count)
	if result.Error != nil {
		log("DB", result.Error.Error())
		return result.Error
	}
	if count == 0 {
		s.Id = 1
		return nil
	}

	var last *Stretch
	result = tx.Model(&Stretch{}).Order("\"id\" DESC").First(&last)
	if result.Error != nil {
		log("DB", result.Error.Error())
		return result.Error
	}
	if last == nil {
		s.Id = 1
	} else {
		s.Id = last.Id + 1
	}
	return nil
}

func (s *Stretch) isValid() bool {
	return !(len(s.Name) == 0 || len(s.Name) > 50 || s.Type <= STRETCH_TYPE_UNKNOWN || s.Type >= STRETCH_TYPE_INVALID)
}

func (s *Stretch) initialize() {
	s.Signals = make(map[uint8]*Signal)
}

func (s *Stretch) insert() OkAndErrorCodeReturn {
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
	stretches[s.Id] = s
	sendUpdateToAppWebClients(WS_SC_COMMAND_SERVER_INSERT, s)
	return OkAndErrorCodeReturn{
		Ok: true,
	}
}

func (s *Stretch) update() OkAndErrorCodeReturn {
	if s.Id == 0 || !s.isValid() {
		tJson, _ := json.Marshal(s)
		return OkAndErrorCodeReturn{
			Ok:        false,
			ErrorCode: ERROR_CODE_DATA_NOT_VALID,
			ExtraData: []string{string(tJson)},
		}
	}

	stretch, ok := stretches[s.Id]
	if !ok {
		return OkAndErrorCodeReturn{
			Ok:        false,
			ErrorCode: ERROR_CODE_COULD_NOT_FIND_RECORD,
			ExtraData: []string{string(s.Id)},
		}
	}

	stretch.Name = s.Name
	stretch.Type = s.Type

	result := dbOrm.Save(&stretch)
	if result.Error != nil {
		log("DB", result.Error.Error())
		return OkAndErrorCodeReturn{
			Ok:           false,
			ErrorCode:    ERROR_CODE_INTERNAL_DATABASE_ERROR,
			ErrorMessage: result.Error.Error(),
		}
	}

	sendUpdateToAppWebClients(WS_SC_COMMAND_SERVER_UPDATE, stretch)

	return OkAndErrorCodeReturn{
		Ok: true,
	}
}

func (s *Stretch) delete() OkAndErrorCodeReturn {
	if s.Id == 0 {
		return OkAndErrorCodeReturn{
			Ok:        false,
			ErrorCode: ERROR_CODE_DATA_NOT_VALID,
		}
	}

	stretch, ok := stretches[s.Id]
	if !ok {
		return OkAndErrorCodeReturn{
			Ok:        false,
			ErrorCode: ERROR_CODE_COULD_NOT_FIND_RECORD,
			ExtraData: []string{string(s.Id)},
		}
	}

	delete(stretch.Signals, s.Id)

	result := dbOrm.Model(&Stretch{}).Where("id = ?", s.Id).Delete(&Stretch{})
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
