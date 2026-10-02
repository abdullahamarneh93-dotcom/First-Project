# Expense Tracker

A full-stack expense tracking web application that allows users to record, manage, and categorize daily expenses with live summary calculations and persistent storage.

## How to run

Follow these steps to run the application locally from scratch:

**Backend**


1. Open PostgreSQL (via pgAdmin or psql) and create a database named `expense_tracker`.
2. Run the `schema.sql` script on the `expense_tracker` database to create the table and seed initial data.
3. Navigate to the `backend` folder:
   ```bash
   cd backend

**Frontend**

1. Open the project folder in VS Code.   
2. Right-click on frontend/index.html and select Open with Live Server (or open the file in your browser).   


## Features

<!-- List what your app can do. Tick what you finished. -->

- [x] Add an expense (with validation)
- [x] Delete an expense
- [x] Edit an expense
- [x] Filter by category
- [x] Summary cards (total, count, highest)
- [x] Data is saved in a PostgreSQL database

## Screenshots

- **Desktop View:**
  ![Desktop Overview](screenshots/desktop.png)

- **Mobile View:**
  ![Mobile Overview](screenshots/mobile.png)

## What was the hardest part?

The hardest part was managing proper data formatting between PostgreSQL and the frontend—specifically ensuring that the NUMERIC column is parsed correctly as a float for calculations and converting the date using to_char to avoid UTC time zone shifts[cite: 1]. Another challenging part was handling network disconnections gracefully so the interface displays clear Bootstrap alerts instead of breaking[cite: 1].
