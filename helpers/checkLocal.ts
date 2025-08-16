import os from 'os';

/**
 * Get all IP addresses of the current device
 * @returns Array of IP addresses for this device
 */
const getDeviceIPAddresses = (): string[] => {
  if (typeof window !== "undefined") {
    // Client-side: can't access os module
    return [];
  }

  const interfaces = os.networkInterfaces();
  const ips: string[] = [];

  for (const interfaceName in interfaces) {
    const networkInterface = interfaces[interfaceName];
    if (networkInterface) {
      for (const net of networkInterface) {
        // Skip internal/loopback and non-IPv4 addresses
        if (!net.internal && net.family === 'IPv4') {
          ips.push(net.address);
        }
      }
    }
  }

  // Always include localhost/loopback addresses
  ips.push('127.0.0.1', 'localhost');
  
  return ips;
};

// Cache for device IPs on client-side
let cachedDeviceIPs: string[] | null = null;

/**
 * Fetch device IPs from server (client-side only)
 */
const fetchDeviceIPs = async (): Promise<string[]> => {
  if (typeof window === "undefined") {
    return [];
  }

  if (cachedDeviceIPs) {
    return cachedDeviceIPs;
  }

  try {
    const response = await fetch('/api/files/device-ips');
    const data = await response.json();
    cachedDeviceIPs = data.deviceIPs || [];
    return cachedDeviceIPs || [];
  } catch (error) {
    console.warn('Failed to fetch device IPs:', error);
    return [];
  }
};

/**
 * Check if the app is running locally by comparing the current hostname
 * with the actual device IP addresses
 */
export const checkLocal = async (): Promise<boolean> => {
  if (typeof window === "undefined") {
    return false;
  }

  // Client-side: check against known local patterns first
  const hostname = window.location.hostname;
  const cleanHost = hostname.split(':')[0];
  
  // // Quick check for obvious local indicators
  if (['localhost', '127.0.0.1', '::1'].includes(cleanHost)) {
    return true;
  }

  // Check if hostname ends with .local
  if (cleanHost.endsWith('.local')) {
    return true;
  }

  // Try to get actual device IPs from server
  try {
    const deviceIPs = await fetchDeviceIPs();

    if (deviceIPs.includes(cleanHost)) {
      return true;
    }
  } catch (error) {
    // Fallback to pattern matching if server call fails
  }

  // Fallback: Check if it's a private IP range
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = cleanHost.match(ipv4Regex);
  
  if (match) {
    const [, a, b] = match.map(Number);
    
    // Private IP ranges
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 127) return true;
  }

  return false;
};

/**
 * Server-side function to check if a request hostname matches device IPs
 * Use this in your API routes or server middleware
 */
export const checkLocalByIP = (hostname: string): boolean => {
  const deviceIPs = getDeviceIPAddresses();
  const cleanHost = hostname.split(':')[0];
  
  return deviceIPs.includes(cleanHost);
};

/**
 * Get device IP addresses (server-side only)
 */
export const getLocalIPs = (): string[] => {
  return getDeviceIPAddresses();
};
