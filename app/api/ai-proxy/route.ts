import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { messages, apiKey, model, baseUrl } = body;

        console.log("Proxying AI request to:", baseUrl);

        if (!apiKey || !baseUrl) {
            return NextResponse.json({ error: 'Missing configuration' }, { status: 400 });
        }

        // Sanitize URL: remove quotes and trailing slashes
        const cleanBaseUrl = baseUrl.replace(/['"]/g, '').replace(/\/$/, '');
        const url = `${cleanBaseUrl}/chat/completions`;

        console.log("Constructed URL:", url);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: 0.7,
                response_format: { type: "json_object" }
            })
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
