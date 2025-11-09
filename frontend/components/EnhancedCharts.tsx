import React, { useMemo } from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import {
  LineChart,
  BarChart,
  PieChart,
  ChartContainer,
  ChartsLegend,
  ChartsTooltip,
  ChartsAxis,
  LineSeriesType,
  BarSeriesType,
  PieSeriesType,
} from '@mui/x-charts';
import { useTranslations } from '../hooks/useTranslations';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface EnhancedLineChartProps {
  title?: string;
  data: ChartDataPoint[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  sx?: any;
}

export const EnhancedLineChart: React.FC<EnhancedLineChartProps> = ({
  title,
  data,
  xAxisLabel,
  yAxisLabel,
  height = 400,
  showLegend = true,
  showTooltip = true,
  sx,
}) => {
  const theme = useTheme();
  const t = useTranslations();

  const chartData = useMemo(() => {
    return {
      xAxis: [
        {
          data: data.map((d) => d.label),
          scaleType: 'band' as const,
        },
      ],
      series: [
        {
          data: data.map((d) => d.value),
          type: 'line' as LineSeriesType['type'],
          color: theme.palette.primary.main,
        },
      ],
    };
  }, [data, theme]);

  return (
    <Paper elevation={2} sx={{ p: 3, ...sx }}>
      {title && (
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {title}
        </Typography>
      )}
      <Box sx={{ width: '100%', height }}>
        <LineChart
          width={undefined}
          height={height}
          xAxis={chartData.xAxis}
          series={chartData.series}
          leftAxis={yAxisLabel ? { label: yAxisLabel } : undefined}
          bottomAxis={xAxisLabel ? { label: xAxisLabel } : undefined}
          slotProps={{
            legend: showLegend
              ? {
                  direction: 'row',
                  position: { vertical: 'bottom', horizontal: 'middle' },
                }
              : undefined,
          }}
        />
      </Box>
    </Paper>
  );
};

export interface EnhancedBarChartProps {
  title?: string;
  data: ChartDataPoint[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  horizontal?: boolean;
  sx?: any;
}

export const EnhancedBarChart: React.FC<EnhancedBarChartProps> = ({
  title,
  data,
  xAxisLabel,
  yAxisLabel,
  height = 400,
  showLegend = true,
  showTooltip = true,
  horizontal = false,
  sx,
}) => {
  const theme = useTheme();
  const t = useTranslations();

  const chartData = useMemo(() => {
    return {
      xAxis: [
        {
          data: data.map((d) => d.label),
          scaleType: 'band' as const,
        },
      ],
      series: [
        {
          data: data.map((d) => d.value),
          type: 'bar' as BarSeriesType['type'],
          color: theme.palette.primary.main,
        },
      ],
    };
  }, [data, theme]);

  return (
    <Paper elevation={2} sx={{ p: 3, ...sx }}>
      {title && (
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {title}
        </Typography>
      )}
      <Box sx={{ width: '100%', height }}>
        <BarChart
          width={undefined}
          height={height}
          xAxis={chartData.xAxis}
          series={chartData.series}
          layout={horizontal ? 'horizontal' : 'vertical'}
          leftAxis={yAxisLabel ? { label: yAxisLabel } : undefined}
          bottomAxis={xAxisLabel ? { label: xAxisLabel } : undefined}
          slotProps={{
            legend: showLegend
              ? {
                  direction: 'row',
                  position: { vertical: 'bottom', horizontal: 'middle' },
                }
              : undefined,
          }}
        />
      </Box>
    </Paper>
  );
};

export interface EnhancedPieChartProps {
  title?: string;
  data: ChartDataPoint[];
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  sx?: any;
}

export const EnhancedPieChart: React.FC<EnhancedPieChartProps> = ({
  title,
  data,
  height = 400,
  showLegend = true,
  showTooltip = true,
  innerRadius = 0,
  outerRadius = 80,
  sx,
}) => {
  const theme = useTheme();
  const t = useTranslations();

  const chartData = useMemo(() => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      theme.palette.info.main,
    ];

    return {
      series: [
        {
          data: data.map((d, index) => ({
            id: index,
            value: d.value,
            label: d.label,
            color: d.color || colors[index % colors.length],
          })),
          type: 'pie' as PieSeriesType['type'],
          innerRadius,
          outerRadius,
        },
      ],
    };
  }, [data, theme, innerRadius, outerRadius]);

  return (
    <Paper elevation={2} sx={{ p: 3, ...sx }}>
      {title && (
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {title}
        </Typography>
      )}
      <Box sx={{ width: '100%', height, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <PieChart
          width={height}
          height={height}
          series={chartData.series}
          slotProps={{
            legend: showLegend
              ? {
                  direction: 'row',
                  position: { vertical: 'bottom', horizontal: 'middle' },
                }
              : undefined,
            tooltip: showTooltip ? {} : undefined,
          }}
        />
      </Box>
    </Paper>
  );
};

export default { EnhancedLineChart, EnhancedBarChart, EnhancedPieChart };

