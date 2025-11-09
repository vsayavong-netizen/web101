import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { Controller, Control, FieldError } from 'react-hook-form';

export interface FormTextFieldProps extends Omit<TextFieldProps, 'name' | 'control'> {
  name: string;
  control: Control<any>;
  error?: FieldError;
}

export const FormTextField: React.FC<FormTextFieldProps> = ({
  name,
  control,
  error,
  required,
  ...textFieldProps
}) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={{
        required: required ? `${textFieldProps.label || name} is required` : false,
      }}
      render={({ field }) => (
        <TextField
          {...field}
          {...textFieldProps}
          error={!!error}
          helperText={error?.message || textFieldProps.helperText}
          required={required}
        />
      )}
    />
  );
};

export default FormTextField;

