import * as React from "react";
import { TicketEmailData } from "@/types/ticket";
import { MasterTemplate } from "@/domain/email/templates/MasterTemplate";

interface Props {
  ticket: TicketEmailData;
}

function NewTicketToCustomerTemplate({ ticket }: Props) {
  return (
    <MasterTemplate>
      <div>
        <h1>Your Ticket for {ticket.eventName}</h1>
        <p>Hi {ticket.ticketHolderName},</p>
        <p>Your ticket is ready!</p>
        <p>QR Code: {ticket.ticketHash}</p>
      </div>
    </MasterTemplate>
  );
}

export { NewTicketToCustomerTemplate };
