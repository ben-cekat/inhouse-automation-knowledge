import type { INodeProperties } from 'n8n-workflow';

export const webhookOperation: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['webhook'],
			},
		},
		options: [
			{
				name: 'Subscribe to webhook',
				value: 'subscribe',
				action: 'Subscribe to a webhook',
			},
			{
				name: 'Unsubscribe to webhook',
				value: 'unsubscribe',
				action: 'Unsubscribe from a webhook',
			},
		],
		default: 'subscribe',
	},
];

export const webhookFields: INodeProperties[] = [
	{
		displayName: 'Webhook URL',
		name: 'webhookUrl',
		type: 'string',
		default: '',
		required: true,
		description: 'The URL to which webhook events will be sent',
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['subscribe', 'unsubscribe'],
			},
		},
	},

	{
		displayName: 'Select Inbox or Inbox ID',
		name: 'inboxId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getInboxesDropdown',
		},
		default: '',
		required: true,
		description: 'Select the inbox to subscribe to webhook events',
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['subscribe'],
			},
		},
	},

	// Only show events when subscribing
	{
		displayName: 'Events',
		name: 'events',
		type: 'multiOptions',
		options: [
			{ name: 'Message Received', value: 'message.received' },
			{ name: 'Message Sent', value: 'message.sent' },
			{ name: 'Conversation Created', value: 'conversation.created' },
			{ name: 'Handled By Updated', value: 'conversation.handled_by_updated' },
			{ name: 'Stage Status Updated', value: 'conversation.stage_status_updated' },
			{ name: 'Pipeline Status Updated', value: 'conversation.pipeline_status_updated' },
			{ name: 'Labels Updated', value: 'conversation.labels_updated' },
			{ name: 'Contact Updated', value: 'contact.updated' },
		],
		default: [],
		required: true,
		description: 'Select one or more events to subscribe',
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['subscribe'], // 👈 hanya muncul saat subscribe
			},
		},
	},
];
