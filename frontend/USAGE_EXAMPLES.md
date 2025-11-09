# Usage Examples: Enhanced Components

## 📋 Table of Contents
1. [ProjectTableEnhanced Usage](#projecttableenhanced-usage)
2. [AnalyticsDashboardEnhanced Usage](#analyticsdashboardenhanced-usage)
3. [Form Components Usage](#form-components-usage)
4. [Loading States Usage](#loading-states-usage)
5. [Date Picker Usage](#date-picker-usage)

## 🗂️ ProjectTableEnhanced Usage

### Basic Usage
```tsx
import ProjectTableEnhanced from './components/ProjectTableEnhanced';

<ProjectTableEnhanced
  user={user}
  projectGroups={projects}
  onSelectProject={handleSelect}
  loading={isLoading}
/>
```

### With All Features
```tsx
<ProjectTableEnhanced
  user={user}
  effectiveRole={effectiveRole}
  projectGroups={projects}
  onSelectProject={handleSelect}
  onRegisterClick={handleRegister}
  onUpdateStatus={handleUpdateStatus}
  scoringSettings={scoringSettings}
  updateDetailedScore={updateDetailedScore}
  addToast={addToast}
  projectHealth={projectHealth}
  onOpenAiAssistant={handleOpenAI}
  selectedIds={selectedIds}
  onSelect={handleSelectRow}
  onSelectAll={handleSelectAll}
  loading={isLoading}
/>
```

### Features Available
1. **Sorting**: Click column headers
2. **Filtering**: Use toolbar filter
3. **Export**: Click export button
4. **Pagination**: Use bottom controls
5. **Selection**: Checkboxes (if enabled)

## 📊 AnalyticsDashboardEnhanced Usage

### Basic Usage
```tsx
import AnalyticsDashboardEnhanced from './components/AnalyticsDashboardEnhanced';

<AnalyticsDashboardEnhanced
  projectGroups={projects}
  advisors={advisors}
  advisorProjectCounts={counts}
  loading={isLoading}
/>
```

### Features Available
1. **Charts**: 4 different chart types
2. **Tooltips**: Hover for details
3. **Export**: Excel export button
4. **Responsive**: Adapts to screen size

## 📝 Form Components Usage

### FormTextField
```tsx
import { FormTextField } from './components/FormTextField';
import { useForm } from 'react-hook-form';

const { control } = useForm();

<FormTextField
  name="topicLao"
  control={control}
  label="Topic (Lao)"
  required
  multiline
  rows={3}
/>
```

### FormSelectField
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

### DatePickerField
```tsx
import { DatePickerField } from './components/DatePickerField';
import dayjs from 'dayjs';

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

## ⏳ Loading States Usage

### Table Loading
```tsx
import { TableSkeleton } from './components/LoadingSkeletons';

{isLoading ? (
  <TableSkeleton rows={10} columns={5} />
) : (
  <ProjectTableEnhanced projects={data} />
)}
```

### Dashboard Loading
```tsx
import { DashboardSkeleton } from './components/LoadingSkeletons';

{isLoading ? (
  <DashboardSkeleton />
) : (
  <Dashboard />
)}
```

### Chart Loading
```tsx
import { ChartSkeleton } from './components/LoadingSkeletons';

{isLoading ? (
  <ChartSkeleton height={400} />
) : (
  <EnhancedBarChart data={data} />
)}
```

## 🎨 Customization Examples

### Custom DataGrid Styling
```tsx
<ProjectTableEnhanced
  sx={{
    '& .MuiDataGrid-cell': {
      fontSize: '0.875rem',
    },
    '& .MuiDataGrid-columnHeader': {
      fontWeight: 'bold',
      backgroundColor: 'action.hover',
    },
  }}
/>
```

### Custom Chart Colors
```tsx
import { useTheme } from '@mui/material';

const theme = useTheme();
const data = [
  { label: 'Approved', value: 45, color: theme.palette.success.main },
  { label: 'Pending', value: 30, color: theme.palette.warning.main },
];
```

### Custom Page Size
```tsx
// Modify in ProjectTableEnhanced.tsx
<EnhancedDataGrid
  pageSize={50} // Change default
  pageSizeOptions={[25, 50, 100, 200]} // Custom options
/>
```

## 🔍 Advanced Usage

### Custom Column Configuration
```tsx
// In ProjectTableEnhanced.tsx, modify columns array
const columns: GridColDef[] = [
  {
    field: 'customField',
    headerName: 'Custom Field',
    width: 200,
    renderCell: (params) => (
      <CustomComponent value={params.value} />
    ),
  },
];
```

### Custom Filter Logic
```tsx
// DataGrid has built-in filtering, but you can also
// filter data before passing to DataGrid:
const filteredData = useMemo(() => {
  return data.filter(item => 
    item.status === 'active'
  );
}, [data]);

<ProjectTableEnhanced projectGroups={filteredData} />
```

### Custom Export Format
```tsx
// DataGrid exports to CSV by default
// For custom export, you can use the data directly:
const handleCustomExport = () => {
  const csv = convertToCSV(data);
  downloadFile(csv, 'custom-export.csv');
};
```

## 🎯 Best Practices

### 1. Loading States
```tsx
// Always show loading state during data fetch
const [isLoading, setIsLoading] = useState(false);

useEffect(() => {
  setIsLoading(true);
  fetchData().finally(() => setIsLoading(false));
}, []);

<Component loading={isLoading} />
```

### 2. Error Handling
```tsx
// Handle errors gracefully
{error ? (
  <Alert severity="error">{error.message}</Alert>
) : (
  <Component data={data} />
)}
```

### 3. Empty States
```tsx
// DataGrid shows empty message automatically
// But you can customize:
<EnhancedDataGrid
  emptyMessage="No projects found. Click 'Register' to add one."
/>
```

### 4. Performance
```tsx
// For large datasets, use pagination
<EnhancedDataGrid
  pageSize={25} // Reasonable default
  pageSizeOptions={[10, 25, 50, 100]}
/>

// Use useMemo for expensive calculations
const processedData = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);
```

## 📚 Additional Resources

- [MUI X DataGrid Docs](https://mui.com/x/react-data-grid/)
- [MUI X Charts Docs](https://mui.com/x/react-charts/)
- [React Hook Form Docs](https://react-hook-form.com/)
- [Examples Folder](./components/examples/)

## ✅ Quick Reference

### ProjectTableEnhanced Props
```tsx
interface ProjectTableEnhancedProps {
  user: User;
  effectiveRole?: Role;
  projectGroups: ProjectGroup[];
  onSelectProject: (group: ProjectGroup) => void;
  onRegisterClick: () => void;
  onUpdateStatus: (projectId: string, status: ProjectStatus) => void;
  updateDetailedScore?: (projectId: string, evaluatorId: string, scores: Record<string, number>) => void;
  addToast?: (toast: Omit<ToastMessage, 'id'>) => void;
  scoringSettings?: ScoringSettings;
  projectHealth?: Record<string, ProjectHealthStatus>;
  onOpenAiAssistant?: () => void;
  selectedIds?: Set<string>;
  onSelect?: (id: string) => void;
  onSelectAll?: () => void;
  loading?: boolean;
}
```

### AnalyticsDashboardEnhanced Props
```tsx
interface AnalyticsDashboardEnhancedProps {
  projectGroups: ProjectGroup[];
  advisors: Advisor[];
  advisorProjectCounts: Record<string, number>;
  loading?: boolean;
}
```

## 🎉 You're All Set!

All components are ready to use. Start with the basic examples and customize as needed!

