/*
This file is part of Arduino Model Train Controller V3 (https://github.com/Itzanh/arduino_model_train_controller_v3).

Arduino Model Train Controller V3 is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3 of the License.

Model Train Controller is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with Model Train Controller. If not, see <https://www.gnu.org/licenses/>.
*/

import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Paper, { PaperProps } from '@mui/material/Paper';
import Draggable from 'react-draggable';
import i18next from 'i18next';
import OkAndErrorCodeReturn from '../NETWORKING/OkAndErrorCodeReturn';
import BackendErrorCodes from '../NETWORKING/BackendErrorCodes';



function PaperComponent(props: PaperProps) {
    return (
        <Draggable
            handle="#draggable-dialog-title"
            cancel={'[class*="MuiDialogContent-root"]'}
        >
            <Paper {...props} />
        </Draggable>
    );
}



class ErrorModalProps {
    public okAndErrorCodeReturn: OkAndErrorCodeReturn;
}

function ErrorModal(props: ErrorModalProps) {
    const [open, setOpen] = React.useState(true);

    const handleClose = () => {
        setOpen(false);
    };

    var errorMessage: string;
    switch (props.okAndErrorCodeReturn.errorCode) {
        case BackendErrorCodes.ERROR_CODE_OK: {
            errorMessage = i18next.t('an-unkown-error-has-ocurred');
            break;
        }
        case BackendErrorCodes.ERROR_CODE_JSON_COULD_NOT_UNMARSHAL: {
            errorMessage = i18next.t('the-json-string-sent-to-the-server-cant-be-decoded');
            break;
        }
        case BackendErrorCodes.ERROR_CODE_DATA_NOT_VALID: {
            errorMessage = i18next.t('some-of-the-data-entered-in-the-form-is-not-valid');
            break;
        }
        case BackendErrorCodes.ERROR_CODE_INTERNAL_DATABASE_ERROR: {
            errorMessage = i18next.t('there-has-been-a-internal-error-in-the-database');
            break;
        }
        case BackendErrorCodes.ERROR_CODE_COULD_NOT_FIND_RECORD: {
            errorMessage = i18next.t('a-record-could-not-be-found-by-id-refresh-try-again');
            break;
        }
        case BackendErrorCodes.ERROR_CODE_TRAIN_NOT_STOPPED: {
            errorMessage = i18next.t('the-train-must-be-set-as-stopped-in-order-to-perform-this-action');
            break;
        }
        case BackendErrorCodes.ERROR_CODE_TRAIN_NOT_STARTED: {
            errorMessage = i18next.t('the-train-must-be-set-as-started-in-order-to-perform-this-action');
            break;
        }
        case BackendErrorCodes.ERROR_CODE_TRAIN_NOT_ONLINE: {
            errorMessage = i18next.t('the-train-is-offline-the-train-must-be-online-in-order-to-perform-this-action');
            break;
        }
    }

    return <Dialog
        open={open}
        onClose={handleClose}
        PaperComponent={PaperComponent}
        aria-labelledby="draggable-dialog-title"
    >
        <DialogTitle style={{ cursor: 'move' }} id="draggable-dialog-title">
            {i18next.t('ERROR-OCURRED')}
        </DialogTitle>
        <DialogContent>
            <DialogContentText>
                <p>{errorMessage}</p>
                <br />
                {
                    props.okAndErrorCodeReturn.extraData === null ? null : props.okAndErrorCodeReturn.extraData.map((i, extraData) => {
                        return <code key={i}>{extraData}</code>
                    })
                }
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={handleClose}>{i18next.t('close')}</Button>
        </DialogActions>
    </Dialog>
}



export default ErrorModal;
