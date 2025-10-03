import 'mocha';

import path from 'path';
import { assert, expect } from 'chai';

import {
    config as defaultConfig,
    ErrorFlow,
    ErrorTypes,
    IRulesConfig,
    KeyModelWithLanguages,
    LanguagesModel,
    ReactI18nextLint,
    ResultCliModel,
    ResultErrorModel,
    ToggleRule,
} from './../../src/core';

import { assertFullModel } from './results/arguments.full';
import { assertDefaultModel } from './results/default.full';
import { assertCustomConfig } from './results/custom.config';
import { configValues } from './results/config.values';
import { getAbsolutePath, projectFolder } from './utils';

/*
TODO: RL: Keys
<h1>{t('welcome.title')}<h1>{t('welcome title-2')}</h1></h1>
<h1>{t('welcome.title', {framework:'React'})}<h2>{t('Welcome to React")}</h2></h1>
import('web-vitals')).then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
*/
describe('Core Integration', () => {
    const ignorePath: string = '';

    const projectIgnorePath: string = './test/integration/inputs/views/pipe.keys.html';
    const projectWithMaskPath: string = './test/integration/inputs/views/*.{html,ts,js}';
    const projectAbsentMaskPath: string = './test/integration/inputs/views/';

    const languagesIgnorePath: string = './test/integration/inputs/locales/EN-eu.json';
    const languagesWithMaskPath: string = './test/integration/inputs/locales/EN-*.json';
    const languagesIncorrectFile: string = './test/integration/inputs/locales/incorrect.json';
    const languagesAbsentMaskPath: string = './test/integration/inputs/locales';

    describe('Custom RegExp to find keys', () => {
       it('should be find keys', async () => {
           // Arrange
           const errorConfig: IRulesConfig = {
               ...defaultConfig.defaultValues.rules,
               customRegExpToFindKeys: [/marker\("(.*)"\)/gm]
           };

           // Act
           const model: ReactI18nextLint = new ReactI18nextLint(projectWithMaskPath, languagesWithMaskPath, undefined, errorConfig);
           const result: ResultCliModel =  await model.lint();

           // Assert
           assert.deepEqual(result.errors.find(x => x.value === 'CUSTOM.REGEXP.ONE')?.errorType, ErrorTypes.warning);
       });
    });
    describe('Empty Keys', () => {
        it('should be warning by default', async () => {
            // Arrange
            const hasEmptyKeys: boolean = true;
            const countEmptyKeys: number = 1;
            const errorType: ErrorTypes = ErrorTypes.warning;
            // Act
            const model: ReactI18nextLint = new ReactI18nextLint(projectWithMaskPath, languagesWithMaskPath);
            const result: ResultCliModel =  await model.lint();

            // Assert
            assert.deepEqual(errorType, result.getEmptyKeys()[0].errorType);
            assert.deepEqual(hasEmptyKeys, result.hasEmptyKeys());
            assert.deepEqual(countEmptyKeys, result.countEmptyKeys());
        });
        it('should be error', async () => {
            // Arrange
            const hasEmptyKeys: boolean = true;
            const countEmptyKeys: number = 1;
            const errorType: ErrorTypes = ErrorTypes.error;
            const errorConfig: IRulesConfig = {
                ...defaultConfig.defaultValues.rules,
                emptyKeys: ErrorTypes.error,
            };
            // Act
            const model: ReactI18nextLint = new ReactI18nextLint(projectWithMaskPath, languagesWithMaskPath, undefined, errorConfig);
            const result: ResultCliModel = await model.lint();

            // Assert
            assert.deepEqual(errorType, result.getEmptyKeys()[0].errorType);
            assert.deepEqual(hasEmptyKeys, result.hasEmptyKeys());
            assert.deepEqual(countEmptyKeys, result.countEmptyKeys());
        });
    });
    describe('Misprint', async () => {
        it('should be disable by default', async () => {
            // Arrange
            const hasMisprint: boolean = false;
            const countMisprint: number = 0;

            // Act
            const model: ReactI18nextLint = new ReactI18nextLint(projectWithMaskPath, languagesWithMaskPath);
            const result: ResultCliModel = await model.lint();

            // Assert
            assert.deepEqual(hasMisprint, result.hasMisprint());
            assert.deepEqual(countMisprint, result.countMisprint());
        });
        it('should be error', async () => {
            // Arrange
            const errorConfig: IRulesConfig = {
                keysOnViews: ErrorTypes.error,
                zombieKeys: ErrorTypes.warning,
                misprintKeys:  ErrorTypes.error,
                deepSearch: ToggleRule.enable,
                emptyKeys: ErrorTypes.warning,
                maxWarning: 1,
                misprintCoefficient: 0.9,
                ignoredKeys: ["IGNORED.KEY.FLAG"],
                ignoredMisprintKeys: [],
                customRegExpToFindKeys: []
            };
            const hasMisprint: boolean = true;
            const countMisprint: number = 1;
            const correctError: ResultErrorModel = new ResultErrorModel(
                'STRING.KEY_FROM_PIPE_VIEW.MISPRINT_IN_ONE_LOCALES',
                    ErrorFlow.misprintKeys, ErrorTypes.error,
                    getAbsolutePath(projectFolder, 'pipe.keys.html'),
                    [
                        'EN-eu.json',
                        'EN-us.json'
                    ],
                    [
                        "STRING.KEY_FROM_PIPE_VIEW.MISPRINT_IN_IN_LOCALES"
                    ]
            );

            // Act
            const model: ReactI18nextLint = new ReactI18nextLint(projectWithMaskPath, languagesWithMaskPath,  '', errorConfig);
            const result: ResultCliModel = await model.lint();
            const clearErrors: ResultErrorModel[] = result.errors.filter((error: ResultErrorModel) => error.errorFlow === ErrorFlow.misprintKeys);

            // Assert
            assert.deepEqual(hasMisprint, result.hasMisprint());
            assert.deepEqual(countMisprint, result.countMisprint());
            assert.deepEqual(correctError, clearErrors.pop());
        });
        it('should be have 2 or more suggestions for one key', async() => {
            // Arrange
            const hasMisprint: boolean = true;
            const countMisprint: number = 2;
            const ignorePath: string = `${languagesIgnorePath}, ${projectIgnorePath}`;
            const errorConfig: IRulesConfig = {
                ...defaultConfig.defaultValues.rules,
                misprintKeys:  ErrorTypes.warning,
            };
            // Act
            const model: ReactI18nextLint = new ReactI18nextLint(projectWithMaskPath, languagesWithMaskPath, ignorePath, errorConfig);
            const result: ResultCliModel = await model.lint();

            // Assert
            assert.deepEqual(hasMisprint, result.hasMisprint());
            assert.deepEqual(countMisprint, result.countMisprint());
        });
    });
    describe('Warnings', async () => {
        it('should be 0 by default',async () => {
            // Act
            const model: ReactI18nextLint = new ReactI18nextLint(projectWithMaskPath, languagesWithMaskPath);
            const result:  ResultCliModel = await model.lint();

            // Assert
            assert.deepEqual(0, result.maxCountWarning);
        });
        it('should be error if warnings more thant 2', async () => {
            // Arrange
            const ignorePath: string = '';
            const maxWarnings: number = 5;
            const ifFullOfWarning: boolean = true;
            const errorConfig: IRulesConfig = {
                keysOnViews: ErrorTypes.warning,
                zombieKeys: ErrorTypes.warning,
                emptyKeys: ErrorTypes.warning,
                maxWarning: 1,
                misprintCoefficient: 0.9,
                misprintKeys: ErrorTypes.disable,
                deepSearch: ToggleRule.enable,
                ignoredKeys: ["IGNORED.KEY.FLAG"],
                ignoredMisprintKeys: [],
                customRegExpToFindKeys: []
            };

            // Act
            const model: ReactI18nextLint = new ReactI18nextLint(projectWithMaskPath, languagesWithMaskPath, ignorePath, errorConfig);
            const result:  ResultCliModel =  await model.lint(maxWarnings);

            // Assert
            assert.deepEqual(ifFullOfWarning, result.isFullOfWarning());
            assert.deepEqual(maxWarnings, result.maxCountWarning);
        });
        it('should be warning if warnings less thant 10', async () => {
            // Arrange
            const maxWarnings: number = 20;
            const ifFullOfWarning: boolean = false;

            // Act
            const model: ReactI18nextLint = new ReactI18nextLint(projectWithMaskPath, languagesWithMaskPath);
            const result: ResultCliModel = await model.lint(maxWarnings);

            // Assert
            assert.deepEqual(ifFullOfWarning, result.isFullOfWarning());
            assert.deepEqual(maxWarnings, result.maxCountWarning);
        });
    });
    describe('Ignore', () => {
        it('should be relative and absolute and have projects and languages files', async () => {
            // Arrange
            const ignoreAbsoluteProjectPath: string = path.resolve(__dirname, process.cwd(), projectIgnorePath);
            const ignorePath: string = `${languagesIgnorePath}, ${ignoreAbsoluteProjectPath}`;
            const errorConfig: IRulesConfig = {
                ...defaultConfig.defaultValues.rules,
                deepSearch: ToggleRule.enable,
                misprintKeys: ErrorTypes.warning
            };

            // Act
            const model: ReactI18nextLint = new ReactI18nextLint(projectWithMaskPath, languagesWithMaskPath, ignorePath, errorConfig);
            const result: ResultCliModel = await model.lint();

            // Assert
            assert.deepEqual(assertFullModel, result.errors);
        });

        it('should be empty or incorrect', async () => {
            // Arrange
            const ignorePath: string = `null, 0, undefined, '',`;

            // Act
            const model: ReactI18nextLint = new ReactI18nextLint(projectWithMaskPath, languagesWithMaskPath, ignorePath);
            const result: ResultCliModel = await model.lint();

            // Assert
            assert.deepEqual(assertDefaultModel, result.errors);
        });
    });
    describe('Path', async () => {
        it('should be relative and absolute', async () => {
            // Arrange
            const absolutePathProject: string = path.resolve(__dirname, process.cwd(), projectWithMaskPath);

            // Act
            const model: ReactI18nextLint = new ReactI18nextLint(absolutePathProject, languagesWithMaskPath);
            const result: ResultCliModel = await model.lint();

            // Assert
            assert.deepEqual(assertDefaultModel, result.errors);
        });

        it('should be absent mask', async () => {
            // Arrange
            const ignorePath: string = `${languagesIgnorePath}, ${projectIgnorePath}, ${languagesIncorrectFile}`;
            const errorConfig: IRulesConfig = {
                ...defaultConfig.defaultValues.rules,
                deepSearch: ToggleRule.enable,
                misprintKeys: ErrorTypes.warning
            };
            // Act
            const model: ReactI18nextLint = new ReactI18nextLint(projectAbsentMaskPath, languagesAbsentMaskPath, ignorePath, errorConfig);
            const result: ResultCliModel = await model.lint();

            // Assert
            assert.deepEqual(assertFullModel, result.errors);
        });
        it('should be empty and incorrect', async () => {
            // Arrange
            const emptyFolder: string = '';
            const incorrectFolder: string = '../files';

            // Act
            const model: ReactI18nextLint = new ReactI18nextLint(emptyFolder, incorrectFolder);

            // Assert
            expect(() => { model.lint(); }).to.throw();
        });

        it('should with parse error', async () => {
            // Arrange
            const absoluteIncorrectLanguagesPath: string = path.resolve(__dirname, process.cwd(), languagesIncorrectFile);
            const errorMessage: string = `Can't parse JSON file: ${absoluteIncorrectLanguagesPath}`;

            // Act
            const model: ReactI18nextLint = new ReactI18nextLint(projectWithMaskPath, languagesIncorrectFile);

            // Assert
            // model.lint();
            assert.throws(() => { model.lint(); }, errorMessage);
        });
    });

    describe('Config', async () => {
        it('should be default', async () => {
            // Act
            const model: ReactI18nextLint = new ReactI18nextLint(projectWithMaskPath, languagesWithMaskPath);
            const result:  ResultCliModel = await model.lint();

            // Assert
            assert.deepEqual(assertDefaultModel, result.errors);
        });
        it('should be incorrect', async () => {
            // Arrange
            const errorConfig: object = {
                keysOnViews: 'incorrect',
                anotherIncorrectKey: ErrorTypes.disable
            };

            // Act
            const model: ReactI18nextLint = new ReactI18nextLint(projectWithMaskPath, languagesWithMaskPath, ignorePath, errorConfig as IRulesConfig);

            // Assert
            expect(() => { model.lint(); }).to.throw();
        });
        it('should be custom', async () => {
            // Arrange
            const errorConfig: IRulesConfig = {
                keysOnViews: ErrorTypes.warning,
                zombieKeys: ErrorTypes.disable,
                emptyKeys: ErrorTypes.warning,
                maxWarning: 1,
                misprintCoefficient: 0.9,
                misprintKeys: ErrorTypes.disable,
                deepSearch: ToggleRule.enable,
                ignoredKeys: ["IGNORED.KEY.FLAG"],
                ignoredMisprintKeys: [],
                customRegExpToFindKeys: []
            };

            // Act
            const model: ReactI18nextLint = new ReactI18nextLint(projectWithMaskPath, languagesWithMaskPath, ignorePath, errorConfig);
            const result: ResultCliModel = await model.lint();

            // Assert
            assert.deepEqual(assertCustomConfig, result.errors);
        });
    });
    describe('API', () => {
        describe('getLanguages', () => {
           it('should be correct', async() => {
               // Arrange
               const countOfLanguage: number = 2;
               // Act
               const model: ReactI18nextLint = new ReactI18nextLint(projectWithMaskPath, languagesWithMaskPath);
               const result: LanguagesModel[] = model.getLanguages();

               // Assert
               assert.equal(result.length, countOfLanguage);
           });
        });
        describe('getKeys', () => {
            it('should be correct',  async () => {
                // Arrange
                 const countOfKeys: number = configValues.totalKeys;
                // Act
                const model: ReactI18nextLint = new ReactI18nextLint(projectWithMaskPath, languagesWithMaskPath);
                const result: KeyModelWithLanguages[] = model.getKeys();

                // Assert
                assert.equal(result.length, countOfKeys);
            });
        });
    });
    it('with full arguments', async () => {
        // Arrange
        const errorConfig: IRulesConfig = {
            keysOnViews: ErrorTypes.error,
            zombieKeys: ErrorTypes.warning,
            emptyKeys: ErrorTypes.warning,
            maxWarning: 1,
            misprintCoefficient: 0.9,
            misprintKeys: ErrorTypes.warning,
            deepSearch: ToggleRule.enable,
            ignoredKeys: ["IGNORED.KEY.FLAG"],
            ignoredMisprintKeys: [],
            customRegExpToFindKeys: []
        };
        const absolutePathProject: string = path.resolve(__dirname, process.cwd(), projectWithMaskPath);
        const ignoreAbsoluteProjectPath: string = path.resolve(__dirname, process.cwd(), projectIgnorePath);
        const ignorePath: string = `${languagesIgnorePath}, ${ignoreAbsoluteProjectPath}`;

        // Act
        const model: ReactI18nextLint = new ReactI18nextLint(absolutePathProject, languagesWithMaskPath, ignorePath, errorConfig);
        const result: ResultCliModel = await model.lint();

        // Assert
        assert.deepEqual(assertFullModel, result.errors);
    });
});
