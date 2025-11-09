# Migration Guide: Using Enhanced Components

## 🚀 Quick Start

### Step 1: ProjectTable Migration

Replace `ProjectTable` with `ProjectTableEnhanced`:

```tsx
// Old
import ProjectTable from './ProjectTable';

<ProjectTable
  projectGroups={projects}
  onSelectProject={handleSelect}
  // ... other props
/>

// New
import ProjectTableEnhanced from './ProjectTableEnhanced';

<ProjectTableEnhanced
  projectGroups={projects}
  onSelectProject={handleSelect}
  loading={isLoading}
  // ... other props
/>
```

**Location to update:**
- `frontend/components/HomePage.tsx` (line ~894)
- `frontend/components/StudentWelcome.tsx` (line ~325)
- `frontend/components/AdvisorDashboard.tsx` (if used)

### Step 2: AnalyticsDashboard Migration

Replace `AnalyticsDashboard` with `AnalyticsDashboardEnhanced`:

```tsx
// Old
import AnalyticsDashboard from './AnalyticsDashboard';

<AnalyticsDashboard
  projectGroups={projects}
  advisors={advisors}
  advisorProjectCounts={counts}
/>

// New
import AnalyticsDashboardEnhanced from './AnalyticsDashboardEnhanced';

<AnalyticsDashboardEnhanced
  projectGroups={projects}
  advisors={advisors}
  advisorProjectCounts={counts}
  loading={isLoading}
/>
```

**Location to update:**
- `frontend/components/HomePage.tsx` (line ~820, case 'analytics')

### Step 3: Add Loading States

Add loading states to components:

```tsx
// Example: HomePage.tsx
const [isLoadingProjects, setIsLoadingProjects] = useState(false);

// When fetching data
useEffect(() => {
  setIsLoadingProjects(true);
  fetchProjects().then(() => {
    setIsLoadingProjects(false);
  });
}, []);

// In render
<ProjectTableEnhanced
  loading={isLoadingProjects}
  // ... other props
/>
```

## 📋 Migration Checklist

### Phase 1: Core Components (High Priority)
- [ ] Migrate `ProjectTable` → `ProjectTableEnhanced` in HomePage
- [ ] Migrate `ProjectTable` → `ProjectTableEnhanced` in StudentWelcome
- [ ] Migrate `AnalyticsDashboard` → `AnalyticsDashboardEnhanced` in HomePage
- [ ] Add loading states to ProjectTableEnhanced
- [ ] Add loading states to AnalyticsDashboardEnhanced

### Phase 2: Forms (Medium Priority)
- [ ] Migrate `RegisterProjectModal` to use React Hook Form
- [ ] Add `DatePickerField` for deadline inputs
- [ ] Add `FormTextField` and `FormSelectField` throughout

### Phase 3: Other Tables (Medium Priority)
- [ ] Migrate `StudentManagement` table to EnhancedDataGrid
- [ ] Migrate `AdvisorManagement` table to EnhancedDataGrid
- [ ] Migrate `CommitteeManagement` table to EnhancedDataGrid

### Phase 4: Charts (Low Priority)
- [ ] Replace custom charts in `DashboardStats` with EnhancedCharts
- [ ] Replace custom charts in `ReportingPage` with EnhancedCharts

## 🎯 Benefits After Migration

### Performance
- ✅ Virtualized tables handle 10,000+ rows smoothly
- ✅ Optimized re-renders with React Hook Form
- ✅ Better perceived performance with skeletons

### User Experience
- ✅ Professional filtering and sorting
- ✅ CSV export functionality
- ✅ Better loading states
- ✅ Responsive design

### Developer Experience
- ✅ Less code to maintain
- ✅ Type-safe components
- ✅ Consistent patterns
- ✅ Better error handling

## 🔧 Customization Examples

### Custom DataGrid Styling
```tsx
<ProjectTableEnhanced
  sx={{
    '& .MuiDataGrid-cell': {
      fontSize: '0.875rem',
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

## 📝 Notes

- Mobile view is automatically handled (cards on mobile, table on desktop)
- All existing props are supported
- Backward compatible with existing code
- Can migrate gradually, one component at a time

## 🐛 Troubleshooting

### Issue: DataGrid not showing data
- Check that `getRowId` returns unique IDs
- Verify `rows` array is not empty
- Check console for errors

### Issue: Charts not rendering
- Ensure data array is not empty
- Check that values are numbers
- Verify theme is properly configured

### Issue: Loading states not showing
- Ensure `loading` prop is passed
- Check that loading state is properly managed
- Verify skeleton components are imported

## ✅ Testing Checklist

After migration, test:
- [ ] Table sorting works
- [ ] Table filtering works
- [ ] Table pagination works
- [ ] CSV export works
- [ ] Charts render correctly
- [ ] Loading states show/hide properly
- [ ] Mobile view works (cards)
- [ ] Desktop view works (table)
- [ ] All existing functionality still works

