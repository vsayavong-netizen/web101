import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  SelectProps,
} from '@mui/material';
import { Controller, Control, FieldError } from 'react-hook-form';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface FormSelectFieldProps extends Omit<SelectProps, 'name' | 'control'> {
  name: string;
  control: Control<any>;
  options: SelectOption[];
  error?: FieldError;
  label: string;
  required?: boolean;
  helperText?: string;
}

export const FormSelectField: React.FC<FormSelectFieldProps> = ({
  name,
  control,
  options,
  error,
  label,
  required = false,
  helperText,
  fullWidth = true,
  ...selectProps
}) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={{
        required: required ? `${label} is required` : false,
      }}
      render={({ field }) => (
        <FormControl fullWidth={fullWidth} error={!!error} required={required}>
          <InputLabel>{label}</InputLabel>
          <Select {...field} {...selectProps} label={label}>
            {options.map((option) => (
              <MenuItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {(error || helperText) && (
            <FormHelperText>{error?.message || helperText}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
};

export default FormSelectField;

