# Restaurant Inventory Management System - User Guide

**Version:** 1.0.0  
**Last Updated:** 2025

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Dashboard Overview](#dashboard-overview)
5. [Inventory Management](#inventory-management)
6. [Stock Transactions](#stock-transactions)
7. [Suppliers Management](#suppliers-management)
8. [Recipes Management](#recipes-management)
9. [Sales Tracking](#sales-tracking)
10. [Alerts & Notifications](#alerts--notifications)
11. [Analytics & Reports](#analytics--reports)
12. [User Administration](#user-administration)
13. [Offline Mode](#offline-mode)
14. [Demo Videos](#demo-videos)
15. [Troubleshooting](#troubleshooting)

---

## Introduction

Welcome to the Restaurant Inventory Management System! This comprehensive guide will help you effectively manage your restaurant's inventory, track stock movements, monitor suppliers, and analyze your operations.

### What This System Does

- **Track Inventory**: Monitor all your ingredients and supplies in real-time
- **Stock Management**: Record stock movements (purchases, sales, waste, transfers)
- **Supplier Management**: Keep track of all your suppliers and their contact information
- **Recipe Management**: Create and manage recipes with ingredient lists
- **Sales Tracking**: Record sales and automatically update inventory
- **Smart Alerts**: Get notified when items are running low or out of stock
- **Analytics**: View detailed reports on usage, costs, and trends
- **Multi-User Support**: Role-based access for managers and staff
- **Offline Capability**: Work even when internet connection is unavailable

### System Requirements

- **Web Browser**: Chrome, Firefox, Safari, or Edge (latest versions)
- **Mobile App**: iOS 13+ or Android 8+
- **Internet Connection**: Required for initial setup and syncing (offline mode available)

---

## Getting Started

### 1. Accessing the Application

**Web Application:**
- Open your web browser
- Navigate to your restaurant's inventory management URL
- You'll be redirected to the login page

**Mobile Application:**
- Open the Restaurant Inventory app on your device
- The login screen will appear automatically

### 2. Logging In

**Demo Video: Login Process**
> *Video Description: Screen recording showing the login process. User enters email and password, clicks "Sign In", and is redirected to the dashboard. Show both successful login and error handling for incorrect credentials.*

**Step-by-Step:**

1. **Enter Your Credentials**
   - Email: Enter your registered email address
   - Password: Enter your password
   - Example: `manager@restaurant.com` / `YourPassword123`

2. **Click "Sign In"**
   - The system will authenticate your credentials
   - You'll be redirected to the dashboard upon successful login

3. **First Time Login**
   - If you're logging in for the first time, contact your manager to receive your credentials
   - Managers can create accounts for staff members

**Troubleshooting Login:**
- **Forgot Password**: Contact your manager to reset your password
- **Account Locked**: Wait 15 minutes or contact support
- **Wrong Credentials**: Double-check your email and password

### 3. Navigation Overview

**Demo Video: Navigation Tour**
> *Video Description: Quick tour of the navigation menu, showing all available sections: Dashboard, Inventory, Stock, Suppliers, Recipes, Sales, Alerts, Analytics, Reports, and Users (manager only). Highlight the responsive design on mobile vs desktop.*

**Main Navigation Menu:**

- **Dashboard** - Overview of inventory and recent activity
- **Inventory** - Manage inventory items
- **Stock** - View and record stock transactions
- **Suppliers** - Manage supplier information
- **Recipes** - Create and manage recipes
- **Sales** - Record and track sales
- **Alerts** - View low stock and out-of-stock alerts
- **Analytics** - View usage reports and analytics
- **Reports** - Generate and export reports
- **Users** - User management (Managers only)

**Mobile Navigation:**
- Tap the menu icon (☰) in the top-left corner
- Navigation menu slides in from the left
- Tap outside the menu or the X button to close

---

## User Roles & Permissions

### Manager Role

**Full Access:**
- ✅ Create, read, update, and delete inventory items
- ✅ Manage suppliers (add, edit, delete)
- ✅ View and manage all stock transactions
- ✅ Create and manage recipes
- ✅ Record and manage sales
- ✅ View analytics and reports
- ✅ Manage user accounts (add, edit, delete users)
- ✅ View audit logs
- ✅ Configure inventory settings

**Example Scenario:**
> *Sarah is the restaurant manager. She can add new inventory items, set their costs, manage suppliers, create user accounts for her staff, and view comprehensive analytics to make purchasing decisions.*

### Staff Role

**Limited Access:**
- ✅ View inventory items
- ✅ Create and update inventory items (cannot delete)
- ✅ Create stock transactions (in/out)
- ✅ Update stock transactions (within 24 hours only)
- ✅ View and create recipes
- ✅ Record sales
- ✅ View alerts and mark them as read
- ❌ Cannot delete inventory items
- ❌ Cannot manage suppliers
- ❌ Cannot modify pricing/cost fields
- ❌ Cannot manage other users
- ❌ Cannot view audit logs

**Example Scenario:**
> *John is a kitchen staff member. He can record when ingredients are used, add new stock when deliveries arrive, and create recipes. However, he cannot delete items, change prices, or manage suppliers - those tasks require manager approval.*

**Demo Video: Role-Based Permissions**
> *Video Description: Show side-by-side comparison of manager vs staff views. Demonstrate what actions are available/hidden for each role. Show error messages when staff tries to perform restricted actions.*

---

## Dashboard Overview

**Demo Video: Dashboard Tour**
> *Video Description: Overview of the dashboard showing inventory summary cards, recent transactions, active alerts, and quick action buttons. Show how to navigate to different sections.*

### Dashboard Features

1. **Inventory Summary**
   - Total items in inventory
   - Items running low
   - Items out of stock
   - Total inventory value

2. **Recent Activity**
   - Latest stock transactions
   - Recent alerts
   - New items added

3. **Quick Actions**
   - Add new inventory item
   - Record stock transaction
   - View active alerts

### Example Dashboard View

```
┌─────────────────────────────────────────┐
│  Inventory Summary                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │ 150  │ │  12  │ │   3  │ │$5,240│  │
│  │Items │ │ Low  │ │ Out  │ │Value │  │
│  └──────┘ └──────┘ └──────┘ └──────┘  │
│                                         │
│  Recent Transactions                   │
│  • Added 50kg Flour - 2 hours ago      │
│  • Used 2kg Tomatoes - 3 hours ago    │
│  • Added 20L Olive Oil - 5 hours ago  │
└─────────────────────────────────────────┘
```

---

## Inventory Management

### Viewing Inventory

**Step-by-Step:**

1. Click **"Inventory"** in the navigation menu
2. View the list of all inventory items
3. Use filters to search by:
   - Item name
   - Category (e.g., Vegetables, Meat, Dairy)
   - Supplier
   - Stock status (All, Low Stock, Out of Stock)

**Demo Video: Viewing Inventory**
> *Video Description: Show the inventory list view, demonstrate filtering and searching, show item details including stock levels, costs, and supplier information.*

### Adding a New Inventory Item

**Demo Video: Adding Inventory Item**
> *Video Description: Complete walkthrough of adding a new inventory item. Show filling out the form with all required fields, selecting category and supplier, setting minimum threshold, and saving.*

**Step-by-Step:**

1. Click **"Add Item"** button (top right)
2. Fill in the form:
   - **Name**: e.g., "Organic Tomatoes"
   - **Category**: Select from dropdown (Vegetables, Meat, Dairy, etc.)
   - **Unit**: Select unit of measurement (kg, liters, pieces, etc.)
   - **Cost per Unit**: Enter purchase cost (e.g., 5.50)
   - **Current Stock**: Enter current quantity (e.g., 25)
   - **Minimum Threshold**: Set alert level (e.g., 10)
   - **Supplier**: Select from existing suppliers or leave blank
   - **SKU**: Optional stock keeping unit code

3. Click **"Save"**
   - Item is added to inventory
   - Stock level is tracked automatically

**Example: Adding "Fresh Basil"**

```
Name: Fresh Basil
Category: Herbs & Spices
Unit: kg
Cost per Unit: $12.00
Current Stock: 2.5
Minimum Threshold: 1.0
Supplier: Green Valley Farms
SKU: BAS-001
```

### Editing an Inventory Item

**Step-by-Step:**

1. Find the item in the inventory list
2. Click the **"Edit"** button (pencil icon)
3. Modify the fields you want to change
4. Click **"Save"**

**Important Notes:**
- **Staff members** cannot edit:
  - Cost per unit
  - Supplier
  - Restaurant ID
- **Managers** can edit all fields

### Deleting an Inventory Item

**Step-by-Step (Managers Only):**

1. Find the item in the inventory list
2. Click the **"Delete"** button (trash icon)
3. Confirm deletion in the popup
4. Item is removed from inventory

**Important:** 
- Items with existing stock transactions cannot be deleted
- System will show an error if deletion is not allowed

**Demo Video: Managing Inventory**
> *Video Description: Show editing an item, updating stock levels, changing supplier, and deleting an item (with error handling for items with transactions).*

---

## Stock Transactions

### Understanding Stock Transactions

Stock transactions record all movements of inventory:
- **Stock In**: Purchases, deliveries, returns
- **Stock Out**: Sales, waste, transfers

### Recording a Stock Transaction

**Demo Video: Recording Stock Transaction**
> *Video Description: Complete process of recording a stock transaction. Show selecting item, choosing transaction type (in/out), entering quantity, selecting reason, adding notes, and saving. Show how stock levels update automatically.*

**Step-by-Step:**

1. Click **"Stock"** in the navigation menu
2. Click **"Add Transaction"** button
3. Fill in the transaction form:
   - **Item**: Select from inventory dropdown
   - **Type**: Choose "In" or "Out"
   - **Quantity**: Enter amount (e.g., 50)
   - **Reason**: 
     - For "In": Purchase, Delivery
     - For "Out": Sale, Waste, Transfer
   - **Cost**: Enter total cost (optional, for "In" transactions)
   - **Notes**: Add any additional information
   - **SKU**: Optional reference number

4. Click **"Save"**
   - Transaction is recorded
   - Stock level updates automatically
   - Alert is generated if stock falls below threshold

**Example: Recording a Purchase**

```
Item: Organic Flour
Type: In
Quantity: 50 kg
Reason: Purchase
Cost: $125.00
Notes: Bulk order from supplier
SKU: PO-2024-001
```

**Result:**
- Flour stock increases by 50 kg
- Transaction appears in stock history
- Cost is recorded for analytics

**Example: Recording Waste**

```
Item: Fresh Lettuce
Type: Out
Quantity: 2 kg
Reason: Waste
Notes: Expired, disposed of
```

**Result:**
- Lettuce stock decreases by 2 kg
- Waste is tracked for reporting
- Alert may trigger if stock is now low

### Viewing Stock History

**Step-by-Step:**

1. Click **"Stock"** in navigation
2. View the transaction list
3. Filter by:
   - Date range
   - Item
   - Type (In/Out)
   - Reason
   - User who recorded it

**Demo Video: Stock History & Filtering**
> *Video Description: Show the stock transaction list, demonstrate filtering options, show transaction details, and explain how to read the history for inventory tracking.*

### Editing Stock Transactions

**Step-by-Step:**

1. Find the transaction in the list
2. Click **"Edit"** button
3. Modify the fields
4. Click **"Save"**

**Important Restrictions:**
- **Staff** can only edit transactions created within the last 24 hours
- **Managers** can edit any transaction
- **Staff** can only edit: quantity, notes, reason
- **Managers** can edit all fields

**Demo Video: Editing Transactions**
> *Video Description: Show editing a recent transaction, demonstrate the 24-hour restriction for staff, show error message when trying to edit old transactions as staff.*

---

## Suppliers Management

### Viewing Suppliers

**Step-by-Step:**

1. Click **"Suppliers"** in navigation menu
2. View list of all suppliers
3. See supplier details:
   - Name
   - Contact person
   - Phone
   - Email
   - Address

**Demo Video: Supplier List**
> *Video Description: Show the suppliers list, demonstrate how to view supplier details, and show which items are supplied by each supplier.*

### Adding a New Supplier

**Step-by-Step (Managers Only):**

1. Click **"Add Supplier"** button
2. Fill in the form:
   - **Name**: Company name (e.g., "Fresh Produce Co.")
   - **Contact Person**: Name of primary contact
   - **Phone**: Contact number
   - **Email**: Contact email
   - **Address**: Full address

3. Click **"Save"**
   - Supplier is added to the system
   - Can be selected when adding inventory items

**Example: Adding a Supplier**

```
Name: Green Valley Farms
Contact Person: John Smith
Phone: +1-555-0123
Email: orders@greenvalley.com
Address: 123 Farm Road, Agricultural City, ST 12345
```

### Editing a Supplier

**Step-by-Step (Managers Only):**

1. Find supplier in the list
2. Click **"Edit"** button
3. Update information
4. Click **"Save"**

### Deleting a Supplier

**Step-by-Step (Managers Only):**

1. Find supplier in the list
2. Click **"Delete"** button
3. Confirm deletion
4. Supplier is removed

**Note:** Suppliers linked to inventory items can still be deleted, but the link will be removed from those items.

**Demo Video: Managing Suppliers**
> *Video Description: Complete walkthrough of adding, editing, and deleting suppliers. Show how suppliers are linked to inventory items.*

---

## Recipes Management

### Understanding Recipes

Recipes allow you to:
- Define dishes with ingredient lists
- Track quantities and units
- Link sales to recipes for automatic inventory updates

### Creating a Recipe

**Demo Video: Creating a Recipe**
> *Video Description: Step-by-step recipe creation. Show adding recipe name, description, status, quantity/unit, and most importantly, adding ingredients with quantities. Show the JSON structure of ingredients.*

**Step-by-Step:**

1. Click **"Recipes"** in navigation menu
2. Click **"Add Recipe"** button
3. Fill in recipe details:
   - **Name**: e.g., "Margherita Pizza"
   - **Description**: Optional description
   - **Status**: Active, Disabled, or Removed
   - **Quantity**: Recipe yield (e.g., 4)
   - **Unit**: servings, portions, pieces, etc.
   - **Ingredients**: Add ingredients with quantities

4. **Adding Ingredients:**
   - Click **"Add Ingredient"**
   - Select item from inventory
   - Enter quantity needed
   - Select unit
   - Repeat for all ingredients

5. Click **"Save"**
   - Recipe is saved
   - Can be used when recording sales

**Example: Creating "Caesar Salad" Recipe**

```
Name: Caesar Salad
Description: Classic Caesar salad with homemade dressing
Status: Active
Quantity: 4
Unit: servings

Ingredients:
- Romaine Lettuce: 500g
- Caesar Dressing: 100ml
- Parmesan Cheese: 50g
- Croutons: 100g
- Anchovies: 20g
```

### Viewing Recipes

**Step-by-Step:**

1. Click **"Recipes"** in navigation
2. View list of all recipes
3. Filter by status (Active, Disabled, Removed)
4. Click on a recipe to view details

### Editing a Recipe

**Step-by-Step:**

1. Find recipe in the list
2. Click **"Edit"** button
3. Modify recipe details or ingredients
4. Click **"Save"**

**Note:** Staff can edit recipes but cannot delete them.

### Deleting a Recipe

**Step-by-Step (Managers Only):**

1. Find recipe in the list
2. Click **"Delete"** button
3. Confirm deletion
4. Recipe is removed

**Demo Video: Recipe Management**
> *Video Description: Show viewing recipes, editing ingredients, changing recipe status, and demonstrate how recipes are used in sales tracking.*

---

## Sales Tracking

### Recording a Sale

**Demo Video: Recording a Sale**
> *Video Description: Complete sales recording process. Show selecting a recipe, entering quantity sold, optionally updating inventory, and saving. Show how inventory is automatically adjusted when "Update Inventory" is checked.*

**Step-by-Step:**

1. Click **"Sales"** in navigation menu
2. Click **"Record Sale"** button
3. Fill in sale details:
   - **Recipe**: Select from recipe list
   - **Quantity**: Number of items sold (e.g., 2)
   - **Receipt ID**: Optional receipt number
   - **Update Inventory**: Check to automatically deduct ingredients

4. Click **"Save"**
   - Sale is recorded
   - If "Update Inventory" is checked, ingredient stock is automatically reduced

**Example: Recording a Sale**

```
Recipe: Margherita Pizza
Quantity: 3
Receipt ID: R-2024-001
Update Inventory: ✓ (checked)

Result:
- 3 Margherita Pizzas sold
- Inventory automatically reduced:
  - Flour: -750g
  - Tomatoes: -300g
  - Mozzarella: -450g
  - Basil: -15g
```

### Viewing Sales History

**Step-by-Step:**

1. Click **"Sales"** in navigation
2. View list of all sales
3. Filter by:
   - Date range
   - Recipe
   - Inventory update status

**Demo Video: Sales History & Analytics**
> *Video Description: Show sales list, filtering options, and demonstrate how sales data is used in analytics and reporting.*

### Updating Inventory After Sale

If you recorded a sale without updating inventory:

1. Find the sale in the list
2. Click **"Update Inventory"** button
3. System automatically deducts ingredients based on recipe
4. Sale is marked as inventory updated

**Demo Video: Manual Inventory Update**
> *Video Description: Show how to manually update inventory for sales that were recorded without automatic inventory update.*

---

## Alerts & Notifications

### Understanding Alerts

The system automatically generates alerts when:
- **Low Stock**: Item quantity falls below minimum threshold
- **Out of Stock**: Item quantity reaches zero

### Viewing Alerts

**Demo Video: Alerts System**
> *Video Description: Show the alerts page, demonstrate different alert types (low stock vs out of stock), show how to mark alerts as read, and explain how alerts are generated automatically.*

**Step-by-Step:**

1. Click **"Alerts"** in navigation menu
2. View list of active alerts
3. Alerts show:
   - Item name
   - Alert type (Low Stock / Out of Stock)
   - Current stock level
   - Minimum threshold
   - Date generated

### Marking Alerts as Read

**Step-by-Step:**

1. Find the alert in the list
2. Click **"Mark as Read"** button
3. Alert is marked as read (grayed out)
4. Read alerts can be filtered out

### Alert Examples

**Low Stock Alert:**
```
Item: Organic Flour
Type: Low Stock
Current: 8 kg
Threshold: 10 kg
Message: "Organic Flour is running low"
```

**Out of Stock Alert:**
```
Item: Fresh Basil
Type: Out of Stock
Current: 0 kg
Threshold: 1 kg
Message: "Fresh Basil is out of stock"
```

### Alert Notifications

- Alerts appear in the navigation menu (badge count)
- Click the alerts icon to view all alerts
- Alerts are generated in real-time as stock changes

**Demo Video: Real-Time Alerts**
> *Video Description: Show how alerts are generated in real-time when stock transactions are recorded. Demonstrate the alert badge in navigation and how it updates automatically.*

---

## Analytics & Reports

### Viewing Analytics

**Demo Video: Analytics Dashboard**
> *Video Description: Comprehensive tour of the analytics dashboard. Show daily/weekly views, usage charts, cost analysis, top items, and trend graphs.*

**Step-by-Step:**

1. Click **"Analytics"** in navigation menu
2. Select time period:
   - **Daily**: View today's data
   - **Weekly**: View this week's data

3. View analytics:
   - **Usage Trends**: Chart showing stock usage over time
   - **Top Items**: Most used items
   - **Cost Analysis**: Total costs by category
   - **Transaction Summary**: Count of transactions by type

### Analytics Features

**Daily View:**
- Today's stock movements
- Items used today
- Costs incurred today
- Transactions recorded today

**Weekly View:**
- Week's usage trends
- Weekly cost summary
- Top items for the week
- Comparison with previous week

**Example Analytics View:**

```
Daily Analytics - October 5, 2024

Usage Summary:
- Stock In: 15 transactions ($450.00)
- Stock Out: 32 transactions
- Total Items Used: 45 items

Top Items Used:
1. Flour: 25 kg
2. Tomatoes: 12 kg
3. Cheese: 8 kg

Cost Breakdown:
- Vegetables: $120.00
- Meat: $180.00
- Dairy: $150.00
```

### Generating Reports

**Demo Video: Report Generation**
> *Video Description: Show the reports page, demonstrate different report types (inventory, transactions, sales, costs), show export options (PDF, Excel), and explain how to customize date ranges.*

**Step-by-Step:**

1. Click **"Reports"** in navigation menu
2. Select report type:
   - **Inventory Report**: Current stock levels
   - **Transaction Report**: Stock movement history
   - **Sales Report**: Sales summary
   - **Cost Report**: Cost analysis

3. Select date range
4. Click **"Generate Report"**
5. Export options:
   - **PDF**: Download as PDF
   - **Excel**: Download as Excel spreadsheet

**Example: Inventory Report**

```
Inventory Report - October 5, 2024

Total Items: 150
Total Value: $5,240.00

Category Breakdown:
- Vegetables: 45 items ($1,200.00)
- Meat: 30 items ($2,100.00)
- Dairy: 25 items ($950.00)
- Pantry: 50 items ($990.00)

Low Stock Items: 12
Out of Stock Items: 3
```

---

## User Administration

### Managing Users (Managers Only)

**Demo Video: User Management**
> *Video Description: Complete user management walkthrough. Show adding new users, editing user details, changing roles, resetting passwords, and deleting users. Show role-based access restrictions.*

### Adding a New User

**Step-by-Step:**

1. Click **"Users"** in navigation menu
2. Click **"Add User"** button
3. Fill in user details:
   - **Email**: User's email address
   - **Password**: Temporary password (user should change on first login)
   - **Role**: Manager or Staff
   - **Restaurant**: Automatically set to your restaurant

4. Click **"Save"**
   - User account is created
   - User receives credentials (via email or in-person)

**Example: Adding a Staff Member**

```
Email: john.kitchen@restaurant.com
Password: TempPass123!
Role: Staff
Restaurant: [Your Restaurant]
```

### Editing a User

**Step-by-Step:**

1. Find user in the list
2. Click **"Edit"** button
3. Modify:
   - Email
   - Role
   - Password (optional)

4. Click **"Save"**

**Important:**
- You cannot change your own role
- You cannot delete your own account

### Deleting a User

**Step-by-Step:**

1. Find user in the list
2. Click **"Delete"** button
3. Confirm deletion
4. User account is removed

**Note:** Deleted users cannot access the system, but their historical transactions remain in the system for audit purposes.

### Viewing User List

**Step-by-Step:**

1. Click **"Users"** in navigation
2. View all users in your restaurant
3. See user details:
   - Email
   - Role (Manager/Staff)
   - Created date
   - Last login (if available)

**Demo Video: User List & Permissions**
> *Video Description: Show the user list view, demonstrate filtering, show user details, and explain the difference between manager and staff accounts.*

---

## Offline Mode

### Understanding Offline Mode

The system works even without an internet connection! All transactions are stored locally and automatically synced when connection is restored.

**Demo Video: Offline Mode**
> *Video Description: Demonstrate offline functionality. Show recording transactions while offline, viewing offline indicator, and automatic sync when connection is restored. Show the offline transaction queue.*

### Using Offline Mode

**Step-by-Step:**

1. **Check Connection Status**
   - Look for the connection indicator in the top-right corner
   - Green = Online
   - Orange = Offline

2. **Work Normally**
   - Add inventory items
   - Record stock transactions
   - Create recipes
   - Record sales
   - All data is saved locally

3. **Automatic Sync**
   - When connection is restored, data syncs automatically
   - You'll see a notification when sync completes
   - No data is lost

### Offline Features

**Available Offline:**
- ✅ View inventory
- ✅ Record stock transactions
- ✅ Create recipes
- ✅ Record sales
- ✅ View alerts (cached)

**Not Available Offline:**
- ❌ User management
- ❌ Real-time analytics
- ❌ Export reports
- ❌ Supplier management (limited)

### Offline Indicator

The system shows your connection status:
- **🟢 Online**: All features available, data syncs in real-time
- **🟠 Offline**: Working offline, data will sync when online
- **🔄 Syncing**: Currently syncing offline data

**Demo Video: Offline Sync Process**
> *Video Description: Show the complete offline-to-online sync process. Demonstrate recording multiple transactions offline, then show the sync process when connection is restored, including progress indicators and success notifications.*

---

## Demo Videos

### Complete System Walkthrough

**Video 1: Getting Started (5 minutes)**
> *Complete introduction to the system: login, navigation, dashboard overview, and basic concepts. Perfect for new users.*

**Video 2: Inventory Management (8 minutes)**
> *Comprehensive guide to managing inventory: adding items, editing, deleting, setting thresholds, and organizing by categories.*

**Video 3: Stock Transactions (10 minutes)**
> *Detailed walkthrough of recording stock movements: purchases, deliveries, sales, waste, and transfers. Includes editing and history viewing.*

**Video 4: Recipes & Sales (7 minutes)**
> *Creating recipes with ingredients, recording sales, and automatic inventory updates. Shows the complete recipe-to-sale workflow.*

**Video 5: Alerts & Analytics (6 minutes)**
> *Understanding alerts, viewing analytics, generating reports, and using data to make purchasing decisions.*

**Video 6: User Management (5 minutes)**
> *Manager-only guide: adding users, managing roles, and understanding permissions. Shows both manager and staff perspectives.*

**Video 7: Offline Mode (4 minutes)**
> *Using the system offline, understanding sync, and ensuring data integrity when working without internet.*

### Quick Tips Videos

**Tip 1: Setting Minimum Thresholds**
> *How to set appropriate minimum stock thresholds to avoid running out of items.*

**Tip 2: Recording Waste Efficiently**
> *Best practices for tracking waste and understanding its impact on inventory and costs.*

**Tip 3: Using Recipes for Inventory**
> *How to use recipes to automatically track ingredient usage from sales.*

**Tip 4: Reading Analytics**
> *Understanding analytics charts and using data to optimize purchasing decisions.*

**Tip 5: Managing Multiple Users**
> *Best practices for managing staff accounts and understanding role-based permissions.*

---

## Troubleshooting

### Common Issues & Solutions

#### 1. Cannot Log In

**Symptoms:**
- Error message: "Invalid credentials"
- Login button doesn't work

**Solutions:**
- ✅ Check email and password spelling
- ✅ Ensure Caps Lock is off
- ✅ Contact manager to reset password
- ✅ Clear browser cache and cookies
- ✅ Try a different browser

#### 2. Cannot Add Inventory Item

**Symptoms:**
- "Add Item" button is grayed out
- Error when saving

**Solutions:**
- ✅ Check if you have permission (staff can add items)
- ✅ Ensure all required fields are filled
- ✅ Check internet connection
- ✅ Refresh the page

#### 3. Stock Level Not Updating

**Symptoms:**
- Transaction recorded but stock unchanged
- Stock shows incorrect amount

**Solutions:**
- ✅ Refresh the page
- ✅ Check if transaction was saved successfully
- ✅ Verify transaction type (In vs Out)
- ✅ Contact support if issue persists

#### 4. Alerts Not Showing

**Symptoms:**
- No alerts despite low stock
- Alerts not updating

**Solutions:**
- ✅ Check minimum threshold settings
- ✅ Refresh the alerts page
- ✅ Verify stock levels are correct
- ✅ Check if alerts are marked as read

#### 5. Cannot Edit Transaction

**Symptoms:**
- "Edit" button is disabled
- Error: "Cannot update transactions older than 24 hours"

**Solutions:**
- ✅ Staff can only edit transactions within 24 hours
- ✅ Contact manager to edit older transactions
- ✅ Create a new transaction to correct errors

#### 6. Offline Data Not Syncing

**Symptoms:**
- Offline transactions not appearing online
- Sync indicator stuck

**Solutions:**
- ✅ Check internet connection
- ✅ Wait for sync to complete (can take a few minutes)
- ✅ Refresh the page
- ✅ Check browser console for errors
- ✅ Contact support if data is missing

#### 7. Reports Not Generating

**Symptoms:**
- Report generation fails
- Export button doesn't work

**Solutions:**
- ✅ Check internet connection
- ✅ Ensure date range is valid
- ✅ Try a smaller date range
- ✅ Clear browser cache
- ✅ Try a different browser

#### 8. Mobile App Not Connecting

**Symptoms:**
- Cannot log in on mobile
- Data not syncing

**Solutions:**
- ✅ Check internet connection
- ✅ Verify environment variables are set
- ✅ Restart the app
- ✅ Reinstall the app if needed
- ✅ Check app permissions

### Getting Help

**Contact Support:**
- Email: support@restaurant-inventory.com
- Phone: 1-800-INVENTORY
- In-App: Click "Help" in navigation menu

**Before Contacting Support:**
- Note the exact error message
- Screenshot the issue
- Note what you were doing when it occurred
- Check if others are experiencing the same issue

---

## Best Practices

### Inventory Management

1. **Set Realistic Thresholds**
   - Base thresholds on actual usage patterns
   - Review and adjust monthly
   - Consider delivery lead times

2. **Regular Stock Checks**
   - Perform weekly physical inventory counts
   - Reconcile with system records
   - Update any discrepancies

3. **Organize by Category**
   - Use consistent category names
   - Group similar items together
   - Makes searching and reporting easier

### Stock Transactions

1. **Record Immediately**
   - Record transactions as they happen
   - Don't wait until end of day
   - Ensures accurate real-time data

2. **Use Descriptive Notes**
   - Add context to transactions
   - Include supplier info for purchases
   - Note reasons for waste

3. **Review Regularly**
   - Check transaction history weekly
   - Identify patterns and trends
   - Correct any errors promptly

### Recipes

1. **Keep Recipes Updated**
   - Update recipes when ingredients change
   - Test recipe quantities regularly
   - Document any variations

2. **Use Consistent Units**
   - Standardize units across recipes
   - Makes inventory tracking easier
   - Reduces calculation errors

### Alerts

1. **Respond Promptly**
   - Check alerts daily
   - Order items before they run out
   - Mark alerts as read after addressing

2. **Adjust Thresholds**
   - If items frequently go out of stock, lower threshold
   - If items sit unused, raise threshold
   - Balance between stockouts and overstocking

### User Management

1. **Regular Access Review**
   - Review user list monthly
   - Remove inactive accounts
   - Update roles as needed

2. **Secure Passwords**
   - Use strong passwords
   - Change passwords regularly
   - Don't share credentials

---

## Appendix

### Keyboard Shortcuts

**Web Application:**
- `Ctrl/Cmd + K`: Quick search
- `Ctrl/Cmd + N`: New item (context-dependent)
- `Esc`: Close modal/dialog
- `Enter`: Submit form

### Data Export Formats

**Supported Formats:**
- PDF: For printing and sharing
- Excel: For data analysis
- CSV: For importing to other systems

### System Limits

- **Maximum Items**: 10,000 per restaurant
- **Maximum Transactions**: Unlimited
- **Maximum Users**: 100 per restaurant
- **File Upload Size**: 10MB maximum

### Glossary

- **Inventory Item**: A product or ingredient tracked in the system
- **Stock Transaction**: A record of stock movement (in or out)
- **Threshold**: Minimum stock level that triggers alerts
- **SKU**: Stock Keeping Unit - unique identifier for items
- **RLS**: Row Level Security - database security feature
- **Offline Mode**: Working without internet connection
- **Sync**: Process of uploading offline data to server

---

## Conclusion

Congratulations! You now have a comprehensive understanding of the Restaurant Inventory Management System. 

**Key Takeaways:**
- ✅ The system helps you track inventory in real-time
- ✅ Alerts prevent stockouts
- ✅ Analytics help optimize purchasing
- ✅ Offline mode ensures you can always work
- ✅ Role-based access keeps data secure

**Next Steps:**
1. Log in and explore the dashboard
2. Add your first inventory item
3. Record a stock transaction
4. Set up alerts for critical items
5. Create your first recipe

**Remember:**
- Start with a few items and expand gradually
- Train your staff on basic operations
- Review analytics weekly to optimize
- Keep thresholds updated based on usage

**Happy Inventory Managing! 🍽️📊**

---

*For the latest updates and additional resources, visit our documentation portal or contact support.*

