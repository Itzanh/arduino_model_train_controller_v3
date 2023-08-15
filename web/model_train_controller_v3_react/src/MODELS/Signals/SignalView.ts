/*
This file is part of Arduino Model Train Controller V3 (https://github.com/Itzanh/arduino_model_train_controller_v3).

Arduino Model Train Controller V3 is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3 of the License.

Model Train Controller is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with Model Train Controller. If not, see <https://www.gnu.org/licenses/>.
*/

import SignalAspect from "./SignalAspect";
import SignalId from "./SignalId";



class SignalView {
    public stretchId: number;
    public id: string;
    public onlyId: number;
    public name: string;
    public speedLimit: number; // 0 = slow, 1 = half, 2 = fast
    public switch: boolean;
    public splitter: boolean | null; // Null: not switch, True: splitter, False: merger
    public stretchDetourId: number | null;
    public signalDetourId: number | null;
    public loopsBack: boolean;
    public stretchLoopBackId: number | null;
    public signalLoopBackId: number | null;
    public passthrough: boolean;
    public queuedForSwitching: boolean;
    public currentlySwitching: boolean;
    public switchFailure: boolean;
    public aspect: SignalAspect;
    public forceRed: boolean;



    constructor(signal: any) {
        if (signal === undefined) {
            return;
        }
        this.stretchId = signal.stretchId;
        this.id = signal.stretchId + ";" + signal.id;
        this.onlyId = signal.id;
        this.name = signal.name;
        this.speedLimit = signal.speedLimit;
        this.switch = signal.switch;
        this.splitter = signal.splitter;
        this.stretchDetourId = signal.stretchDetourId;
        this.signalDetourId = signal.signalDetourId;
        this.loopsBack = signal.loopsBack;
        this.stretchLoopBackId = signal.stretchLoopBackId;
        this.signalLoopBackId = signal.signalLoopBackId;
        this.passthrough = signal.passthrough;
        this.queuedForSwitching = signal.queuedForSwitching;
        this.currentlySwitching = signal.currentlySwitching;
        this.switchFailure = signal.switchFailure;
        this.aspect = signal.aspect;
        this.forceRed = signal.forceRed;
    }

    public aspectToString(): string {
        switch (this.aspect) {
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
    
    public getSignalId(): SignalId {
        return new SignalId(this.stretchId, this.onlyId);
    }
}



export default SignalView;
