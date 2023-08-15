/*
This file is part of Arduino Model Train Controller V3 (https://github.com/Itzanh/arduino_model_train_controller_v3).

Arduino Model Train Controller V3 is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3 of the License.

Model Train Controller is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with Model Train Controller. If not, see <https://www.gnu.org/licenses/>.
*/

package main

type OkAndErrorCodeReturn struct {
	Ok           bool     `json:"ok"`
	ErrorCode    uint8    `json:"errorCode"`
	ExtraData    []string `json:"extraData"`
	ErrorMessage string   `json:"errorMessage"`
}

func minUInt8(x uint8, y uint8) uint8 {
	if x < y {
		return x
	}
	return y
}

const (
	ERROR_CODE_OK                       = iota
	ERROR_CODE_JSON_COULD_NOT_UNMARSHAL = iota
	ERROR_CODE_DATA_NOT_VALID           = iota
	ERROR_CODE_INTERNAL_DATABASE_ERROR  = iota
	ERROR_CODE_COULD_NOT_FIND_RECORD    = iota
	ERROR_CODE_TRAIN_NOT_STOPPED        = iota
	ERROR_CODE_TRAIN_NOT_STARTED        = iota
	ERROR_CODE_TRAIN_NOT_ONLINE         = iota
	ERROR_CODE_TRAIN_NOT_STOP_AT_SIGNAL = iota
)
