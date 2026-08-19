import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	ApplicationError,
} from 'n8n-workflow';

import * as options from './methods/orderMethods';
import { handlers } from './handlers';
import { lookupOrderFields, lookupOrderOperation } from './description/LookupOrderDescription';
import { actionOrderFields, actionOrderOperation } from './description/ActionOrderDescription';

export class CekatOrder implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cekat Order',
		name: 'cekatOrder',
		group: ['transform'],
		version: 1,
		description: 'Interact with Cekat Order API untuk mengelola order data',
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		defaults: {
			name: 'Cekat Order',
		},
		inputs: ['main' as any],
		outputs: ['main' as any],
		icon: 'file:cekat.svg',
		credentials: [
			{
				name: 'CekatOpenApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Lookup', value: 'lookup' },
					{ name: 'Action', value: 'action' },
				],
				default: 'lookup',
			},
			// Lookup operations
			...lookupOrderOperation,
			...lookupOrderFields,
			// Action operations
			...actionOrderOperation,
			...actionOrderFields,
		],
	};

	methods = {
		loadOptions: {
			getOrders: options.getOrders,
			getContacts: options.getContacts,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				console.log(`=== Processing Item ${i}: ${resource}:${operation} ===`);

				// // Process column data based on operation before calling handler
				// if (operation === 'createItem') {
				// 	console.log('Processing createItem columns...');

				// 	// Try multiple methods to get columns data
				// 	let columns: any[] = [];

				// 	try {
				// 		// Method 1: Direct path
				// 		columns = this.getNodeParameter('columns.column', i, []) as any[];
				// 		console.log('Method 1 (columns.column) result:', JSON.stringify(columns, null, 2));
				// 	} catch (error) {
				// 		console.log('Method 1 failed:', error.message);

				// 		try {
				// 			// Method 2: Fallback to columns object
				// 			const columnsObj = this.getNodeParameter('columns', i, {}) as any;
				// 			columns = columnsObj.column || [];
				// 			console.log('Method 2 (columns object) result:', JSON.stringify(columns, null, 2));
				// 		} catch (error2) {
				// 			console.log('Method 2 also failed:', error2.message);
				// 		}
				// 	}

				// 	console.log(`Found ${columns.length} columns to process`);

				// 	if (columns.length > 0) {
				// 		const formattedColumns = processCreateItemColumns(columns);
				// 		console.log('Formatted columns result:', JSON.stringify(formattedColumns, null, 2));

				// 		// Store formatted columns for handler to access
				// 		items[i].json.formattedColumns = formattedColumns;
				// 	} else {
				// 		console.log('No columns data found, setting empty formattedColumns');
				// 		items[i].json.formattedColumns = {};
				// 	}

				// } else if (operation === 'updateItem') {
				// 	console.log('Processing updateItem columns...');

				// 	let columns: any[] = [];

				// 	try {
				// 		columns = this.getNodeParameter('columns.column', i, []) as any[];
				// 		console.log('Update columns data:', JSON.stringify(columns, null, 2));
				// 	} catch (error) {
				// 		console.log('Failed to get update columns:', error.message);

				// 		try {
				// 			const columnsObj = this.getNodeParameter('columns', i, {}) as any;
				// 			columns = columnsObj.column || [];
				// 		} catch (error2) {
				// 			console.log('Fallback method also failed for update:', error2.message);
				// 		}
				// 	}

				// 	console.log(`Found ${columns.length} columns to update`);

				// 	if (columns.length > 0) {
				// 		const formattedColumns = processCreateItemColumns(columns); // Reuse same function
				// 		console.log('Formatted update columns result:', JSON.stringify(formattedColumns, null, 2));

				// 		items[i].json.formattedColumns = formattedColumns;
				// 	} else {
				// 		console.log('No update columns data found, setting empty formattedColumns');
				// 		items[i].json.formattedColumns = {};
				// 	}
				// }

				// Call the appropriate handler
				const key = `${resource}:${operation}`;
				const handler = handlers[key];

				if (!handler) {
					throw new ApplicationError(`No handler registered for resource:operation "${key}"`);
				}

				console.log(`Calling handler for ${key}...`);
				const result = await handler(this, i);
				console.log(`Handler ${key} completed successfully`);

				returnData.push(result);
			} catch (error) {
				console.error(`Error processing item ${i}:`, error);

				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
							item: i,
							resource: this.getNodeParameter('resource', i, ''),
							operation: this.getNodeParameter('operation', i, ''),
							timestamp: new Date().toISOString(),
						},
						pairedItem: i,
					});
					continue;
				}
				throw error;
			}
		}

		console.log(
			`=== Execution completed: ${returnData.length}/${items.length} items processed ===`,
		);
		return [returnData];
	}
}
