function decodeBase64Url(value) {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0)).buffer;
}

function encodeBase64Url(value) {
    const bytes = new Uint8Array(value);
    let binary = '';
    bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function registrationOptions(options) {
    return {
        ...options,
        challenge: decodeBase64Url(options.challenge),
        user: { ...options.user, id: decodeBase64Url(options.user.id) },
        excludeCredentials: (options.excludeCredentials || []).map((credential) => ({
            ...credential,
            id: decodeBase64Url(credential.id)
        }))
    };
}

export function serializeCredential(credential) {
    const response = credential.response;
    return {
        id: credential.id,
        rawId: encodeBase64Url(credential.rawId),
        type: credential.type,
        authenticatorAttachment: credential.authenticatorAttachment || null,
        clientExtensionResults: credential.getClientExtensionResults(),
        response: {
            attestationObject: encodeBase64Url(response.attestationObject),
            clientDataJSON: encodeBase64Url(response.clientDataJSON),
            transports: typeof response.getTransports === 'function' ? response.getTransports() : []
        }
    };
}
