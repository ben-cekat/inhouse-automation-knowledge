import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { cekatApiRequest } from '../GenericFunctions';


export async function handleGetAllBoards(
	context: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData> {
	const response = await cekatApiRequest.call(
		context,
		'GET',
		'/api/crm/boards',
		{},
		{},
		'server',
	);

	return {
		json: {
			success: true,
			operation: 'getAllBoards',
			response,
		},
		pairedItem: i,
	};
}

export async function handleGetBoard(
	context: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData> {
	const boardId = context.getNodeParameter('boardId', i) as string;

	const response = await cekatApiRequest.call(
		context,
		'GET',
		`/api/crm/boards/${boardId}`,
		{},
		{},
		'server',
	);

	return {
		json: {
			success: true,
			operation: 'getBoard',
			boardId,
			response,
		},
		pairedItem: i,
	};
}

export async function handleGetAllItems(
	context: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData> {
	const boardId = context.getNodeParameter('boardId', i) as string;

	const response = await cekatApiRequest.call(
		context,
		'GET',
		`/api/crm/boards/${boardId}/items`,
		{},
		{},
		'server',
	);

	return {
		json: {
			success: true,
			operation: 'getAllItems',
			boardId,
			response,
		},
		pairedItem: i,
	};
}

export async function handleGetItem(
	context: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData> {
	const boardId = context.getNodeParameter('boardId', i) as string;
	const itemId = context.getNodeParameter('itemId', i) as string;

	const response = await cekatApiRequest.call(
		context,
		'GET',
		`/api/crm/boards/${boardId}/items/${itemId}`,
		{},
		{},
		'server',
	);

	return {
		json: {
			success: true,
			operation: 'getItem',
			boardId,
			itemId,
			response,
		},
		pairedItem: i,
	};
}
