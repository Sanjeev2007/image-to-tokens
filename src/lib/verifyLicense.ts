export interface VerifyResult {
  success: boolean;
  message?: string;
}

export async function verifyLicense(licenseKey: string): Promise<VerifyResult> {
  const productId = import.meta.env.VITE_GUMROAD_PRODUCT_ID;
  if (!productId) {
    return { success: false, message: 'Missing Gumroad Product ID' };
  }

  try {
    const params = new URLSearchParams();
    params.append('product_id', productId);
    params.append('license_key', licenseKey);
    params.append('increment_uses_count', 'false');

    const res = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      body: params,
    });
    
    const data = await res.json();
    
    if (data.success) {
      return { success: true };
    } else {
      return { success: false, message: data.message || 'Invalid license key.' };
    }
  } catch (err) {
    return { success: false, message: 'Network error. Please try again.' };
  }
}
