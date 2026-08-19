import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { cekatApiRequest } from '../../GenericFunctions';

export async function handleSendTemplateMessage(
	context: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData> {
	const inboxId = context.getNodeParameter('inboxId', i) as string;
	const receiverName = context.getNodeParameter('receiverName', i) as string;
	const receiverPhoneNumber = context.getNodeParameter('receiverPhoneNumber', i) as string;
	const fileUrl = context.getNodeParameter('fileUrl', i, '') as string;

	const templateId = context.getNodeParameter('templateId', i);

	const templates = await cekatApiRequest.call(
		context,
		'GET',
		'/templates',
		{},
		{ inbox_id: inboxId },

		'api',
	);
	const selectedTemplate = templates.data.find((t: any) => t.id === templateId);
	if (!selectedTemplate) {
		throw new Error(`Template with ID ${templateId} not found in inbox ${inboxId}`);
	}

	const whatsappTemplateId = selectedTemplate.wa_template_id;
	const bodyVarsRaw = context.getNodeParameter('bodyVariables', i, {}) as {
		variable?: { value: string }[];
	};
	const bodyVariables = Array.isArray(bodyVarsRaw.variable)
		? bodyVarsRaw.variable.map((v) => v.value)
		: [];

	const body: any = {
		inbox_id: inboxId,
		wa_template_id: whatsappTemplateId,
		// "otp_code": "552345", //max 15 char for auth only
		template_body_variables: bodyVariables,
		phone_number: receiverPhoneNumber,
		phone_name: receiverName,
	};

	// Add file_url if provided
	if (fileUrl && fileUrl.trim() !== '') {
		body.file_url = fileUrl.trim();
	}

	const response = await cekatApiRequest.call(context, 'POST', '/templates/send', body, {}, 'api');

	return {
		json: response,
	};
}
