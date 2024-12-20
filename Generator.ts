import FileSystem from "fs";
import Path from "path";
import {
  RawObjectDataProcessor,
  capitalizeFirstCharacter,
  explodeURI_PathToSegments,
  getMatchingWithFirstRegularExpressionCapturingGroup,
  removeArrayElementsByPredicates,
  replaceDoubleBackslashesWithForwardSlashes,
  Logger,
  UnexpectedEventError,
  PoliteErrorsMessagesBuilder,
  isNonEmptyString,
  isNonEmptyArray,
  isNotUndefined,
  isUndefined
} from "@yamato-daiwa/es-extensions";
import {
  ImprovedGlob,
  ImprovedPath,
  ImprovedFileSystem,
  ConsoleApplicationLogger,
  InvalidConsoleCommandError,
  ObjectDataFilesProcessor,
  FileNotFoundError
} from "@yamato-daiwa/es-extensions-nodejs";


class Generator {

  /* ━━━ Static Fields ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  private static readonly CONSOLE_COMMAND_PHRASE: string = "aa1";

  private static readonly REGULAR_EXPRESSION_FOR_EXTRACTING_OF_CSHARP_NAMESPACE_DECLARATION: RegExp =
      /^[^\S\r\n]*namespace[^\S\r\n]+(?<namespaceDeclaraction>[^;]+);/gmu;

  private static readonly OUTPUT_FILE_COMMENT_HEADER: string = [
    "/* [ !!! ATTENTION !!! ] NO MANUAL EDITING!!!       */",
    "/* This file is being GENERATED REPEATEDLY.         */",
    "/* All manual changes COULD BE LOST AT ANY MOMENT.  */"
  ].join("\n");


  /* ━━━ Instance Fields ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  private readonly sourceDirectories: Readonly<{
    base: Readonly<{ absolutePath: string; }>;
    commonStringResources: Readonly<{ relativePath: string; absolutePath: string; }>;
    pages: Readonly<{ relativePath: string; absolutePath: string; }>;
    sharedComponents: Readonly<{ relativePath: string; absolutePath: string; }>;
  }>;

  private readonly outputDirectories: Readonly<{
    base: Readonly<{ absolutePath: string; }>;
    commonStringResources: Readonly<{ relativePath: string; absolutePath: string; }>;
    pages: Readonly<{ relativePath: string; absolutePath: string; }>;
    sharedComponents: Readonly<{ relativePath: string; absolutePath: string; }>;
  }>;

  private readonly targetLocales__capitalized: ReadonlyArray<string>;
  private readonly outputFileCSharpNamespaceCommonPart: string;

  /* [ Dynamic Initialization ] */
  private commonStringResourcesNamespaces?: {
    original: string;
    new: string;
  };


  /* ━━━ Entry Point ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  public static interpretAndExecuteConsoleCommand(): void {

    Logger.setImplementation(ConsoleApplicationLogger);

    const configurationFileRelativePath: unknown = process.argv[2];

    if (!isNonEmptyString(configurationFileRelativePath)) {
      Logger.throwErrorAndLog({
        errorInstance: new InvalidConsoleCommandError({
          customMessage:
              `The command "${ Generator.CONSOLE_COMMAND_PHRASE }" must be invoked with single parameter, the relative ` +
              "path to configuration file of YAML format."
        }),
        title: UnexpectedEventError.localization.defaultTitle,
        occurrenceLocation: "Generator.interpretAndExecuteConsoleCommand()"
      });
    }

    const order: ReadonlyArray<Generator.Configuration> = ObjectDataFilesProcessor.
        processFile<ReadonlyArray<Generator.Configuration>>({
          filePath: Path.join(process.cwd(), configurationFileRelativePath),
          validDataSpecification: {
            nameForLogging: "AA1 Application Configuration",
            subtype: RawObjectDataProcessor.ObjectSubtypes.indexedArray,
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
  private constructor(
    {
      sourceDirectoriesRelativePaths,
      outputDirectoriesRelativePaths,
      targetLocales,
      outputFileCSharpNamespaceCommonPart
    }: Generator.Configuration
  ) {

    const baseSourceDirectoryAbsolutPath: string = Path.join(
      process.cwd(),
      isNotUndefined(sourceDirectoriesRelativePaths.base) ? Path.normalize(sourceDirectoriesRelativePaths.base) : ""
    );

    const commonStringResourcesSourceDirectoryNormalizedRelativePath: string =
        Path.normalize(sourceDirectoriesRelativePaths.commonStringResources);

    const pagesSourceDirectoryNormalizedRelativePath: string = Path.normalize(sourceDirectoriesRelativePaths.pages);

    const sharedComponentsSourceDirectoryNormalizedRelativePath: string =
        Path.normalize(sourceDirectoriesRelativePaths.sharedComponents);

    this.sourceDirectories = {
      base: { absolutePath: baseSourceDirectoryAbsolutPath },
      pages: {
        absolutePath: Path.join(baseSourceDirectoryAbsolutPath, pagesSourceDirectoryNormalizedRelativePath),
        relativePath: pagesSourceDirectoryNormalizedRelativePath
      },
      sharedComponents: {
        absolutePath: Path.join(baseSourceDirectoryAbsolutPath, sharedComponentsSourceDirectoryNormalizedRelativePath),
        relativePath: sharedComponentsSourceDirectoryNormalizedRelativePath
      },
      commonStringResources: {
        absolutePath: Path.join(baseSourceDirectoryAbsolutPath, commonStringResourcesSourceDirectoryNormalizedRelativePath),
        relativePath: commonStringResourcesSourceDirectoryNormalizedRelativePath
      }
    };


    const baseOutputDirectoryAbsolutPath: string = Path.
        join(process.cwd(), Path.normalize(outputDirectoriesRelativePaths.base));

    const commonStringResourcesOutputDirectoryNormalizedRelativePath: string =
        Path.normalize(outputDirectoriesRelativePaths.commonStringResources);

    const pagesStringResourcesOutputDirectoryNormalizedRelativePath: string =
        Path.normalize(outputDirectoriesRelativePaths.pages);

    const sharedComponentsStringResourcesOutputDirectoryNormalizedRelativePath: string =
        Path.normalize(outputDirectoriesRelativePaths.sharedComponents);

    this.outputDirectories = {
      base: { absolutePath: baseOutputDirectoryAbsolutPath },
      commonStringResources: {
        relativePath: commonStringResourcesOutputDirectoryNormalizedRelativePath,
        absolutePath: Path.join(baseOutputDirectoryAbsolutPath, commonStringResourcesOutputDirectoryNormalizedRelativePath)
      },
      pages: {
        relativePath: pagesStringResourcesOutputDirectoryNormalizedRelativePath,
        absolutePath: Path.join(baseOutputDirectoryAbsolutPath, pagesStringResourcesOutputDirectoryNormalizedRelativePath)
      },
      sharedComponents: {
        relativePath: sharedComponentsStringResourcesOutputDirectoryNormalizedRelativePath,
        absolutePath: Path.join(
          baseOutputDirectoryAbsolutPath, sharedComponentsStringResourcesOutputDirectoryNormalizedRelativePath
        )
      }
    };

    this.targetLocales__capitalized = targetLocales.
        map((targetLocale: string): string => capitalizeFirstCharacter(targetLocale.toLowerCase()));

    this.outputFileCSharpNamespaceCommonPart = outputFileCSharpNamespaceCommonPart;

  }


  /* ━━━ Processing ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  private prepareFilesForCommonStringResources(): this {

    const commonStringsResourcesFilesAbsolutePaths: ReadonlyArray<string> = ImprovedGlob.getFilesAbsolutePathsSynchronously([
      buildAllFilesInCurrentDirectoryAndBelowGlobSelector({
        basicDirectoryPath: this.sourceDirectories.commonStringResources.absolutePath,
        fileNamesExtensions: [ "cs" ]
      })
    ]);

    let commonStringsResourcesSchemaFileAbsolutePath: string | undefined;
    const commonStringsResourcesLocalizationsFilesAbsolutePaths: Set<string> = new Set();

    for (const commonStringsResourcesFileAbsolutePath of commonStringsResourcesFilesAbsolutePaths) {

      const fileNameWithoutExtension: string = ImprovedPath.extractFileNameWithoutExtensionFromPath({
        targetPath: commonStringsResourcesFileAbsolutePath,
        mustThrowErrorIfLastPathSegmentHasNoDots: true
      });

      if (isStringIncludingAtLeastOneOfSubstrings(fileNameWithoutExtension, this.targetLocales__capitalized)) {
        commonStringsResourcesLocalizationsFilesAbsolutePaths.add(commonStringsResourcesFileAbsolutePath);
      } else {
        commonStringsResourcesSchemaFileAbsolutePath = commonStringsResourcesFileAbsolutePath;
      }

    }

    if (isUndefined(commonStringsResourcesSchemaFileAbsolutePath)) {
      Logger.throwErrorAndLog({
        errorInstance: new FileNotFoundError({ customMessage: "Common string resources schema file not found." }),
        title: FileNotFoundError.localization.defaultTitle,
        occurrenceLocation: "generator.prepareFilesForCommonStringResources()"
      });
    }


    /* [ Theory ] For the unclear reason non-braking space is being appended to read file content; need to trim it. */
    const sourceSchemaFileContent: string = FileSystem.
        readFileSync(commonStringsResourcesSchemaFileAbsolutePath, "utf-8").
        trim();

    const originalCSharpNamespace: string = getMatchingWithFirstRegularExpressionCapturingGroup(
      sourceSchemaFileContent,
      Generator.REGULAR_EXPRESSION_FOR_EXTRACTING_OF_CSHARP_NAMESPACE_DECLARATION,
      { mustExpectExactlyOneMatching: true }
    );

    const newCSharpNamespace: string = [
      this.outputFileCSharpNamespaceCommonPart,
      ...this.outputDirectories.commonStringResources.relativePath.split(Path.sep)
    ].join(".");

    this.commonStringResourcesNamespaces = {
      original: originalCSharpNamespace,
      new: newCSharpNamespace
    };

    const outputSchemaFileContent: string = [
      Generator.OUTPUT_FILE_COMMENT_HEADER,
      "",
      sourceSchemaFileContent.replace(
        Generator.generateCSharpNamespaceDeclarationRegularExpression({
          targetNamespaceName: originalCSharpNamespace.replaceAll(".", "\\.")
        }),
        Generator.generateCSharpNamespaceDeclaration({ targetNamespaceName: newCSharpNamespace })
      )
    ].join("\n");

    ImprovedFileSystem.writeFileToPossiblyNotExistingDirectory({
      filePath: Path.join(
        this.outputDirectories.commonStringResources.absolutePath,
        Path.basename(commonStringsResourcesSchemaFileAbsolutePath)
      ),
      content: outputSchemaFileContent,
      synchronously: true
    });

    for (const commonStringsResourcesLocalizationFileAbsolutPath of commonStringsResourcesLocalizationsFilesAbsolutePaths) {

      const sourceLocalizationFileContent: string = FileSystem.
          readFileSync(commonStringsResourcesLocalizationFileAbsolutPath, "utf-8").
          trim();

      const outputLocalizationFileContent: string = [
        Generator.OUTPUT_FILE_COMMENT_HEADER,
        "",
        sourceLocalizationFileContent.replace(
          Generator.generateCSharpNamespaceDeclarationRegularExpression({
            targetNamespaceName: originalCSharpNamespace.replaceAll(".", "\\.")
          }),
          `namespace ${
            [
              this.outputFileCSharpNamespaceCommonPart,
              ...this.outputDirectories.commonStringResources.relativePath.split(Path.sep)
            ].join(".")  
          };`
        )
      ].join("\n");

      ImprovedFileSystem.writeFileToPossiblyNotExistingDirectory({
        filePath: Path.join(
          this.outputDirectories.commonStringResources.absolutePath,
          Path.basename(commonStringsResourcesLocalizationFileAbsolutPath)
        ),
        content: outputLocalizationFileContent,
        synchronously: true
      });

    }

    return this;

  }

  private prepareFilesForPagesStringResources(): this {

    this.prepareFilesForPagesOrSharedComponentsStringResources({
      targetFilesCommonSourceDirectoryAbsolutePath: this.sourceDirectories.pages.absolutePath,
      targetFilesCommonOutputDirectory: this.outputDirectories.pages
    });

    return this;

  }

  private prepareFilesForSharedComponentsStringResources(): this {

    this.prepareFilesForPagesOrSharedComponentsStringResources({
      targetFilesCommonSourceDirectoryAbsolutePath: this.sourceDirectories.sharedComponents.absolutePath,
      targetFilesCommonOutputDirectory: this.outputDirectories.sharedComponents
    });

    return this;

  }

  private prepareFilesForPagesOrSharedComponentsStringResources(
    {
      targetFilesCommonSourceDirectoryAbsolutePath,
      targetFilesCommonOutputDirectory
    }: Readonly<{
      targetFilesCommonSourceDirectoryAbsolutePath: string;
      targetFilesCommonOutputDirectory: Readonly<{ relativePath: string; absolutePath: string; }>;
    }>
  ): void {

    const targetFilesAbsolutePaths: ReadonlyArray<string> = ImprovedGlob.getFilesAbsolutePathsSynchronously([
      buildAllFilesInCurrentDirectoryAndBelowGlobSelector({
        basicDirectoryPath: targetFilesCommonSourceDirectoryAbsolutePath,
        fileNamePostfixes: [ "Localization" ],
        fileNamesExtensions: [ "cs" ]
      })
    ]);

    const targetFilesRelativePaths: ReadonlyArray<string> = targetFilesAbsolutePaths.map(
      (targetFilesAbsolutePath: string): string =>
          Path.relative(this.sourceDirectories.pages.absolutePath, targetFilesAbsolutePath)
    );

    const sortedByDirectoriesSourceFilesRelativePaths: Generator.SortedByDirectoriesSourceFilesRelativePaths = new Map();

    for (const targetFileRelativePath of targetFilesRelativePaths) {

      const directoryRelativePath: string = ImprovedPath.extractDirectoryFromFilePath({
        targetPath: targetFileRelativePath,
        ambiguitiesResolution: {
          mustConsiderLastSegmentStartingWithDotAsDirectory: false,
          mustConsiderLastSegmentWithNonLeadingDotAsDirectory: false,
          mustConsiderLastSegmentWithoutDotsAsFileNameWithoutExtension: false
        }
      });

      const relativePathsOfFilesOfSameDirectory: Set<string> | undefined = sortedByDirectoriesSourceFilesRelativePaths.
          get(directoryRelativePath);

      if (isUndefined(relativePathsOfFilesOfSameDirectory)) {
        sortedByDirectoriesSourceFilesRelativePaths.set(directoryRelativePath, new Set([ targetFileRelativePath ]));
      } else {
        relativePathsOfFilesOfSameDirectory.add(targetFileRelativePath);
      }

      for (
        const [
          commonForCurrentlyIteratedFilesSourceDirectoryRelativePath,
          namesOfFilesOfCurrentlyIteratedGroup
        ] of sortedByDirectoriesSourceFilesRelativePaths.entries()
      ) {

        let schemaSourceFileRelativePath: string | undefined;
        const localizationsSourceFilesRelativePaths: Array<string> = [];

        for (const fileRelativePath of namesOfFilesOfCurrentlyIteratedGroup) {
          if (isStringIncludingAtLeastOneOfSubstrings(fileRelativePath, this.targetLocales__capitalized)) {
            localizationsSourceFilesRelativePaths.push(fileRelativePath);
          } else {
            schemaSourceFileRelativePath = fileRelativePath;
          }
        }

        if (isUndefined(schemaSourceFileRelativePath)) {
          Logger.throwErrorAndLog({
            errorInstance: new FileNotFoundError({
              customMessage:
                  "Schema file not found in directory " +
                    `"${ commonForCurrentlyIteratedFilesSourceDirectoryRelativePath }".`
            }),
            title: UnexpectedEventError.localization.defaultTitle,
            occurrenceLocation: "generator.prepareFilesForPagesOrSharedComponentsStringResources(compoundParameter)"
          });
        }


        const schemaFileSourceAbsolutePath: string = Path.join(
          targetFilesCommonSourceDirectoryAbsolutePath, schemaSourceFileRelativePath
        );

        /* [ Theory ] For the unclear reason non-braking space is being appended to read file content; need to trim it. */
        const sourceSchemaFileContent: string = FileSystem.
            readFileSync(schemaFileSourceAbsolutePath, "utf-8").
            trim();

        const originalCSharpNamespace: string = getMatchingWithFirstRegularExpressionCapturingGroup(
          sourceSchemaFileContent,
          Generator.REGULAR_EXPRESSION_FOR_EXTRACTING_OF_CSHARP_NAMESPACE_DECLARATION,
          { mustExpectExactlyOneMatching: true }
        );

        const schemaFileOutputPathRelativeToBaseOne: string = removePathSegments(
          Path.relative(targetFilesCommonSourceDirectoryAbsolutePath, schemaFileSourceAbsolutePath),
          [ "Localizations" ]
        );

        if (isUndefined(this.commonStringResourcesNamespaces)) {
          Logger.throwErrorAndLog({
            errorInstance: new UnexpectedEventError(
              PoliteErrorsMessagesBuilder.buildMessage({
                politeExplanation:
                    "The information required for working with the files relates with pages and shared components " +
                      "has not been collected for some reason.",
                technicalDetails:
                    "\"commonStringResourcesNamespaces\" field has not been initialized yet while must been " +
                      "before working with files of pages and shared components localization."
              })
            ),
            title: UnexpectedEventError.localization.defaultTitle,
            occurrenceLocation: "generator.prepareFilesForPagesOrSharedComponentsStringResources(compoundParameter)"
          });
        }


        const newCSharpNamespace: string = [
          this.outputFileCSharpNamespaceCommonPart,
          ...targetFilesCommonOutputDirectory.relativePath.split(Path.sep),
          ImprovedPath.extractDirectoryFromFilePath({
            targetPath: schemaFileOutputPathRelativeToBaseOne,
            ambiguitiesResolution: {
              mustConsiderLastSegmentStartingWithDotAsDirectory: false,
              mustConsiderLastSegmentWithNonLeadingDotAsDirectory: false,
              mustConsiderLastSegmentWithoutDotsAsFileNameWithoutExtension: false
            }
          }).replaceAll(Path.sep, ".")
        ].join(".");

        const outputSchemaFileContent: string = [
          Generator.OUTPUT_FILE_COMMENT_HEADER,
          "",
          sourceSchemaFileContent.
              replace(
                Generator.generateCSharpNamespaceDeclarationRegularExpression({
                  targetNamespaceName: originalCSharpNamespace.replaceAll(".", "\\.")
                }),
                `namespace ${ newCSharpNamespace };`
              ).
              replace(
                Generator.generateCSharpUsingDeclarationRegularExpression({
                  targetUsedNamespaceName: this.commonStringResourcesNamespaces.original.replaceAll(".", "\\.")
                }),
                Generator.generateCSharpUsingDeclaration({
                  targetUsedNamespaceName: this.commonStringResourcesNamespaces.new
                })
              )
        ].join("\n");

        ImprovedFileSystem.writeFileToPossiblyNotExistingDirectory({
          filePath: Path.join(
            targetFilesCommonOutputDirectory.absolutePath,
            Path.relative(
              targetFilesCommonSourceDirectoryAbsolutePath,
              removePathSegments(schemaFileSourceAbsolutePath, [ "Localizations" ])
            )
          ),
          content: outputSchemaFileContent,
          synchronously: true
        });


        for (const localizationSourceFileRelativePath of localizationsSourceFilesRelativePaths) {

          /* [ Theory ] For the unclear reason non-braking space is being appended to read file content; need to trim it. */
          const sourceLocalizationFileContent: string = FileSystem.
              readFileSync(
                Path.join(targetFilesCommonSourceDirectoryAbsolutePath, localizationSourceFileRelativePath), "utf-8"
              ).
              trim();

          const outputLocalizationFileContent: string = [
            Generator.OUTPUT_FILE_COMMENT_HEADER,
            "",
            sourceLocalizationFileContent.
                replace(
                  Generator.generateCSharpNamespaceDeclarationRegularExpression({
                    targetNamespaceName: originalCSharpNamespace.replaceAll(".", "\\.")
                  }),
                  `namespace ${ newCSharpNamespace };`
                ).
                replace(
                  Generator.generateCSharpUsingDeclarationRegularExpression({
                    targetUsedNamespaceName: this.commonStringResourcesNamespaces.original.replaceAll(".", "\\.")
                  }),
                  Generator.generateCSharpUsingDeclaration({
                    targetUsedNamespaceName: this.commonStringResourcesNamespaces.new
                  })
                )
          ].join("\n");

          ImprovedFileSystem.writeFileToPossiblyNotExistingDirectory({
            filePath: Path.join(
              targetFilesCommonOutputDirectory.absolutePath,
              removePathSegments(localizationSourceFileRelativePath, [ "Localizations" ])
            ),
            content: outputLocalizationFileContent,
            synchronously: true
          });

        }

      }

    }

  }

  private static generateCSharpNamespaceDeclarationRegularExpression(
    { targetNamespaceName }: Readonly<{ targetNamespaceName: string; }>
  ): RegExp {
    return new RegExp(`^[^\\S\\r\\n]*namespace[^\\S\\r\\n]+${ targetNamespaceName }[^\\S\\r\\n]*;`, "gmu");
  }

  private static generateCSharpNamespaceDeclaration(
    { targetNamespaceName }: Readonly<{ targetNamespaceName: string; }>
  ): string {
    return `namespace ${ targetNamespaceName };`;
  }

  private static generateCSharpUsingDeclarationRegularExpression(
    { targetUsedNamespaceName }: Readonly<{ targetUsedNamespaceName: string; }>
  ): RegExp {
    return new RegExp(`^[^\\S\\r\\n]*using[^\\S\\r\\n]+${ targetUsedNamespaceName }[^\\S\\r\\n]*;`, "gmu");
  }

  private static generateCSharpUsingDeclaration(
    { targetUsedNamespaceName }: Readonly<{ targetUsedNamespaceName: string; }>
  ): string {
    return `using ${ targetUsedNamespaceName };`;
  }

}

