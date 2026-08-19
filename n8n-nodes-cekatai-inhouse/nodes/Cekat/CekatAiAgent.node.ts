import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { cekatApiRequest } from './GenericFunctions';
import * as options from './methods';

export class CekatAiAgent implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cekat AI Agent',
		name: 'cekatAiAgent',
		group: ['transform'],
		version: 1,
		description: 'Send messages to a Cekat AI Agent and receive response',
		defaults: {
			name: 'Cekat AI Agent',
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
				displayName: 'AI Agent',
				name: 'ai_agent_id',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getAIAgentsDropdown',
				},
				required: true,
				default: '',
			},
			{
				displayName: 'Messages',
				name: 'messages',
				type: 'json',
				default: `[
		  {
		    "id": 1,
		    "message": "hi",
		    "sent_by_type": "user",
		    "created_at": "2025-10-23T08:49:40.781Z"
		  }
		]`,
				required: true,
				description: 'Array of message objects to send to the AI agent',
			},
		],
	};

	methods = {
		loadOptions: {
			getAIAgentsDropdown: options.getAIAgentsDropdown,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const aiAgentId = this.getNodeParameter('ai_agent_id', i) as string;
			const messagesParam = this.getNodeParameter('messages', i) as string | any[];
			let messages: any[] = [];
			if (typeof messagesParam === 'string') {
				messages = JSON.parse(messagesParam);
			} else {
				messages = messagesParam as any[];
			}

			const body = {
				ai_agent_id: aiAgentId,
				messages,
			} as any;

			const response = await cekatApiRequest.call(
				this,
				'POST',
				'/api/ai_response/beta',
				body,
				{},
				'api',
			);

			returnData.push({ json: response, pairedItem: i });
		}

		return [returnData];
	}
}
