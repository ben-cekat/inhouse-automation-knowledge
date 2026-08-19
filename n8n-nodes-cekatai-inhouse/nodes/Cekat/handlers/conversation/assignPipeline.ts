import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { cekatApiRequest } from '../../GenericFunctions';

export async function handleSetPipelineStatus(
	context: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData> {
	const pipelineStatusId = context.getNodeParameter('pipelineStatusId', i) as string;
	const conversationId = context.getNodeParameter('conversationId', i) as string;

	const body = {
		pipeline_status_id: pipelineStatusId,
		conversation_id: conversationId,
	};

	const response = await cekatApiRequest.call(
		context,
		'POST',
		'/business_workflows/pipeline-status',
		body,
		{},
		'server',
	);

	return {
		json: response,
	};
}
