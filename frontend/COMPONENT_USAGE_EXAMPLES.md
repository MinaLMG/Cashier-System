# Updated Component Usage Examples

## Theme Colors

The application now uses a purple-blue color schema matching the provided image:

-   **Primary Colors**: Purple-blue tones (#4a5568, #718096, #2d3748)
-   **Secondary Colors**: Gradient purple-blue (#667eea, #a5b4fc, #4c51bf)
-   **Accent Colors**: Red for highlights (#e53e3e)
-   **Neutral Colors**: Clean grays for text and borders

## Updated Components

### SortableTable

Now supports configurable width and equal column growth:

```jsx
import SortableTable from "../Basic/SortableTable";

// Example usage with 90% width (default)
<SortableTable
    columns={[
        { field: "name", title: "اسم المنتج" },
        { field: "packages", title: "العبوات" },
        { field: "remaining", title: "الباقي حاليا" },
        { field: "minimum", title: "مش عاوزينها تقل عن" },
    ]}
    data={inventoryData}
    width="90%" // Configurable width
    renderRow={(item, index) => (
        <tr key={index}>
            <td>
                <FaEdit className="text-danger" />
            </td>
            <td>{item.name}</td>
            <td>{item.packages}</td>
            <td>{item.remaining}</td>
            <td>{item.minimum}</td>
        </tr>
    )}
/>;
```

### TextInput

Now supports configurable width and sticks to the left:

```jsx
import TextInput from "../Basic/TextInput";

// Example usage with custom width
<TextInput
    type="text"
    label="اسم المنتج"
    id="productName"
    value={productName}
    onchange={setProductName}
    width="400px" // Configurable width, defaults to 300px
/>;
```

### Select

Now supports configurable width and sticks to the left:

```jsx
import Select from "../Basic/Select";

// Example usage with custom width
<Select
    title="اختر المورد"
    options={supplierOptions}
    value={selectedSupplier}
    onchange={setSelectedSupplier}
    width="350px" // Configurable width, defaults to 300px
/>;
```

### Button

Updated with new theme colors and improved styling:

```jsx
import Button from "../Basic/Button";

// Example usage
<Button content="حفظ المنتج" onClick={handleSave} className="mt-3" />;
```

## Navigation Icons

The sidebar now includes icons for each navigation item:

-   📦 زود منتج (FaBox)
-   ✏️ عدل منتج (FaEdit)
-   👁️ اعرض كل البضاعة (FaEye)
-   🛒 زود فاتورة بيع (FaShoppingCart)
-   📄 زود فاتورة مشتريات (FaFileInvoice)
-   📊 تقرير الإيرادات (FaChartLine)
-   👥 إدارة الموردين (FaUsers)
-   👤 إدارة العملاء (FaUserFriends)
-   📦 إدارة العبوات (FaBoxes)
-   ⚙️ إدارة المستخدمين (FaUserCog)

## Header Design

The header now features:

-   Gradient background matching the theme
-   User information on the left
-   Centered logo with heart icon
-   System title on the right
-   Consistent purple-blue color scheme

## Form Layout

All forms now:

-   Use the new theme colors
-   Have input fields that stick to the left
-   Support configurable widths through props
-   Tables take 90% width by default (configurable)
-   All table columns grow equally
