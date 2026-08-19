import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { cekatApiRequest } from '../../GenericFunctions';
export async function handleLookup(
	context: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData> {
	const operation = context.getNodeParameter('operation', i) as string;

	console.log(`Executing lookup operation: ${operation}`);

	switch (operation) {
		case 'getMessages': {
			const conversationId = context.getNodeParameter('conversationId', i) as string;
			const res = await cekatApiRequest.call(
				context,
				'GET',
				`/business_workflows/conversation-messages`,
				{},
				{ conversation_id: conversationId },
				'server',
			);
			return { json: res };
		}

		case 'getAllTemplates': {
			const inboxId = context.getNodeParameter('inboxId', i) as string;
			const res = await cekatApiRequest.call(
				context,
				'GET',
				'/templates',
				{},
				{ inbox_id: inboxId },
				'api',
			);
			return { json: res };
		}

		case 'getLabels': {
			const res = await cekatApiRequest.call(
				context,
				'GET',
				'/business_workflows/labels',
				{},
				{},
				'server',
			);
			return { json: res };
		}

		case 'getInboxes': {
			const res = await cekatApiRequest.call(
				context,
				'GET',
				'/business_workflows/inboxes',
				{},
				{},
				'server',
			);
			return { json: res };
		}

		case 'getAgents': {
			const res = await cekatApiRequest.call(
				context,
				'GET',
				'/business_workflows/agents',
				{},
				{},
				'server',
			);
			return { json: res };
		}

		case 'getContact': {
			const phone_number = context.getNodeParameter('phoneNumber', i) as string;
			const res = await cekatApiRequest.call(
				context,
				'GET',
				'/business_workflows/contact',
				{},
				{ phone_number: phone_number },
				'server',
			);
			return { json: res };
		}

		case 'getPipelineStatuses': {
			const res = await cekatApiRequest.call(
				context,
				'GET',
				'/business_workflows/pipeline-status',
				{},
				{},
				'server',
			);
			return { json: res };
		}

		case 'getSubscribedWebhooks': {
			const res = await cekatApiRequest.call(
				context,
				'GET',
				'/business_workflows/webhooks',
				{},
				{},
				'server',
			);
			return { json: res };
		}

		default:
			throw new Error(`Unsupported lookup operation: ${operation}`);
	}
}
