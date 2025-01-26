export const devLog = (message: string) => {
    if (import.meta.env.VITE_DEV_MODE === 'true') {
        window.dispatchEvent(new CustomEvent('dev-log', { detail: message }));
    }
}; 