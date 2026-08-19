import { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { cekatApiRequest } from './GenericFunctions';

// Existing functions...
export async function getInboxes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const credentials = await this.getCredentials('CekatOpenApi');
	if (!credentials || !credentials.apiKey) {
		throw new Error('No Cekat API Key credentials found!');
	}
	const apiKey = credentials.apiKey as string;
	const data = await cekatApiRequest.call(
		this,
		'GET',
		'/inboxes',
		{},
		{
			api_key: apiKey,
		},
		'api',
	);

	return data.data.map(
		(inbox: { id: string; name: string; type: string; phone_number: string }) => ({
			name:
				inbox.name +
				(inbox.type
					? ` (${inbox.type}${inbox.phone_number ? ` - ${inbox.phone_number}` : ''})`
					: ''),
			value: inbox.id,
		}),
	);
}

export async function loadTemplateVariables(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const credentials = await this.getCredentials('CekatOpenApi');
	if (!credentials || !credentials.apiKey) {
		throw new Error('No Cekat API Key credentials found!');
	}
	const apiKey = credentials.apiKey as string;

	const inboxId = this.getNodeParameter('inboxId') as string;

	const data = await cekatApiRequest.call(
		this,
		'GET',
		'/templates',
		{ inbox_id: inboxId },
		{ api_key: apiKey },
		'api',
	);

	return data.data.map((template: { id: string; name: string }) => ({
		name: template.name,
		value: template.id,
	}));
}

export async function getTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const credentials = await this.getCredentials('CekatOpenApi');
	if (!credentials || !credentials.apiKey) {
		throw new Error('No Cekat API Key credentials found!');
	}

	// Get inboxId from current node parameters
	const inboxId = this.getCurrentNodeParameter('inboxId') as string;

	if (!inboxId) {
		return [];
	}

	console.log('Getting templates for inboxId:', inboxId);

	const data = await cekatApiRequest.call(
		this,
		'GET',
		'/templates',
		{},
		{ inbox_id: inboxId },
		'api',
	);

	console.log('Templates response:', data);

	return data.data.map((template: { id: string; name: string }) => ({
		name: template.name,
		value: template.id,
	}));
}

export async function getAgentsDropdown(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const res = await cekatApiRequest.call(
		this,
		'GET',
		'/business_workflows/agents',
		{},
		{},
		'server',
	);

	return res.map((agent: { id: string; name: string }) => ({
		name: agent.name,
		value: agent.id,
	}));
}

export async function getAIAgentsDropdown(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const res = await cekatApiRequest.call(
		this,
		'GET',
		'/business_workflows/ai-agents',
		{},
		{},
		'server',
	);

	return res.map((agent: { id: string; name: string }) => ({
		name: agent.name,
		value: agent.id,
	}));
}

export async function getLabelsDropdown(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const res = await cekatApiRequest.call(
		this,
		'GET',
		'/business_workflows/labels',
		{},
		{},
		'server',
	);

	return res.map((labels: { id: string; name: string }) => ({
		name: labels.name,
		value: labels.id,
	}));
}

export async function getPipelinesDropdown(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const res = await cekatApiRequest.call(
		this,
		'GET',
		'/business_workflows/pipeline-status',
		{},
		{},
		'server',
	);

	return res.map((pipelines: { id: string; name: string; color: string }) => ({
		name: pipelines.name,
		value: pipelines.id,
		color: pipelines.color,
	}));
}

export async function getInboxesDropdown(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const res = await cekatApiRequest.call(
		this,
		'GET',
		'/business_workflows/inboxes',
		{},
		{},
		'server',
	);

	return res.map((inbox: { id: string; name: string }) => ({
		name: inbox.name,
		value: inbox.id,
	}));
}

// CRM BOARDS - Updated dengan pattern existing
export async function getBoards(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	try {
		const res = await cekatApiRequest.call(this, 'GET', '/api/crm/boards', {}, {}, 'server');

		console.log('getBoards response:', JSON.stringify(res, null, 2));

		if (res.message === 'success' && res.data) {
			if (Array.isArray(res.data)) {
				return res.data.map((board: { id: string; name: string; column_name?: string }) => ({
					name: board.column_name ? `${board.name} (${board.column_name})` : board.name,
					value: board.id,
				}));
			} else {
				const board = res.data;
				return [
					{
						name: board.column_name ? `${board.name} (${board.column_name})` : board.name,
						value: board.id,
					},
				];
			}
		}

		if (res.boards && Array.isArray(res.boards)) {
			return res.boards.map((board: { id: string; name: string; column_name?: string }) => ({
				name: board.column_name ? `${board.name} (${board.column_name})` : board.name,
				value: board.id,
			}));
		}

		console.log('No valid board data found in response');
		return [];
	} catch (error) {
		console.error('Error in getBoards:', error);
		return [];
	}
}

