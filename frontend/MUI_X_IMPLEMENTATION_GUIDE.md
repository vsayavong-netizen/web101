# MUI X Implementation Guide

This guide documents the implementation of MUI X components, React Hook Form, and enhanced UI features in the application.

## 📦 Installed Packages

```json
{
  "@mui/x-data-grid": "^latest",
  "@mui/x-date-pickers": "^latest",
  "@mui/x-charts": "^latest",
  "react-hook-form": "^latest",
  "@hookform/resolvers": "^latest",
  "yup": "^latest",
  "dayjs": "^latest"
}
```

## 🎯 Components Created

### 1. Enhanced DataGrid (`EnhancedDataGrid.tsx`)

A powerful, feature-rich data table component built on MUI X DataGrid.

**Features:**
- ✅ Sorting, Filtering, Pagination
- ✅ Export to CSV
- ✅ Row selection
- ✅ Action buttons (Edit, View, Delete)
- ✅ Customizable toolbar
- ✅ Loading states
- ✅ Responsive design
- ✅ Internationalization support

**Usage Example:**
```tsx
import { EnhancedDataGrid } from './components/EnhancedDataGrid';

const columns = [
  { field: 'id', headerName: 'ID', width: 90 },
  { field: 'name', headerName: 'Name', width: 200 },
  { field: 'status', headerName: 'Status', width: 150 },
];

<EnhancedDataGrid
  rows={projects}
  columns={columns}
  getRowId={(row) => row.id}
  onRowClick={(row) => handleView(row)}
  onEdit={(row) => handleEdit(row)}
  onDelete={(row) => handleDelete(row)}
  title="Projects"
  loading={isLoading}
  checkboxSelection
  enableFiltering
  enableExport
/>
```

**Migration from ProjectTable:**
```tsx
// Old: ProjectTable.tsx
<ProjectTable
  projectGroups={projectGroups}
  onSelectProject={handleSelect}
/>

// New: EnhancedDataGrid
<EnhancedDataGrid
  rows={projectGroups}
  columns={projectColumns}
  getRowId={(row) => row.project.projectId}
  onRowClick={(row) => handleSelect(row)}
  title="Projects"
/>
```

### 2. Date Picker Field (`DatePickerField.tsx`)

Integrated date/time picker component for forms.

**Features:**
- ✅ Date, DateTime, and Time pickers
- ✅ React Hook Form integration
- ✅ Validation support
- ✅ Min/Max date constraints
- ✅ Error handling

**Usage Example:**
```tsx
import { DatePickerField } from './components/DatePickerField';
import { useForm } from 'react-hook-form';

const { control } = useForm();

<DatePickerField
  name="deadline"
  control={control}
  label="Deadline"
  variant="date" // or "datetime" or "time"
  required
  minDate={dayjs()}
  maxDate={dayjs().add(1, 'year')}
/>
```

### 3. Enhanced Charts (`EnhancedCharts.tsx`)

Professional chart components using MUI X Charts.

**Available Charts:**
- `EnhancedLineChart` - Line charts for trends
- `EnhancedBarChart` - Bar charts for comparisons
- `EnhancedPieChart` - Pie charts for distributions

**Usage Example:**
```tsx
import { EnhancedBarChart, EnhancedPieChart } from './components/EnhancedCharts';

const data = [
  { label: 'Approved', value: 45, color: '#22c55e' },
  { label: 'Pending', value: 30, color: '#eab308' },
  { label: 'Rejected', value: 15, color: '#ef4444' },
];

<EnhancedBarChart
  title="Project Status"
  data={data}
  xAxisLabel="Status"
  yAxisLabel="Count"
  height={400}
/>

<EnhancedPieChart
  title="Status Distribution"
  data={data}
  height={400}
  innerRadius={0}
  outerRadius={80}
/>
```

**Migration from AnalyticsDashboard:**
```tsx
// Old: Custom SVG charts
<svg>...</svg>

// New: Enhanced Charts
<EnhancedPieChart
  title="Project Status"
  data={statusData}
/>
```

### 4. Loading Skeletons (`LoadingSkeletons.tsx`)

Professional loading placeholders for better UX.

**Available Skeletons:**
- `TableSkeleton` - For data tables
- `CardSkeleton` - For card layouts
- `DashboardSkeleton` - For dashboard pages
- `FormSkeleton` - For forms
- `ListSkeleton` - For lists
- `ChartSkeleton` - For charts

**Usage Example:**
```tsx
import { TableSkeleton, DashboardSkeleton } from './components/LoadingSkeletons';

{isLoading ? (
  <TableSkeleton rows={10} columns={5} />
) : (
  <EnhancedDataGrid rows={data} columns={columns} />
)}

{isLoading ? (
  <DashboardSkeleton />
) : (
  <Dashboard />
)}
```

