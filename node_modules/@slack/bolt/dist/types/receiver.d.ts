import App from '../App';
import { AckFn } from './index';
import { StringIndexed } from './helpers';
export interface ReceiverEvent {
    body: StringIndexed;
    ack: AckFn<any>;
}
export interface Receiver {
    init(app: App): void;
    start(...args: any[]): Promise<unknown>;
    stop(...args: any[]): Promise<unknown>;
}
//# sourceMappingURL=receiver.d.ts.map