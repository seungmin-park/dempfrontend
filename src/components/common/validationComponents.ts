import { Form as VeeForm, Field as VeeField, ErrorMessage as VeeErrorMessage } from 'vee-validate';
import type { FormHTMLAttributes, HTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'vue';

// Vee Validate forwards native attributes but its published $props omit them.
// Keep the original component and its props/events; add only typed native attrs.
type WithNativeAttributes<T extends abstract new (...args: never[]) => { $props: object }, Attributes> =
  T & (new () => InstanceType<T> & { $props: InstanceType<T>['$props'] & Attributes });
export const ValidationForm = VeeForm as WithNativeAttributes<typeof VeeForm, FormHTMLAttributes>;
export const Field = VeeField as WithNativeAttributes<typeof VeeField, InputHTMLAttributes & TextareaHTMLAttributes & SelectHTMLAttributes>;
export const ErrorMessage = VeeErrorMessage as WithNativeAttributes<typeof VeeErrorMessage, HTMLAttributes>;