namespace Generator {

  export type Configuration = Readonly<{
    sourceDirectoriesRelativePaths: Readonly<{
      base: string;
      commonStringResources: string;
      pages: string;
      sharedComponents: string;
    }>;
    outputDirectoriesRelativePaths: Readonly<{
      base: string;
      commonStringResources: string;
      pages: string;
      sharedComponents: string;
    }>;
    targetLocales: ReadonlyArray<string>;
    outputFileCSharpNamespaceCommonPart: string;
  }>;

  export type SortedByDirectoriesSourceFilesRelativePaths = Map<
    SortedByDirectoriesSourceFilesRelativePaths.DirectoryRelativePath,
    Set<SortedByDirectoriesSourceFilesRelativePaths.FileNameWithExtension>
  >;

  export namespace SortedByDirectoriesSourceFilesRelativePaths {
    export type DirectoryRelativePath = string;
    export type FileNameWithExtension = string;
  }

}


export default Generator;


function isStringIncludingAtLeastOneOfSubstrings(
  targetString: string,
  substrings: ReadonlyArray<string> | ReadonlySet<string>
): boolean {

  for (const substring of substrings) {

    if (targetString.includes(substring)) {
      return true;
    }

  }


  return false;

}

function removePathSegments(targetPath: string, targetPathSegments: ReadonlyArray<string>): string {
  return removeArrayElementsByPredicates({
    targetArray: explodeURI_PathToSegments(targetPath),
    predicate: (element: string): boolean => targetPathSegments.includes(element),
    mutably: true
  }).updatedArray.join("/");
}


