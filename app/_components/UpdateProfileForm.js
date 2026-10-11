"use client";
import { useActionState } from "react";
import { updateGuest } from "../_lib/actions";
import SubmitButton from "./SubmitButton";
export default function UpdateProfileForm({ children, guest }) {
  const [state, action] = useActionState(updateGuest, {});
  return (
    <form
      action={action}
      className="bg-primary-900 p-6 md:p-10 text-lg flex gap-6 flex-col"
    >
      <div className="space-y-2">
        <label htmlFor="fullName">Full name</label>
        <input
          id="fullName"
          disabled
          defaultValue={guest.fullName}
          className="px-5 py-3 bg-gray-600 w-full rounded-sm"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          disabled
          defaultValue={guest.email}
          className="px-5 py-3 bg-gray-600 w-full rounded-sm"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="nationality">Where are you from?</label>
        {children}
      </div>
      <div className="space-y-2">
        <label htmlFor="nationalID">National ID number (optional)</label>
        <input
          id="nationalID"
          name="nationalID"
          defaultValue={guest.nationalID ?? ""}
          maxLength={18}
          className="px-5 py-3 bg-primary-200 text-primary-800 w-full rounded-sm"
        />
      </div>
      {state.error && (
        <p role="alert" className="text-red-300">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="text-green-300">
          {state.success}
        </p>
      )}
      <SubmitButton pendingLabel="Updating...">Update profile</SubmitButton>
    </form>
  );
}
