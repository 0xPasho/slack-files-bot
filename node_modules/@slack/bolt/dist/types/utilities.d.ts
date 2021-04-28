import { ChatPostMessageArguments, WebAPICallResult } from '@slack/web-api';
import { KnownKeys } from './helpers';
export declare type SayArguments = Pick<ChatPostMessageArguments, Exclude<KnownKeys<ChatPostMessageArguments>, 'channel'>> & {
    channel?: string;
};
export interface SayFn {
    (message: string | SayArguments): Promise<WebAPICallResult>;
}
export declare type RespondArguments = Pick<ChatPostMessageArguments, Exclude<KnownKeys<ChatPostMessageArguments>, 'channel' | 'text'>> & {
    /** Response URLs can be used to send ephemeral messages or in-channel messages using this argument */
    response_type?: 'in_channel' | 'ephemeral';
    replace_original?: boolean;
    delete_original?: boolean;
    text?: string;
};
export interface RespondFn {
    (message: string | RespondArguments): Promise<any>;
}
export interface AckFn<Response> {
    (response?: Response): Promise<void>;
}
//# sourceMappingURL=utilities.d.ts.map