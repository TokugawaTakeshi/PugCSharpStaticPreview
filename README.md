The npm package and respective nuget package for the creating of the Pug static preview in C# hybrid and web
  applications.
More exactly, this stack provides the solution for the following tasks:

* Generating of the entities (enterprise business rules) objects based on C# classes which could be injected to Pug
* Generating of the string resources based on C# classes which could be injected to Pug
* Generating of the mock data based on C# classes which could be injected to Pug

The [Yamato Daiwa Automation](https://automation.yamato-daiwa.com/) project building tool will also required
  to complete this tasks.


## Limitations for directories structure / file naming

* You will need to create the new entry point.
  Because of "one entry point per project" .NET limitation, it will require to add the new project to your solution
    besides the main one.
* String Resources
  * The names of the classes/structures/records describing the localization schema common for all languages must ends 
    with **"Localization"** (for example, "ProductCardLocalization", "ProductCartLocalization").
  * The names of classes/structures/records including the data for specific language must obey to
    **[Language]Localization** (for example, "ProductCardEnglishLocalization", "ProductCartJapaneseLocalization").
