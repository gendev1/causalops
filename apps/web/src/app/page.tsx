import { env } from '../env';

export default function HomePage() {
    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
            <h1>CausalOps Copilot</h1>
            <p><strong>From alerts to action: evidence → cause → fix.</strong></p>

            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                <h2>Environment Status</h2>
                <p>✅ Environment validation passed</p>
                <p>🔗 Agent URL: {env.NEXT_PUBLIC_AGENT_URL}</p>
                <p>📊 Environment: {env.NODE_ENV}</p>
                <p>🔌 Port: {env.WEB_PORT}</p>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <p><em>COP-3.1 will implement Next.js App Router here</em></p>
            </div>
        </div>
    );
}