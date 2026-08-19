import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

// import { cekatApiRequest } from './GenericFunctions';
import { messageOperations, messageFields, templateFields } from './description/MessageDescription';

import * as options from './methods';
import { conversationFields, conversationOperation } from './description/ConversationDescription';
import { lookupFields, lookupOperation } from './description/LookupDescription';
import { contactFields, contactOperation } from './description/ContactDescription';
import { webhookFields, webhookOperation } from './description/WebhookDescription';
import { handlers } from './handlers';

export class Cekat implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cekat Chat',
		name: 'cekat',
		group: ['transform'],
		version: 1,
		description: 'Interact with Cekat Chat API',
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		defaults: {
			name: 'Cekat',
		},
		inputs: ['main' as any],
		outputs: ['main' as any],
		icon: 'file:cekat.svg',
		credentials: [
			{
				name: 'CekatOpenApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				options: [
					{ name: 'Lookup', value: 'lookup' },
					{ name: 'Contact', value: 'contact' },
					{ name: 'Webhook', value: 'webhook' },
					{ name: 'Conversation', value: 'conversation' },
					{ name: 'Message', value: 'message' },
				],
				default: [],
			},

			//lookup operations && fields
			...lookupOperation,
			...lookupFields,
			//contact operations && fields
			...contactOperation,
			...contactFields,

			//webhook operations && fields
			...webhookOperation,
			...webhookFields,

			//conversation operations && fields
			...conversationOperation,
			...conversationFields,

			//message operations && fields
			...messageOperations,
			...messageFields,
			...templateFields,
		],
	};

	methods = {
		loadOptions: {
			getAIAgentsDropdown: options.getAIAgentsDropdown,
			getInboxes: options.getInboxes,
			getTemplates: options.getTemplates,
			getAgentsDropdown: options.getAgentsDropdown,
			getLabelsDropdown: options.getLabelsDropdown,
			getPipelinesDropdown: options.getPipelinesDropdown,
			getInboxesDropdown: options.getInboxesDropdown,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				const key = `${resource}:${operation}`;

				const handler = handlers[key];

				if (!handler) {
					throw new Error(`No handler registered for resource:operation "${key}"`);
				}

				const result = await handler(this, i);
				returnData.push(result);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: i });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
