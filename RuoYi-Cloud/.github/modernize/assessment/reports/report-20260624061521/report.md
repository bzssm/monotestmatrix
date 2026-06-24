# ruoyi

## Summary

| Metric | Value |
|--------|-------|
| Total Issues | 12 |
| Mandatory Blockers | 6 |
| Potential Issues | 4 |

## Component Information

| Property | Value |
|----------|-------|
| Language | Java, JavaScript, Batchfile, Dockerfile |
| Frameworks | Spring Cloud, Spring, Vue, Spring Boot, JakartaEE |
| Build tools | Maven, NodeJs |
| JDK version | 17 |

## Cloud Readiness Issues

| Issue Name | Criticality | Story Points | Occurrences |
|------------|-------------|--------------|-------------|
| Avoid File System Logging in Configuration | Mandatory | 1 | [29](#Avoid_File_System_Logging_in_Configuration) |
| CRA: Default or well-known password detected | Mandatory | 3 | [5](#CRA_Default_or_well-known_password_detected) |
| Hardcoded IP Address | Mandatory | 3 | [3](#Hardcoded_IP_Address) |
| Use of unsecured network protocols or URI libraries | Mandatory | 3 | [1](#Use_of_unsecured_network_protocols_or_URI_libraries) |
| CRA: Use of weak hash algorithm MD5 | Mandatory | 5 | [1](#CRA_Use_of_weak_hash_algorithm_MD5) |
| CRA: Use of insecure random number generator java.util.Random | Mandatory | 5 | [1](#CRA_Use_of_insecure_random_number_generator_java_util_Random) |
| Restricted configurations found | Potential | 2 | [7](#Restricted_configurations_found) |
| MySQL database found | Potential | 5 | [2](#MySQL_database_found) |
| Password found in configuration file | Potential | 3 | [1](#Password_found_in_configuration_file) |
| CRA: Use of ThreadLocalRandom in potential security context | Potential | 3 | [1](#CRA_Use_of_ThreadLocalRandom_in_potential_security_context) |
| Localhost Usage | Optional | 3 | [19](#Localhost_Usage) |

### Issue Details

<details id="Avoid_File_System_Logging_in_Configuration">
<summary><b>Avoid File System Logging in Configuration</b> — affected files</summary>

- `ruoyi-visual/ruoyi-monitor/src/main/resources/logback.xml (line 16)`
- `ruoyi-visual/ruoyi-monitor/src/main/resources/logback.xml (line 17)`
- `ruoyi-visual/ruoyi-monitor/src/main/resources/logback.xml (line 38)`
- `ruoyi-visual/ruoyi-monitor/src/main/resources/logback.xml (line 39)`
- `ruoyi-auth/src/main/resources/logback.xml (line 16)`
- `ruoyi-auth/src/main/resources/logback.xml (line 17)`
- `ruoyi-auth/src/main/resources/logback.xml (line 38)`
- `ruoyi-auth/src/main/resources/logback.xml (line 39)`
- `ruoyi-gateway/src/main/resources/logback.xml (line 16)`
- `ruoyi-gateway/src/main/resources/logback.xml (line 17)`
- `ruoyi-gateway/src/main/resources/logback.xml (line 38)`
- `ruoyi-gateway/src/main/resources/logback.xml (line 39)`
- `ruoyi-modules/ruoyi-file/src/main/resources/logback.xml (line 4)`
- `ruoyi-modules/ruoyi-file/src/main/resources/logback.xml (line 16)`
- `ruoyi-modules/ruoyi-file/src/main/resources/logback.xml (line 17)`
- `ruoyi-modules/ruoyi-file/src/main/resources/logback.xml (line 38)`
- `ruoyi-modules/ruoyi-file/src/main/resources/logback.xml (line 39)`
- `ruoyi-modules/ruoyi-gen/src/main/resources/logback.xml (line 16)`
- `ruoyi-modules/ruoyi-gen/src/main/resources/logback.xml (line 17)`
- `ruoyi-modules/ruoyi-gen/src/main/resources/logback.xml (line 38)`
- `ruoyi-modules/ruoyi-gen/src/main/resources/logback.xml (line 39)`
- `ruoyi-modules/ruoyi-job/src/main/resources/logback.xml (line 16)`
- `ruoyi-modules/ruoyi-job/src/main/resources/logback.xml (line 17)`
- `ruoyi-modules/ruoyi-job/src/main/resources/logback.xml (line 38)`
- `ruoyi-modules/ruoyi-job/src/main/resources/logback.xml (line 39)`
- `ruoyi-modules/ruoyi-system/src/main/resources/logback.xml (line 16)`
- `ruoyi-modules/ruoyi-system/src/main/resources/logback.xml (line 17)`
- `ruoyi-modules/ruoyi-system/src/main/resources/logback.xml (line 38)`
- `ruoyi-modules/ruoyi-system/src/main/resources/logback.xml (line 39)`

</details>

<details id="CRA_Default_or_well-known_password_detected">
<summary><b>CRA: Default or well-known password detected</b> — affected files</summary>

- `docker/docker-compose.yml (line 43)`
- `ruoyi-api/ruoyi-api-system/src/main/java/com/ruoyi/system/api/domain/SysUser.java (line 208)`
- `ruoyi-auth/src/main/java/com/ruoyi/auth/form/LoginBody.java (line 37)`
- `ruoyi-auth/src/main/java/com/ruoyi/auth/form/UnLockBody.java (line 22)`
- `docker/nacos/conf/application.properties (line 5)`

</details>

<details id="Hardcoded_IP_Address">
<summary><b>Hardcoded IP Address</b> — affected files</summary>

- `ruoyi-common/ruoyi-common-core/src/main/java/com/ruoyi/common/core/utils/ip/IpUtils.java (line 68)`
- `ruoyi-common/ruoyi-common-core/src/main/java/com/ruoyi/common/core/utils/ip/IpUtils.java (line 80)`
- `ruoyi-common/ruoyi-common-core/src/main/java/com/ruoyi/common/core/utils/ip/IpUtils.java (line 228)`

</details>

<details id="Use_of_unsecured_network_protocols_or_URI_libraries">
<summary><b>Use of unsecured network protocols or URI libraries</b> — affected files</summary>

- `ruoyi-common/ruoyi-common-core/src/main/java/com/ruoyi/common/core/constant/Constants.java (line 43)`

</details>

<details id="CRA_Use_of_weak_hash_algorithm_MD5">
<summary><b>CRA: Use of weak hash algorithm MD5</b> — affected files</summary>

- `ruoyi-common/ruoyi-common-core/src/main/java/com/ruoyi/common/core/utils/uuid/UUID.java (line 119)`

</details>

<details id="CRA_Use_of_insecure_random_number_generator_java_util_Random">
<summary><b>CRA: Use of insecure random number generator java.util.Random</b> — affected files</summary>

- `ruoyi-gateway/src/main/java/com/ruoyi/gateway/config/KaptchaTextCreator.java (line 19)`

</details>

<details id="Restricted_configurations_found">
<summary><b>Restricted configurations found</b> — affected files</summary>

- `ruoyi-visual/ruoyi-monitor/src/main/resources/bootstrap.yml (line 26)`
- `ruoyi-auth/src/main/resources/bootstrap.yml (line 26)`
- `ruoyi-gateway/src/main/resources/bootstrap.yml (line 41)`
- `ruoyi-modules/ruoyi-file/src/main/resources/bootstrap.yml (line 26)`
- `ruoyi-modules/ruoyi-gen/src/main/resources/bootstrap.yml (line 26)`
- `ruoyi-modules/ruoyi-job/src/main/resources/bootstrap.yml (line 26)`
- `ruoyi-modules/ruoyi-system/src/main/resources/bootstrap.yml (line 26)`

</details>

<details id="MySQL_database_found">
<summary><b>MySQL database found</b> — affected files</summary>

- `docker/nacos/conf/application.properties (line 3)`

</details>

<details id="Password_found_in_configuration_file">
<summary><b>Password found in configuration file</b> — affected files</summary>

- `docker/nacos/conf/application.properties (line 5)`

</details>

<details id="CRA_Use_of_ThreadLocalRandom_in_potential_security_context">
<summary><b>CRA: Use of ThreadLocalRandom in potential security context</b> — affected files</summary>

- `ruoyi-common/ruoyi-common-core/src/main/java/com/ruoyi/common/core/utils/uuid/UUID.java (line 482)`

</details>

<details id="Localhost_Usage">
<summary><b>Localhost Usage</b> — affected files</summary>

- `ruoyi-modules/ruoyi-system/src/main/resources/bootstrap.yml (line 17)`
- `ruoyi-modules/ruoyi-system/src/main/resources/bootstrap.yml (line 20)`
- `ruoyi-visual/ruoyi-monitor/src/main/resources/bootstrap.yml (line 17)`
- `ruoyi-visual/ruoyi-monitor/src/main/resources/bootstrap.yml (line 20)`
- `ruoyi-auth/src/main/resources/bootstrap.yml (line 17)`
- `ruoyi-auth/src/main/resources/bootstrap.yml (line 20)`
- `ruoyi-common/ruoyi-common-core/src/main/java/com/ruoyi/common/core/utils/ip/IpUtils.java (line 68)`
- `ruoyi-common/ruoyi-common-core/src/main/java/com/ruoyi/common/core/utils/ip/IpUtils.java (line 80)`
- `ruoyi-common/ruoyi-common-core/src/main/java/com/ruoyi/common/core/utils/ip/IpUtils.java (line 228)`
- `ruoyi-gateway/src/main/resources/bootstrap.yml (line 17)`
- `ruoyi-gateway/src/main/resources/bootstrap.yml (line 20)`
- `ruoyi-gateway/src/main/resources/bootstrap.yml (line 26)`
- `ruoyi-gateway/src/main/resources/bootstrap.yml (line 31)`
- `ruoyi-modules/ruoyi-gen/src/main/resources/bootstrap.yml (line 17)`
- `ruoyi-modules/ruoyi-gen/src/main/resources/bootstrap.yml (line 20)`
- `ruoyi-modules/ruoyi-file/src/main/resources/bootstrap.yml (line 17)`
- `ruoyi-modules/ruoyi-file/src/main/resources/bootstrap.yml (line 20)`
- `ruoyi-modules/ruoyi-job/src/main/resources/bootstrap.yml (line 17)`
- `ruoyi-modules/ruoyi-job/src/main/resources/bootstrap.yml (line 20)`

</details>

## Upgrade Issues

| Issue Name | Criticality | Story Points | Occurrences |
|------------|-------------|--------------|-------------|
| Java Version is not the latest LTS | Optional | 8 | [1](#Java_Version_is_not_the_latest_LTS) |

### Issue Details

<details id="Java_Version_is_not_the_latest_LTS">
<summary><b>Java Version is not the latest LTS</b> — affected files</summary>

- `pom.xml (line 19)`

</details>

---

## Codebase Insights

> **Note:** These documents are generated by AI and may contain inaccuracies or incomplete information. Please review carefully.

> **Codebase Insights aren't available yet.**
>
> These documents are generated when assessment runs with **Full analysis** coverage. Re-run the assessment and set `analysisCoverage: full` to enable them.

[Share feedback](https://aka.ms/ghcp-appmod/feedback)