// CRM GROUPS - Load groups berdasarkan board
export async function getGroups(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	try {
		const boardId = this.getNodeParameter('boardId', 0) as string;

		if (!boardId) {
			console.log('getGroups called without boardId');
			return [];
		}

		const res = await cekatApiRequest.call(
			this,
			'GET',
			`/api/crm/boards/${boardId}`,
			{},
			{},
			'server',
		);

		console.log('getGroups response for boardId:', boardId);

		if (res.message === 'success' && res.data?.crm_groups) {
			return res.data.crm_groups.map((group: { id: string; name: string; color?: string }) => ({
				name: group.name,
				value: group.id,
				description: group.color ? `Color: ${group.color}` : undefined,
			}));
		}

		return [];
	} catch (error) {
		console.error('Error in getGroups:', error);
		return [];
	}
}

// CRM ITEMS - Load items berdasarkan board
export async function getItems(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	try {
		const boardId = this.getNodeParameter('boardId', 0) as string;

		if (!boardId) {
			console.log('getItems called without boardId');
			return [];
		}

		const res = await cekatApiRequest.call(
			this,
			'GET',
			`/api/crm/boards/${boardId}/items`,
			{},
			{},
			'server',
		);

		console.log('getItems response:', JSON.stringify(res, null, 2));

		if (res.message === 'success' && Array.isArray(res.data)) {
			return res.data.map((item: any) => ({
				name: item.item_name || item.name || 'Unknown Item',
				value: item.item_id || item.id,
			}));
		}

		if (Array.isArray(res)) {
			return res.map((item: any) => ({
				name: item.item_name || item.name || 'Unknown Item',
				value: item.item_id || item.id,
			}));
		}

		console.log('No valid items found in response');
		return [];
	} catch (error) {
		console.error('Error in getItems:', error);
		return [];
	}
}

// DYNAMIC BOARD COLUMNS - Fungsi utama untuk dynamic fields
export async function getBoardColumns(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	try {
		const boardId = this.getNodeParameter('boardId', 0) as string;

		if (!boardId) {
			console.log('getBoardColumns called without boardId');
			return [];
		}

		console.log('Getting columns for boardId:', boardId);

		const res = await cekatApiRequest.call(
			this,
			'GET',
			`/api/crm/boards/${boardId}`,
			{},
			{},
			'server',
		);

		console.log('getBoardColumns response:', JSON.stringify(res, null, 2));

		if (res.message === 'success' && res.data?.crm_columns) {
			return res.data.crm_columns
				.filter(
					// (column: any) => !column.read_only && column.is_visible && column.type !== 'timeline',
					(column: any) => column.type !== 'timeline',
				)
				.map(
					(column: {
						id: string;
						name: string;
						type: string;
						settings?: any;
						is_required?: boolean;
					}) => {
						let displayName = column.name;

						if (column.type) {
							displayName += ` (${column.type})`;
						}
						if (column.type === 'number' && column.settings?.unit) {
							displayName += ` [${column.settings.unit}]`;
						}
						if (column.is_required) {
							displayName += ' *';
						}

						return {
							name: displayName,
							value: column.name,
							description: `Column: ${column.name} | Type: ${column.type}`,
						};
					},
				);
		}

		console.log('No valid columns found in response for boardId:', boardId);
		return [];
	} catch (error) {
		console.error('Error in getBoardColumns:', error);
		return [];
	}
}

// Load stage options untuk dropdown Stage (jika ada)
export async function getStageOptions(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	try {
		const boardId = this.getNodeParameter('boardId', 0) as string;

		if (!boardId) return [];

		const res = await cekatApiRequest.call(
			this,
			'GET',
			`/api/crm/boards/${boardId}`,
			{},
			{},
			'server',
		);

		if (res.message === 'success' && res.data?.crm_columns) {
			const stageColumn = res.data.crm_columns.find(
				(col: any) => col.name.toLowerCase().includes('stage') && col.type === 'select',
			);

			if (stageColumn?.settings?.labels) {
				return stageColumn.settings.labels
					// .filter((label: any) => label.id !== 'default')
					.map((label: any) => ({
						name: label.name,
						value: label.id,
						description: `Stage: ${label.name}`,
					}));
			}
		}

		return [];
	} catch (error) {
		console.error('Error loading stage options:', error);
		return [];
	}
}

