# Struts1 Sample Project

## Description

This is a sample project demonstrating the use of Struts 1 with Java 1.5. The project includes a simple Struts-based web application and a Dev Container configuration for running it on GitHub Codespaces.

Here's the structure of the project:

- `pom.xml` - Maven configuration file to manage dependencies.
- `src/main/java` - Directory for Java source files.
- `src/main/webapp` - Directory for web application files (JSP, WEB-INF, etc.).
- `src/main/webapp/WEB-INF/struts-config.xml` - Struts configuration file.
- `.devcontainer/devcontainer.json` - Dev Containers configuration file.
- `.devcontainer/Dockerfile` - Dockerfile for Dev Containers.

## Demo

The demo demonstrates a basic Struts 1 application that displays a "Hello, World!" message.

## Features

- Basic Struts 1.3 implementation
- Basic Action class to handle requests
- JSP page to display the message

## Requirement

- Java 1.5 or later
- Apache Maven
- (Optional) GitHub Codespaces (for running in Dev Containers)
- (Optional) Docker (for running in Dev Containers)

## Usage

1. Clone the repository
   ```bash
   git clone https://github.com/your-repo/struts1-java15-demo.git
   cd struts1-java15-demo
   ```
2. Open in GitHub Codespaces or set up a local environment.
3. Build the project using Maven:
   ```bash
   mvn clean install
   ```
4. Run the application using the embedded Tomcat server:
   ```bash
   mvn tomcat7:run
   ```
5. Access the application at `Access the application via http://localhost:8080/your-app-context/`
   (`http://localhost:8080/struts1-java15-demo/hello.do`)

## Installation

To set up the development environment using GitHub Codespaces:

1. Open the repository in GitHub Codespaces.
2. The .devcontainer configuration will set up Java and Maven automatically.
3. Run the application using the provided configurations.

## References

- [Struts 1 Documentation](https://struts.apache.org/struts1/)
- [Java 1.5 Features](https://docs.oracle.com/javase/1.5.0/docs/)
- [GitHub Codespaces Documentation](https://docs.github.com/en/codespaces)

## Licence

Released under the [MIT license](https://gist.githubusercontent.com/shinyay/56e54ee4c0e22db8211e05e70a63247e/raw/f3ac65a05ed8c8ea70b653875ccac0c6dbc10ba1/LICENSE)

## Author

- github: [https://github.com/shinyay](https://github.com/shinyay)
- twitter: [https://twitter.com/yanashin18618](https://twitter.com/yanashin18618)
- mastodon: [https://mastodon.social/@yanashin](https://mastodon.social/@yanashin)

