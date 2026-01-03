import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { messages, apiKey, model, baseUrl, tools, toolChoice } = body;

        console.log("Proxying AI request to:", baseUrl);

        if (!apiKey || !baseUrl) {
            return NextResponse.json({ error: 'Missing configuration' }, { status: 400 });
        }

        // Sanitize URL: remove quotes and trailing slashes
        const cleanBaseUrl = baseUrl.replace(/['"]/g, '').replace(/\/$/, '');
        const url = `${cleanBaseUrl}/chat/completions`;

        console.log("Constructed URL:", url);

        const requestBody: any = {
            model: model,
            messages: messages,
            temperature: 0.7
        };

        // Add tools if provided
        if (tools && Array.isArray(tools)) {
            requestBody.tools = tools;
        }

        // Add tool_choice if specified
        if (toolChoice) {
            requestBody.tool_choice = toolChoice;
        } else if (tools && tools.length > 0) {
            // Auto mode if tools are provided but no choice specified
            requestBody.tool_choice = 'auto';
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Upstream API Error:", response.status, errorText);
            return NextResponse.json({ error: `Upstream Error: ${response.statusText}`, details: errorText }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("Proxy Error:", error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
