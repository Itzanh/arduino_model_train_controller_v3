/*
This file is part of Arduino Model Train Controller V3 (https://github.com/Itzanh/arduino_model_train_controller_v3).

Arduino Model Train Controller V3 is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3 of the License.

Model Train Controller is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with Model Train Controller. If not, see <https://www.gnu.org/licenses/>.
*/

package main

import (
	"time"

	"gorm.io/gorm"
)

type EventLogType int16

const (
	EVENT_LOG_TYPE_UNKNOWN                               = iota
	EVENT_LOG_TYPE_START                                 = iota
	EVENT_LOG_TYPE_JUMP_START_TRAIN                      = iota
	EVENT_LOG_TYPE_REQUEST_STOP_TRAIN                    = iota
	EVENT_LOG_TYPE_TRAIN_REED_SWITCH_TRIGGERED           = iota
	EVENT_LOG_TYPE_TRAIN_PASS_CLEAR_SIGNAL               = iota
	EVENT_LOG_TYPE_TRAIN_PASS_PRELIMINARY_CAUTION_SIGNAL = iota
	EVENT_LOG_TYPE_TRAIN_PASS_CAUTION_SIGNAL             = iota
	EVENT_LOG_TYPE_TRAIN_STOP_AT_DANGER_SIGNAL           = iota
	EVENT_LOG_TYPE_SIGNAL_LOCKED                         = iota
	EVENT_LOG_TYPE_SIGNAL_UNLOCKED                       = iota
	EVENT_LOG_TYPE_SWITCH_QUEUED_FOR_SWITCHING           = iota
	EVENT_LOG_TYPE_SWITCH_STARTED_SWITCHING              = iota
	EVENT_LOG_TYPE_SWITCH_SUCCESSFULLY_SWITCHED          = iota
	EVENT_LOG_TYPE_SWITCH_FAILED_SWITCHING               = iota
)

type EventLog struct {
	Id      int32        `json:"id" gorm:"primaryKey;column:id;type:integer;not null:true"`
	Time    time.Time    `json:"time" gorm:"column:time;type:timestamp(3) with time zone; not null:true;index:event_log_time,sort:DESC"`
	Type    EventLogType `json:"type" gorm:"column:type;type:smallint;not null:true;index:event_log_type"`
	Details string       `json:"details" gorm:"column:details;type:jsonb;not null:true"`
}

func (EventLog) TableName() string {
	return "event_log"
}

type EventLogQuery struct {
	TimeStart *time.Time    `json:"timeStart"`
	TimeEnd   *time.Time    `json:"timeEnd"`
	Type      *EventLogType `json:"type"`
}

func (q *EventLogQuery) getEventLog() []EventLog {
	var logs []EventLog = make([]EventLog, 0)
	query := dbOrm.Model(&EventLog{})

	if q.TimeStart != nil {
		query = query.Where("time >= ?", q.TimeStart)
	}
	if q.TimeEnd != nil {
		query = query.Where("time <= ?", q.TimeEnd)
	}
	if q.Type != nil {
		query = query.Where("type = ?", q.Type)
	}

	result := query.Order("time DESC").Find(&logs)
	if result.Error != nil {
		log("DB", result.Error.Error())
	}

	return logs
}

func (l *EventLog) BeforeCreate(tx *gorm.DB) (err error) {
	var count int64
	result := tx.Model(&EventLog{}).Count(&count)
	if result.Error != nil {
		log("DB", result.Error.Error())
		return result.Error
	}
	if count == 0 {
		l.Id = 1
		return nil
	}

	var last *EventLog
	result = tx.Model(&EventLog{}).Order("\"id\" DESC").First(&last)
	if result.Error != nil {
		log("DB", result.Error.Error())
		return result.Error
	}
	if last == nil {
		l.Id = 1
	} else {
		l.Id = last.Id + 1
	}
	return nil
}

func (l *EventLog) insert() OkAndErrorCodeReturn {
	result := dbOrm.Create(&l)
	if result.Error != nil {
		log("DB", result.Error.Error())
		return OkAndErrorCodeReturn{
			Ok:           false,
			ErrorCode:    ERROR_CODE_INTERNAL_DATABASE_ERROR,
			ErrorMessage: result.Error.Error(),
		}
	}
	return OkAndErrorCodeReturn{
		Ok: true,
	}
}

func logEvent(logType EventLogType) {
	el := &EventLog{
		Time:    time.Now(),
		Type:    logType,
		Details: "{}",
	}
	el.insert()
}

func logEventWithDetails(logType EventLogType, details string) {
	el := &EventLog{
		Time:    time.Now(),
		Type:    logType,
		Details: details,
	}
	el.insert()
}
