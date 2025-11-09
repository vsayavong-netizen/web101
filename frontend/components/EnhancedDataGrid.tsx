import React, { useMemo, useState } from 'react';
import {
  DataGrid,
  GridColDef,
  GridRowsProp,
  GridToolbar,
  GridActionsCellItem,
  GridRowParams,
  GridRowSelectionModel,
  GridFilterModel,
  GridSortModel,
} from '@mui/x-data-grid';
import { Box, Paper, Typography, IconButton, Tooltip, Chip } from '@mui/material';
import { Edit as EditIcon, Visibility as ViewIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useTranslations } from '../hooks/useTranslations';

export interface EnhancedDataGridProps<T> {
  rows: T[];
  columns: GridColDef<T>[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  getRowId: (row: T) => string;
  title?: string;
  height?: number | string;
  pageSize?: number;
  pageSizeOptions?: number[];
  checkboxSelection?: boolean;
  disableRowSelectionOnClick?: boolean;
  enableFiltering?: boolean;
  enableSorting?: boolean;
  enableExport?: boolean;
  customToolbar?: React.ReactNode;
  emptyMessage?: string;
  sx?: any;
}

export function EnhancedDataGrid<T extends Record<string, any>>({
  rows,
  columns,
  loading = false,
  onRowClick,
  onEdit,
  onDelete,
  onSelectionChange,
  getRowId,
  title,
  height = 600,
  pageSize = 25,
  pageSizeOptions = [10, 25, 50, 100],
  checkboxSelection = false,
  disableRowSelectionOnClick = false,
  enableFiltering = true,
  enableSorting = true,
  enableExport = true,
  customToolbar,
  emptyMessage,
  sx,
}: EnhancedDataGridProps<T>) {
  const t = useTranslations();
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>([]);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });
  const [sortModel, setSortModel] = useState<GridSortModel>([]);

  // Add action columns if needed
  const enhancedColumns = useMemo(() => {
    const actionCol: GridColDef<T> = {
      field: 'actions',
      type: 'actions',
      headerName: t('actions') || 'Actions',
      width: 120,
      getActions: (params: GridRowParams<T>) => {
        const actions = [];
        
        if (onRowClick || onEdit) {
          actions.push(
            <GridActionsCellItem
              icon={
                <Tooltip title={onEdit ? t('edit') || 'Edit' : t('view') || 'View'}>
                  {onEdit ? <EditIcon /> : <ViewIcon />}
                </Tooltip>
              }
              label={onEdit ? t('edit') || 'Edit' : t('view') || 'View'}
              onClick={() => {
                if (onEdit) {
                  onEdit(params.row);
                } else if (onRowClick) {
                  onRowClick(params.row);
                }
              }}
            />
          );
        }
        
        if (onDelete) {
          actions.push(
            <GridActionsCellItem
              icon={
                <Tooltip title={t('delete') || 'Delete'}>
                  <DeleteIcon />
                </Tooltip>
              }
              label={t('delete') || 'Delete'}
              onClick={() => onDelete(params.row)}
              showInMenu
            />
          );
        }
        
        return actions;
      },
    };

    return [...columns, ...(onRowClick || onEdit || onDelete ? [actionCol] : [])];
  }, [columns, onRowClick, onEdit, onDelete, t]);

  const handleSelectionChange = (newSelection: GridRowSelectionModel) => {
    setSelectionModel(newSelection);
    if (onSelectionChange) {
      onSelectionChange(newSelection as string[]);
    }
  };

  const slots = enableFiltering || enableExport
    ? {
        toolbar: () => (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
            {customToolbar || <Box />}
            {(enableFiltering || enableExport) && (
              <GridToolbar
                showQuickFilter={enableFiltering}
                csvOptions={{
                  fileName: title || 'export',
                  delimiter: ',',
                  utf8WithBom: true,
                }}
                printOptions={{ disableToolbarButton: true }}
              />
            )}
          </Box>
        ),
      }
    : undefined;

  return (
    <Paper elevation={2} sx={{ height, width: '100%', ...sx }}>
      {title && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight="bold">
            {title}
          </Typography>
        </Box>
      )}
      <DataGrid
        rows={rows}
        columns={enhancedColumns}
        getRowId={getRowId}
        loading={loading}
        checkboxSelection={checkboxSelection}
        disableRowSelectionOnClick={disableRowSelectionOnClick}
        rowSelectionModel={selectionModel}
        onRowSelectionModelChange={handleSelectionChange}
        filterModel={filterModel}
        onFilterModelChange={setFilterModel}
        sortModel={sortModel}
        onSortModelChange={setSortModel}
        pageSizeOptions={pageSizeOptions}
        initialState={{
          pagination: {
            paginationModel: { pageSize },
          },
        }}
        slots={slots}
        slotProps={{
          toolbar: {
            showQuickFilter: enableFiltering,
          },
        }}
        sx={{
          '& .MuiDataGrid-cell:focus': {
            outline: 'none',
          },
          '& .MuiDataGrid-row:hover': {
            cursor: onRowClick ? 'pointer' : 'default',
            backgroundColor: onRowClick ? 'action.hover' : 'transparent',
          },
          '& .MuiDataGrid-row:focus': {
            backgroundColor: 'action.selected',
          },
        }}
        localeText={{
          noRowsLabel: emptyMessage || t('noDataAvailable') || 'No data available',
          noResultsOverlayLabel: t('noResultsFound') || 'No results found',
          errorOverlayDefaultLabel: t('anErrorOccurred') || 'An error occurred',
          toolbarFilters: t('filters') || 'Filters',
          toolbarFiltersLabel: t('showFilters') || 'Show filters',
          toolbarFiltersTooltipHide: t('hideFilters') || 'Hide filters',
          toolbarFiltersTooltipShow: t('showFilters') || 'Show filters',
          columnsManagementSearchTitle: t('searchColumns') || 'Search columns',
          columnsManagementNoColumns: t('noColumns') || 'No columns',
          columnsManagementShowHideAllText: t('showHideAllColumns') || 'Show/Hide all columns',
          filterPanelAddFilter: t('addFilter') || 'Add filter',
          filterPanelDeleteIconLabel: t('delete') || 'Delete',
          filterPanelOperators: t('operators') || 'Operators',
          filterPanelOperatorAnd: t('and') || 'And',
          filterPanelOperatorOr: t('or') || 'Or',
          filterPanelColumns: t('columns') || 'Columns',
          filterPanelInputLabel: t('value') || 'Value',
          filterPanelInputPlaceholder: t('filterValue') || 'Filter value',
          filterOperatorContains: t('contains') || 'Contains',
          filterOperatorEquals: t('equals') || 'Equals',
          filterOperatorStartsWith: t('startsWith') || 'Starts with',
          filterOperatorEndsWith: t('endsWith') || 'Ends with',
          filterOperatorIs: t('is') || 'Is',
          filterOperatorNot: t('isNot') || 'Is not',
          filterOperatorAfter: t('after') || 'After',
          filterOperatorOnOrAfter: t('onOrAfter') || 'On or after',
          filterOperatorBefore: t('before') || 'Before',
          filterOperatorOnOrBefore: t('onOrBefore') || 'On or before',
          filterOperatorIsEmpty: t('isEmpty') || 'Is empty',
          filterOperatorIsNotEmpty: t('isNotEmpty') || 'Is not empty',
          columnMenuLabel: t('menu') || 'Menu',
          columnMenuShowColumns: t('showColumns') || 'Show columns',
          columnMenuFilter: t('filter') || 'Filter',
          columnMenuHideColumn: t('hideColumn') || 'Hide column',
          columnMenuUnsort: t('unsort') || 'Unsort',
          columnMenuSortAsc: t('sortAsc') || 'Sort by ASC',
          columnMenuSortDesc: t('sortDesc') || 'Sort by DESC',
          columnHeaderFiltersTooltipActive: (count) =>
            count !== 1
              ? `${count} ${t('activeFilters') || 'active filters'}`
              : `${count} ${t('activeFilter') || 'active filter'}`,
          columnsManagementColumnVisibilityLabel: t('columnVisibility') || 'Column visibility',
          footerRowSelected: (count) =>
            count !== 1
              ? `${count} ${t('rowsSelected') || 'rows selected'}`
              : `${count} ${t('rowSelected') || 'row selected'}`,
          footerTotalRows: t('totalRows') || 'Total rows',
          footerTotalVisibleRows: (visibleCount, totalCount) =>
            `${visibleCount} ${t('of') || 'of'} ${totalCount}`,
          MuiTablePagination: {
            labelRowsPerPage: t('rowsPerPage') || 'Rows per page',
            labelDisplayedRows: ({ from, to, count }) =>
              `${from}–${to} ${t('of') || 'of'} ${count !== -1 ? count : `${t('moreThan') || 'more than'} ${to}`}`,
          },
        }}
      />
    </Paper>
  );
}

export default EnhancedDataGrid;

