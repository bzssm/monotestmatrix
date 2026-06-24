FROM mcr.microsoft.com/vscode/devcontainers/java:0-11

# Install Maven
RUN apt-get update && \
    apt-get install -y maven && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

USER vscode
