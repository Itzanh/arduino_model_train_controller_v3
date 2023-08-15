/*
This file is part of Arduino Model Train Controller V3 (https://github.com/Itzanh/arduino_model_train_controller_v3).

Arduino Model Train Controller V3 is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3 of the License.

Model Train Controller is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with Model Train Controller. If not, see <https://www.gnu.org/licenses/>.
*/

import EventLogType from "./EventLogType";



class EventLog {
    public id: number;
    public time: Date;
    public type: EventLogType;
    public details: string;



    constructor(log: any) {
        if (log === undefined) {
            return;
        }
        this.id = log.id;
        this.time = log.time;
        this.type = log.type;
        this.details = log.details;
    }
}



export default EventLog;
