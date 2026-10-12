export type RecordStatus = "Active" | "Overdue" | "Paid";

export type Person = {
  id: string;
  full_name: string;
  address: string | null;
  mobile_number: string;
  alternative_mobile_number: string | null;
  notes: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type PaymentAmountRow = { payment_amount: number | string };

export type RecordRow = {
  id: string;
  person_id: string;
  amount_given: number | string;
  date_given: string;
  amount_due: number | string;
  due_date: string;
  notes: string | null;
  payments?: PaymentAmountRow[] | null;
};
