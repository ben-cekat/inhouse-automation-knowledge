import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { cekatApiRequest } from '../../GenericFunctions';

export async function handleRemoveLabel(
	context: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData> {
	const conversationId = context.getNodeParameter('conversationId', i) as string;
	const labelId = context.getNodeParameter('labelId', i) as string;

	const body = {
		conversation_id: conversationId,
		label_id: labelId,
	};

	const response = await cekatApiRequest.call(
		context,
		'POST',
		'/business_workflows/labels/remove',
		body,
		{},
		'server',
	);

	return { json: response };
}
