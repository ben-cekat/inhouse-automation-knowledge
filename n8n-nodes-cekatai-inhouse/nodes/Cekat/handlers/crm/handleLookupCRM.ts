import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { cekatApiRequest } from '../../GenericFunctions';

export async function handleGetAllBoards(
	context: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData> {
	const response = await cekatApiRequest.call(context, 'GET', '/api/crm/boards', {}, {}, 'server');

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

export async function handleSearchItems(
	context: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData> {
	const boardId = context.getNodeParameter('boardId', i) as string;
	const searchInputMethod = context.getNodeParameter('searchInputMethod', i, 'manual') as string;
	const condition = context.getNodeParameter('condition', i, 'AND') as string;

	let searchConditions: any[] = [];

	if (searchInputMethod === 'dynamic') {
		// Handle dynamic search data from previous node
		const dynamicSearchData = context.getNodeParameter('dynamicSearchData', i) as string;

		try {
			if (typeof dynamicSearchData === 'string') {
				searchConditions = JSON.parse(dynamicSearchData);
			} else {
				searchConditions = dynamicSearchData as any[];
			}

			if (!Array.isArray(searchConditions)) {
				throw new Error('Dynamic search data must be an array');
			}
		} catch (error) {
			throw new Error(`Error parsing dynamic search data: ${error.message}`);
		}
	} else {
		// Handle manual search conditions
		const searchConditionsInput = context.getNodeParameter('searchConditions', i) as {
			condition: any[];
		};

		if (searchConditionsInput.condition && Array.isArray(searchConditionsInput.condition)) {
			searchConditions = searchConditionsInput.condition.map((cond: any) => ({
				column_name: cond.column_name,
				operator: cond.operator,
				value: cond.value || '', // Handle empty values for operators like is_empty
			}));
		}
	}

	// Validate search conditions
	if (!searchConditions || searchConditions.length === 0) {
		throw new Error('At least one search condition is required');
	}

	// Validate each condition
	for (const cond of searchConditions) {
		if (!cond.column_name || !cond.operator) {
			throw new Error('Each search condition must have column_name and operator');
		}

		// Check if value is required for this operator
		const operatorsWithoutValue = ['is_empty', 'is_not_empty'];
		if (
			!operatorsWithoutValue.includes(cond.operator) &&
			(cond.value === undefined || cond.value === '')
		) {
			throw new Error(`Operator "${cond.operator}" requires a value`);
		}
	}

	// Build request body
	const requestBody = {
		condition,
		search: searchConditions,
	};

	console.log('Search request body:', JSON.stringify(requestBody, null, 2));

	const response = await cekatApiRequest.call(
		context,
		'POST',
		`/api/crm/boards/${boardId}/items/search`,
		requestBody,
		{},
		'server',
	);

	return {
		json: {
			success: true,
			operation: 'searchItems',
			boardId,
			searchConditions: searchConditions.length,
			condition,
			response,
		},
		pairedItem: i,
	};
}
