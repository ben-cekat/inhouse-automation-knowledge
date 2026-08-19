import { INodeType, INodeTypeDescription, IWebhookFunctions, IHookFunctions } from 'n8n-workflow';
import { cekatApiRequest } from '../Cekat/GenericFunctions';
import * as options from '../Cekat/methods';

export class CekatOrderTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cekat Order Trigger',
		name: 'cekatOrderTrigger',
		group: ['trigger'],
		version: 1,
		description: 'Trigger node for receiving Cekat Order webhooks',
		icon: 'file:cekat.svg',
		defaults: {
			name: 'Cekat Order Trigger',
		},
		inputs: [],
		outputs: ['main' as any],
		credentials: [
			{
				name: 'CekatOpenApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				options: [
					{ name: 'Order Created', value: 'order.created' },
					{ name: 'Order Updated', value: 'order.updated' },
					{ name: 'Order Status Updated', value: 'order.order_status_updated' },
					{ name: 'Payment Status Updated', value: 'order.payment_status_updated' },
				],
				default: [],
				description: 'Select which order events to listen for',
			},
			{
				displayName: 'Order Filter (Optional)',
				name: 'orderFilter',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				description: 'Optional filters for order events',
				options: [
					{
						displayName: 'Payment Method',
						name: 'paymentMethod',
						type: 'options',
						options: [
							{ name: 'Xendit', value: 'xendit' },
							{ name: 'Manual', value: 'manual' },
							{ name: 'Custom', value: 'custom' },
						],
						default: '',
						description: 'Only trigger for specific payment method',
					},
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
						description: 'Only trigger for specific order status',
					},
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
						description: 'Only trigger for specific payment status',
					},
				],
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const res = await cekatApiRequest.call(
					this as any,
					'GET',
					'/business_workflows/webhooks',
					{},
					{ webhookUrl },
					'server',
				);
				return Array.isArray(res) && res.length > 0;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const events = this.getNodeParameter('events') as string[];
				const webhookUrl = this.getNodeWebhookUrl('default');
				const orderFilter = this.getNodeParameter('orderFilter', {}) as any;

				const payload: any = {
					name: 'N8N Order Webhook',
					webhookUrl: webhookUrl,
					events: events,
				};

				// Add filters if specified
				if (Object.keys(orderFilter).length > 0) {
					payload.filters = {};

					if (orderFilter.paymentMethod) {
						payload.filters.payment_method = orderFilter.paymentMethod;
					}

					if (orderFilter.orderStatus) {
						payload.filters.order_status = orderFilter.orderStatus;
					}

					if (orderFilter.paymentStatus) {
						payload.filters.payment_status = orderFilter.paymentStatus;
					}
				}

				await cekatApiRequest.call(
					this as any,
					'POST',
					'/business_workflows/webhooks/subscribe',
					payload,
					'server',
				);

				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');

				await cekatApiRequest.call(
					this as any,
					'POST',
					'/business_workflows/webhooks/unsubscribe',
					{ webhookUrl },
					'server',
				);

				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<any> {
		const body = this.getBodyData();

		return {
			workflowData: [[{ json: body }]],
		};
	}

	methods = {
		loadOptions: {
			...options,
		},
	};
}
