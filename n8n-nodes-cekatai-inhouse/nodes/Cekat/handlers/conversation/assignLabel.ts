import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { cekatApiRequest } from '../../GenericFunctions';

export async function handleAssignLabel(
	context: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData> {
	const conversationId = context.getNodeParameter('conversationId', i) as string;
	const labelId = context.getNodeParameter('labelId', i) as string;
	const currency = context.getNodeParameter('currency', i) as string;
	const value = context.getNodeParameter('value', i) as number;

	const body = {
		conversation_id: conversationId,
		label_id: labelId,
		currency: currency,
		value: value,
	};

	const response = await cekatApiRequest.call(
		context,
		'POST',
		'/business_workflows/labels',
		body,
		{},
		'server',
	);

	return { json: response };
}
