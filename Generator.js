"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const es_extensions_1 = require("@yamato-daiwa/es-extensions");
const es_extensions_nodejs_1 = require("@yamato-daiwa/es-extensions-nodejs");
class Generator {
    /* ━━━ Static Fields ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    static CONSOLE_COMMAND_PHRASE = "aa1";
    static REGULAR_EXPRESSION_FOR_EXTRACTING_OF_CSHARP_NAMESPACE_DECLARATION = /^[^\S\r\n]*namespace[^\S\r\n]+(?<namespaceDeclaraction>[^;]+);/gmu;
    static OUTPUT_FILE_COMMENT_HEADER = [
        "/* [ !!! ATTENTION !!! ] NO MANUAL EDITING!!!       */",
        "/* This file is being GENERATED REPEATEDLY.         */",
        "/* All manual changes COULD BE LOST AT ANY MOMENT.  */"
    ].join("\n");
    /* ━━━ Instance Fields ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    sourceDirectories;
    outputDirectories;
    targetLocales__capitalized;
    outputFileCSharpNamespaceCommonPart;
    /* [ Dynamic Initialization ] */
    commonStringResourcesNamespaces;
    /* ━━━ Entry Point ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    static interpretAndExecuteConsoleCommand() {
        es_extensions_1.Logger.setImplementation(es_extensions_nodejs_1.ConsoleApplicationLogger);
        const configurationFileRelativePath = process.argv[2];
        if (!(0, es_extensions_1.isNonEmptyString)(configurationFileRelativePath)) {
            es_extensions_1.Logger.throwErrorAndLog({
                errorInstance: new es_extensions_nodejs_1.InvalidConsoleCommandError({
                    customMessage: `The command "${Generator.CONSOLE_COMMAND_PHRASE}" must be invoked with single parameter, the relative ` +
                        "path to configuration file of YAML format."
                }),
                title: es_extensions_1.UnexpectedEventError.localization.defaultTitle,
                occurrenceLocation: "Generator.interpretAndExecuteConsoleCommand()"
            });
        }
        const order = es_extensions_nodejs_1.ObjectDataFilesProcessor.
            processFile({
            filePath: path_1.default.join(process.cwd(), configurationFileRelativePath),
            validDataSpecification: {
                nameForLogging: "AA1 Application Configuration",
                subtype: es_extensions_1.RawObjectDataProcessor.ObjectSubtypes.indexedArray,
                element: {
                    type: Object,
                    properties: {
                        sourceDirectoriesRelativePaths: {
                            type: Object,
                            required: true,
                            properties: {
                                base: {
                                    type: String,
                                    required: false,
                                    minimalCharactersCount: 1
                                },
                                commonStringResources: {
                                    type: String,
                                    required: true,
                                    minimalCharactersCount: 1
                                },
                                pages: {
                                    type: String,
                                    required: true,
                                    minimalCharactersCount: 1
                                },
                                sharedComponents: {
                                    type: String,
                                    required: true,
                                    minimalCharactersCount: 1
                                }
                            }
                        },
                        outputDirectoriesRelativePaths: {
                            type: Object,
                            required: true,
                            properties: {
                                base: {
                                    type: String,
                                    required: true,
                                    minimalCharactersCount: 1
                                },
                                commonStringResources: {
                                    type: String,
                                    required: true,
                                    minimalCharactersCount: 1
                                },
                                pages: {
                                    type: String,
                                    required: true,
                                    minimalCharactersCount: 1
                                },
                                sharedComponents: {
                                    type: String,
                                    required: true,
                                    minimalCharactersCount: 1
                                }
                            }
                        },
                        targetLocales: {
                            type: Array,
                            required: true,
                            element: {
                                type: String,
                                minimalCharactersCount: 2
                            }
                        },
                        outputFileCSharpNamespaceCommonPart: {
                            type: String,
                            required: true,
                            minimalCharactersCount: 2
                        }
                    }
                }
            },
            synchronously: true
        });
        for (const configuration of order) {
            new Generator(configuration).
                prepareFilesForCommonStringResources().
                prepareFilesForPagesStringResources().
                prepareFilesForSharedComponentsStringResources();
        }
    }
    /* ━━━ Constructor ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    constructor({ sourceDirectoriesRelativePaths, outputDirectoriesRelativePaths, targetLocales, outputFileCSharpNamespaceCommonPart }) {
        const baseSourceDirectoryAbsolutPath = path_1.default.join(process.cwd(), (0, es_extensions_1.isNotUndefined)(sourceDirectoriesRelativePaths.base) ? path_1.default.normalize(sourceDirectoriesRelativePaths.base) : "");
        const commonStringResourcesSourceDirectoryNormalizedRelativePath = path_1.default.normalize(sourceDirectoriesRelativePaths.commonStringResources);
        const pagesSourceDirectoryNormalizedRelativePath = path_1.default.normalize(sourceDirectoriesRelativePaths.pages);
        const sharedComponentsSourceDirectoryNormalizedRelativePath = path_1.default.normalize(sourceDirectoriesRelativePaths.sharedComponents);
        this.sourceDirectories = {
            base: { absolutePath: baseSourceDirectoryAbsolutPath },
            pages: {
                absolutePath: path_1.default.join(baseSourceDirectoryAbsolutPath, pagesSourceDirectoryNormalizedRelativePath),
                relativePath: pagesSourceDirectoryNormalizedRelativePath
            },
            sharedComponents: {
                absolutePath: path_1.default.join(baseSourceDirectoryAbsolutPath, sharedComponentsSourceDirectoryNormalizedRelativePath),
                relativePath: sharedComponentsSourceDirectoryNormalizedRelativePath
            },
            commonStringResources: {
                absolutePath: path_1.default.join(baseSourceDirectoryAbsolutPath, commonStringResourcesSourceDirectoryNormalizedRelativePath),
                relativePath: commonStringResourcesSourceDirectoryNormalizedRelativePath
            }
        };
        const baseOutputDirectoryAbsolutPath = path_1.default.
            join(process.cwd(), path_1.default.normalize(outputDirectoriesRelativePaths.base));
        const commonStringResourcesOutputDirectoryNormalizedRelativePath = path_1.default.normalize(outputDirectoriesRelativePaths.commonStringResources);
        const pagesStringResourcesOutputDirectoryNormalizedRelativePath = path_1.default.normalize(outputDirectoriesRelativePaths.pages);
        const sharedComponentsStringResourcesOutputDirectoryNormalizedRelativePath = path_1.default.normalize(outputDirectoriesRelativePaths.sharedComponents);
        this.outputDirectories = {
            base: { absolutePath: baseOutputDirectoryAbsolutPath },
            commonStringResources: {
                relativePath: commonStringResourcesOutputDirectoryNormalizedRelativePath,
                absolutePath: path_1.default.join(baseOutputDirectoryAbsolutPath, commonStringResourcesOutputDirectoryNormalizedRelativePath)
            },
            pages: {
                relativePath: pagesStringResourcesOutputDirectoryNormalizedRelativePath,
                absolutePath: path_1.default.join(baseOutputDirectoryAbsolutPath, pagesStringResourcesOutputDirectoryNormalizedRelativePath)
            },
            sharedComponents: {
                relativePath: sharedComponentsStringResourcesOutputDirectoryNormalizedRelativePath,
                absolutePath: path_1.default.join(baseOutputDirectoryAbsolutPath, sharedComponentsStringResourcesOutputDirectoryNormalizedRelativePath)
            }
        };
        this.targetLocales__capitalized = targetLocales.
            map((targetLocale) => (0, es_extensions_1.capitalizeFirstCharacter)(targetLocale.toLowerCase()));
        this.outputFileCSharpNamespaceCommonPart = outputFileCSharpNamespaceCommonPart;
    }
    /* ━━━ Processing ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    prepareFilesForCommonStringResources() {
        const commonStringsResourcesFilesAbsolutePaths = es_extensions_nodejs_1.ImprovedGlob.getFilesAbsolutePathsSynchronously([
            buildAllFilesInCurrentDirectoryAndBelowGlobSelector({
                basicDirectoryPath: this.sourceDirectories.commonStringResources.absolutePath,
                fileNamesExtensions: ["cs"]
            })
        ]);
        let commonStringsResourcesSchemaFileAbsolutePath;
        const commonStringsResourcesLocalizationsFilesAbsolutePaths = new Set();
        for (const commonStringsResourcesFileAbsolutePath of commonStringsResourcesFilesAbsolutePaths) {
            const fileNameWithoutExtension = es_extensions_nodejs_1.ImprovedPath.extractFileNameWithoutExtensionFromPath({
                targetPath: commonStringsResourcesFileAbsolutePath,
                mustThrowErrorIfLastPathSegmentHasNoDots: true
            });
            if (isStringIncludingAtLeastOneOfSubstrings(fileNameWithoutExtension, this.targetLocales__capitalized)) {
                commonStringsResourcesLocalizationsFilesAbsolutePaths.add(commonStringsResourcesFileAbsolutePath);
            }
            else {
                commonStringsResourcesSchemaFileAbsolutePath = commonStringsResourcesFileAbsolutePath;
            }
        }
        if ((0, es_extensions_1.isUndefined)(commonStringsResourcesSchemaFileAbsolutePath)) {
            es_extensions_1.Logger.throwErrorAndLog({
                errorInstance: new es_extensions_nodejs_1.FileNotFoundError({ customMessage: "Common string resources schema file not found." }),
                title: es_extensions_nodejs_1.FileNotFoundError.localization.defaultTitle,
                occurrenceLocation: "generator.prepareFilesForCommonStringResources()"
            });
        }
        /* [ Theory ] For the unclear reason non-braking space is being appended to read file content; need to trim it. */
        const sourceSchemaFileContent = fs_1.default.
            readFileSync(commonStringsResourcesSchemaFileAbsolutePath, "utf-8").
            trim();
        const originalCSharpNamespace = (0, es_extensions_1.getMatchingWithFirstRegularExpressionCapturingGroup)(sourceSchemaFileContent, Generator.REGULAR_EXPRESSION_FOR_EXTRACTING_OF_CSHARP_NAMESPACE_DECLARATION, { mustExpectExactlyOneMatching: true });
        const newCSharpNamespace = [
            this.outputFileCSharpNamespaceCommonPart,
            ...this.outputDirectories.commonStringResources.relativePath.split(path_1.default.sep)
        ].join(".");
        this.commonStringResourcesNamespaces = {
            original: originalCSharpNamespace,
            new: newCSharpNamespace
        };
        const outputSchemaFileContent = [
            Generator.OUTPUT_FILE_COMMENT_HEADER,
            "",
            sourceSchemaFileContent.replace(Generator.generateCSharpNamespaceDeclarationRegularExpression({
                targetNamespaceName: originalCSharpNamespace.replaceAll(".", "\\.")
            }), Generator.generateCSharpNamespaceDeclaration({ targetNamespaceName: newCSharpNamespace }))
        ].join("\n");
        es_extensions_nodejs_1.ImprovedFileSystem.writeFileToPossiblyNotExistingDirectory({
            filePath: path_1.default.join(this.outputDirectories.commonStringResources.absolutePath, path_1.default.basename(commonStringsResourcesSchemaFileAbsolutePath)),
            content: outputSchemaFileContent,
            synchronously: true
        });
        for (const commonStringsResourcesLocalizationFileAbsolutPath of commonStringsResourcesLocalizationsFilesAbsolutePaths) {
            const sourceLocalizationFileContent = fs_1.default.
                readFileSync(commonStringsResourcesLocalizationFileAbsolutPath, "utf-8").
                trim();
            const outputLocalizationFileContent = [
                Generator.OUTPUT_FILE_COMMENT_HEADER,
                "",
                sourceLocalizationFileContent.replace(Generator.generateCSharpNamespaceDeclarationRegularExpression({
                    targetNamespaceName: originalCSharpNamespace.replaceAll(".", "\\.")
                }), `namespace ${[
                    this.outputFileCSharpNamespaceCommonPart,
                    ...this.outputDirectories.commonStringResources.relativePath.split(path_1.default.sep)
                ].join(".")};`)
            ].join("\n");
            es_extensions_nodejs_1.ImprovedFileSystem.writeFileToPossiblyNotExistingDirectory({
                filePath: path_1.default.join(this.outputDirectories.commonStringResources.absolutePath, path_1.default.basename(commonStringsResourcesLocalizationFileAbsolutPath)),
                content: outputLocalizationFileContent,
                synchronously: true
            });
        }
        return this;
    }
    prepareFilesForPagesStringResources() {
        this.prepareFilesForPagesOrSharedComponentsStringResources({
            targetFilesCommonSourceDirectoryAbsolutePath: this.sourceDirectories.pages.absolutePath,
            targetFilesCommonOutputDirectory: this.outputDirectories.pages
        });
        return this;
    }
    prepareFilesForSharedComponentsStringResources() {
        this.prepareFilesForPagesOrSharedComponentsStringResources({
            targetFilesCommonSourceDirectoryAbsolutePath: this.sourceDirectories.sharedComponents.absolutePath,
            targetFilesCommonOutputDirectory: this.outputDirectories.sharedComponents
        });
        return this;
    }
    prepareFilesForPagesOrSharedComponentsStringResources({ targetFilesCommonSourceDirectoryAbsolutePath, targetFilesCommonOutputDirectory }) {
        const targetFilesAbsolutePaths = es_extensions_nodejs_1.ImprovedGlob.getFilesAbsolutePathsSynchronously([
            buildAllFilesInCurrentDirectoryAndBelowGlobSelector({
                basicDirectoryPath: targetFilesCommonSourceDirectoryAbsolutePath,
                fileNamePostfixes: ["Localization"],
                fileNamesExtensions: ["cs"]
            })
        ]);
        const targetFilesRelativePaths = targetFilesAbsolutePaths.map((targetFilesAbsolutePath) => path_1.default.relative(this.sourceDirectories.pages.absolutePath, targetFilesAbsolutePath));
        const sortedByDirectoriesSourceFilesRelativePaths = new Map();
        for (const targetFileRelativePath of targetFilesRelativePaths) {
            const directoryRelativePath = es_extensions_nodejs_1.ImprovedPath.extractDirectoryFromFilePath({
                targetPath: targetFileRelativePath,
                ambiguitiesResolution: {
                    mustConsiderLastSegmentStartingWithDotAsDirectory: false,
                    mustConsiderLastSegmentWithNonLeadingDotAsDirectory: false,
                    mustConsiderLastSegmentWithoutDotsAsFileNameWithoutExtension: false
                }
            });
            const relativePathsOfFilesOfSameDirectory = sortedByDirectoriesSourceFilesRelativePaths.
                get(directoryRelativePath);
            if ((0, es_extensions_1.isUndefined)(relativePathsOfFilesOfSameDirectory)) {
                sortedByDirectoriesSourceFilesRelativePaths.set(directoryRelativePath, new Set([targetFileRelativePath]));
            }
            else {
                relativePathsOfFilesOfSameDirectory.add(targetFileRelativePath);
            }
            for (const [commonForCurrentlyIteratedFilesSourceDirectoryRelativePath, namesOfFilesOfCurrentlyIteratedGroup] of sortedByDirectoriesSourceFilesRelativePaths.entries()) {
                let schemaSourceFileRelativePath;
                const localizationsSourceFilesRelativePaths = [];
                for (const fileRelativePath of namesOfFilesOfCurrentlyIteratedGroup) {
                    if (isStringIncludingAtLeastOneOfSubstrings(fileRelativePath, this.targetLocales__capitalized)) {
                        localizationsSourceFilesRelativePaths.push(fileRelativePath);
                    }
                    else {
                        schemaSourceFileRelativePath = fileRelativePath;
                    }
                }
                if ((0, es_extensions_1.isUndefined)(schemaSourceFileRelativePath)) {
                    es_extensions_1.Logger.throwErrorAndLog({
                        errorInstance: new es_extensions_nodejs_1.FileNotFoundError({
                            customMessage: "Schema file not found in directory " +
                                `"${commonForCurrentlyIteratedFilesSourceDirectoryRelativePath}".`
                        }),
                        title: es_extensions_1.UnexpectedEventError.localization.defaultTitle,
                        occurrenceLocation: "generator.prepareFilesForPagesOrSharedComponentsStringResources(compoundParameter)"
                    });
                }
                const schemaFileSourceAbsolutePath = path_1.default.join(targetFilesCommonSourceDirectoryAbsolutePath, schemaSourceFileRelativePath);
                /* [ Theory ] For the unclear reason non-braking space is being appended to read file content; need to trim it. */
                const sourceSchemaFileContent = fs_1.default.
                    readFileSync(schemaFileSourceAbsolutePath, "utf-8").
                    trim();
                const originalCSharpNamespace = (0, es_extensions_1.getMatchingWithFirstRegularExpressionCapturingGroup)(sourceSchemaFileContent, Generator.REGULAR_EXPRESSION_FOR_EXTRACTING_OF_CSHARP_NAMESPACE_DECLARATION, { mustExpectExactlyOneMatching: true });
                const schemaFileOutputPathRelativeToBaseOne = removePathSegments(path_1.default.relative(targetFilesCommonSourceDirectoryAbsolutePath, schemaFileSourceAbsolutePath), ["Localizations"]);
                if ((0, es_extensions_1.isUndefined)(this.commonStringResourcesNamespaces)) {
                    es_extensions_1.Logger.throwErrorAndLog({
                        errorInstance: new es_extensions_1.UnexpectedEventError(es_extensions_1.PoliteErrorsMessagesBuilder.buildMessage({
                            politeExplanation: "The information required for working with the files relates with pages and shared components " +
                                "has not been collected for some reason.",
                            technicalDetails: "\"commonStringResourcesNamespaces\" field has not been initialized yet while must been " +
                                "before working with files of pages and shared components localization."
                        })),
                        title: es_extensions_1.UnexpectedEventError.localization.defaultTitle,
                        occurrenceLocation: "generator.prepareFilesForPagesOrSharedComponentsStringResources(compoundParameter)"
                    });
                }
                const newCSharpNamespace = [
                    this.outputFileCSharpNamespaceCommonPart,
                    ...targetFilesCommonOutputDirectory.relativePath.split(path_1.default.sep),
                    es_extensions_nodejs_1.ImprovedPath.extractDirectoryFromFilePath({
                        targetPath: schemaFileOutputPathRelativeToBaseOne,
                        ambiguitiesResolution: {
                            mustConsiderLastSegmentStartingWithDotAsDirectory: false,
                            mustConsiderLastSegmentWithNonLeadingDotAsDirectory: false,
                            mustConsiderLastSegmentWithoutDotsAsFileNameWithoutExtension: false
                        }
                    }).replaceAll(path_1.default.sep, ".")
                ].join(".");
                const outputSchemaFileContent = [
                    Generator.OUTPUT_FILE_COMMENT_HEADER,
                    "",
                    sourceSchemaFileContent.
                        replace(Generator.generateCSharpNamespaceDeclarationRegularExpression({
                        targetNamespaceName: originalCSharpNamespace.replaceAll(".", "\\.")
                    }), `namespace ${newCSharpNamespace};`).
                        replace(Generator.generateCSharpUsingDeclarationRegularExpression({
                        targetUsedNamespaceName: this.commonStringResourcesNamespaces.original.replaceAll(".", "\\.")
                    }), Generator.generateCSharpUsingDeclaration({
                        targetUsedNamespaceName: this.commonStringResourcesNamespaces.new
                    }))
                ].join("\n");
                es_extensions_nodejs_1.ImprovedFileSystem.writeFileToPossiblyNotExistingDirectory({
                    filePath: path_1.default.join(targetFilesCommonOutputDirectory.absolutePath, path_1.default.relative(targetFilesCommonSourceDirectoryAbsolutePath, removePathSegments(schemaFileSourceAbsolutePath, ["Localizations"]))),
                    content: outputSchemaFileContent,
                    synchronously: true
                });
                for (const localizationSourceFileRelativePath of localizationsSourceFilesRelativePaths) {
                    /* [ Theory ] For the unclear reason non-braking space is being appended to read file content; need to trim it. */
                    const sourceLocalizationFileContent = fs_1.default.
                        readFileSync(path_1.default.join(targetFilesCommonSourceDirectoryAbsolutePath, localizationSourceFileRelativePath), "utf-8").
                        trim();
                    const outputLocalizationFileContent = [
                        Generator.OUTPUT_FILE_COMMENT_HEADER,
                        "",
                        sourceLocalizationFileContent.
                            replace(Generator.generateCSharpNamespaceDeclarationRegularExpression({
                            targetNamespaceName: originalCSharpNamespace.replaceAll(".", "\\.")
                        }), `namespace ${newCSharpNamespace};`).
                            replace(Generator.generateCSharpUsingDeclarationRegularExpression({
                            targetUsedNamespaceName: this.commonStringResourcesNamespaces.original.replaceAll(".", "\\.")
                        }), Generator.generateCSharpUsingDeclaration({
                            targetUsedNamespaceName: this.commonStringResourcesNamespaces.new
                        }))
                    ].join("\n");
                    es_extensions_nodejs_1.ImprovedFileSystem.writeFileToPossiblyNotExistingDirectory({
                        filePath: path_1.default.join(targetFilesCommonOutputDirectory.absolutePath, removePathSegments(localizationSourceFileRelativePath, ["Localizations"])),
                        content: outputLocalizationFileContent,
                        synchronously: true
                    });
                }
            }
        }
    }
    static generateCSharpNamespaceDeclarationRegularExpression({ targetNamespaceName }) {
        return new RegExp(`^[^\\S\\r\\n]*namespace[^\\S\\r\\n]+${targetNamespaceName}[^\\S\\r\\n]*;`, "gmu");
    }
    static generateCSharpNamespaceDeclaration({ targetNamespaceName }) {
        return `namespace ${targetNamespaceName};`;
    }
    static generateCSharpUsingDeclarationRegularExpression({ targetUsedNamespaceName }) {
        return new RegExp(`^[^\\S\\r\\n]*using[^\\S\\r\\n]+${targetUsedNamespaceName}[^\\S\\r\\n]*;`, "gmu");
    }
    static generateCSharpUsingDeclaration({ targetUsedNamespaceName }) {
        return `using ${targetUsedNamespaceName};`;
    }
}
exports.default = Generator;
function isStringIncludingAtLeastOneOfSubstrings(targetString, substrings) {
    for (const substring of substrings) {
        if (targetString.includes(substring)) {
            return true;
        }
    }
    return false;
}
function removePathSegments(targetPath, targetPathSegments) {
    return (0, es_extensions_1.removeArrayElementsByPredicates)({
        targetArray: (0, es_extensions_1.explodeURI_PathToSegments)(targetPath),
        predicate: (element) => targetPathSegments.includes(element),
        mutably: true
    }).updatedArray.join("/");
}
/** Upgrade of ImprovedGlob.buildAllFilesInCurrentDirectoryAndBelowGlobSelector */
function buildAllFilesInCurrentDirectoryAndBelowGlobSelector({ basicDirectoryPath, fileNamePostfixes, fileNamesExtensions }) {
    return [
        appendCharacterIfItDoesNotPresentInLastPosition({
            targetString: (0, es_extensions_1.replaceDoubleBackslashesWithForwardSlashes)(basicDirectoryPath),
            trailingCharacter: "/"
        }),
        "**/*",
        ...(0, es_extensions_1.isNonEmptyArray)(fileNamePostfixes) ?
            [`@(${fileNamePostfixes.join("|").replace(/\./gu, "")})`] : [],
        ...(0, es_extensions_1.isNonEmptyArray)(fileNamesExtensions) ?
            [es_extensions_nodejs_1.ImprovedGlob.createMultipleFilenameExtensionsGlobPostfix(fileNamesExtensions)] : []
    ].join("");
}
function appendCharacterIfItDoesNotPresentInLastPosition(compoundParameter) {
    const { targetString, trailingCharacter } = compoundParameter;
    return targetString.endsWith(trailingCharacter) ? targetString : `${targetString}${trailingCharacter}`;
}
