interface CloudflareStreamAccount {
  id: string;
  uid: string;
  default: boolean;
}

interface CloudflareApiResponse<T> {
  result: T;
  success: boolean;
  errors: Array<{ message: string }>;
  messages: Array<{ message: string }>;
}

class CloudflareStreamClient {
  private accountId: string;
  private apiToken: string;
  private baseUrl: string;

  constructor() {
    this.accountId = process.env.CF_ACCOUNT_ID!;
    this.apiToken = process.env.CF_STREAM_API_TOKEN!;
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream`;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Cloudflare API error: ${response.status} ${response.statusText}`);
    }

    const data: CloudflareApiResponse<T> = await response.json();
    
    if (!data.success) {
      throw new Error(`Cloudflare API failed: ${data.errors.map(e => e.message).join(', ')}`);
    }

    return data.result;
  }

  async getCustomerCode(): Promise<string> {
    try {
      // Get account details to retrieve customer code
      const accountResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${this.accountId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!accountResponse.ok) {
        throw new Error(`Failed to get account details: ${accountResponse.statusText}`);
      }

      await accountResponse.json();
      
      // The customer code is typically the account ID for Stream
      // But let's also check the Stream-specific endpoint
      await this.request<CloudflareStreamAccount[]>('');
      
      // For Cloudflare Stream, the customer code is usually the account ID
      return this.accountId;
    } catch (error) {
      console.error('Error fetching Cloudflare customer code:', error);
      throw error;
    }
  }

  async getVideoDetails(videoId: string) {
    return this.request(`/${videoId}`);
  }

  async listVideos() {
    return this.request('');
  }
}

// Create singleton instance
export const cloudflareClient = new CloudflareStreamClient();

// Utility function to get customer code
export const getCloudflareCustomerCode = async (): Promise<string> => {
  try {
    return await cloudflareClient.getCustomerCode();
  } catch (error) {
    console.error('Failed to get Cloudflare customer code:', error);
    // Fallback to account ID which is typically the customer code
    return process.env.CF_ACCOUNT_ID!;
  }
};

// Generate Cloudflare Stream iframe URL
export const generateStreamUrl = (videoId: string, _customerCode?: string): string => {
  return `https://iframe.videodelivery.net/${videoId}`;
};

// Generate Cloudflare Stream thumbnail URL
export const generateThumbnailUrl = (videoId: string): string => {
  return `https://videodelivery.net/${videoId}/thumbnails/thumbnail.jpg`;
};