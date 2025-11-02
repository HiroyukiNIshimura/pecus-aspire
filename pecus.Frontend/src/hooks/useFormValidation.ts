"use client";

import { useEffect, useRef, useState } from "react";
import Pristine from "pristinejs";

interface UseFormValidationOptions {
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

  const validateForm = (): boolean => {
    if (!pristineRef.current) return false;
    return pristineRef.current.validate();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const isValid = validateForm();
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
