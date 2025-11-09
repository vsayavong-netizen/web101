import React from 'react';
import {
  Skeleton,
  Box,
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {Array.from({ length: columns }).map((_, index) => (
              <TableCell key={index}>
                <Skeleton variant="text" width="100%" height={24} />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton variant="text" width="100%" height={20} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <Stack spacing={2}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <CardContent>
            <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="text" width="80%" height={20} />
            <Skeleton variant="rectangular" width="100%" height={200} sx={{ mt: 2, borderRadius: 1 }} />
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Skeleton variant="text" width="30%" height={40} sx={{ mb: 3 }} />
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} sx={{ flex: 1 }}>
            <CardContent>
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="40%" height={32} sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        ))}
      </Stack>
      <Stack direction="row" spacing={2}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Skeleton variant="text" width="50%" height={28} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 1 }} />
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Skeleton variant="text" width="50%" height={28} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 1 }} />
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};

export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 5 }) => {
  return (
    <Box sx={{ p: 3 }}>
      <Skeleton variant="text" width="40%" height={32} sx={{ mb: 3 }} />
      <Stack spacing={3}>
        {Array.from({ length: fields }).map((_, index) => (
          <Box key={index}>
            <Skeleton variant="text" width="30%" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
          </Box>
        ))}
      </Stack>
      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
        <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
      </Stack>
    </Box>
  );
};

export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => {
  return (
    <Stack spacing={2}>
      {Array.from({ length: items }).map((_, index) => (
        <Card key={index}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Skeleton variant="circular" width={40} height={40} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton variant="text" width="40%" height={20} sx={{ mt: 0.5 }} />
              </Box>
              <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
};

export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 400 }) => {
  return (
    <Card>
      <CardContent>
        <Skeleton variant="text" width="40%" height={28} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={height} sx={{ borderRadius: 1 }} />
      </CardContent>
    </Card>
  );
};

export default {
  TableSkeleton,
  CardSkeleton,
  DashboardSkeleton,
  FormSkeleton,
  ListSkeleton,
  ChartSkeleton,
};

