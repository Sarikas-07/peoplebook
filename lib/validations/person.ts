export type PersonFields = {
  full_name: string;
  address: string;
  mobile_number: string;
  alternative_mobile_number: string;
  aadhaar_number: string;
  notes: string;
  branch_name: string;
  branch_location: string;
  account_number: string; // kept as text so leading zeros survive
};

export type FieldErrors = Partial<Record<keyof PersonFields, string>>;

const MOBILE = /^\+?[0-9]{10,13}$/;
const clean = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");
const phone = (v: string) => v.replace(/[\s-]/g, "");

export function readPersonForm(fd: FormData): PersonFields {
  return {
    full_name: clean(fd.get("full_name")),
    address: clean(fd.get("address")),
    mobile_number: phone(clean(fd.get("mobile_number"))),
    alternative_mobile_number: phone(clean(fd.get("alternative_mobile_number"))),
    aadhaar_number: clean(fd.get("aadhaar_number")).replace(/\s/g, ""),
    notes: clean(fd.get("notes")),
    branch_name: clean(fd.get("branch_name")),
    branch_location: clean(fd.get("branch_location")),
    account_number: clean(fd.get("account_number")).replace(/[\s-]/g, ""),
  };
}

export function validatePerson(v: PersonFields): FieldErrors {
  const e: FieldErrors = {};
  if (!v.full_name) e.full_name = "Full name is required.";
  else if (v.full_name.length > 200) e.full_name = "Full name must be 200 characters or fewer.";
  if (v.address.length > 500) e.address = "Address must be 500 characters or fewer.";
  if (v.notes.length > 2000) e.notes = "Notes must be 2000 characters or fewer.";
  if (!v.mobile_number) e.mobile_number = "Mobile number is required.";
  else if (!MOBILE.test(v.mobile_number)) e.mobile_number = "Enter a valid mobile number.";
  if (v.alternative_mobile_number && !MOBILE.test(v.alternative_mobile_number))
    e.alternative_mobile_number = "Enter a valid mobile number.";
  if (v.aadhaar_number && !/^[0-9]{12}$/.test(v.aadhaar_number))
    e.aadhaar_number = "Aadhaar number must be 12 digits.";
  if (v.branch_name.length > 200) e.branch_name = "Branch name must be 200 characters or fewer.";
  if (v.branch_location.length > 500) e.branch_location = "Branch location must be 500 characters or fewer.";
  if (v.account_number && !/^[0-9]{9,18}$/.test(v.account_number))
    e.account_number = "Account number must be 9 to 18 digits.";
  return e;
}
