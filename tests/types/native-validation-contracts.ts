import type { Field, ValidationForm } from '@/components/common/validationComponents';
const input: InstanceType<typeof Field>['$props'] = { name: 'title', id: 'title', type: 'text', autocomplete: 'off' };
const form: InstanceType<typeof ValidationForm>['$props'] = { enctype: 'multipart/form-data' };
// @ts-expect-error Native attribute adaptation must preserve Vee Validate props.
const wrongName: InstanceType<typeof Field>['$props'] = { name: 123 };
// @ts-expect-error A misspelled attribute is not a native attribute.
const typo: InstanceType<typeof Field>['$props'] = { name: 'title', autoCompleteTypo: 'off' };
void [input, form, wrongName, typo];
