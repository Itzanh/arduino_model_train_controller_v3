/*
This file is part of Arduino Model Train Controller V3 (https://github.com/Itzanh/arduino_model_train_controller_v3).

Arduino Model Train Controller V3 is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3 of the License.

Model Train Controller is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with Model Train Controller. If not, see <https://www.gnu.org/licenses/>.
*/

import { createSlice } from '@reduxjs/toolkit'
import Train from '../MODELS/Trains/Train';

var initialState: Train[] = [];

export const trainsSlice = createSlice({
    name: 'trains',
    initialState,
    reducers: {
        add: (state, action) => {
            state.push(action.payload);
            state = state.sort((a, b) => {
                return a.id - b.id;
            });
        },
        addMultiple: (state, action) => {
            state.push(...action.payload);
            state = state.sort((a, b) => {
                return a.id - b.id;
            });
        },
        update: (state, action) => {
            const i = state.findIndex((train) => {
                return train.id === action.payload.id;
            });
            state.splice(i, 1);
            state.push(action.payload);
            state = state.sort((a, b) => {
                return a.id - b.id;
            });
        },
        remove: (state, action) => {
            const i = state.findIndex((train) => {
                return train.id === action.payload.id;
            });
            state.splice(i, 1);
        }
    },
})

// Action creators are generated for each case reducer function
export const { add, addMultiple, update, remove } = trainsSlice.actions

export default trainsSlice.reducer
