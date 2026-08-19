import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { cekatApiRequest } from '../../GenericFunctions';

export async function handleSubscribeWebhook(
	context: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData> {
	const webhookUrl = context.getNodeParameter('webhookUrl', i) as string;
	const inboxId = context.getNodeParameter('inboxId', i) as string;
	const events = context.getNodeParameter('events', i) as string[];

	const body = {
		webhookUrl,
		inboxId,
		events,
	};

	const response = await cekatApiRequest.call(
		context,
		'POST',
		'/business_workflows/webhooks/subscribe',
		body,
		{},
		'server',
	);

	return {
		json: response,
	};
}
