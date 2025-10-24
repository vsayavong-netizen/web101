import React from 'react';
import { TableCell, TableSortLabel, Box } from '@mui/material';
import { 
  ArrowUpward as ArrowUpIcon, 
  ArrowDownward as ArrowDownIcon,
  UnfoldMore as ChevronUpDownIcon 
} from '@mui/icons-material';

export type SortDirection = 'ascending' | 'descending';

export interface SortConfig<T> {
  key: T;
  direction: SortDirection;
}

interface SortableHeaderProps<T> {
  sortKey: T;
  title: string;
  sortConfig: SortConfig<T> | null;
  requestSort: (key: T) => void;
  className?: string;
}

const SortableHeader = <T extends string>({ 
    sortKey, 
    title, 
    sortConfig, 
    requestSort,
    className
}: SortableHeaderProps<T>) => {
  const isSorted = sortConfig?.key === sortKey;
  const direction = isSorted ? sortConfig.direction : undefined;

  return (
    <TableCell className={className}>
      <TableSortLabel
        active={isSorted}
        direction={direction === 'ascending' ? 'asc' : 'desc'}
        onClick={() => requestSort(sortKey)}
        IconComponent={isSorted 
          ? (direction === 'ascending' ? ArrowUpIcon : ArrowDownIcon)
          : ChevronUpDownIcon
        }
      >
        {title}
      </TableSortLabel>
    </TableCell>
  );
};

export default SortableHeader;
