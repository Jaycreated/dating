import { useState, ChangeEvent } from 'react';

interface UseFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string | undefined) => void;
  clearError: (field: keyof T) => void;
  clearAllErrors: () => void;
  validate: (validators: Partial<Record<keyof T, (value: any) => string | undefined>>) => boolean;
  reset: () => void;
}

export const useForm = <T extends Record<string, any>>(initialValues: T): UseFormReturn<T> => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof T]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const setFieldValue = (field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const setFieldError = (field: keyof T, error: string | undefined) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const clearError = (field: keyof T) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const clearAllErrors = () => {
    setErrors({});
  };

  const validate = (validators: Partial<Record<keyof T, (value: any) => string | undefined>>): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(validators).forEach((key) => {
      const validator = validators[key as keyof T];
      if (validator) {
        const error = validator(values[key as keyof T]);
        if (error) {
          newErrors[key as keyof T] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
  };

  return {
    values,
    errors,
    handleChange,
    setFieldValue,
    setFieldError,
    clearError,
    clearAllErrors,
    validate,
    reset,
  };
};
