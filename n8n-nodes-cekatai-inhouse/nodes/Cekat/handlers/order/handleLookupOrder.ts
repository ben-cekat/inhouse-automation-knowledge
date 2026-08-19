import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { cekatApiRequest } from '../../GenericFunctions';

export async function handleGetAllOrders(
	context: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData> {
	const response = await cekatApiRequest.call(context, 'GET', '/api/orders', {}, {}, 'server');

	return {
		json: {
			success: true,
			operation: 'getAllOrders',
			response,
		},
		pairedItem: i,
	};
}

export async function handleGetOrder(
	context: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData> {
	const orderId = context.getNodeParameter('orderId', i) as string;

	const response = await cekatApiRequest.call(
		context,
		'GET',
		`/api/orders/${orderId}`,
		{},
		{},
		'server',
	);

	return {
		json: {
			success: true,
			operation: 'getOrder',
			orderId,
			response,
		},
		pairedItem: i,
	};
}

export async function handleUpdateOrder(
	context: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData> {
	const orderId = context.getNodeParameter('orderId', i) as string;

	const response = await cekatApiRequest.call(
		context,
		'PUT',
		`/api/orders/${orderId}`,
		{},
		{},
		'server',
	);

	return {
		json: {
			success: true,
			operation: 'updateOrder',
			orderId,
			response,
		},
		pairedItem: i,
	};
}
