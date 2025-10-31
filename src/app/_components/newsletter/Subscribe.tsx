"use client";

import { useState } from "react";
import ActionButton from "@/app/_components/form/ActionButton";
import Input from "@/app/_components/form/Input";
import { CheckoutValidationService } from "@/lib/services/validation/validation.service";
import { subscribeFromClient } from "@/domain/newsletter/actions/subscribeFromClient";
import CheckoutError from "@/app/_components/checkout/CheckoutError";
import AnimatedSuccessIcon from "@/app/_components/icon/AnimatedSuccessIcon";
import Spinner from "@/app/_components/ui/Spinner";

interface SubscribeProps {
  title: string;
  description: string;
  apiEndpoint: string;
  containerClass?: string;
}

type SubmitState = "idle" | "loading" | "success";

export default function Subscribe({
  title,
  description,
  apiEndpoint,
  containerClass = "",
}: SubscribeProps) {
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [emailValue, setEmailValue] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleValueChange = (name: string, value: string) => {
    setEmailValue(value);
    setErrorMessage("");
  };

  const handleSubmit = async () => {
    setSubmitState("loading");
    setErrorMessage("");

    if (!CheckoutValidationService.isValidEmail(emailValue)) {
      setSubmitState("idle");
      setErrorMessage("Please enter a valid email address");
      return;
    }

    const result = await subscribeFromClient({
      email: emailValue,
      apiEndpoint,
    });

    if (result.success) {
      setSubmitState("success");
    } else {
      setSubmitState("idle");
      setErrorMessage(result.error || "Failed to subscribe");
    }
  };

  const getButtonText = () => {
    switch (submitState) {
      case "loading":
        return <Spinner text={"Subscribing..."} />;
      case "success":
        return "Subscribed!";
      default:
        return "Sign me up";
    }
  };

  return (
    <div className={`text-center ${containerClass}`}>
      {errorMessage && <CheckoutError error={errorMessage} />}

      {submitState === "success" && (
        <>
          <div className="mb-8 flex justify-center">
            <AnimatedSuccessIcon />
          </div>

          <div className="text-neutral-400">{emailValue}</div>
          <h1 className="text-3xl font-bold text-neutral-200 mb-4">
            subscribed successfully!
          </h1>
        </>
      )}

      {submitState !== "success" && (
        <>
          <h1 className="text-2xl font-bold text-neutral-200 mb-4">{title}</h1>
          <p className="text-gray-400 mb-8 text-lg">{description}</p>
          <div className="max-w-xl mx-auto mb-12 px-4 space-y-4 flex flex-col items-center justify-center">
            <Input
              name={"emailNewsletter"}
              placeholder={"you@gmail.com"}
              type="email"
              value={emailValue}
              onChangeAction={handleValueChange}
              onEnter={() => handleSubmit()}
            />
            <ActionButton
              disabled={submitState !== "idle"}
              onClick={handleSubmit}
              fullWidth={false}
            >
              {getButtonText()}
            </ActionButton>
          </div>
        </>
      )}
    </div>
  );
}
