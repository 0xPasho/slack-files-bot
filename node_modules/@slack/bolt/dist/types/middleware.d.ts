import { WebClient } from '@slack/web-api';
import { Logger } from '@slack/logger';
import { StringIndexed } from './helpers';
import { SlackEventMiddlewareArgs } from './events';
import { SlackActionMiddlewareArgs } from './actions';
import { SlackCommandMiddlewareArgs } from './command';
import { SlackOptionsMiddlewareArgs } from './options';
import { SlackShortcutMiddlewareArgs } from './shortcuts';
import { SlackViewMiddlewareArgs } from './view';
export declare type AnyMiddlewareArgs = SlackEventMiddlewareArgs | SlackActionMiddlewareArgs | SlackCommandMiddlewareArgs | SlackOptionsMiddlewareArgs | SlackViewMiddlewareArgs | SlackShortcutMiddlewareArgs;
export interface AllMiddlewareArgs {
    context: Context;
    logger: Logger;
    client: WebClient;
    next?: NextFn;
}
export interface Middleware<Args> {
    (args: Args & AllMiddlewareArgs): Promise<void>;
}
export interface Context extends StringIndexed {
}
export declare type NextFn = () => Promise<void>;
//# sourceMappingURL=middleware.d.ts.map