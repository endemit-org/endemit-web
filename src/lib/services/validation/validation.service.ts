import { CheckoutFormData } from "@/domain/checkout/types/checkout";
import { transformToComplementaryTicketModel } from "@/domain/ticket/transformers/transformToComplementaryTicketModel";
import { ValidationErrors } from "@/domain/checkout/types/validation";
import { CartItem } from "@/domain/checkout/types/cartItem";

export class CheckoutValidationService {
  static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static isValidName(name: string): boolean {
    return name.trim().length >= 2;
  }

  static isValidFullName(name: string): boolean {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 && parts.every(part => part.length >= 2);
  }

  static isValidAddress(address: string): boolean {
    return address.trim().length >= 5;
  }

  static isValidCity(city: string): boolean {
    return city.trim().length > 2;
  }

  static isValidPostalCode(postalCode: string): boolean {
    return postalCode.trim().length >= 3;
  }

  static isValidCountry(country: string): boolean {
    return country.trim().length === 2;
  }

  static isValidDiscountCodeFormat(discountCode: string): boolean {
    return discountCode.trim().length >= 2;
  }

  static isValidPhone(phone: string): boolean {
    const cleaned = phone.trim();
    return cleaned.length >= 5 && /^\d+$/.test(cleaned);
  }

  static isValidCheckbox(checked: boolean): boolean {
    return checked;
  }

  static isComplementaryTicketItem(key: string) {
    return key.startsWith("complementaryTicket_");
  }

  static formatComplementaryTicketKey(key: string) {
    return `complementaryTicket_${key}`;
  }

  static validateForm({
    formData,
    items,
    requiresShippingAddress,
  }: {
    formData: CheckoutFormData;
    requiresShippingAddress: boolean;
    items: CartItem[];
  }): ValidationErrors {
    const errors: ValidationErrors = {
      email: !this.isValidEmail(formData.email),
      emailRepeat: formData.email !== formData.emailRepeat,
      name: false,
      address: false,
      city: false,
      postalCode: false,
      country: false,
      phone: false,
      termsAndConditions: !this.isValidCheckbox(formData.termsAndConditions),
    };

    if (requiresShippingAddress) {
      errors.name = !this.isValidFullName(formData.name);
      errors.address = !this.isValidAddress(formData.address);
      errors.city = !this.isValidCity(formData.city);
      errors.postalCode = !this.isValidPostalCode(formData.postalCode);
      errors.country = !this.isValidCountry(formData.country);
      errors.phone = !this.isValidPhone(formData.phone);
    }

    // Flatten complementary ticket validation to top level
    const complementaryModel = items
      ? transformToComplementaryTicketModel(items, "")
      : null;
    if (complementaryModel) {
      for (const key in complementaryModel) {
        const value = formData.complementaryTicketData?.[key] || "";
        errors[this.formatComplementaryTicketKey(key)] = !this.isValidName(
          String(value)
        );
      }
    }

    return errors;
  }

  static isFormValid(errors: ValidationErrors): boolean {
    return Object.values(errors).every(error => !error);
  }

  static getErrorMessages(errors: ValidationErrors): Record<string, string> {
    const errorMap: Record<string, string> = {
      email: "Invalid email address",
      emailRepeat: "Email addresses do not match",
      name: "Full name must include the first and last name",
      address: "Address must be at least 5 characters",
      city: "City must be at least 2 characters",
      postalCode: "Postal code must be at least 3 characters",
      country: "Invalid country",
      phone: "Phone number must be at least 5 numbers and digits only",
      termsAndConditions: "You must accept the terms and conditions",
    };

    const messages: Record<string, string> = {};

    Object.keys(errors).forEach(key => {
      if (errors[key]) {
        if (this.isComplementaryTicketItem(key)) {
          messages[key] =
            "Ticket holder name must be provided and at least 2 characters";
        } else if (errorMap[key]) {
          messages[key] = errorMap[key];
        }
      }
    });

    return messages;
  }
}
