import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { cekatApiRequest } from '../../GenericFunctions';

export async function handleAssignAiAgent(
	context: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData> {
	const conversationId = context.getNodeParameter('conversationId', i) as string;
	const aiAgentId = context.getNodeParameter('agentId', i) as string;
	const keepAssigned = context.getNodeParameter('keepAssigned', i) as boolean;
	const body = {
		assigned_ai_agent: aiAgentId,
		keep_assigned_ai_agent_on_resolve: keepAssigned,
	};
	const response = await cekatApiRequest.call(
		context,
		'PUT',
		`/api/conversations/${conversationId}`,
		body,
		{},
		'server',
	);

	return { json: response };
}
