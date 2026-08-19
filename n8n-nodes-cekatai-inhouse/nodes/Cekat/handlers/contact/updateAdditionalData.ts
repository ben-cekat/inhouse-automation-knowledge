import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { cekatApiRequest } from '../../GenericFunctions';

export async function handleUpdateAdditionalData(
	context: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData> {
	const contactId = context.getNodeParameter('contactId', i) as string;

	const additionalData = context.getNodeParameter('additionalData', i, {}) as {
		data?: { key: string; value: string }[];
	};
	const bodyAdditionalData = Array.isArray(additionalData.data)
		? additionalData.data.reduce(
				(acc, { key, value }) => {
					if (key) acc[key] = value;
					return acc;
				},
				{} as Record<string, string>,
			)
		: {};

	const body = {
		contact_id: contactId,
		additional_data: bodyAdditionalData,
	};

	const response = await cekatApiRequest.call(
		context,
		'POST',
		'/business_workflows/additional-data',
		body,
		{},
		'server',
	);

	return {
		json: response,
	};
}
