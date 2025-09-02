# WhatsApp API with Broadcast and Auto-Update

This project is a Node.js-based API for sending WhatsApp messages, with a robust broadcast system that uses a message queue to handle large volumes of messages while respecting rate limits.

It also includes scripts to automate the installation and update process on Windows, using **NSSM (the Non-Sucking Service Manager)** for maximum reliability.

## Features

- **Standard Message Sending:** Send text and media messages via a simple API endpoint.
- **Broadcast Endpoint:** Send messages to a large list of numbers.
- **Message Queue:** Powered by Redis and BullMQ, ensures messages are sent reliably, respecting a rate limit (10 messages / 3 seconds) and a daily cap (900 messages/day).
- **Automated Installation:** A one-time `install.bat` script to set up the entire environment and create a Windows Service.
- **Automated Updates:** An `auto_update.bat` script that can be scheduled to keep the API up-to-date with the latest code from the Git repository.

---

## 1. Installation

To get started, simply run the `install.bat` script as an administrator.

1.  Right-click on `install.bat`.
2.  Select **"Run as administrator"**.

This script will perform the following actions:
- **Request Administrator Privileges:** Necessary to install software and create a Windows service.
- **Install Core Dependencies:** It will check for and automatically install Node.js, Git, and Redis using the `winget` package manager if they are not already present.
- **Install Project Modules:** It runs `npm install` to download all the necessary Node.js packages.
- **Setup and Start the Service:** It downloads `nssm.exe` and uses it to create a new Windows Service named **`waapi`**. This service runs the API in the background and is automatically configured to start when the computer boots up.

After the script finishes, the API will be running as a true Windows Service. You can manage it from the Windows Services application (`services.msc`).

---

## 2. Auto-Update Setup (Optional)

The `auto_update.bat` script is designed to automatically check for new updates from the Git repository, install any new dependencies, and restart the `waapi` service to apply the changes.

To make this process fully automatic, you should set up a **Windows Scheduled Task** to run this script periodically (e.g., every hour).

### How to Set Up the Scheduled Task

1.  **Open Task Scheduler:**
    -   Press `Win + R`, type `taskschd.msc`, and press Enter.

2.  **Create a New Task:**
    -   In the right-hand pane, click **"Create Task..."** (not "Create Basic Task...").

3.  **General Tab:**
    -   **Name:** Give the task a descriptive name, like `WhatsApp API Auto-Updater`.
    -   **Description:** (Optional) `Checks for API updates every hour.`
    -   Select **"Run whether user is logged on or not"**.
    -   Check the box for **"Run with highest privileges"**.

4.  **Triggers Tab:**
    -   Click **"New..."**.
    -   Set the schedule:
        -   Begin the task: **"On a schedule"**.
        -   Settings: **"Daily"**.
        -   Repeat task every: **"1 hour"** for a duration of **"Indefinitely"**.
    -   Ensure **"Enabled"** is checked at the bottom.
    -   Click **"OK"**.

5.  **Actions Tab:**
    -   Click **"New..."**.
    -   **Action:** **"Start a program"**.
    -   **Program/script:** Click **"Browse..."** and navigate to the project folder, then select the `auto_update.bat` file.
    -   Click **"OK"**.

6.  **Conditions Tab:**
    -   (Optional) You may want to uncheck **"Start the task only if the computer is on AC power"** if you are running this on a laptop and want it to update even on battery power.

7.  **Save the Task:**
    -   Click **"OK"** to save the task.
    -   You may be prompted to enter your user password to grant the necessary permissions.

The auto-updater is now configured. It will run silently in the background every hour, ensuring your API is always running the latest version of the code.
