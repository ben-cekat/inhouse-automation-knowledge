import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { cekatApiRequest } from '../../GenericFunctions';

export async function handleChangeStageStatus(
	context: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData> {
	const conversationId = context.getNodeParameter('conversationId', i) as string;
	const stage_status = context.getNodeParameter('stage_status', i) as string;
	// const credentials = await context.getCredentials('CekatOpenApi');

	const body = {
		conversation_id: conversationId,
		stage_status: stage_status,
	};

	const response = await cekatApiRequest.call(
		context,
		'POST',
		'/business_workflows/conversation-status',
		body,
		'',
		'server',
	);

	return { json: response };
}
