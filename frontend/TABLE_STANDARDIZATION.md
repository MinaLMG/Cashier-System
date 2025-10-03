# Table Standardization Guide

## Overview

All tables in the application have been standardized into two main types with consistent styling and theme color differences.

## Table Types

### 1. **InputTable** - For Data Entry Forms

Used in forms where users input data:

-   **زود منتج** (Add Product)
-   **عدل منتج** (Edit Product)
-   **زود فاتورة مشتريات** (Add Purchase Invoice)
-   **زود فاتورة بيع** (Add Sales Invoice)

**Visual Characteristics:**

-   **Border Color:** Purple-blue (`var(--secondary-color)`)
-   **Header Background:** Gradient purple-blue (`var(--secondary-color)` to `var(--secondary-light)`)
-   **Hover Effects:** Purple-blue tinted backgrounds
-   **Purpose:** Indicates interactive data entry

### 2. **OutputTable** - For Data Display

Used for displaying existing data:

-   **اعرض كل البضاعة** (Show Inventory)
-   **اعرض كل فواتير المشتريات** (Show Purchase Invoices)
-   **اعرض كل فواتير البيع** (Show Sales Invoices)
-   **SortableTable** (Enhanced data display with sorting)

**Visual Characteristics:**

-   **Border Color:** Dark gray (`var(--primary-color)`)
-   **Header Background:** Gradient dark gray (`var(--primary-color)` to `var(--primary-light)`)
-   **Hover Effects:** Dark gray tinted backgrounds
-   **Purpose:** Indicates read-only data display

## Usage Examples

### InputTable Usage

```jsx
import InputTable from "../Basic/InputTable";

<InputTable>
    <thead>
        <tr>
            <th>Column 1</th>
            <th>Column 2</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>
                <input type="text" />
            </td>
            <td>
                <select>
                    <option>Option</option>
                </select>
            </td>
        </tr>
    </tbody>
</InputTable>;
```

### OutputTable Usage

```jsx
import OutputTable from "../Basic/OutputTable";

<OutputTable>
    <thead>
        <tr>
            <th>Column 1</th>
            <th>Column 2</th>
            <th>Actions</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Data 1</td>
            <td>Data 2</td>
            <td>
                <button className="actionButton edit">Edit</button>
                <button className="actionButton delete">Delete</button>
            </td>
        </tr>
    </tbody>
</OutputTable>;
```

## Features

### Responsive Design

-   **90% max-width** on normal screens
-   **95% max-width** on screens ≤1200px
-   **100% width** on mobile devices
-   **Horizontal scrolling** when content exceeds container
-   **Minimum widths** to prevent cramping

### Theme Integration

-   Uses CSS custom properties from theme
-   Consistent color scheme throughout
-   Proper contrast ratios for accessibility
-   Smooth transitions and hover effects

### Accessibility

-   Proper semantic HTML structure
-   Keyboard navigation support
-   Screen reader friendly
-   High contrast text and borders

## Updated Components

### Input Tables

1. **ProductForm** - Product conversion table
2. **PurchaseInvoice** - Invoice items table
3. **SalesInvoice** - Sales items table

### Output Tables

1. **ShowInventory** - Inventory display table
2. **ShowPurchaseInvoices** - Purchase invoices list (via SortableTable)
3. **ShowSalesInvoices** - Sales invoices list (via SortableTable)
4. **SortableTable** - Enhanced data display component

## Benefits

1. **Consistency:** All tables follow the same design patterns
2. **User Experience:** Clear visual distinction between input and output
3. **Maintainability:** Centralized styling through components
4. **Responsiveness:** Works well on all device sizes
5. **Accessibility:** Proper semantic structure and contrast
6. **Theme Integration:** Uses application color scheme consistently

## Customization

Both table types accept:

-   `className` - Additional CSS classes for the table
-   `wrapperClassName` - Additional CSS classes for the wrapper

Example:

```jsx
<InputTable className="custom-table" wrapperClassName="custom-wrapper">
    {/* table content */}
</InputTable>
```
