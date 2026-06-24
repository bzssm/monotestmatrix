# BaGet.Aliyun

## Summary

| Metric | Value |
|--------|-------|
| Total Issues | 9 |
| Mandatory Blockers | 1 |
| Potential Issues | 6 |

## Component Information

| Property | Value |
|----------|-------|
| Language | C# |
| Frameworks | netstandard2.0 |
| Build tools | MSBuild |

## Cloud Readiness Issues

| Issue Name | Criticality | Story Points | Occurrences |
|------------|-------------|--------------|-------------|
| Out of support .NET target framework is detected | Mandatory | 3 | [8](#Out_of_support_NET_target_framework_is_detected) |
| Hardcoded URLs detected | Potential | 1 | [36](#Hardcoded_URLs_detected) |
| Local or network IO operations detected | Potential | 3 | [33](#Local_or_network_IO_operations_detected) |
| Access to external resources via HTTP is detected | Potential | 3 | [33](#Access_to_external_resources_via_HTTP_is_detected) |
| Dependency on cloud services outside of Azure is detected | Potential | 3 | [8](#Dependency_on_cloud_services_outside_of_Azure_is_detected) |
| Local application configuration detected | Potential | 1 | [8](#Local_application_configuration_detected) |
| Environment variables dependency detected | Potential | 3 | [1](#Environment_variables_dependency_detected) |
| Synchronous API usage detected | Optional | 1 | [2](#Synchronous_API_usage_detected) |
| Static content detected | Optional | 3 | [1](#Static_content_detected) |

### Issue Details

<details id="Out_of_support_NET_target_framework_is_detected">
<summary><b>Out of support .NET target framework is detected</b> — affected files</summary>

- `tests/BaGet.Core.Tests/BaGet.Core.Tests.csproj`
- `src/BaGet/BaGet.csproj`
- `samples/BaGet.Protocol.Samples.Tests/BaGet.Protocol.Samples.Tests.csproj`
- `tests/BaGet.Protocol.Tests/BaGet.Protocol.Tests.csproj`
- `tests/BaGet.Tests/BaGet.Tests.csproj`
- `src/BaGet.Web/BaGet.Web.csproj`
- `tests/BaGet.Web.Tests/BaGet.Web.Tests.csproj`
- `samples/BaGetWebApplication/BaGetWebApplication.csproj`

</details>

<details id="Hardcoded_URLs_detected">
<summary><b>Hardcoded URLs detected</b> — affected files</summary>

- `src/BaGet.Core/Storage/PackageStorageService.cs (line 201)`
- `src/BaGet.Core/Upstream/PackageDownloadsJsonSource.cs (line 16)`
- `tests/BaGet.Core.Tests/Upstream/V3UpstreamClientTests.cs (line 106)`
- `tests/BaGet.Core.Tests/Upstream/V3UpstreamClientTests.cs (line 108)`
- `tests/BaGet.Core.Tests/Upstream/V3UpstreamClientTests.cs (line 111)`
- `tests/BaGet.Core.Tests/Upstream/V3UpstreamClientTests.cs (line 166)`
- `tests/BaGet.Core.Tests/Upstream/V3UpstreamClientTests.cs (line 167)`
- `src/BaGet.Protocol/Models/AutocompleteContext.cs (line 8)`
- `src/BaGet.Protocol/Models/SearchContext.cs (line 10)`
- `src/BaGet.Protocol/Models/RegistrationLeafResponse.cs (line 16)`
- `samples/BaGet.Protocol.Samples.Tests/Sample03_Metadata.cs (line 16)`
- `samples/BaGet.Protocol.Samples.Tests/Sample03_Metadata.cs (line 39)`
- `samples/BaGet.Protocol.Samples.Tests/Sample03_Metadata.cs (line 55)`
- `samples/BaGet.Protocol.Samples.Tests/Sample02_Search.cs (line 15)`
- `samples/BaGet.Protocol.Samples.Tests/Sample02_Search.cs (line 33)`
- `samples/BaGet.Protocol.Samples.Tests/Sample02_Search.cs (line 54)`
- `samples/BaGet.Protocol.Samples.Tests/Sample01_Download.cs (line 14)`
- `samples/BaGet.Protocol.Samples.Tests/Sample01_Download.cs (line 29)`
- `tests/BaGet.Protocol.Tests/RawPackageMetadataClientTests.cs (line 111)`
- `tests/BaGet.Protocol.Tests/RawPackageMetadataClientTests.cs (line 91)`
- `tests/BaGet.Protocol.Tests/RawPackageMetadataClientTests.cs (line 117)`
- `tests/BaGet.Protocol.Tests/RawPackageMetadataClientTests.cs (line 114)`
- `tests/BaGet.Protocol.Tests/RawPackageMetadataClientTests.cs (line 97)`
- `tests/BaGet.Protocol.Tests/RawPackageMetadataClientTests.cs (line 94)`
- `tests/BaGet.Tests/ApiIntegrationTests.cs (line 128)`
- `tests/BaGet.Tests/ApiIntegrationTests.cs (line 166)`
- `tests/BaGet.Tests/ApiIntegrationTests.cs (line 147)`
- `tests/BaGet.Tests/ApiIntegrationTests.cs (line 109)`
- `tests/BaGet.Tests/ApiIntegrationTests.cs (line 89)`
- `tests/BaGet.Tests/ApiIntegrationTests.cs (line 47)`
- `tests/BaGet.Tests/ApiIntegrationTests.cs (line 319)`
- `tests/BaGet.Tests/ApiIntegrationTests.cs (line 244)`
- `tests/BaGet.Tests/MirrorIntegrationTests.cs (line 37)`
- `tests/BaGet.Tests/MirrorIntegrationTests.cs (line 154)`
- `tests/BaGet.Tests/MirrorIntegrationTests.cs (line 90)`
- `tests/BaGet.Tests/Support/BaGetApplication.cs (line 67)`

</details>

<details id="Local_or_network_IO_operations_detected">
<summary><b>Local or network IO operations detected</b> — affected files</summary>

- `src/BaGet.Core/Indexing/SymbolIndexingService.cs (line 123)`
- `src/BaGet.Core/Indexing/SymbolIndexingService.cs (line 132)`
- `src/BaGet.Core/Extensions/StreamExtensions.cs (line 21)`
- `src/BaGet.Core/Extensions/StreamExtensions.cs (line 25)`
- `src/BaGet.Core/Extensions/StreamExtensions.cs (line 26)`
- `src/BaGet.Core/Storage/FileStorageService.cs (line 61)`
- `src/BaGet.Core/Storage/FileStorageService.cs (line 89)`
- `src/BaGet.Core/Storage/FileStorageService.cs (line 71)`
- `src/BaGet.Core/Storage/FileStorageService.cs (line 65)`
- `src/BaGet.Core/Storage/FileStorageService.cs (line 73)`
- `src/BaGet.Core/Storage/FileStorageService.cs (line 33)`
- `src/BaGet.Core/Storage/SymbolStorageService.cs (line 52)`
- `src/BaGet.Core/Configuration/FileSystemStorageOptions.cs (line 21)`
- `src/BaGet.Core/Upstream/PackageDownloadsJsonSource.cs (line 91)`
- `src/BaGet.Core/Upstream/PackageDownloadsJsonSource.cs (line 91)`
- `tests/BaGet.Core.Tests/Services/FileStorageServiceTests.cs (line 198)`
- `tests/BaGet.Core.Tests/Services/FileStorageServiceTests.cs (line 99)`
- `tests/BaGet.Core.Tests/Services/FileStorageServiceTests.cs (line 176)`
- `tests/BaGet.Core.Tests/Services/FileStorageServiceTests.cs (line 97)`
- `tests/BaGet.Core.Tests/Services/FileStorageServiceTests.cs (line 171)`
- `tests/BaGet.Core.Tests/Services/FileStorageServiceTests.cs (line 170)`
- `tests/BaGet.Core.Tests/Services/FileStorageServiceTests.cs (line 26)`
- `tests/BaGet.Core.Tests/Services/FileStorageServiceTests.cs (line 108)`
- `tests/BaGet.Core.Tests/Services/FileStorageServiceTests.cs (line 128)`
- `tests/BaGet.Core.Tests/Services/FileStorageServiceTests.cs (line 212)`
- `tests/BaGet.Core.Tests/Services/FileStorageServiceTests.cs (line 109)`
- `tests/BaGet.Core.Tests/Services/FileStorageServiceTests.cs (line 129)`
- `src/BaGet/ConfigureRazorRuntimeCompilation.cs (line 24)`
- `src/BaGet.Protocol/Catalog/FileCursor.cs (line 47)`
- `src/BaGet.Protocol/Catalog/FileCursor.cs (line 30)`
- `tests/BaGet.Tests/Support/TestableHttpSource.cs (line 18)`
- `tests/BaGet.Tests/Support/BaGetApplication.cs (line 41)`
- `tests/BaGet.Tests/Support/BaGetApplication.cs (line 35)`

</details>

<details id="Access_to_external_resources_via_HTTP_is_detected">
<summary><b>Access to external resources via HTTP is detected</b> — affected files</summary>

- `src/BaGet.Core/Extensions/DependencyInjectionExtensions.cs (line 168)`
- `src/BaGet.Core/Extensions/DependencyInjectionExtensions.cs (line 176)`
- `src/BaGet.Core/Extensions/DependencyInjectionExtensions.cs (line 189)`
- `src/BaGet.Core/Upstream/PackageDownloadsJsonSource.cs (line 18)`
- `src/BaGet.Core/Upstream/PackageDownloadsJsonSource.cs (line 21)`
- `src/BaGet.Protocol/NuGetClientFactory.cs (line 15)`
- `src/BaGet.Protocol/NuGetClientFactory.cs (line 38)`
- `src/BaGet.Protocol/NuGetClient.cs (line 41)`
- `src/BaGet.Protocol/Extensions/HttpClientExtensions.cs (line 19)`
- `src/BaGet.Protocol/Extensions/HttpClientExtensions.cs (line 49)`
- `src/BaGet.Protocol/PackageContent/RawPackageContentClient.cs (line 16)`
- `src/BaGet.Protocol/PackageContent/RawPackageContentClient.cs (line 24)`
- `src/BaGet.Protocol/ServiceIndex/RawServiceIndexClient.cs (line 15)`
- `src/BaGet.Protocol/ServiceIndex/RawServiceIndexClient.cs (line 23)`
- `src/BaGet.Protocol/Search/RawSearchClient.cs (line 17)`
- `src/BaGet.Protocol/Search/RawSearchClient.cs (line 25)`
- `src/BaGet.Protocol/Search/RawAutocompleteClient.cs (line 15)`
- `src/BaGet.Protocol/Search/RawAutocompleteClient.cs (line 23)`
- `src/BaGet.Protocol/Catalog/RawCatalogClient.cs (line 11)`
- `src/BaGet.Protocol/Catalog/RawCatalogClient.cs (line 14)`
- `src/BaGet.Protocol/PackageMetadata/RawPackageMetadataClient.cs (line 13)`
- `src/BaGet.Protocol/PackageMetadata/RawPackageMetadataClient.cs (line 21)`
- `tests/BaGet.Protocol.Tests/Support/ProtocolFixture.cs (line 10)`
- `tests/BaGet.Tests/NuGetClientIntegrationTests.cs (line 21)`
- `tests/BaGet.Tests/ApiIntegrationTests.cs (line 13)`
- `tests/BaGet.Tests/MirrorIntegrationTests.cs (line 14)`
- `tests/BaGet.Tests/BaGetClientIntegrationTests.cs (line 18)`
- `tests/BaGet.Tests/Support/TestableHttpSource.cs (line 13)`
- `tests/BaGet.Tests/Support/TestableHttpSource.cs (line 34)`
- `tests/BaGet.Tests/Support/HttpSourceResourceProviderTestHost.cs (line 20)`
- `tests/BaGet.Tests/Support/HttpSourceResourceProviderTestHost.cs (line 22)`
- `tests/BaGet.Tests/Support/BaGetApplication.cs (line 23)`
- `tests/BaGet.Tests/Support/BaGetApplication.cs (line 25)`

</details>

<details id="Dependency_on_cloud_services_outside_of_Azure_is_detected">
<summary><b>Dependency on cloud services outside of Azure is detected</b> — affected files</summary>

- `src/BaGet.Aliyun/AliyunStorageService.cs (line 15)`
- `src/BaGet.Aliyun/AliyunStorageService.cs (line 17)`
- `src/BaGet.Aliyun/AliyunStorageService.cs (line 62)`
- `src/BaGet.Aliyun/AliyunStorageService.cs (line 62)`
- `src/BaGet.Aliyun/AliyunStorageService.cs (line 39)`
- `src/BaGet.Aliyun/AliyunStorageService.cs (line 67)`
- `src/BaGet.Aliyun/AliyunStorageService.cs (line 67)`
- `src/BaGet.Aliyun/AliyunApplicationExtensions.cs (line 23)`

</details>

<details id="Local_application_configuration_detected">
<summary><b>Local application configuration detected</b> — affected files</summary>

- `src/BaGet/appsettings.json`
- `src/BaGet/appsettings.json`
- `src/BaGet/appsettings.json`
- `src/BaGet/appsettings.json`
- `src/BaGet/appsettings.json`
- `src/BaGet/appsettings.json`
- `src/BaGet/appsettings.json`
- `samples/BaGetWebApplication/appsettings.json`

</details>

<details id="Environment_variables_dependency_detected">
<summary><b>Environment variables dependency detected</b> — affected files</summary>

- `src/BaGet/Properties/launchSettings.json`

</details>

<details id="Synchronous_API_usage_detected">
<summary><b>Synchronous API usage detected</b> — affected files</summary>

- `tests/BaGet.Core.Tests/Services/FileStorageServiceTests.cs (line 109)`
- `tests/BaGet.Core.Tests/Services/FileStorageServiceTests.cs (line 129)`

</details>

<details id="Static_content_detected">
<summary><b>Static content detected</b> — affected files</summary>

- `src/BaGet.Web/BaGet.Web.csproj`

</details>

---

## Codebase Insights

> **Note:** These documents are generated by AI and may contain inaccuracies or incomplete information. Please review carefully.

> **Codebase Insights aren't available yet.**
>
> These documents are generated when assessment runs with **Full analysis** coverage. Re-run the assessment and set `analysisCoverage: full` to enable them.

[Share feedback](https://aka.ms/ghcp-appmod/feedback)
