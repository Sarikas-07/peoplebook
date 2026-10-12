"use client";

import { archivePerson } from "@/app/(app)/people/actions";

export default function ArchiveButton({ id, className }: { id: string; className?: string }) {
  return (
    <form
      action={archivePerson.bind(null, id)}
      onSubmit={(e) => {
        if (!window.confirm("Archive this person? Their history will be kept.")) e.preventDefault();
      }}
    >
      <button type="submit" className={className ?? "text-sm font-medium text-red-600 hover:underline"}>
        Archive
      </button>
    </form>
  );
}