export async function getSelectColumnOptions(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	try {
		const boardId = this.getNodeParameter('boardId', 0) as string;

		// Cara yang benar untuk mengakses columnName dari fixedCollection
		let columnName = '';

		// Method 1: Coba akses dari parameter context
		try {
			// Dalam konteks loadOptions untuk fixedCollection, kita perlu mengakses dari collection yang sedang aktif
			const columnsCollection = this.getNodeParameter('columns', 0) as any;
			console.log('Columns collection:', JSON.stringify(columnsCollection, null, 2));

			// Akses berdasarkan struktur fixedCollection: columns.column[index].columnName
			if (columnsCollection.column && Array.isArray(columnsCollection.column)) {
				// Ambil dari row terakhir yang sedang di-edit (biasanya yang paling baru)
				const lastIndex = columnsCollection.column.length - 1;
				if (lastIndex >= 0) {
					columnName = columnsCollection.column[lastIndex]?.columnName || '';
				}
			}
		} catch (error) {
			console.log('Method 1 failed, trying alternative approach:', error.message);
		}

		// Method 2: Jika masih kosong, coba dengan cara yang berbeda
		if (!columnName) {
			try {
				// Coba akses langsung dengan path
				columnName = this.getNodeParameter('columns.column.columnName', 0) as string;
			} catch (error) {
				console.log('Method 2 failed:', error.message);
			}
		}

		// Method 3: Fallback - ambil dari node parameters secara manual
		if (!columnName) {
			try {
				// const allParams = this.getNode().parameters;
				// console.log('All node parameters:', JSON.stringify(allParams, null, 2));
				// Implementasi manual parsing jika diperlukan
			} catch (error) {
				console.log('Method 3 failed:', error.message);
			}
		}

		console.log('getSelectColumnOptions called');
		console.log('boardId:', boardId);
		console.log('columnName:', columnName);

		if (!boardId) {
			console.log('No boardId provided');
			return [];
		}

		if (!columnName) {
			console.log('No columnName provided - returning empty array');
			// Return empty array jika columnName belum dipilih
			return [];
		}

		// Panggil API dengan endpoint dan body yang benar
		const res = await cekatApiRequest.call(
			this,
			'POST', // Gunakan POST sesuai dengan API spec
			`/api/crm/boards/${boardId}/columns/by-name`,
			{
				name: columnName, // Body request berisi nama kolom
			},
			{}, // Query parameters kosong
			'server',
		);

		console.log('API Response:', JSON.stringify(res, null, 2));

		// Parse response sesuai dengan struktur yang Anda berikan
		if (res.message === 'success' && res.data?.settings?.labels) {
			return res.data.settings.labels
				// .filter((label: any) => label.id !== 'default') // Skip default option
				.map((label: any) => ({
					name: label.name,
					value: label.id,
					description: `${label.name} (Count: ${label.count || 0})`,
				}));
		}

		console.log('No valid labels found in response');
		return [];
	} catch (error) {
		console.error('Error in getSelectColumnOptions:', error);

		// Return fallback options untuk development/testing
		return [
			{ name: 'Kontak Pribadi', value: '1' },
			{ name: 'Kontak Leasing', value: '2' },
			{ name: 'Kontak Koperasi', value: '3' },
			{ name: 'Tiktok', value: '4' },
			{ name: 'Sosmed (IG, Youtube, FB)', value: '5' },
			{ name: 'WI Store', value: '6' },
			{ name: 'OLX', value: '7' },
			{ name: 'Altius', value: '8' },
		];
	}
}

