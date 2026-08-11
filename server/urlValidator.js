import dns from 'dns/promises';

const BLOCKED_HOSTNAMES = new Set([
    'localhost',
    '0.0.0.0',
    '127.0.0.1',
    '::1',
    'metadata.google.internal'
]);

function isPrivateIpv4(ip) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
        return false;
    }

    const [a, b] = parts;
    return (
        a === 10 ||
        a === 127 ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        (a === 169 && b === 254) ||
        a === 0
    );
}

function isPrivateIpv6(ip) {
    const normalized = ip.toLowerCase();
    return (
        normalized === '::1' ||
        normalized.startsWith('fc') ||
        normalized.startsWith('fd') ||
        normalized.startsWith('fe80')
    );
}

function isPrivateIp(ip) {
    if (ip.includes(':')) {
        return isPrivateIpv6(ip);
    }
    return isPrivateIpv4(ip);
}

export async function validateUrl(input) {
    if (!input || typeof input !== 'string') {
        throw new Error('URL is required');
    }

    const trimmed = input.trim();
    let parsed;

    try {
        parsed = new URL(trimmed);
    } catch {
        throw new Error('Please enter a valid URL (include http:// or https://)');
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Only http:// and https:// URLs are supported');
    }

    const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');

    if (BLOCKED_HOSTNAMES.has(hostname)) {
        throw new Error('This URL is not allowed');
    }

    if (isPrivateIp(hostname)) {
        throw new Error('Private network URLs are not allowed');
    }

    const addresses = await dns.lookup(hostname, { all: true });
    for (const entry of addresses) {
        if (isPrivateIp(entry.address)) {
            throw new Error('Private network URLs are not allowed');
        }
    }

    return parsed.href;
}
