import { useCallback, useMemo, useState } from "react";

/**
 * Minimal schema-form state — the shape every form in the product needs, without
 * pulling a form library into the bundle.
 *
 * The caller supplies the validator (normally `validateWithSchema` from
 * `@eco-nojin/validation`, which wraps Zod). Errors are keyed by field name and
 * are produced on blur and on submit, never on every keystroke.
 */
export type FormErrors<T> = Partial<Record<keyof T, string>>;

export type FormResult<T> = {
  ok: boolean;
  data?: T;
  errors: FormErrors<T>;
};

export type FormValidator<T> = (values: T) => FormResult<T>;

export type FormState<T> = {
  values: T;
  errors: FormErrors<T>;
  setField: <K extends keyof T>(field: K, value: T[K]) => void;
  setValues: (next: T) => void;
  blur: (field: keyof T) => void;
  validateAll: () => FormResult<T>;
  reset: (next?: T) => void;
  isValid: (values: T) => boolean;
};

export function useFormState<T extends Record<string, unknown>>({
  initial,
  validate,
}: {
  initial: T;
  validate: FormValidator<T>;
}): FormState<T> {
  const [values, setValuesState] = useState<T>(initial);
  const [errors, setErrors] = useState<FormErrors<T>>({});

  const setField = useCallback<FormState<T>["setField"]>((field, value) => {
    setValuesState((current) => {
      const next = { ...current, [field]: value };
      setErrors((currentErrors) => {
        if (!currentErrors[field]) return currentErrors;
        const { [field]: _removed, ...rest } = currentErrors;
        return rest as FormErrors<T>;
      });
      return next;
    });
  }, []);

  const setValues = useCallback((next: T) => {
    setValuesState(next);
    setErrors({});
  }, []);

  const blur = useCallback(
    (field: keyof T) => {
      const result = validate(values);
      setErrors((current) => {
        const message = result.ok ? undefined : result.errors[field];
        const next = { ...current };
        if (message) next[field] = message;
        else delete next[field];
        return next as FormErrors<T>;
      });
    },
    [validate, values],
  );

  const validateAll = useCallback((): FormResult<T> => {
    const result = validate(values);
    setErrors(result.errors);
    return result;
  }, [validate, values]);

  const reset = useCallback(
    (next?: T) => {
      setValuesState(next ?? initial);
      setErrors({});
    },
    [initial],
  );

  const isValid = useCallback((candidate: T) => validate(candidate).ok, [validate]);

  return useMemo(
    () => ({ values, errors, setField, setValues, blur, validateAll, reset, isValid }),
    [values, errors, setField, setValues, blur, validateAll, reset, isValid],
  );
}