### 5. Form Components

#### FormTextField (`FormTextField.tsx`)
Text input with React Hook Form integration.

```tsx
import { FormTextField } from './components/FormTextField';

<FormTextField
  name="topicLao"
  control={control}
  label="Topic (Lao)"
  required
  multiline
  rows={3}
/>
```

#### FormSelectField (`FormSelectField.tsx`)
Select dropdown with React Hook Form integration.

```tsx
import { FormSelectField } from './components/FormSelectField';

<FormSelectField
  name="advisorName"
  control={control}
  label="Advisor"
  options={[
    { value: 'advisor1', label: 'Advisor 1' },
    { value: 'advisor2', label: 'Advisor 2' },
  ]}
  required
/>
```

## 🔧 Configuration

### Theme Setup

The theme has been updated to support MUI X components:

```tsx
// frontend/context/ThemeContext.tsx
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

<LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en">
  {/* App content */}
</LocalizationProvider>
```

## 📝 Migration Checklist

### For Tables:
- [ ] Replace `ProjectTable` with `EnhancedDataGrid`
- [ ] Replace `StudentManagement` table with `EnhancedDataGrid`
- [ ] Replace `AdvisorManagement` table with `EnhancedDataGrid`
- [ ] Replace `CommitteeManagement` table with `EnhancedDataGrid`

### For Forms:
- [ ] Migrate `RegisterProjectModal` to use React Hook Form
- [ ] Migrate `ProfileModal` to use React Hook Form
- [ ] Migrate `SettingsPage` forms to use React Hook Form
- [ ] Add `DatePickerField` for date inputs

### For Charts:
- [ ] Replace custom SVG charts in `AnalyticsDashboard` with `EnhancedCharts`
- [ ] Replace charts in `DashboardStats` with `EnhancedCharts`
- [ ] Replace charts in `ReportingPage` with `EnhancedCharts`

### For Loading States:
- [ ] Add `TableSkeleton` to table components
- [ ] Add `DashboardSkeleton` to dashboard pages
- [ ] Add `FormSkeleton` to form modals
- [ ] Add `ChartSkeleton` to chart components

## 🚀 Best Practices

### 1. DataGrid Performance
```tsx
// Use pagination for large datasets
<EnhancedDataGrid
  pageSize={25}
  pageSizeOptions={[10, 25, 50, 100]}
/>

// Use loading state
<EnhancedDataGrid
  loading={isLoading}
  rows={data}
/>
```

### 2. Form Validation
```tsx
// Use Yup schema for validation
const schema = yup.object({
  name: yup.string().required().min(3),
  email: yup.string().email().required(),
});

const { control } = useForm({
  resolver: yupResolver(schema),
});
```

### 3. Date Handling
```tsx
// Always use dayjs for date operations
import dayjs from 'dayjs';

const minDate = dayjs();
const maxDate = dayjs().add(1, 'year');
```

### 4. Error Handling
```tsx
// Provide user-friendly error messages
<FormTextField
  name="email"
  control={control}
  error={errors.email}
  helperText={errors.email?.message}
/>
```

## 📚 Additional Resources

- [MUI X DataGrid Documentation](https://mui.com/x/react-data-grid/)
- [MUI X Date Pickers Documentation](https://mui.com/x/react-date-pickers/)
- [MUI X Charts Documentation](https://mui.com/x/react-charts/)
- [React Hook Form Documentation](https://react-hook-form.com/)
- [Yup Validation Schema](https://github.com/jquense/yup)

## 🎨 Customization

### Custom DataGrid Styling
```tsx
<EnhancedDataGrid
  sx={{
    '& .MuiDataGrid-cell': {
      fontSize: '0.875rem',
    },
    '& .MuiDataGrid-columnHeader': {
      fontWeight: 'bold',
    },
  }}
/>
```

### Custom Chart Colors
```tsx
const data = [
  { label: 'Approved', value: 45, color: theme.palette.success.main },
  { label: 'Pending', value: 30, color: theme.palette.warning.main },
];
```

## ✅ Benefits

1. **Performance**: Virtualized tables handle large datasets efficiently
2. **UX**: Professional loading states and smooth interactions
3. **Accessibility**: Built-in ARIA support and keyboard navigation
4. **Maintainability**: Standardized components reduce code duplication
5. **Features**: Export, filtering, sorting out of the box
6. **Validation**: Robust form validation with clear error messages
7. **Type Safety**: Full TypeScript support

## 🔄 Next Steps

1. Gradually migrate existing components to use new components
2. Add more chart types as needed
3. Customize theme for brand consistency
4. Add more form field types (Checkbox, Radio, etc.)
5. Implement advanced DataGrid features (grouping, aggregation)

