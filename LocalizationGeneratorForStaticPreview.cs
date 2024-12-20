using System.Text.Json.Nodes;
using YamatoDaiwa.CSharpExtensions;

using DotSeparatedPropertyPath = string;
using JSON_Value = string;
using LanguageKey = string;


namespace YamatoDaiwa.PugCSharpStaticPreview;


public abstract partial class LocalizationsGeneratorForStaticPreview
{

  [System.Text.RegularExpressions.GeneratedRegex(@"\{\{\s*(\w+)\s*\}\}")]
  private static partial System.Text.RegularExpressions.Regex getTemplateVariablesCapturingRegularExpression();
  
  public static void Generate<Localization>(
    JsonObject outputObjectWorkpiece,
    string outputObjectDotSeparatedPathCommonPart,
    Dictionary<LanguageKey, Localization> languageKeysAndLocalizations,
    Dictionary<DotSeparatedPropertyPath, Func<Localization, JSON_Value>> properties,
    string objectTypeNameForJSDoc
  )
  {

    bool hasJSDocNotBeenGeneratedYet = true;

    foreach ((LanguageKey languageKey, Localization localization) in languageKeysAndLocalizations)
    {

      LocalizationsGeneratorForStaticPreview.fillObjectAndGenerateJSDoc(
        outputObjectWorkpiece,
        outputObjectDotSeparatedPathCommonPart,
        languageKey,
        localization,
        properties,
        mustGenerateJSDocForTypeWithName: hasJSDocNotBeenGeneratedYet ? objectTypeNameForJSDoc : null
      );

      hasJSDocNotBeenGeneratedYet = false;

    }

  }

  private static void fillObjectAndGenerateJSDoc<Localization>(
    JsonObject outputObjectWorkpiece,
    string outputObjectDotSeparatedPathCommonPart,
    LanguageKey languageKey,
    Localization localization,
    Dictionary<DotSeparatedPropertyPath, Func<Localization, JSON_Value>> properties,
    string? mustGenerateJSDocForTypeWithName
  )
  {

    if (mustGenerateJSDocForTypeWithName is not null)
    {
      Console.WriteLine("");
      Console.WriteLine("");
      Console.WriteLine("/**");
      Console.WriteLine($" * @typedef { mustGenerateJSDocForTypeWithName }");
    }

    foreach ((string dotSeparatedSpecificPathPart, Func<Localization, JSON_Value> getValue) in properties)
    {

      string dotSeparatedPropertyPath = $"{ outputObjectDotSeparatedPathCommonPart }.{ dotSeparatedSpecificPathPart }";

      string propertyValue = getValue(localization);

      outputObjectWorkpiece.SetProperty($"{ languageKey }.{ dotSeparatedPropertyPath }", propertyValue);

      if (mustGenerateJSDocForTypeWithName is null)
      {
        continue;
      }


      Console.WriteLine($" * @property {{ string }} {dotSeparatedSpecificPathPart}");

      System.Text.RegularExpressions.MatchCollection templateVariablesMatches =
          getTemplateVariablesCapturingRegularExpression().Matches(propertyValue);

      if (templateVariablesMatches.Count > 0)
      {
        Console.WriteLine(
          " *   `type TemplateVariables = { " +
          String.Join(
            " ",
            templateVariablesMatches.Select(
              (System.Text.RegularExpressions.Match templateVariableMatch) =>
                $"{ templateVariableMatch.Groups[1].Value }: string;")
          ) +
          " }`"
        );
      }

    }

    if (mustGenerateJSDocForTypeWithName is null)
    {
      return;
    }


    Console.WriteLine(" */");
    Console.WriteLine("");
    Console.WriteLine($"/** @var {{ { mustGenerateJSDocForTypeWithName } }} */");
    Console.WriteLine(
      $"const $componentStringResources = [VARIABLE_NAME].[LOCALE].{ outputObjectDotSeparatedPathCommonPart };"
    );

  }
  
}
