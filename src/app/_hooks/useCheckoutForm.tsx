"use client";

import {
  useEffect,
  useState,
  useCallback,
  Dispatch,
  SetStateAction,
} from "react";
import { CheckoutValidationService } from "@/lib/services/validation/validation.service";
import { CheckoutFormData } from "@/domain/checkout/types/checkout";
import { transformToComplementaryTicketModel } from "@/domain/ticket/transformers/transformToComplementaryTicketModel";
import { useSessionStorageForm } from "@/app/_hooks/useSessionStorageForm";

import { convertHoursToMs } from "@/lib/util/converters";
import { CartItem } from "@/domain/checkout/types/cartItem";

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
    complementaryTicketData: transformToComplementaryTicketModel(items, ""),
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
  validateForm: (type: "manual" | "auto") => void;
}

export function useCheckoutForm(
  requiresShippingAddress: boolean,
  items: CartItem[],
  setValidationTriggered: Dispatch<SetStateAction<boolean>>
): UseCheckoutFormReturn {
  const { saveToStorage, loadFromStorage, clearStorage } =
    useSessionStorageForm<CheckoutFormData>(STORAGE_KEY, convertHoursToMs(2));

  const [formData, setFormData] = useState<CheckoutFormData>(() => {
    const stored = loadFromStorage();
    if (stored) {
      return {
        ...stored,
        complementaryTicketData: transformToComplementaryTicketModel(items, ""),
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

  const validateForm = useCallback(
    (type: "manual" | "auto") => {
      const errors = CheckoutValidationService.validateForm({
        formData,
        requiresShippingAddress,
        items,
      });
      setFieldErrors(errors);

      if (type === "manual") {
        setValidationTriggered(true);
      }

      setIsFormValid(CheckoutValidationService.isFormValid(errors));
    },
    [formData, requiresShippingAddress, items, setValidationTriggered]
  );

  // Persist to localStorage
  useEffect(() => {
    saveToStorage(formData);
  }, [formData, saveToStorage]);

  // Validate form whenever data changes
  useEffect(() => {
    validateForm("auto");
  }, [formData, requiresShippingAddress, items, validateForm]);

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
    validateForm,
  };
}
