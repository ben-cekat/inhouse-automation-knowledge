import type { INodeProperties } from 'n8n-workflow';

export const lookupOrderOperation: INodeProperties[] = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['lookup'], // ✅ Fixed: Changed from 'lookupOrder' to 'lookup'
            },
        },
        options: [
            {
                name: 'Get All Orders',
                value: 'getAllOrders',
                action: 'Get all orders',
            },
            {
                name: 'Get Order',
                value: 'getOrder',
                action: 'Get order',
            }
        ],
        default: 'getAllOrders',
    },
];

export const lookupOrderFields: INodeProperties[] = [
    // ========== ORDER ID FIELD ==========
    {
        displayName: 'Order ID',
        name: 'orderId',
        type: 'options',
        typeOptions: {
            loadOptionsMethod: 'getOrders',
        },
        default: '',
        required: true,
        description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
        displayOptions: {
            show: {
                resource: ['lookup'], // ✅ Fixed: Changed from 'lookupOrder' to 'lookup'
                operation: ['getOrder', 'updateOrder'], // ✅ Removed 'getAllOrders' since it doesn't need orderId
            },
        },
    },
];