// TAMBAHAN: Function untuk debug parameter access
export async function debugParameterAccess(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	try {
		console.log('=== DEBUG PARAMETER ACCESS ===');

		// Method 1: Get all available parameters
		const allParams = this.getNode().parameters;
		console.log('All node parameters:', JSON.stringify(allParams, null, 2));

		// Method 2: Try different ways to access columns
		const methods = [
			() => this.getNodeParameter('columns', 0),
			() => this.getNodeParameter('columns.column', 0),
			() => this.getNodeParameter('columns.column.0', 0),
			() => this.getNodeParameter('columns.column.0.columnName', 0),
		];

		methods.forEach((method, index) => {
			try {
				const result = method();
				console.log(`Method ${index + 1} result:`, JSON.stringify(result, null, 2));
			} catch (error) {
				console.log(`Method ${index + 1} failed:`, error.message);
			}
		});

		return [{ name: 'Debug Complete - Check Console', value: 'debug' }];
	} catch (error) {
		console.error('Debug error:', error);
		return [{ name: 'Debug Error', value: 'error' }];
	}
}

// PENDEKATAN ALTERNATIF: Jika akses columnName masih bermasalah
// Buat function yang mengembalikan semua select options dari semua kolom select di board

export async function getAllSelectColumnOptions(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	try {
		const boardId = this.getNodeParameter('boardId', 0) as string;

		if (!boardId) {
			return [];
		}

		console.log('Getting all select options for boardId:', boardId);

		// 1. Pertama, ambil semua kolom di board
		const boardRes = await cekatApiRequest.call(
			this,
			'GET',
			`/api/crm/boards/${boardId}`,
			{},
			{},
			'server',
		);

		if (boardRes.message !== 'success' || !boardRes.data?.crm_columns) {
			return [];
		}

		// 2. Filter hanya kolom dengan type 'select'
		const selectColumns = boardRes.data.crm_columns.filter(
			(col: any) => col.type === 'select' && !col.read_only && col.is_visible,
		);

		console.log('Found select columns:', selectColumns.length);

		// 3. Untuk setiap kolom select, ambil options-nya
		const allOptions: INodePropertyOptions[] = [];

		for (const column of selectColumns) {
			try {
				// Panggil API untuk mendapatkan options kolom ini
				const columnRes = await cekatApiRequest.call(
					this,
					'POST',
					`/api/crm/boards/${boardId}/columns/by-name`,
					{
						name: column.name,
					},
					{},
					'server',
				);

				if (columnRes.message === 'success' && columnRes.data?.settings?.labels) {
					const options = columnRes.data.settings.labels
						// .filter((label: any) => label.id !== 'default')
						.map((label: any) => ({
							name: `${column.name}: ${label.name}`,
							value: `${column.name}|${label.id}`, // Encode column name dan value
							description: `Column: ${column.name} | Option: ${label.name}`,
						}));

					allOptions.push(...options);
				}
			} catch (error) {
				console.error(`Error getting options for column ${column.name}:`, error);
			}
		}

		console.log('Total select options found:', allOptions.length);
		return allOptions;
	} catch (error) {
		console.error('Error in getAllSelectColumnOptions:', error);
		return [];
	}
}

// ATAU: Pendekatan dengan predefined mapping
export async function getPredefinedSelectOptions(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	try {
		// const boardId = this.getNodeParameter('boardId', 0) as string;

		// Mapping kolom select yang umum digunakan
		const commonSelectOptions: { [key: string]: INodePropertyOptions[] } = {
			'Source Data': [
				{ name: 'Kontak Pribadi', value: '1' },
				{ name: 'Kontak Leasing', value: '2' },
				{ name: 'Kontak Koperasi', value: '3' },
				{ name: 'Tiktok', value: '4' },
				{ name: 'Sosmed (IG, Youtube, FB)', value: '5' },
				{ name: 'WI Store', value: '6' },
				{ name: 'OLX', value: '7' },
				{ name: 'Altius', value: '8' },
			],
			Status: [
				{ name: 'New', value: 'new' },
				{ name: 'In Progress', value: 'progress' },
				{ name: 'Completed', value: 'completed' },
			],
			Priority: [
				{ name: 'Low', value: 'low' },
				{ name: 'Medium', value: 'medium' },
				{ name: 'High', value: 'high' },
			],
		};

		// Return semua options yang tersedia
		const allOptions: INodePropertyOptions[] = [];
		Object.entries(commonSelectOptions).forEach(([columnName, options]) => {
			const prefixedOptions = options.map((opt) => ({
				...opt,
				name: `${columnName}: ${opt.name}`,
				value: `${columnName}|${opt.value}`,
			}));
			allOptions.push(...prefixedOptions);
		});

		return allOptions;
	} catch (error) {
		console.error('Error in getPredefinedSelectOptions:', error);
		return [];
	}
}
