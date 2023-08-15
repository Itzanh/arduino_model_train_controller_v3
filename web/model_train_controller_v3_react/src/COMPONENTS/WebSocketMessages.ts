/*
This file is part of Arduino Model Train Controller V3 (https://github.com/Itzanh/arduino_model_train_controller_v3).

Arduino Model Train Controller V3 is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3 of the License.

Model Train Controller is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with Model Train Controller. If not, see <https://www.gnu.org/licenses/>.
*/

enum WebSocketMessages {
    WS_CS_TRAIN                                = "TRAIN",
	WS_CS_SIGNAL                               = "SIGNAL",
	WS_CS_MANUALLY_JUMP_START_TRAIN            = "MANUALLY_JUMP_START_TRAIN",
	WS_CS_MANUALLY_STOP_TRAIN                  = "MANUALLY_STOP_TRAIN",
	WS_CS_MANUALLY_STOP_TRAIN_AT_SIGNAL        = "MANUALLY_STOP_TRAIN_AT_SIGNAL",
	WS_CS_MANUALLY_CANCEL_STOP_TRAIN_AT_SIGNAL = "MANUALLY_CANCEL_STOP_TRAIN_AT_SIGNAL",
	WS_CS_MOVE_SIGNAL_UP                       = "MOVE_SIGNAL_UP",
	WS_CS_MOVE_SIGNAL_DOWN                     = "MOVE_SIGNAL_DOWN",
}

export default WebSocketMessages;
