import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { handleLookup } from './lookup/handleLookup';
import { handleSendMessage } from './message/sendMessage';
import { handleSendTemplateMessage } from './message/sendTemplateMessage';
import { handleUpdateAdditionalData } from './contact/updateAdditionalData';
import { handleSubscribeWebhook } from './webhook/subscribe';
import { handleSetPipelineStatus } from './conversation/assignPipeline';
import { handleAssignLabel } from './conversation/assignLabel';
import { handleRemoveLabel } from './conversation/removeLabel';
import { handleAssignAgent } from './conversation/assignAgent';
import { handleAssignAiAgent } from './conversation/assignAiAgent';
import { handleAddCollaborator } from './conversation/addCollaborator';
import { handleChangeStageStatus } from './conversation/changeStageStatus';
import { handleResolveConversation } from './conversation/resolve';
import { handleBlockAi } from './conversation/blockAi';
import { handleUnblockAi } from './conversation/unblockAi';
// Import CRM lookup handlers
import {
	handleGetAllBoards,
	handleGetBoard,
	handleGetAllItems,
	handleGetItem,
	handleSearchItems,
} from './crm/handleLookupCRM';
// Import CRM action handlers
import { handleCreateItem, handleDeleteItems, handleUpdateItem } from './crm/handleActionCRM'; // atau './action/handleActionCRM' sesuai struktur folder
// Import Order lookup handlers
import { handleGetAllOrders, handleGetOrder } from './order/handleLookupOrder';
// Import Order action handlers
import { handleCreateOrder, handleUpdateOrder } from './order/handleActionOrder';

export const handlers: Record<
	string,
	(context: IExecuteFunctions, i: number) => Promise<INodeExecutionData>
> = {
	// Message operations
	'message:sendMessage': handleSendMessage,
	'message:sendTemplateMessage': handleSendTemplateMessage,

	// Contact operations
	'contact:updateAdditionalData': handleUpdateAdditionalData,

	// Webhook operations
	'webhook:subscribe': handleSubscribeWebhook,
	'webhook:unsubscribe': handleSubscribeWebhook,

	// Conversation operations
	'conversation:setPipelineStatus': handleSetPipelineStatus,
	'conversation:resolveConversation': handleResolveConversation,
	'conversation:blockAI': handleBlockAi,
	'conversation:unblockAI': handleUnblockAi,
	'conversation:assignLabel': handleAssignLabel,
	'conversation:removeLabel': handleRemoveLabel,
	'conversation:assignAgent': handleAssignAgent,
	'conversation:assignAiAgent': handleAssignAiAgent,
	'conversation:addCollaborator': handleAddCollaborator,
	'conversation:changeStageStatus': handleChangeStageStatus,

	// General lookup operations (existing)
	'lookup:getMessages': handleLookup,
	'lookup:getAllTemplates': handleLookup,
	'lookup:getLabels': handleLookup,
	'lookup:getInboxes': handleLookup,
	'lookup:getAgents': handleLookup,
	'lookup:getContact': handleLookup,
	'lookup:getPipelineStatuses': handleLookup,
	'lookup:getSubscribedWebhooks': handleLookup,

	// CRM lookup operations (✅ removed duplicates)
	'lookup:getAllBoards': handleGetAllBoards,
	'lookup:getBoard': handleGetBoard,
	'lookup:getAllItems': handleGetAllItems,
	'lookup:getItem': handleGetItem,
	'lookup:searchItems': handleSearchItems,

	// CRM action operations
	'action:createItem': handleCreateItem,
	'action:updateItem': handleUpdateItem,
	'action:deleteItems': handleDeleteItems,

	// Order lookup operations
	'lookup:getAllOrders': handleGetAllOrders,
	'lookup:getOrder': handleGetOrder,
	'lookup:updateOrder': handleUpdateOrder,

	// Order action operations
	'action:updateOrder': handleUpdateOrder,
	'action:createOrder': handleCreateOrder,
};
