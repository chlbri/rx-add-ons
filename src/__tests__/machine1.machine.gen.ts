/**
 *
 * All paths of the concerned files
 *
 * ### Author
 *
 * chlbri (bri_lvi@icloud.com)
 *
 * [My GitHub](https://github.com/chlbri?tab=repositories)
 *
 * <br/>
 *
 * ### Documentation
 *
 * Link to machine lib [here](https://www.npmjs.com/package/@bemedev/app-ts).
 *
 * Link to this lib [here](https://www.npmjs.com/package/@bemedev/app-cli)
 *
 *
 * This file is auto-generated. Do not edit manually.
 */
export type _AllPaths = {
  machineEmitter1: '/' | '/inactive' | '/active';
};
/**
 *
 * Constants as type helpers for the concerned file.
 * Don't use it as values, just for typings
 *
 * ### Author
 *
 * chlbri (bri_lvi@icloud.com)
 *
 * [My GitHub](https://github.com/chlbri?tab=repositories)
 *
 * <br/>
 *
 * ### Documentation
 *
 * Link to machine lib [here](https://www.npmjs.com/package/@bemedev/app-ts).
 *
 * Link to this lib [here](https://www.npmjs.com/package/@bemedev/app-cli)
 *
 * NB: This file is auto-generated. Do not edit manually.
 */
export const SCHEMAS = {
  machineEmitter1: {
    __tsSchema: undefined as unknown as {
      readonly targets: Exclude<_AllPaths['machineEmitter1'], '/'>;
      readonly states: {
        readonly inactive: {
          readonly targets: Exclude<
            _AllPaths['machineEmitter1'],
            '/inactive'
          >;
        };
        readonly active: {
          readonly targets: Exclude<
            _AllPaths['machineEmitter1'],
            '/active'
          >;
        };
      };
      readonly initial: 'inactive' | 'active';
    },
  },
};
