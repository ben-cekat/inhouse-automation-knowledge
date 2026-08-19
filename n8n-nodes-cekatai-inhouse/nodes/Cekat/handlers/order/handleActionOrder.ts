import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { cekatApiRequest } from '../../GenericFunctions';

export async function handleUpdateOrder(
	context: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData> {
	const orderId = context.getNodeParameter('orderId', i) as string;
	const orderStatus = context.getNodeParameter('orderStatus', i, '') as string;
	const paymentStatus = context.getNodeParameter('paymentStatus', i, '') as string;
	const paymentMethod = context.getNodeParameter('paymentMethod', i, '') as string;

	console.log('=== UPDATE ORDER DEBUG ===');
	console.log('orderId:', orderId);
	console.log('orderStatus:', orderStatus);
	console.log('paymentStatus:', paymentStatus);
	console.log('paymentMethod:', paymentMethod);

	// Build request body dengan hanya field yang diisi
	const requestBody: any = {};

	if (orderStatus) requestBody.order_status = orderStatus;
	if (paymentStatus) requestBody.payment_status = paymentStatus;
	if (paymentMethod) requestBody.payment_method = paymentMethod;

	console.log('Final requestBody:', JSON.stringify(requestBody, null, 2));

	const response = await cekatApiRequest.call(
		context,
		'PUT',
		`/api/orders/${orderId}`,
		requestBody,
		{},
		'server',
	);

	return {
		json: {
			success: true,
			operation: 'updateOrder',
			orderId,
			fieldsCount: Object.keys(requestBody).length,
			updatedFields: requestBody,
			response,
		},
		pairedItem: i,
	};
}

export async function handleCreateOrder(
	context: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData> {
	// Required fields
	const orderItems = context.getNodeParameter('orderItems', i) as string;
	const paymentMethod = context.getNodeParameter('paymentMethod', i) as string;
	const customerIdMethod = context.getNodeParameter('customerIdMethod', i) as string;

	// Customer identification fields (required based on method)
	let conversationId = '';
	let contactId = '';
	let phoneNumber = '';

	// Get required field based on method
	if (customerIdMethod === 'conversation') {
		conversationId = context.getNodeParameter('conversationId', i) as string;
		// Get optional fields
		contactId = context.getNodeParameter('contactIdOptional', i, '') as string;
		phoneNumber = context.getNodeParameter('phoneNumberOptional', i, '') as string;
	} else if (customerIdMethod === 'contact') {
		contactId = context.getNodeParameter('contactId', i) as string;
		// Get optional fields
		conversationId = context.getNodeParameter('conversationIdOptional', i, '') as string;
		phoneNumber = context.getNodeParameter('phoneNumberOptional', i, '') as string;
	} else if (customerIdMethod === 'phone') {
		phoneNumber = context.getNodeParameter('phoneNumber', i) as string;
		// Get optional fields
		conversationId = context.getNodeParameter('conversationIdOptional', i, '') as string;
		contactId = context.getNodeParameter('contactIdOptional', i, '') as string;
	}

	// Other optional fields
	const shippingFee = context.getNodeParameter('shippingFee', i, 0) as number;
	const discount = context.getNodeParameter('discount', i, 0) as number;
	const vat = context.getNodeParameter('vat', i, 0) as number;
	const notes = context.getNodeParameter('notes', i, '') as string;
	const address = context.getNodeParameter('address', i, '') as string;
	const name = context.getNodeParameter('name', i, '') as string;
	const email = context.getNodeParameter('email', i, '') as string;

	// Conditional fields based on payment method
	let bankAccountNumber = '';
	let customInvoiceUrl = '';

	if (paymentMethod === 'manual') {
		bankAccountNumber = context.getNodeParameter('bankAccountNumber', i) as string;
	}

	if (paymentMethod === 'custom') {
		customInvoiceUrl = context.getNodeParameter('customInvoiceUrl', i) as string;
	}

	console.log('=== CREATE ORDER DEBUG ===');
	console.log('customerIdMethod:', customerIdMethod);
	console.log('conversationId:', conversationId);
	console.log('contactId:', contactId);
	console.log('phoneNumber:', phoneNumber);
	console.log('orderItems:', orderItems);
	console.log('paymentMethod:', paymentMethod);

	// Validate that at least one customer identification is provided
	if (!conversationId && !contactId && !phoneNumber) {
		throw new Error('At least one of conversation_id, contact_id, or phone_number is required');
	}

	// Parse orderItems JSON
	let parsedOrderItems;
	try {
		parsedOrderItems = JSON.parse(orderItems);
	} catch (error) {
		throw new Error(`Invalid JSON format for order items: ${error.message}`);
	}

	// Build request body
	const requestBody: any = {
		orders_products: parsedOrderItems,
		payment_method: paymentMethod,
	};

	// Add customer identification fields only if they have values
	if (conversationId) requestBody.conversation_id = conversationId;
	if (contactId) requestBody.contact_id = contactId;
	if (phoneNumber) requestBody.phone_number = phoneNumber;

	// Add required fields
	requestBody.display_name = name;

	// Add optional fields only if they have values
	if (shippingFee > 0) requestBody.shipping_fee = shippingFee;
	if (discount > 0) requestBody.discount = discount;
	if (vat > 0) requestBody.vat = vat;
	if (notes) requestBody.notes = notes;
	if (address) requestBody.address = address;
	if (email) requestBody.email = email;

	// Add conditional fields
	if (paymentMethod === 'manual' && bankAccountNumber) {
		requestBody.bank_account_number = bankAccountNumber;
	}

	if (paymentMethod === 'custom' && customInvoiceUrl) {
		requestBody.custom_invoice_url = customInvoiceUrl;
	}

	console.log('Final requestBody:', JSON.stringify(requestBody, null, 2));

	const response = await cekatApiRequest.call(
		context,
		'POST',
		'/api/orders',
		requestBody,
		{},
		'server',
	);

	return {
		json: {
			success: true,
			operation: 'createOrder',
			customerIdMethod,
			fieldsCount: Object.keys(requestBody).length,
			createdFields: requestBody,
			response,
		},
		pairedItem: i,
	};
}
