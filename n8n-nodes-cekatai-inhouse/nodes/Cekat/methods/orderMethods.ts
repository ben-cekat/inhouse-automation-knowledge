import { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { cekatApiRequest } from '../GenericFunctions';

export async function getOrders(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const response = await cekatApiRequest.call(this, 'GET', '/api/orders', {}, {}, 'server');

	// Fix: Access orders array from response.data.orders, not response.data
	const orders = response.data.orders || [];

	return orders.map((order: any) => ({
		// Fix: Use order_number for display name since it's more readable
		name: `Order #${order.order_number} - ${order.contact?.display_name || 'No Contact'}`,
		// Fix: Use 'id' field directly
		value: order.id,
	}));
}

export async function getContacts(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	try {
		const response = await cekatApiRequest.call(this, 'GET', '/api/contacts', {}, {}, 'server');
		
		console.log('getContacts response:', JSON.stringify(response, null, 2));
		
		// Handle different response structures
		let contacts = [];
		if (response.data && Array.isArray(response.data)) {
			contacts = response.data;
		} else if (response.data && response.data.contacts && Array.isArray(response.data.contacts)) {
			contacts = response.data.contacts;
		} else if (Array.isArray(response)) {
			contacts = response;
		}
		
		return contacts.map((contact: any) => ({
			name: contact.display_name || contact.name || contact.phone_number || 'Unknown Contact',
			value: contact.id,
			description: contact.phone_number ? `Phone: ${contact.phone_number}` : undefined,
		}));
	} catch (error) {
		console.error('Error in getContacts:', error);
		return [];
	}
}
