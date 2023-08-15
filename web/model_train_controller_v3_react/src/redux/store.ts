/*
This file is part of Arduino Model Train Controller V3 (https://github.com/Itzanh/arduino_model_train_controller_v3).

Arduino Model Train Controller V3 is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3 of the License.

Model Train Controller is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with Model Train Controller. If not, see <https://www.gnu.org/licenses/>.
*/

import { configureStore } from '@reduxjs/toolkit';
import { trainsSlice } from './trainsSlice';
import { stretchesSlice } from './stretchesSlice';
import { signalsSlice } from './signalsSlice';



export const store = configureStore({
    reducer: {
        trains: trainsSlice.reducer,
        stretches: stretchesSlice.reducer,
        signals: signalsSlice.reducer,
    },
})

export type RootState = ReturnType<typeof store.getState>
