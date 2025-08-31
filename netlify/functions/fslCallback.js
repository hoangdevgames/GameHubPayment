exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Token',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Parse query parameters (for direct API calls)
    const queryParams = event.queryStringParameters || {};
    let accessToken = queryParams.access_token;
    let state = queryParams.state;
    
    // If no query params, try to parse from URL fragment (for FSL OAuth redirects)
    if (!accessToken && !state) {
      const url = event.rawUrl || event.path || '';
      const fragmentMatch = url.match(/#([^?]*)/);
      if (fragmentMatch) {
        const fragment = fragmentMatch[1];
        const fragmentParams = new URLSearchParams(fragment);
        accessToken = fragmentParams.get('access_token');
        state = fragmentParams.get('state');
      }
    }

    // Create response data
    const responseData = {
      code: 0,
      data: {
        redirectUrl: "https://gamehubpayment.netlify.app/"
      }
    };

    // Log the callback for debugging
    console.log('FSL Callback received:', {
      accessToken: accessToken ? '***' : 'missing',
      state: state || 'missing',
      timestamp: new Date().toISOString(),
      url: event.rawUrl || event.path || 'unknown'
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responseData)
    };

  } catch (error) {
    console.error('Error in FSL Callback:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        code: 1,
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
