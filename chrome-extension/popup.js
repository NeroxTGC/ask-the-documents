document.addEventListener('DOMContentLoaded', function() {
    const queryForm = document.getElementById('query-form');
    const queryInput = document.getElementById('query-input');
    const answerContainer = document.getElementById('answer-container');
    const answerContent = document.getElementById('answer-content');
    const loadingContainer = document.getElementById('loading-container');
    const loginMessage = document.getElementById('login-message');
    const loginLink = document.getElementById('login-link');
    const debugContainer = document.getElementById('debug-container');
    const toggleDebugBtn = document.getElementById('toggle-debug');
    const clearDebugBtn = document.getElementById('clear-debug');
    const body = document.body;

    // Base URL of your Wasp app API
    const API_BASE_URL = 'http://localhost:3001';
    // Base URL of your Wasp app frontend (for token retrieval)
    const APP_BASE_URL = 'http://localhost:3000';

    // Set the login link href
    if (loginLink) {
        loginLink.href = APP_BASE_URL;
    }

    // Debug logging function
    function logDebug(message, data = null) {
        console.log(`[DEBUG] ${message}`, data || '');
        
        if (debugContainer) {
            const logEntry = document.createElement('div');
            logEntry.className = 'debug-entry';
            logEntry.textContent = `${new Date().toISOString().substr(11, 8)} - ${message}`;
            
            if (data) {
                try {
                    if (typeof data === 'object') {
                        logEntry.textContent += `: ${JSON.stringify(data)}`;
                    } else {
                        logEntry.textContent += `: ${data}`;
                    }
                } catch (e) {
                    logEntry.textContent += `: [Object]`;
                }
            }
            
            debugContainer.appendChild(logEntry);
            debugContainer.scrollTop = debugContainer.scrollHeight;
        }
    }

    // Function to get JWT token from the app's localStorage
    async function getJwtToken() {
        try {
            logDebug('Attempting to get JWT token from app');
            
            // We need to query the active tab to get the token from localStorage
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Check if the tab URL matches our app URL
            if (!tab.url || !tab.url.startsWith(APP_BASE_URL)) {
                logDebug('Current tab is not the app', tab.url);
                return null;
            }
            
            logDebug('Executing script to get token from localStorage');
            
            // Execute script in the context of the web page to get the token
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => {
                    // Mostrar todas las claves en localStorage para depuración
                    const keys = Object.keys(localStorage);
                    console.log('localStorage keys:', keys);
                    
                    // Buscar el token con la clave "wasp:sessionId"
                    let token = localStorage.getItem('wasp:sessionId');
                    
                    // Si encontramos el token, devolverlo (eliminar comillas si las tiene)
                    if (token) {
                        console.log('Token encontrado con clave wasp:sessionId');
                        // Eliminar comillas si el token está entre comillas
                        if (token.startsWith('"') && token.endsWith('"')) {
                            token = token.slice(1, -1);
                        }
                        return token;
                    }
                    
                    // Si no encontramos el token, buscar en todas las claves que contengan "auth" o "session"
                    for (const key of keys) {
                        if (key.includes('auth') || key.includes('session')) {
                            token = localStorage.getItem(key);
                            console.log(`Token encontrado con clave ${key}`);
                            // Eliminar comillas si el token está entre comillas
                            if (token.startsWith('"') && token.endsWith('"')) {
                                token = token.slice(1, -1);
                            }
                            return token;
                        }
                    }
                    
                    // Si aún no encontramos el token, devolver null
                    console.log('No se encontró token en localStorage');
                    return null;
                }
            });
            
            const token = results[0]?.result;
            logDebug('Token retrieved', token ? 'Token found' : 'No token found');
            
            return token;
        } catch (error) {
            logDebug('Error getting JWT token', error.message);
            return null;
        }
    }

    // Function to render markdown
    function renderMarkdown(text) {
        // This is a simple implementation. For a more complete solution,
        // you might want to use a library like marked.js
        
        // Convert headers
        text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        // Convert links
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank">$1</a>');
        
        // Convert bold and italic
        text = text.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/gim, '<em>$1</em>');
        
        // Convert code blocks
        text = text.replace(/```([^`]+)```/gim, '<pre><code>$1</code></pre>');
        text = text.replace(/`([^`]+)`/gim, '<code>$1</code>');
        
        // Convert paragraphs (must be done last)
        text = text.replace(/\n\n/gim, '</p><p>');
        
        return '<p>' + text + '</p>';
    }

    // Function to ask the documents
    async function askDocuments(query) {
        try {
            showLoading();
            logDebug('Starting askDocuments with query', query);
            
            // Get JWT token for authentication
            const token = await getJwtToken();
            logDebug('JWT token status', token ? 'Token available' : 'No token available');
            
            const apiUrl = `${API_BASE_URL}/api/ask`;
            logDebug('API URL', apiUrl);
            
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };
            
            // Add Authorization header if token is available
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
                logDebug('Added Authorization header');
            } else {
                logDebug('No Authorization header added (no token)');
            }
            
            const requestOptions = {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ query }),
                mode: 'cors',
                cache: 'no-cache'
            };
            logDebug('Request options', requestOptions);
            
            try {
                logDebug('Sending fetch request...');
                
                // Añadir un timeout para asegurarnos de que la solicitud no se queda colgada
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000);
                
                const response = await fetch(apiUrl, {
                    ...requestOptions,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                logDebug('Response received', {
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries([...response.headers].map(h => [h[0], h[1]]))
                });
                
                if (!response.ok) {
                    logDebug('Response not OK', { status: response.status, statusText: response.statusText });
                    
                    // Intentar leer el cuerpo de la respuesta incluso si no es OK
                    try {
                        const errorBody = await response.text();
                        logDebug('Error response body', errorBody);
                        
                        try {
                            // Intentar parsear como JSON
                            const errorJson = JSON.parse(errorBody);
                            throw new Error(`Error: ${response.status} ${response.statusText} - ${errorJson.error || errorJson.message || 'Unknown error'}`);
                        } catch (parseError) {
                            // Si no se puede parsear como JSON, usar el texto
                            throw new Error(`Error: ${response.status} ${response.statusText} - ${errorBody}`);
                        }
                    } catch (bodyError) {
                        // Si no podemos leer el cuerpo, lanzar error con el status
                        throw new Error(`Error: ${response.status} ${response.statusText}`);
                    }
                }
                
                logDebug('Parsing JSON response...');
                const data = await response.json();
                logDebug('Response data', data);
                return data;
            } catch (fetchError) {
                logDebug('Fetch error', fetchError.message);
                throw fetchError;
            }
        } catch (error) {
            logDebug('Error in askDocuments', error.message);
            return { error: error.message };
        } finally {
            hideLoading();
        }
    }

    // Function to show loading spinner
    function showLoading() {
        loadingContainer.classList.remove('hidden');
        answerContainer.classList.add('hidden');
        if (loginMessage) loginMessage.classList.add('hidden');
        logDebug('Showing loading spinner');
    }

    // Function to hide loading spinner
    function hideLoading() {
        loadingContainer.classList.add('hidden');
        logDebug('Hiding loading spinner');
    }

    // Function to display the answer
    function displayAnswer(answer) {
        answerContent.innerHTML = renderMarkdown(answer);
        answerContainer.classList.remove('hidden');
        logDebug('Displaying answer', answer.substring(0, 50) + '...');
    }

    // Function to display login message
    function displayLoginMessage() {
        if (loginMessage) {
            loginMessage.classList.remove('hidden');
            logDebug('Displaying login message');
        }
    }

    // Toggle debug panel
    if (toggleDebugBtn) {
        toggleDebugBtn.addEventListener('click', function() {
            if (debugContainer) {
                const isHidden = debugContainer.classList.contains('hidden');
                debugContainer.classList.toggle('hidden');
                
                // Add or remove the debug-open class to the body
                if (isHidden) {
                    body.classList.add('debug-open');
                    toggleDebugBtn.textContent = 'Ocultar Debug';
                } else {
                    body.classList.remove('debug-open');
                    toggleDebugBtn.textContent = 'Mostrar Debug';
                }
                
                logDebug('Debug panel toggled to ' + (isHidden ? 'visible' : 'hidden'));
            }
        });
    }

    // Clear debug logs
    if (clearDebugBtn) {
        clearDebugBtn.addEventListener('click', function() {
            if (debugContainer) {
                debugContainer.innerHTML = '';
                logDebug('Debug logs cleared');
            }
        });
    }

    // Event listener for form submission
    queryForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const query = queryInput.value.trim();
        if (!query) return;
        
        logDebug('Form submitted with query', query);
        
        const result = await askDocuments(query);
        logDebug('Got result from askDocuments', result);
        
        if (result.error && (result.error.includes('Unauthorized') || result.error.includes('Authentication'))) {
            displayLoginMessage();
        } else if (result.answer) {
            displayAnswer(result.answer);
        } else if (result.error) {
            displayAnswer(`Error: ${result.error}`);
        } else {
            displayAnswer('No response received from the server.');
        }
    });

    // Initialize
    logDebug('Extension popup initialized');
});
