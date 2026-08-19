import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { cekatApiRequest } from '../../GenericFunctions';
// import { processCreateItemColumns } from '../../description/ActionCRMDescription';

export async function handleCreateItem(
	context: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData> {
	const boardId = context.getNodeParameter('boardId', i) as string;
	const groupId = context.getNodeParameter('groupId', i, '') as string;
	const itemName = context.getNodeParameter('itemName', i, '') as string;

	// PERBAIKAN: Ambil pre-processed columns dari items[i].json
	const inputData = context.getInputData();
	const formattedColumns = (inputData[i].json.formattedColumns as Record<string, any>) || {};

	console.log('=== CREATE ITEM DEBUG ===');
	console.log('boardId:', boardId);
	console.log('groupId:', groupId);
	console.log('itemName:', itemName);
	console.log('formattedColumns:', JSON.stringify(formattedColumns, null, 2));

	// Build request body dengan pre-processed data
	const requestBody: any = {
		...formattedColumns, // Gunakan data yang sudah diformat di execute()
	};

	// Tambahkan required fields
	if (itemName) {
		requestBody.item_name = itemName;
	}
	if (groupId) {
		requestBody.group_id = groupId;
	}

	console.log('Final requestBody:', JSON.stringify(requestBody, null, 2));

	const response = await cekatApiRequest.call(
		context,
		'POST',
		`/api/crm/boards/${boardId}/items`,
		requestBody,
		{},
		'server',
	);

	return {
		json: {
			success: true,
			operation: 'createItem',
			boardId,
			itemName,
			groupId,
			columnsCount: Object.keys(formattedColumns).length,
			requestBody,
			response,
		},
		pairedItem: i,
	};
}

export async function handleUpdateItem(
	context: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData> {
	const boardId = context.getNodeParameter('boardId', i) as string;
	const itemId = context.getNodeParameter('itemId', i) as string;

	// PERBAIKAN: Ambil pre-processed columns dari items[i].json
	const inputData = context.getInputData();
	const formattedColumns = (inputData[i].json.formattedColumns as Record<string, any>) || {};

	console.log('=== UPDATE ITEM DEBUG ===');
	console.log('boardId:', boardId);
	console.log('itemId:', itemId);
	console.log('formattedColumns:', JSON.stringify(formattedColumns, null, 2));

	// Gunakan pre-processed data sebagai request body
	const requestBody = { ...formattedColumns };

	console.log('Final requestBody:', JSON.stringify(requestBody, null, 2));

	const response = await cekatApiRequest.call(
		context,
		'PUT',
		`/api/crm/boards/${boardId}/items/${itemId}`,
		requestBody,
		{},
		'server',
	);

	return {
		json: {
			success: true,
			operation: 'updateItem',
			boardId,
			itemId,
			columnsCount: Object.keys(formattedColumns).length,
			updatedFields: requestBody,
			response,
		},
		pairedItem: i,
	};
}

// Delete handler tetap sama karena tidak memerlukan column processing
export async function handleDeleteItems(
	context: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData> {
	const boardId = context.getNodeParameter('boardId', i) as string;
	const itemIds = context.getNodeParameter('itemIds', i) as string[];
	const confirmDelete = context.getNodeParameter('confirmDelete', i) as boolean;

	if (!confirmDelete) {
		return {
			json: {
				success: false,
				message: 'Deletion not confirmed. Please check the confirmation checkbox.',
				operation: 'deleteItems',
			},
			pairedItem: i,
		};
	}

	if (!itemIds || itemIds.length === 0) {
		return {
			json: {
				success: false,
				message: 'No valid item IDs provided',
				operation: 'deleteItems',
			},
			pairedItem: i,
		};
	}

	try {
		const response = await cekatApiRequest.call(
			context,
			'DELETE',
			`/api/crm/boards/${boardId}/items`,
			{ item_ids: itemIds },
			{},
			'server',
		);

		return {
			json: {
				success: true,
				operation: 'deleteItems',
				boardId,
				totalItems: itemIds.length,
				itemIds,
				response,
			},
			pairedItem: i,
		};
	} catch (error) {
		return {
			json: {
				success: false,
				operation: 'deleteItems',
				boardId,
				itemIds,
				error: (error as Error).message,
			},
			pairedItem: i,
		};
	}
}
