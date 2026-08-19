import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { cekatApiRequest } from '../../GenericFunctions';

export async function handleUnblockAi(
	context: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData> {
	const conversationId = context.getNodeParameter('conversationId', i) as string;
	// const credentials = await context.getCredentials('CekatOpenApi');

	const body = { conversation_id: conversationId };

	const response = await cekatApiRequest.call(
		context,
		'POST',
		'/business_workflows/unblock-ai',
		body,
		'',
		'server',
	);

	return { json: response };
}
