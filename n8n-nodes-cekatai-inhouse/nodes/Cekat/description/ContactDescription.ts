import type { INodeProperties } from 'n8n-workflow';

export const contactOperation: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['contact'],
			},
		},
		options: [
			{
				name: 'Update Additional Data',
				value: 'updateAdditionalData',
				action: 'Update additional data of a contact',
			},
		],
		default: 'updateAdditionalData',
	},
];

export const contactFields: INodeProperties[] = [
	{
		displayName: 'Contact ID',
		name: 'contactId',
		type: 'string',
		default: '',
		required: true,
		description: 'The ID of the contact whose additional data will be updated',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['updateAdditionalData'],
			},
		},
	},
	{
		displayName: 'Additional Data',
		name: 'additionalData',
		type: 'fixedCollection',
		placeholder: 'Add Field',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		options: [
			{
				displayName: 'Data',
				name: 'data',
				values: [
					{
						displayName: 'Data Key (e.g., Name)',
						name: 'key',
						type: 'string',
						default: '',
						description: "The key to update in the contact's additional data.",
					},
					{
						displayName: 'Data Value (e.g., John Doe)',
						name: 'value',
						type: 'string',
						default: '',
						description:
							"The value to update in the contact's additional data. This can be a string or a number.",
					},
				],
			},
		],
		required: true,
		description: "Key-value pairs to update in the contact's additional data",
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['updateAdditionalData'],
			},
		},
	},
];
