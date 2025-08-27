# How to Install Redis on Windows for this API

This project uses Redis as a message queue to handle WhatsApp broadcasts efficiently. Redis is not officially supported on Windows, but there are two common and reliable ways to install and run it for development purposes.

## Option 1: Install Redis using WSL (Windows Subsystem for Linux) - Recommended

WSL allows you to run a Linux environment directly on Windows, without the overhead of a traditional virtual machine. This is the most recommended way to run Redis on Windows.

### 1. Install WSL

If you don't have WSL installed, open PowerShell as an Administrator and run:
```sh
wsl --install
```
This will install WSL and the default Ubuntu distribution. Restart your computer after the installation is complete.

### 2. Update and Install Redis

Once your Linux distribution (e.g., Ubuntu) is set up, open it and run the following commands to update the package lists and install Redis:
```sh
sudo apt-get update
sudo apt-get upgrade
sudo apt-get install redis-server
```

### 3. Start the Redis Server

You can start the Redis server with the following command:
```sh
sudo service redis-server start
```

### 4. Verify Redis is Running

Check that Redis is running correctly:
```sh
redis-cli ping
```
If it's running, it will reply with `PONG`.

Your API, running on Windows, will be able to connect to this Redis instance at `localhost:6379` without any extra configuration.

## Option 2: Install an Unofficial Windows Port

There is a popular, though unofficial, port of Redis for Windows maintained by Microsoft Open Tech. It is a few versions behind the official Redis, but it is stable and suitable for development.

### 1. Download the Installer

Go to the [Redis on Windows releases page](https://github.com/microsoftarchive/redis/releases) and download the latest `.msi` installer file (e.g., `Redis-x64-3.0.504.msi`).

### 2. Run the Installer

Run the downloaded `.msi` file. Follow the setup wizard.
- It is recommended to check the box **"Add the Redis installation folder to the PATH environment variable."**
- It's also recommended to let the installer set a `maxmemory` limit to prevent Redis from consuming all your RAM.

### 3. Redis as a Windows Service

The installer will set up Redis to run automatically as a Windows Service, so it will start every time you boot your computer. You don't need to start it manually.

### 4. Verify Redis is Running

You can verify that the service is running by opening the Task Manager, going to the "Services" tab, and looking for "Redis". Alternatively, you can open a Command Prompt and use the `redis-cli` tool:
```sh
redis-cli ping
```
If it's running, it will respond with `PONG`.

---

Once Redis is installed and running using either of these methods, the API will be able to connect to it and the broadcast functionality will work as expected.
