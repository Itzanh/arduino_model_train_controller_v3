/*
This file is part of Arduino Model Train Controller V3 (https://github.com/Itzanh/arduino_model_train_controller_v3).

Arduino Model Train Controller V3 is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3 of the License.

Model Train Controller is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with Model Train Controller. If not, see <https://www.gnu.org/licenses/>.
*/

const WebSocketVerbsDirection = {
    "GET": false,
    "INSERT": false,
    "UPDATE": false,
    "DELETE": false,
    "ACTION": false,
    "SET": true,
    "SERVER_INSERT": true,
    "SERVER_UPDATE": true,
    "SERVER_DELETE": true
} as { [verb: string]: Boolean }

class NetworkController {
    private ws: WebSocket;
    private internalListeners: { [requestHeader: string]: Function };
    private externalListeners: { [requestHeader: string]: Function };

    constructor(ws: WebSocket) {
        this.ws = ws;
        this.internalListeners = {};
        this.externalListeners = {};
        this.onWebSocketMessage = this.onWebSocketMessage.bind(this);
        this.ws.onmessage = this.onWebSocketMessage;
    }

    private addListenerHandler(requestHeader: string, listener: Function) {
        this.internalListeners[requestHeader] = listener;
    }

    public addEventListenerHandle(verb: string, resource: string, listener: Function) {
        this.externalListeners[verb + ":" + resource] = listener;
    }

    private onWebSocketMessage(msg: MessageEvent<any>) {
        const message = msg.data as string;

        // initial check
        if (message.indexOf("$") <= 0) {
            return;
        }
        const command = message.substring(0, message.indexOf("$"));
        if (command.length <= 0) {
            return;
        }

        const verb = command.split(":");
        if (verb.length != 2) {
            return;
        }

        const verbDirectionFromServer = WebSocketVerbsDirection[verb[0]];
        if (verbDirectionFromServer == null) {
            return;
        }

        const messageContent = message.substring(message.indexOf("$")+1);

        if (verbDirectionFromServer) {
            const listener = this.externalListeners[command];
            if (listener == null) {
                return;
            }
            listener(messageContent);
        } else {
            const listener = this.internalListeners[command];
            if (listener == null) {
                return;
            }
            delete this.internalListeners[command];
            listener(messageContent);
        }
    }

    public getRows(resource: string, extraData: string = ""): Promise<object> {
        return new Promise((resolve) => {
            this.addListenerHandler('GET:' + resource, (msg: string) => {
                resolve(JSON.parse(msg));
            });
            this.ws.send('GET:' + resource + '$' + extraData);
        });
    }

    public addRows(resource: string, rowObject: object): Promise<object> {
        return new Promise((resolve) => {
            this.addListenerHandler('INSERT:' + resource, (msg: string) => {
                resolve(JSON.parse(msg));
            });
            this.ws.send('INSERT:' + resource + '$' + JSON.stringify(rowObject));
        });
    }

    public updateRows(resource: string, rowObject: object): Promise<object> {
        return new Promise((resolve) => {
            this.addListenerHandler('UPDATE:' + resource, (msg: string) => {
                resolve(JSON.parse(msg));
            });
            this.ws.send('UPDATE:' + resource + '$' + JSON.stringify(rowObject));
        });
    }

    public deleteRows(resource: string, rowId: number | string): Promise<object> {
        return new Promise((resolve) => {
            this.addListenerHandler('DELETE:' + resource, (msg: string) => {
                resolve(JSON.parse(msg));
            });
            this.ws.send('DELETE:' + resource + '$' + rowId);
        });
    }

    /*public nameRecord(resource: string, searchName: string): Promise<object> {
        return new Promise((resolve) => {
            this.ws.onmessage = (msg) => {
                resolve(JSON.parse(msg.data));
            }
            this.ws.send('NAME:' + resource + '$' + searchName);
        });
    }

    public getRecordName(resource: string, rowId: number | string): Promise<string> {
        return new Promise((resolve) => {
            this.ws.onmessage = (msg) => {
                resolve(msg.data);
            }
            this.ws.send('GETNAME:' + resource + '$' + rowId);
        });
    }

    public getResourceDefaults(resource: string, extraData: string = ""): Promise<object> {
        return new Promise((resolve) => {
            this.ws.onmessage = (msg) => {
                resolve(JSON.parse(msg.data));
            }
            this.ws.send('DEFAULTS:' + resource + '$' + extraData);
        });
    }*/

    public executeAction(resource: string, extraData: string = ""): Promise<object> {
        return new Promise((resolve) => {
            /*this.ws.onmessage = (msg) => {
                resolve(JSON.parse(msg.data));
            }*/
            this.addListenerHandler('ACTION:' + resource, (msg: string) => {
                resolve(JSON.parse(msg));
            });
            this.ws.send('ACTION:' + resource + '$' + extraData);
        });
    }

    /*public locateRows(resource: string, extraData: string = ""): Promise<object> {
        return new Promise((resolve) => {
            this.ws.onmessage = (msg) => {
                resolve(JSON.parse(msg.data));
            }
            this.ws.send('LOCATE:' + resource + '$' + extraData);
        });
    }

    public searchRows(resource: string, search: string): Promise<object> {
        return new Promise((resolve) => {
            this.ws.onmessage = (msg) => {
                resolve(JSON.parse(msg.data));
            }
            this.ws.send('SEARCH:' + resource + '$' + search);
        });
    }*/

}



export default NetworkController;
