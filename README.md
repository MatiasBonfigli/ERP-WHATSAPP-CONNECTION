# WhatsApp API with Broadcast and Auto-Update

This project is a Node.js-based API for sending WhatsApp messages, with a robust broadcast system that uses a message queue to handle large volumes of messages while respecting rate limits.

This repository includes scripts to fully automate the installation and update process on a Windows machine.

## Features

- **Standard Message Sending:** Send text and media messages via a simple API endpoint.
- **Broadcast Endpoint:** Send messages to a large list of numbers.
- **Message Queue:** Powered by Redis and BullMQ, ensures messages are sent reliably, respecting a rate limit (10 messages / 3 seconds) and a daily cap (900 messages/day).
- **Automated Bootstrapper Installation:** A single `install.bat` script that clones this repository and sets up the entire environment and Windows Service.
- **Automated Updates:** An `auto_update.bat` script that can be scheduled to keep the API up-to-date with the latest code from the `main` branch.

---

## 1. Installation

The installation is fully automated. You only need the `install.bat` script.

1.  Download the `install.bat` script to any folder on your Windows machine (e.g., your Desktop).
2.  Right-click on `install.bat`.
3.  Select **"Run as administrator"**.

This script will perform the following actions:
- **Request Administrator Privileges:** Necessary to install software and create a Windows service.
- **Install Git:** It will check for and automatically install Git using the `winget` package manager if it's not already present.
- **Clone Repository:** It will clone this repository from GitHub into `C:\ERP-WHATSAPP-CONNECTION`.
- **Install Dependencies:** Inside the new directory, it will install Node.js and Redis using `winget`.
- **Install Project Modules:** It runs `npm install` to download all the necessary Node.js packages.
- **Setup and Start Service:** It downloads **NSSM (the Non-Sucking Service Manager)** and uses it to create a new Windows Service named **`waapi`**. This service runs the API in the background and is automatically configured to start when the computer boots up.

After the script finishes, the API will be installed in `C:\ERP-WHATSAPP-CONNECTION` and running as a true Windows Service.

---

## 2. Auto-Update Setup (Optional)

The `auto_update.bat` script (located inside `C:\ERP-WHATSAPP-CONNECTION`) is designed to automatically check for new updates from the `main` branch of the Git repository, install any new dependencies, and restart the `waapi` service to apply the changes.

To make this process fully automatic, you should set up a **Windows Scheduled Task** to run this script **daily at midnight (00:00)**.

### How to Set Up the Scheduled Task

1.  **Open Task Scheduler:**
    -   Press `Win + R`, type `taskschd.msc`, and press Enter.

2.  **Create a New Task:**
    -   In the right-hand pane, click **"Create Task..."** (not "Create Basic Task...").

3.  **General Tab:**
    -   **Name:** Give the task a descriptive name, like `WhatsApp API Auto-Updater`.
    -   **Description:** (Optional) `Checks for API updates daily at midnight.`
    -   Select **"Run whether user is logged on or not"**.
    -   Check the box for **"Run with highest privileges"**.

4.  **Triggers Tab:**
    -   Click **"New..."**.
    -   Set the schedule:
        -   Begin the task: **"On a schedule"**.
        -   Settings: **"Daily"**.
        -   Start time: **`12:00:00 AM`** (which is 00:00).
    -   Ensure **"Enabled"** is checked at the bottom.
    -   Click **"OK"**.

5.  **Actions Tab:**
    -   Click **"New..."**.
    -   **Action:** **"Start a program"**.
    -   **Program/script:** Click **"Browse..."** and navigate to `C:\ERP-WHATSAPP-CONNECTION`, then select the `auto_update.bat` file.
    -   Click **"OK"**.

6.  **Conditions Tab:**
    -   (Optional) You may want to uncheck **"Start the task only if the computer is on AC power"** if you are running this on a laptop and want it to update even on battery power.

7.  **Save the Task:**
    -   Click **"OK"** to save the task.
    -   You may be prompted to enter your user password to grant the necessary permissions.

The auto-updater is now configured. It will run silently in the background every day at midnight, ensuring your API is always running the latest version of the code from the `main` branch.
