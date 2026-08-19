import type { INodeProperties } from 'n8n-workflow';

const allCurrencies = [
	{ name: 'Indonesian Rupiah', value: 'idr' },
	{ name: 'Singapore Dollar', value: 'sgd' },
	{ name: 'Malaysian Ringgit', value: 'myr' },
	{ name: 'Thai Baht', value: 'thb' },
	{ name: 'Vietnamese Dong', value: 'vnd' },
	{ name: 'Philippine Peso', value: 'php' },
	{ name: 'Indian Rupee', value: 'inr' },
	{ name: 'United States Dollar', value: 'usd' },
	{ name: 'British Pound Sterling', value: 'gbp' },
	{ name: 'Canadian Dollar', value: 'cad' },
	{ name: 'Australian Dollar', value: 'aud' },
	{ name: 'New Zealand Dollar', value: 'nzd' },
	{ name: 'Swiss Franc', value: 'chf' },
	{ name: 'Japanese Yen', value: 'jpy' },
	{ name: 'Chinese Yuan', value: 'cny' },
	{ name: 'Hong Kong Dollar', value: 'hkd' },
]; //indo malay sgd asean

export const conversationOperation: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['conversation'],
			},
		},
		options: [
			{
				name: 'Resolve Conversation',
				value: 'resolveConversation',
				action: 'Resolve a conversation',
			},
			{
				name: 'Assign Label',
				value: 'assignLabel',
				action: 'Assign a label to a conversation',
			},
			{
				name: 'Remove Label',
				value: 'removeLabel',
				action: 'Remove a label from a conversation',
			},
			{
				name: 'Assign Agent',
				value: 'assignAgent',
				action: 'Assign a agent to a conversation',
			},
			{
				name: 'Add Collaborator',
				value: 'addCollaborator',
				action: 'Add a collaborator to a conversation',
			},
			{
				name: 'Change Stage Status',
				value: 'changeStageStatus',
				action: 'Change the stage status of a conversation',
			},
			{
				name: 'Set Pipeline Status',
				value: 'setPipelineStatus',
				action: 'Set the status of a pipeline',
			},
			{
				name: 'Block AI',
				value: 'blockAI',
				action: 'Block the AI from a conversation',
			},
			{
				name: 'Unblock AI',
				value: 'unblockAI',
				action: 'Unblock the AI from a conversation',
			},
			{
				name: 'Assign AI Agent',
				value: 'assignAiAgent',
				action: 'Assign the ai agent to conversation',
			},
		],
		default: 'assignAgent',
	},
];

export const conversationFields: INodeProperties[] = [
	// 📌 Digunakan oleh SEMUA operation
	{
		displayName: 'Choose AI Agent',
		name: 'agentId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getAIAgentsDropdown',
		},
		displayOptions: {
			show: {
				resource: ['conversation'],
				operation: ['assignAiAgent'],
			},
		},
		required: true,
		default: '',
		description: 'Select an AI agent to assign to the conversation',
	},
	{
		displayName: 'Keep Assigned Ai Agent on Resolve',
		name: 'keepAssigned',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['conversation'],
				operation: ['assignAiAgent'],
			},
		},
		required: true,
		default: [],
		description: 'Select True or False for Keep Assigned Ai Agent when Resolve',
	},
	// 📌 assignAgent & addCollaborator
	{
		displayName: 'Select Agent or Agent ID',
		name: 'agentId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getAgentsDropdown',
		},
		default: '',
		required: true,
		description: 'choose of the agent to assign or add as collaborator',
		displayOptions: {
			show: {
				resource: ['conversation'],
				operation: ['assignAgent', 'addCollaborator'],
			},
		},
	},

	// 📌 assignLabel & removeLabel only
	{
		displayName: 'Select Label or Label ID',
		name: 'labelId',

		type: 'options',
		default: '',
		required: true,
		typeOptions: {
			loadOptionsMethod: 'getLabelsDropdown',
		},
		description: 'choose of the Label to assign',
		displayOptions: {
			show: {
				resource: ['conversation'],
				operation: ['assignLabel', 'removeLabel'],
			},
		},
	},

	//currency and value
	// iso 4127 currency code options
	{
		displayName: 'Currency (Optional)',
		name: 'currency',
		type: 'options',
		options: allCurrencies,
		default: 'idr',
		required: false,
		description:
			'The currency of the value to be set. Only needed for Conversion API / Meta Pixel Purchase Event',
		displayOptions: {
			show: {
				resource: ['conversation'],
				operation: ['assignLabel'],
			},
		},
	},
	{
		displayName: 'Value (Optional)',
		name: 'value',
		type: 'number',
		default: 0,
		required: false,
		description: 'The value to be set. Only needed for Conversion API / Meta Pixel Purchase Event',
		displayOptions: {
			show: {
				resource: ['conversation'],
				operation: ['assignLabel'],
			},
		},
	},
	{
		displayName: 'Stage Status',
		name: 'stage_status',
		type: 'options',
		options: [
			{ name: 'Assigned', value: 'assigned' },
			{ name: 'Pending', value: 'pending' },
			{ name: 'Open', value: 'open' },
			{ name: 'Resolved', value: 'resolved' },
		],
		default: 'assigned',
		required: true,
		description: 'The stage status to change the conversation to',
		displayOptions: {
			show: {
				resource: ['conversation'],
				operation: ['changeStageStatus'],
			},
		},
	},
	{
		displayName: 'Select Pipeline or Pipeline ID',
		name: 'pipelineStatusId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getPipelinesDropdown',
		},
		default: '',
		required: true,
		description: 'The ID of the pipeline status to be set',
		displayOptions: {
			show: {
				resource: ['conversation'],
				operation: ['setPipelineStatus'],
			},
		},
	},
	{
		displayName: 'Conversation ID',
		name: 'conversationId',
		type: 'string',
		default: '',
		required: true,
		description: 'The ID of the conversation to apply the pipeline status to',
		displayOptions: {
			show: {
				resource: ['conversation'],
				operation: ['setPipelineStatus'],
			},
		},
	},
	{
		displayName: 'Conversation ID',
		name: 'conversationId',
		type: 'string',
		default: '',
		required: true,
		description: 'ID of the conversation',
		displayOptions: {
			show: {
				resource: ['conversation'],
				operation: [
					'resolveConversation',
					'assignLabel',
					'assignAgent',
					'addCollaborator',
					'changeStageStatus',
					'blockAI',
					'unblockAI',
					'removeLabel',
					'assignAiAgent',
				],
			},
		},
	},
];
