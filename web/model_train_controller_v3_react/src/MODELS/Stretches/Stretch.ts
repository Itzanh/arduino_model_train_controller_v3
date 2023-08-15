/*
This file is part of Arduino Model Train Controller V3 (https://github.com/Itzanh/arduino_model_train_controller_v3).

Arduino Model Train Controller V3 is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3 of the License.

Model Train Controller is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with Model Train Controller. If not, see <https://www.gnu.org/licenses/>.
*/

import StretchType from "./StretchType";

class Stretch {
    public id: number;
    public name: string;
    public type: StretchType;



    constructor(stretch: any) {
        if (stretch === undefined || stretch === null) {
            return;
        }
        this.id = stretch.id;
        this.name = stretch.name;
        this.type = stretch.type;
    }

    public typeToString(): string {
        switch (this.type) {
            case StretchType.OneWaySingleTrack: {
                return 'one-way-single-track';
            }
        }
        return "";
    }
}



export default Stretch;
