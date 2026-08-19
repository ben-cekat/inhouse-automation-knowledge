import type { INodeProperties } from 'n8n-workflow';

export const lookupCRMOperation: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['lookup'],
			},
		},
		options: [
			{
				name: 'Get All Boards',
				value: 'getAllBoards',
				action: 'Get all boards',
			},
			{
				name: 'Get Board',
				value: 'getBoard',
				action: 'Get board',
			},
			{
				name: 'Get All Items',
				value: 'getAllItems',
				action: 'Get all items',
			},
			{
				name: 'Get Item',
				value: 'getItem',
				action: 'Get item',
			},
			{
				name: 'Search Items',
				value: 'searchItems',
				action: 'Search items',
			},
		],
		default: 'getAllBoards',
	},
];

export const lookupCRMFields: INodeProperties[] = [
	// ========== GET BOARD FIELDS ==========
	{
		displayName: 'Board Name or ID',
		name: 'boardId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getBoards',
		},
		default: '',
		required: true,
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		displayOptions: {
			show: {
				resource: ['lookup'],
				operation: ['getBoard', 'getAllItems', 'getItem', 'searchItems'],
			},
		},
	},

	// ========== GET ITEM FIELDS ==========
	{
		displayName: 'Item Name or ID',
		name: 'itemId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getItems',
			loadOptionsDependsOn: ['boardId'],
		},
		default: '',
		required: true,
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		displayOptions: {
			show: {
				resource: ['lookup'],
				operation: ['getItem'],
			},
		},
	},

	// ========== SEARCH ITEMS FIELDS ==========
	{
		displayName: 'Search Input Method',
		name: 'searchInputMethod',
		type: 'options',
		options: [
			{
				name: 'Manual Entry',
				value: 'manual',
				description: 'Add search conditions one by one manually',
			},
			{
				name: 'Dynamic from Previous Node',
				value: 'dynamic',
				description: 'Use search data from previous node (JSON array)',
			},
		],
		default: 'manual',
		description: 'How do you want to provide the search conditions?',
		displayOptions: {
			show: {
				resource: ['lookup'],
				operation: ['searchItems'],
			},
		},
	},
	{
		displayName: 'Logical Condition',
		name: 'condition',
		type: 'options',
		options: [
			{
				name: 'AND',
				value: 'AND',
				description: 'All conditions must be true',
			},
			{
				name: 'OR',
				value: 'OR',
				description: 'At least one condition must be true',
			},
		],
		default: 'AND',
		description: 'Logical operator between multiple search conditions',
		displayOptions: {
			show: {
				resource: ['lookup'],
				operation: ['searchItems'],
			},
		},
	},
	{
		displayName: 'Search Conditions',
		name: 'searchConditions',
		placeholder: 'Add Search Condition',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		options: [
			{
				displayName: 'Condition',
				name: 'condition',
				values: [
					{
						displayName: 'Column Name',
						name: 'column_name',
						type: 'options',
						typeOptions: {
							loadOptionsMethod: 'getBoardColumns',
							loadOptionsDependsOn: ['boardId'],
						},
						default: '',
						required: true,
						description: 'Select the column to search in',
					},
					{
						displayName: 'Operator',
						name: 'operator',
						type: 'options',
						options: [
							{
								name: 'Equals',
								value: 'equals',
								description: 'Exact match',
							},
							{
								name: 'Contains',
								value: 'contains',
								description: 'Contains the value (case-insensitive)',
							},
							{
								name: 'Greater Than',
								value: 'greater_than',
								description: 'Greater than the value (for numbers/dates)',
							},
							{
								name: 'Less Than',
								value: 'less_than',
								description: 'Less than the value (for numbers/dates)',
							},
							{
								name: 'Greater Than or Equal',
								value: 'greater_than_or_equal',
								description: 'Greater than or equal to the value',
							},
							{
								name: 'Less Than or Equal',
								value: 'less_than_or_equal',
								description: 'Less than or equal to the value',
							},
							{
								name: 'Not Equals',
								value: 'not_equals',
								description: 'Does not equal the value',
							},
							{
								name: 'Is Empty',
								value: 'is_empty',
								description: 'Field is empty or null',
							},
							{
								name: 'Is Not Empty',
								value: 'is_not_empty',
								description: 'Field is not empty',
							},
						],
						default: 'equals',
						required: true,
						description: 'Comparison operator to use',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						description:
							'Value to compare against (leave empty for "is_empty" and "is_not_empty" operators)',
						displayOptions: {
							hide: {
								operator: ['is_empty', 'is_not_empty'],
							},
						},
					},
				],
			},
		],
		displayOptions: {
			show: {
				resource: ['lookup'],
				operation: ['searchItems'],
				searchInputMethod: ['manual'],
			},
		},
		description: 'Define search conditions for filtering CRM items',
	},
	{
		displayName: 'Dynamic Search Data',
		name: 'dynamicSearchData',
		type: 'string',
		default: '',
		required: true,
		description:
			'JSON array of search conditions from previous node. Format: [{"column_name": "Email", "operator": "equals", "value": "test@example.com"}]',
		displayOptions: {
			show: {
				resource: ['lookup'],
				operation: ['searchItems'],
				searchInputMethod: ['dynamic'],
			},
		},
		typeOptions: {
			rows: 4,
		},
	},
];
