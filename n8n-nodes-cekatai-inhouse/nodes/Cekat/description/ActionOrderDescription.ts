import type { INodeProperties } from 'n8n-workflow';

export const actionOrderOperation: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['action'],
			},
		},
		options: [
			{
				name: 'Update Order',
				value: 'updateOrder',
				action: 'Update order',
			},
			{
				name: 'Create Order',
				value: 'createOrder',
				action: 'Create order',
			},
		],
		default: 'updateOrder',
	},
];

export const actionOrderFields: INodeProperties[] = [
	// ========== ORDER ID FIELD (for update operation) ==========
	{
		displayName: 'Order ID',
		name: 'orderId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getOrders',
		},
		default: '',
		required: true,
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		displayOptions: {
			show: {
				resource: ['action'],
				operation: ['updateOrder'],
			},
		},
	},

	// ========== ORDER STATUS FIELD (for update operation) ==========
	{
		displayName: 'Order Status',
		name: 'orderStatus',
		type: 'options',
		options: [
			{ name: 'Pending', value: 'pending' },
			{ name: 'Processing', value: 'processing' },
			{ name: 'Shipping', value: 'shipping' },
			{ name: 'Cancelled', value: 'cancelled' },
			{ name: 'Completed', value: 'completed' },
		],
		default: '',
		description: 'Select the order status',
		displayOptions: {
			show: {
				resource: ['action'],
				operation: ['updateOrder'],
			},
		},
	},

	// ========== PAYMENT STATUS FIELD (for update operation) ==========
	{
		displayName: 'Payment Status',
		name: 'paymentStatus',
		type: 'options',
		options: [
			{ name: 'Pending', value: 'pending' },
			{ name: 'Paid', value: 'paid' },
			{ name: 'Expired', value: 'expired' },
			{ name: 'Settled', value: 'settled' },
		],
		default: '',
		description: 'Select the payment status',
		displayOptions: {
			show: {
				resource: ['action'],
				operation: ['updateOrder'],
			},
		},
	},

	// ========== PAYMENT METHOD FIELD ==========
	{
		displayName: 'Payment Method',
		name: 'paymentMethod',
		type: 'options',
		options: [
			{ name: 'Xendit', value: 'xendit' },
			{ name: 'Manual', value: 'manual' },
			{ name: 'Custom', value: 'custom' },
		],
		default: 'xendit',
		required: true,
		description: 'Select the payment method',
		displayOptions: {
			show: {
				resource: ['action'],
				operation: ['updateOrder', 'createOrder'],
			},
		},
	},

	// ========== ORDER ITEMS FIELD ==========
	{
		displayName: 'Order Items (JSON)',
		name: 'orderItems',
		type: 'json',
		default: `[
  {
    "product_id": "5dc769c3-b7b0-4c13-a8f9-c6402197959f",
    "product_name": "Meja",
    "quantity": 2,
    "price": 12901298
  },
  {
    "product_id": null,
    "product_name": "Kursi",
    "quantity": 1,
    "price": 199000
  }
]`,
		required: true,
		description:
			'Products in the order as JSON array. Use product_id for existing products or null for custom items.',
		displayOptions: {
			show: {
				resource: ['action'],
				operation: ['createOrder'],
			},
		},
	},

	// ========== SHIPPING FEE FIELD ==========
	{
		displayName: 'Shipping Fee',
		name: 'shippingFee',
		type: 'number',
		typeOptions: {
			minValue: 0,
			numberPrecision: 2,
		},
		default: 0,
		description: 'The shipping fee for the order',
		displayOptions: {
			show: {
				resource: ['action'],
				operation: ['createOrder'],
			},
		},
	},

	// ========== DISCOUNT FIELD ==========
	{
		displayName: 'Discount',
		name: 'discount',
		type: 'number',
		typeOptions: {
			minValue: 0,
			numberPrecision: 2,
		},
		default: 0,
		description: 'The discount amount for the order',
		displayOptions: {
			show: {
				resource: ['action'],
				operation: ['createOrder'],
			},
		},
	},

	// ========== VAT FIELD ==========
	{
		displayName: 'VAT',
		name: 'vat',
		type: 'number',
		typeOptions: {
			minValue: 0,
			numberPrecision: 2,
		},
		default: 0,
		description: 'The VAT amount for the order',
		displayOptions: {
			show: {
				resource: ['action'],
				operation: ['createOrder'],
			},
		},
	},

	// ========== CUSTOMER IDENTIFICATION METHOD ==========
	{
		displayName: 'Customer Identification',
		name: 'customerIdMethod',
		type: 'options',
		options: [
			{ name: 'Contact ID', value: 'contact' },
			{ name: 'Phone Number', value: 'phone' },
			{ name: 'Conversation ID', value: 'conversation' },
		],
		default: 'contact',
		required: true,
		description: 'Choose how to identify the customer (at least one is required)',
		displayOptions: {
			show: {
				resource: ['action'],
				operation: ['createOrder'],
			},
		},
	},

	// ========== CONTACT ID FIELD ==========
	{
		displayName: 'Contact ID',
		name: 'contactId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getContacts',
		},
		default: '',
		required: true,
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		displayOptions: {
			show: {
				resource: ['action'],
				operation: ['createOrder'],
				customerIdMethod: ['contact'],
			},
		},
	},

	// ========== PHONE NUMBER FIELD ==========
	{
		displayName: 'Phone Number',
		name: 'phoneNumber',
		type: 'string',
		default: '',
		required: true,
		description: 'Customer phone number (with country code, e.g., 6282272001548)',
		displayOptions: {
			show: {
				resource: ['action'],
				operation: ['createOrder'],
				customerIdMethod: ['phone'],
			},
		},
	},

	// ========== CONVERSATION ID FIELD ==========
	{
		displayName: 'Conversation ID',
		name: 'conversationId',
		type: 'string',
		default: '',
		required: true,
		description: 'ID of the conversation related to this order',
		displayOptions: {
			show: {
				resource: ['action'],
				operation: ['createOrder'],
				customerIdMethod: ['conversation'],
			},
		},
	},

	// ========== OPTIONAL PHONE NUMBER (when not primary method) ==========
	{
		displayName: 'Phone Number (Optional)',
		name: 'phoneNumberOptional',
		type: 'string',
		default: '',
		description: 'Additional phone number (optional)',
		displayOptions: {
			show: {
				resource: ['action'],
				operation: ['createOrder'],
				customerIdMethod: ['contact', 'conversation'],
			},
		},
	},

	// ========== OPTIONAL CONTACT ID (when not primary method) ==========
	{
		displayName: 'Contact ID (Optional)',
		name: 'contactIdOptional',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getContacts',
		},
		default: '',
		description: 'Additional contact ID (optional)',
		displayOptions: {
			show: {
				resource: ['action'],
				operation: ['createOrder'],
				customerIdMethod: ['phone', 'conversation'],
			},
		},
	},

	// ========== OPTIONAL CONVERSATION ID (when not primary method) ==========
	{
		displayName: 'Conversation ID (Optional)',
		name: 'conversationIdOptional',
		type: 'string',
		default: '',
		description: 'Additional conversation ID (optional)',
		displayOptions: {
			show: {
				resource: ['action'],
				operation: ['createOrder'],
				customerIdMethod: ['contact', 'phone'],
			},
		},
	},

	// ========== NAME FIELD (Required) ==========
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
		description: 'Customer name (required)',
		displayOptions: {
			show: {
				resource: ['action'],
				operation: ['createOrder'],
			},
		},
	},

	// ========== EMAIL FIELD (Optional) ==========
	{
		displayName: 'Email (Optional)',
		name: 'email',
		type: 'string',
		default: '',
		description: 'Customer email address (optional)',
		displayOptions: {
			show: {
				resource: ['action'],
				operation: ['createOrder'],
			},
		},
	},

	// ========== NOTES FIELD ==========
	{
		displayName: 'Notes',
		name: 'notes',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		description: 'Additional notes for the order',
		displayOptions: {
			show: {
				resource: ['action'],
				operation: ['createOrder'],
			},
		},
	},

	// ========== ADDRESS FIELD ==========
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		typeOptions: {
			rows: 3,
		},
		default: '',
		description: 'Shipping address for the order',
		displayOptions: {
			show: {
				resource: ['action'],
				operation: ['createOrder'],
			},
		},
	},

	// ========== BANK ACCOUNT NUMBER FIELD (Required for manual payment) ==========
	{
		displayName: 'Bank Account Number',
		name: 'bankAccountNumber',
		type: 'string',
		default: '',
		required: true,
		description: 'Bank account number for manual payment',
		displayOptions: {
			show: {
				resource: ['action'],
				operation: ['createOrder'],
				paymentMethod: ['manual'],
			},
		},
	},

	// ========== CUSTOM INVOICE URL FIELD (Required for custom payment) ==========
	{
		displayName: 'Custom Invoice URL',
		name: 'customInvoiceUrl',
		type: 'string',
		default: '',
		required: true,
		description: 'Custom invoice URL for custom payment method',
		displayOptions: {
			show: {
				resource: ['action'],
				operation: ['createOrder'],
				paymentMethod: ['custom'],
			},
		},
	},
];
