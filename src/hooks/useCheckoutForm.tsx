"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckoutValidationService } from "@/app/services/validation/validation.service";
import { CheckoutFormData } from "@/types/checkout";
import { CartItem } from "@/types/cart";
import { getComplementaryTicketModel } from "@/domain/ticket/actions/getComplementaryTicketModel";
import { useLocalStorageForm } from "@/hooks/useLocalStorageForm";
import { transformHoursToMs } from "@/lib/util";

const STORAGE_KEY = "checkout_form_data";

function getDefaultFormData(items: CartItem[]): CheckoutFormData {
  return {
    email: "",
    emailRepeat: "",
    name: "",
    address: "",
    city: "",
    postalCode: "",
    country: "SI",
    phone: "",
    termsAndConditions: false,
    subscribeToNewsletter: false,
    complementaryTicketData: getComplementaryTicketModel(items, ""),
    discountCodeId: undefined,
  };
}

interface UseCheckoutFormReturn {
  formData: CheckoutFormData;
  fieldErrors: { [x: string]: string | boolean } | null;
  errorMessages: Record<string, string>;
  isFormValid: boolean;
  updateField: (name: string, value: string | boolean | undefined) => void;
  updateTicketField: (name: string, value: string) => void;
  clearForm: () => void;
}

export function useCheckoutForm(
  requiresShippingAddress: boolean,
  items: CartItem[]
): UseCheckoutFormReturn {
  const { saveToStorage, loadFromStorage, clearStorage } =
    useLocalStorageForm<CheckoutFormData>(STORAGE_KEY, transformHoursToMs(2));

  const [formData, setFormData] = useState<CheckoutFormData>(() => {
    const stored = loadFromStorage();
    if (stored) {
      return {
        ...stored,
        complementaryTicketData: getComplementaryTicketModel(items, ""),
        termsAndConditions: false,
      };
    }
    return getDefaultFormData(items);
  });

  const [fieldErrors, setFieldErrors] = useState(() => ({
    email: false,
    emailRepeat: false,
    name: false,
    address: false,
    city: false,
    postalCode: false,
    country: false,
    phone: false,
    termsAndConditions: false,
  }));

  const [isFormValid, setIsFormValid] = useState(false);

  // Persist to localStorage
  useEffect(() => {
    saveToStorage(formData);
  }, [formData, saveToStorage]);

  // Validate form whenever data changes
  useEffect(() => {
    const errors = CheckoutValidationService.validateForm({
      formData,
      requiresShippingAddress,
      items,
    });
    setFieldErrors(errors);
    setIsFormValid(CheckoutValidationService.isFormValid(errors));
  }, [formData, requiresShippingAddress, items]);

  const updateField = useCallback(
    (name: string, value: string | boolean | undefined) => {
      setFormData(prev => ({ ...prev, [name]: value }));
    },
    []
  );

  const updateTicketField = useCallback((name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      complementaryTicketData: {
        ...prev.complementaryTicketData,
        [name]: value,
      },
    }));
  }, []);

  const clearForm = useCallback(() => {
    clearStorage();
    setFormData(getDefaultFormData(items));
  }, [items, clearStorage]);

  const errorMessages = CheckoutValidationService.getErrorMessages(fieldErrors);

  return {
    formData,
    fieldErrors,
    errorMessages,
    isFormValid,
    updateField,
    updateTicketField,
    clearForm,
  };
}
