// ✅ CLEAN: Simple helper untuk handle column values
export function processAllColumnData(params: {
	// JSON approach (power users)
	columnValuesJson?: string;
	updateColumnValuesJson?: string;
	
	// Type-specific approaches (user-friendly)
	textColumns?: any[];
	numberColumns?: any[];
	dateColumns?: any[];
	selectColumns?: any[];
	agentColumns?: any[];
	
	// Update versions
	updateTextColumns?: any[];
	updateNumberColumns?: any[];
	updateDateColumns?: any[];
	updateSelectColumns?: any[];
	updateAgentColumns?: any[];
}): Record<string, any> {
	const processedValues: Record<string, any> = {};

	// APPROACH 1: Parse JSON values
	const jsonInputs = [params.columnValuesJson, params.updateColumnValuesJson];
	for (const jsonInput of jsonInputs) {
		if (jsonInput && jsonInput !== '{}') {
			try {
				const jsonValues = JSON.parse(jsonInput);
				if (typeof jsonValues === 'object' && jsonValues !== null) {
					Object.assign(processedValues, jsonValues);
				}
			} catch (error) {
				console.error('Error parsing JSON column values:', error);
			}
		}
	}

	// APPROACH 2: Process type-specific collections
	const collections = [
		{ data: params.textColumns || params.updateTextColumns, type: 'text' },
		{ data: params.numberColumns || params.updateNumberColumns, type: 'number' },
		{ data: params.dateColumns || params.updateDateColumns, type: 'date' },
		{ data: params.selectColumns || params.updateSelectColumns, type: 'select' },
		{ data: params.agentColumns || params.updateAgentColumns, type: 'agent' },
	];

	for (const collection of collections) {
		if (collection.data && Array.isArray(collection.data)) {
			for (const item of collection.data) {
				if (item.columnId && item.value !== undefined && item.value !== '') {
					processedValues[item.columnId] = processValue(item.value, collection.type);
				}
			}
		}
	}

	return processedValues;
}

// ✅ SIMPLE: Process single value based on type
function processValue(value: any, type: string): any {
	switch (type) {
		case 'text':
			return String(value || '').trim();
		
		case 'number':
			const numValue = Number(value);
			return isNaN(numValue) ? 0 : numValue;
		
		case 'date':
			if (!value) return '';
			if (value instanceof Date) {
				return value.toISOString().split('T')[0];
			}
			if (typeof value === 'string' && value.includes('T')) {
				return value.split('T')[0];
			}
			return String(value);
		
		case 'select':
		case 'agent':
			return String(value || '');
		
		default:
			return String(value || '').trim();
	}
}

// ✅ SIMPLE: Build API requests
export function buildCreateItemRequest(params: {
	boardId: string;
	groupId?: string;
	itemName: string;
	columnValues: Record<string, any>;
}): any {
	const requestBody: any = {
		board_id: params.boardId,
		item_name: params.itemName,
		column_values: params.columnValues,
	};

	if (params.groupId) {
		requestBody.group_id = params.groupId;
	}

	return requestBody;
}

export function buildUpdateItemRequest(params: {
	boardId: string;
	itemId: string;
	columnValues: Record<string, any>;
}): any {
	return {
		board_id: params.boardId,
		item_id: params.itemId,
		column_values: params.columnValues,
	};
}

export function processColumnValuesWithTypeDetection(
	columnValues: any[], 
	columnTypeMap: Record<string, string>
): Record<string, any> {
	const processedValues: Record<string, any> = {};

	for (const item of columnValues) {
		if (item.columnId && item.value !== undefined && item.value !== '') {
			const columnType = columnTypeMap[item.columnId];
			let processedValue = item.value;

			// Auto-convert based on column type
			switch (columnType) {
				case 'text':
				case 'email':
					processedValue = String(item.value).trim();
					break;
				
				case 'number':
					processedValue = Number(item.value) || 0;
					break;
				
				case 'date':
					if (item.value instanceof Date) {
						processedValue = item.value.toISOString().split('T')[0];
					} else if (typeof item.value === 'string' && item.value.includes('T')) {
						processedValue = item.value.split('T')[0];
					} else {
						processedValue = String(item.value);
					}
					break;
				
				case 'select':
				case 'dropdown':
					processedValue = String(item.value);
					break;
				
				case 'agents':
					processedValue = String(item.value);
					break;
				
				default:
					processedValue = String(item.value).trim();
					break;
			}

			processedValues[item.columnId] = processedValue;
		}
	}

	return processedValues;
}
