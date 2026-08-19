import { IExecuteFunctions, ILoadOptionsFunctions, IRequestOptions } from 'n8n-workflow';

const server_url = 'https://server.cekat.ai';
const api_url = 'https://api.cekat.ai';
const staging_url = 'https://staging-server.cekat.ai';

// const server_url = 'http://localhost:3001';

export async function cekatApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: string,
	endpoint: string,
	body?: any,
	qs?: any,
	urlType: 'server' | 'staging' | 'api' = 'server',
): Promise<any> {
	const credentials = await this.getCredentials('CekatOpenApi');
	const options = {
		method,
		body,
		qs,
		headers: {
			Authorization: `Bearer ${credentials.apiKey}`,
			api_key: credentials.apiKey,
		},
		uri: `${urlType === 'server' ? server_url + endpoint : api_url + endpoint}`,
		json: true,
	} as IRequestOptions;
	if (urlType === 'staging') {
		options.uri = `${staging_url + endpoint}`;
	}
	return this.helpers.request(options);
}
