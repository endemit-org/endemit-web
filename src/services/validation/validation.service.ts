import { CheckoutFormData } from "@/domain/checkout/types/checkout";
import { CartItem } from "@/types/cart";
import { getComplementaryTicketModel } from "@/domain/ticket/actions/getComplementaryTicketModel";
import { ValidationErrors } from "@/types/validation";

export class CheckoutValidationService {
  static isValidEmail(email: string): boolean {
    return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
      email: this.isValidEmail(formData.email),
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
      ? getComplementaryTicketModel(items, "")
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
    return Object.values(errors).every(error => error === false);
  }

  static getErrorMessages(errors: ValidationErrors): Record<string, string> {
    const messages: Record<string, string> = {};

    if (errors.email) messages.email = "Invalid email address";
    if (errors.emailRepeat)
      messages.emailRepeat = "Email addresses do not match";
    if (errors.name)
      messages.name = "Full name must include the first and last name";
    if (errors.address)
      messages.address = "Address must be at least 5 characters";
    if (errors.city) messages.city = "City must be at least 2 characters";
    if (errors.postalCode)
      messages.postalCode = "Postal code must be at least 3 characters";
    if (errors.country) messages.country = "Invalid country";
    if (errors.phone)
      messages.phone =
        "Phone number must be at least 5 numbers and digits only";
    if (errors.termsAndConditions)
      messages.termsAndConditions = "You must accept the terms and conditions";

    // Handle complementary ticket errors
    Object.keys(errors).forEach(key => {
      if (this.isComplementaryTicketItem(key) && errors[key]) {
        messages[key] =
          "Ticket holder name must be provided and at least 2 characters";
      }
    });

    return messages;
  }
}
