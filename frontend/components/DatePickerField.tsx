import React from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { TextField, TextFieldProps } from '@mui/material';
import { Controller, Control, FieldError } from 'react-hook-form';
import dayjs, { Dayjs } from 'dayjs';

export interface DatePickerFieldProps {
  name: string;
  control: Control<any>;
  label: string;
  error?: FieldError;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  minDate?: Dayjs;
  maxDate?: Dayjs;
  variant?: 'date' | 'datetime' | 'time';
  fullWidth?: boolean;
  sx?: any;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  name,
  control,
  label,
  error,
  helperText,
  required = false,
  disabled = false,
  minDate,
  maxDate,
  variant = 'date',
  fullWidth = true,
  sx,
}) => {
  const renderPicker = (value: Dayjs | null, onChange: (value: Dayjs | null) => void) => {
    const commonProps = {
      label,
      value: value || null,
      onChange,
      disabled,
      minDate,
      maxDate,
      slotProps: {
        textField: {
          error: !!error,
          helperText: error?.message || helperText,
          required,
          fullWidth,
          sx,
        } as TextFieldProps,
      },
    };

    switch (variant) {
      case 'datetime':
        return <DateTimePicker {...commonProps} />;
      case 'time':
        return <TimePicker {...commonProps} />;
      default:
        return <DatePicker {...commonProps} />;
    }
  };

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        required: required ? `${label} is required` : false,
        validate: (value) => {
          if (!value && required) {
            return `${label} is required`;
          }
          if (value && minDate && dayjs(value).isBefore(minDate, 'day')) {
            return `Date must be after ${minDate.format('YYYY-MM-DD')}`;
          }
          if (value && maxDate && dayjs(value).isAfter(maxDate, 'day')) {
            return `Date must be before ${maxDate.format('YYYY-MM-DD')}`;
          }
          return true;
        },
      }}
      render={({ field: { onChange, value } }) =>
        renderPicker(value ? dayjs(value) : null, (newValue) => {
          onChange(newValue ? newValue.toISOString() : null);
        })
      }
    />
  );
};

export default DatePickerField;

