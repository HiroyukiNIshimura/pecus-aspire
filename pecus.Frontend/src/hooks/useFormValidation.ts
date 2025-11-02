"use client";

import { useEffect, useRef, useState } from "react";
import Pristine from "pristinejs";
import { z } from "zod";

interface UseFormValidationOptions {
  schema?: z.ZodObject<any>;
  onSubmit?: (data: any) => void | Promise<void>;
}

export function useFormValidation(options: UseFormValidationOptions = {}) {
  const formRef = useRef<HTMLFormElement>(null);
  const pristineRef = useRef<Pristine | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (formRef.current) {
      pristineRef.current = new Pristine(formRef.current, {
        classTo: "form-control",
        errorClass: "has-danger",
        successClass: "has-success",
        errorTextParent: "form-control",
        errorTextTag: "div",
        errorTextClass: "text-error text-sm mt-1",
      });
    }

    return () => {
      pristineRef.current?.destroy();
    };
  }, []);

  const validateField = (element: HTMLInputElement | HTMLTextAreaElement) => {
    if (pristineRef.current) {
      pristineRef.current.validate(element);
    }
  };

  const validateForm = async (): Promise<boolean> => {
    if (!pristineRef.current) return false;

    const isValid = pristineRef.current.validate();

    if (isValid && options.schema && formRef.current) {
      const formData = new FormData(formRef.current);
      const data = Object.fromEntries(formData.entries());

      const result = await options.schema.safeParseAsync(data);
      if (!result.success) {
        // Zodのエラーをフォームに表示
        result.error.issues.forEach((issue) => {
          const fieldName = String(issue.path[0]);
          const field = formRef.current?.querySelector(
            `[name="${fieldName}"]`,
          ) as HTMLInputElement;
          if (field && pristineRef.current) {
            pristineRef.current.addError(field, issue.message);
          }
        });
        return false;
      }
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const isValid = await validateForm();
      if (isValid && options.onSubmit) {
        await options.onSubmit(
          formRef.current
            ? Object.fromEntries(new FormData(formRef.current))
            : {},
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    pristineRef.current?.reset();
    formRef.current?.reset();
  };

  return {
    formRef,
    isSubmitting,
    validateField,
    validateForm,
    handleSubmit,
    reset,
  };
}