/** Upgrade of ImprovedGlob.buildAllFilesInCurrentDirectoryAndBelowGlobSelector */
function buildAllFilesInCurrentDirectoryAndBelowGlobSelector(
  {
    basicDirectoryPath,
    fileNamePostfixes,
    fileNamesExtensions
  }: Readonly<{
    basicDirectoryPath: string;
    fileNamePostfixes?: ReadonlyArray<string>;
    fileNamesExtensions?: ReadonlyArray<string>;
  }>
): string {
  return [
    appendCharacterIfItDoesNotPresentInLastPosition({
      targetString: replaceDoubleBackslashesWithForwardSlashes(basicDirectoryPath),
      trailingCharacter: "/"
    }),
    "**/*",
    ...isNonEmptyArray(fileNamePostfixes) ?
        [ `@(${ fileNamePostfixes.join("|").replace(/\./gu, "") })` ] : [],
    ...isNonEmptyArray(fileNamesExtensions) ?
        [ ImprovedGlob.createMultipleFilenameExtensionsGlobPostfix(fileNamesExtensions) ] : []
  ].join("");
}

function appendCharacterIfItDoesNotPresentInLastPosition(
  compoundParameter: Readonly<{ targetString: string; trailingCharacter: string; }>
): string {
  const { targetString, trailingCharacter }: Readonly<{ targetString: string; trailingCharacter: string; }> = compoundParameter;
  return targetString.endsWith(trailingCharacter) ? targetString : `${ targetString }${ trailingCharacter }`;
}
