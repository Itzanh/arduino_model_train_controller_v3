/*
This file is part of Arduino Model Train Controller V3 (https://github.com/Itzanh/arduino_model_train_controller_v3).

Arduino Model Train Controller V3 is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3 of the License.

Model Train Controller is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with Model Train Controller. If not, see <https://www.gnu.org/licenses/>.
*/

import Signal from "../Signals/Signal";
import SignalAspect from "../Signals/SignalAspect";



class Train {
    public id: number;
    public name: string;
    public speedSlow: number;
    public speedHalf: number;
    public speedFast: number;
    public accessKey: number;
    public online: boolean;
    public lastSignal: Signal | null;
    public lastSignalPassedAspect: SignalAspect | null;
    public started: boolean;
    public stopAtSignal: boolean;
    public signalToStopAt: Signal | null;



    constructor(train: any) {
        if (train === undefined || train === null) {
            return;
        }
        this.id = train.id;
        this.name = train.name;
        this.speedSlow = train.speedSlow;
        this.speedHalf = train.speedHalf;
        this.speedFast = train.speedFast;
        this.accessKey = train.accessKey;
        this.online = train.online;
        this.lastSignal = train.lastSignal;
        this.lastSignalPassedAspect = train.lastSignalPassedAspect;
        this.started = train.started;
        this.stopAtSignal = train.stopAtSignal;
        this.signalToStopAt = train.signalToStopAt;
    }
    
    public aspectToString(): string {
        switch (this.lastSignalPassedAspect) {
            case SignalAspect.Clear:
                return 'clear';
            case SignalAspect.PreliminaryCaution:
                return 'preliminary-caution';
            case SignalAspect.Caution:
                return 'caution';
            case SignalAspect.Danger:
                return 'danger';
        }
    }

}



export default Train;
